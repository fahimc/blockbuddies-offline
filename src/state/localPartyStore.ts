import { create } from 'zustand'
import { strFromU8, strToU8, unzlibSync, zlibSync } from 'fflate'
import type {
  AvatarSettings,
  BotRuntime,
  BuildBlock,
  LocationId,
  PlayerEmote,
  SavedFriend,
  Vec3,
} from '../game/types'
import { worldLocations } from '../data/world'
import { sanitizeBuildPieceName } from '../data/buildPieces'
import {
  discoverSignalRooms,
  getSignalAnswers,
  getSignalOffer,
  isLocalSignalSupported,
  sanitizeRoomName,
  sendSignalAnswer,
  startSignalHost,
  stopSignalHost,
  type LanHostInfo,
  type LanRoom,
} from '../network/localSignal'
import {
  closeHostedRoom,
  createHostedRoom,
  getHostedAnswers,
  getHostedRoom,
  isHostedSignalSupported,
  sendHostedAnswer,
  type HostedRoomInfo,
} from '../network/hostedSignal'

export type LocalPartyStatus =
  'idle' | 'hosting' | 'joining' | 'connecting' | 'connected' | 'error'
export type LocalPartyRole = 'host' | 'guest'
export type LocalPartySignalType = 'offer' | 'answer'

export type LocalPartySignal = {
  v: 1
  type: LocalPartySignalType
  from: string
  name: string
  sessionId?: string
  sdp: RTCSessionDescriptionInit
}

export type LocalPartySnapshot = {
  id: string
  name: string
  position: Vec3
  yaw: number
  avatar: AvatarSettings
  action: BotRuntime['action']
  emote: PlayerEmote
  interiorId?: string
  role?: LocalPartyRole
  hostId?: string
  placedBlocks?: BuildBlock[]
  savedFriends?: SavedFriend[]
  updatedAt: number
}

type LocalPartySnapshotInput = Omit<
  LocalPartySnapshot,
  'updatedAt' | 'emote'
> & {
  updatedAt?: number
  emote?: PlayerEmote
}

export type LocalPartyDirectMessage = {
  id: string
  fromId: string
  fromName: string
  toId: string
  presetId: string
  text: string
  createdAt: number
}

type LocalPartyMessage =
  | { type: 'hello'; id: string; name: string }
  | { type: 'snapshot'; snapshot: LocalPartySnapshot }
  | { type: 'direct_message'; message: LocalPartyDirectMessage }
  | { type: 'bye'; id: string; name: string }

type LocalPartyState = {
  playerId: string
  playerName: string
  status: LocalPartyStatus
  role?: LocalPartyRole
  inviteCode: string
  joinCodeInput: string
  answerCode: string
  answerCodeInput: string
  roomName: string
  lanRooms: LanRoom[]
  lanSearching: boolean
  lanHost?: LanHostInfo
  hostedRoom?: HostedRoomInfo
  pendingLanAnswerName?: string
  pendingHostedAnswerName?: string
  error?: string
  remotePlayers: Record<string, LocalPartySnapshot>
  incomingDirectMessages: LocalPartyDirectMessage[]
  lastEvent: string
  setPlayerName: (name: string) => void
  setRoomName: (name: string) => void
  setJoinCodeInput: (code: string) => void
  setAnswerCodeInput: (code: string) => void
  discoverRooms: () => Promise<void>
  startRoomHost: () => Promise<void>
  joinRoom: (room: LanRoom) => Promise<void>
  startHostedRoom: () => Promise<void>
  joinHostedRoom: () => Promise<void>
  startHost: () => Promise<void>
  startJoin: () => Promise<void>
  acceptAnswer: () => Promise<void>
  disconnect: () => void
  broadcastSnapshot: (snapshot: LocalPartySnapshot) => void
  sendDirectMessage: (toId: string, presetId: string, text: string) => void
  pruneRemotePlayers: (now?: number) => void
}

type LocalPartySetter = (
  partial:
    | Partial<LocalPartyState>
    | ((state: LocalPartyState) => Partial<LocalPartyState>),
) => void

const localPlayerId = `local-${Math.random().toString(36).slice(2, 8)}`

let peer: RTCPeerConnection | undefined
let channel: RTCDataChannel | undefined
let signalChannel: BroadcastChannel | undefined
let stopSignalStorageListener: (() => void) | undefined
let lanAnswerPoll: number | undefined
let hostedAnswerPoll: number | undefined

const compactPartyCodePrefix = 'BBP1.'
const signalBusName = 'blockbuddies-local-party-signal'
const signalStorageKey = 'blockbuddies-local-party-signal'
const maxSyncedBuildBlocks = 96
const maxSyncedSavedFriends = 12
const validLocationIds = new Set<LocationId>(
  worldLocations.map((location) => location.id),
)

export function sanitizePartyName(input: string) {
  const cleaned = input
    .replace(/[^\w -]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18)
  return cleaned || 'LocalBuddy'
}

function encodeUtf8Base64(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decodeUtf8Base64(code: string) {
  const binary = atob(code.replace(/\s+/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index)
  return new TextDecoder().decode(bytes)
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeBase64Url(code: string) {
  const padded = code
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(code.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index)
  return bytes
}

export function extractPartyCode(input: string) {
  const trimmed = input.trim()
  const compactMatch = trimmed.match(/BBP1\.[A-Za-z0-9_-]+/)
  if (compactMatch) return compactMatch[0]
  return trimmed.replace(/\s+/g, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function assertPartySignal(value: unknown): asserts value is LocalPartySignal {
  if (!isRecord(value))
    throw new Error('Invite code is not a local party signal.')
  if (value.v !== 1) throw new Error('Invite code version is not supported.')
  if (value.type !== 'offer' && value.type !== 'answer')
    throw new Error('Invite code type is not supported.')
  if (typeof value.from !== 'string' || typeof value.name !== 'string')
    throw new Error('Invite code is missing a player.')
  if ('sessionId' in value && typeof value.sessionId !== 'string')
    throw new Error('Invite code session is invalid.')
  if (
    !isRecord(value.sdp) ||
    (value.sdp.type !== 'offer' && value.sdp.type !== 'answer') ||
    typeof value.sdp.sdp !== 'string'
  ) {
    throw new Error('Invite code does not include a WebRTC session.')
  }
}

export function encodePartySignal(signal: LocalPartySignal) {
  const payload = strToU8(JSON.stringify(signal))
  return `${compactPartyCodePrefix}${encodeBase64Url(zlibSync(payload, { level: 9 }))}`
}

export function encodeLegacyPartySignal(signal: LocalPartySignal) {
  return encodeUtf8Base64(JSON.stringify(signal))
}

export function decodePartySignal(code: string) {
  const cleanCode = extractPartyCode(code)
  try {
    const json = cleanCode.startsWith(compactPartyCodePrefix)
      ? strFromU8(
          unzlibSync(
            decodeBase64Url(cleanCode.slice(compactPartyCodePrefix.length)),
          ),
        )
      : decodeUtf8Base64(cleanCode)
    const parsed: unknown = JSON.parse(json)
    assertPartySignal(parsed)
    return parsed
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Invite code could not be read.', { cause: error })
  }
}

export function makePartySnapshot(
  snapshot: LocalPartySnapshotInput,
): LocalPartySnapshot {
  return {
    ...snapshot,
    name: sanitizePartyName(snapshot.name),
    position: [
      snapshot.position[0],
      snapshot.position[1],
      snapshot.position[2],
    ],
    emote: sanitizePartyEmote(snapshot.emote),
    interiorId: snapshot.interiorId,
    placedBlocks: sanitizeBuildBlocks(snapshot.placedBlocks),
    savedFriends: sanitizePartySavedFriends(snapshot.savedFriends),
    updatedAt: snapshot.updatedAt ?? Date.now(),
  }
}

function sanitizePartyEmote(emote: unknown): PlayerEmote {
  return emote === 'wave' ||
    emote === 'cheer' ||
    emote === 'dance' ||
    emote === 'sit' ||
    emote === 'kickups'
    ? emote
    : 'none'
}

export function isRemoteFresh(
  snapshot: LocalPartySnapshot,
  now = Date.now(),
  ttlMs = 5000,
) {
  return now - snapshot.updatedAt <= ttlMs
}

export function electLocalPartyHost(
  localId: string,
  remotePlayers: Record<string, LocalPartySnapshot>,
  now = Date.now(),
) {
  const freshRemotePlayers = Object.values(remotePlayers).filter((player) =>
    isRemoteFresh(player, now),
  )
  const explicitRemoteHosts = freshRemotePlayers
    .filter((player) => player.role === 'host')
    .map((player) => player.hostId ?? player.id)
  if (explicitRemoteHosts.length > 0)
    return explicitRemoteHosts.sort((left, right) =>
      left.localeCompare(right),
    )[0]

  return (
    [localId, ...freshRemotePlayers.map((player) => player.id)].sort(
      (left, right) => left.localeCompare(right),
    )[0] ?? localId
  )
}

function sanitizeBuildBlocks(
  blocks: BuildBlock[] | undefined,
): BuildBlock[] | undefined {
  if (!blocks?.length) return undefined
  return blocks.slice(-maxSyncedBuildBlocks).map((block) => ({
    id: String(block.id).slice(0, 64),
    kind: block.kind,
    ...(sanitizeBuildPieceName(block.name)
      ? { name: sanitizeBuildPieceName(block.name) }
      : {}),
    position: [
      Number(block.position[0]) || 0,
      Number(block.position[1]) || 0,
      Number(block.position[2]) || 0,
    ],
    color: /^#[0-9a-f]{3,8}$/i.test(block.color) ? block.color : '#60a5fa',
    rotation: Number.isFinite(block.rotation) ? block.rotation : 0,
  }))
}

function sanitizeHexColor(color: unknown, fallback: string) {
  return typeof color === 'string' && /^#[0-9a-f]{3,8}$/i.test(color)
    ? color
    : fallback
}

function sanitizePartyAvatar(
  avatar: AvatarSettings | undefined,
): AvatarSettings {
  return {
    bodyColor: sanitizeHexColor(avatar?.bodyColor, '#9a5b43'),
    shirtColor: sanitizeHexColor(avatar?.shirtColor, '#5eead4'),
    hairColor: sanitizeHexColor(avatar?.hairColor, '#3b1f12'),
    hairStyle: avatar?.hairStyle,
    face: avatar?.face,
    eyeColor: sanitizeHexColor(avatar?.eyeColor, '#111827'),
    accentColor: sanitizeHexColor(avatar?.accentColor, '#0b74ff'),
    secondaryColor: sanitizeHexColor(avatar?.secondaryColor, '#ffffff'),
    pantsColor: sanitizeHexColor(avatar?.pantsColor, '#111827'),
    topStyle: avatar?.topStyle,
    outfitStyle: avatar?.outfitStyle,
    bottomStyle: avatar?.bottomStyle,
    shoeStyle: avatar?.shoeStyle,
    shoeColor: sanitizeHexColor(avatar?.shoeColor, '#f8fafc'),
    avatarSource: String(avatar?.avatarSource ?? 'Local Party Friend').slice(
      0,
      64,
    ),
    hat: avatar?.hat ?? 'none',
    accessory: avatar?.accessory ?? 'none',
    trail: avatar?.trail ?? 'none',
  }
}

function fallbackFriendRoute(index: number): LocationId[] {
  return index % 2 === 0
    ? ['spawn', 'park', 'shop', 'houses']
    : ['spawn', 'school', 'obby', 'park']
}

function sanitizeFriendRoute(route: unknown, index: number): LocationId[] {
  if (!Array.isArray(route)) return fallbackFriendRoute(index)
  const sanitized = route
    .filter(
      (location): location is LocationId =>
        typeof location === 'string' &&
        validLocationIds.has(location as LocationId),
    )
    .slice(0, 6)
  return sanitized.length > 0 ? sanitized : fallbackFriendRoute(index)
}

function sanitizePartySavedFriends(
  friends: SavedFriend[] | undefined,
): SavedFriend[] | undefined {
  if (!friends?.length) return undefined
  return friends.slice(0, maxSyncedSavedFriends).map((friend, index) => ({
    id: String(friend.id).slice(0, 64),
    name: sanitizePartyName(friend.name || `Friend ${index + 1}`),
    avatar: sanitizePartyAvatar(friend.avatar),
    inWorld: Boolean(friend.inWorld),
    route: sanitizeFriendRoute(friend.route, index),
    createdAt: Number.isFinite(friend.createdAt)
      ? friend.createdAt
      : Date.now(),
  }))
}

function sendPartyMessage(message: LocalPartyMessage) {
  if (channel?.readyState === 'open') channel.send(JSON.stringify(message))
}

function parsePartyMessage(data: unknown): LocalPartyMessage | undefined {
  if (typeof data !== 'string') return undefined
  try {
    const message: unknown = JSON.parse(data)
    if (!isRecord(message) || typeof message.type !== 'string') return undefined
    if (message.type === 'hello' || message.type === 'bye') {
      if (typeof message.id === 'string' && typeof message.name === 'string')
        return { type: message.type, id: message.id, name: message.name }
      return undefined
    }
    if (message.type === 'snapshot' && isRecord(message.snapshot)) {
      const snapshot = message.snapshot
      if (
        typeof snapshot.id === 'string' &&
        typeof snapshot.name === 'string' &&
        Array.isArray(snapshot.position) &&
        typeof snapshot.yaw === 'number' &&
        isRecord(snapshot.avatar) &&
        typeof snapshot.action === 'string'
      ) {
        return {
          type: 'snapshot',
          snapshot: {
            ...(snapshot as LocalPartySnapshot),
            emote: sanitizePartyEmote(snapshot.emote),
          },
        }
      }
    }
    if (message.type === 'direct_message' && isRecord(message.message)) {
      const localMessage = message.message
      if (
        typeof localMessage.id === 'string' &&
        typeof localMessage.fromId === 'string' &&
        typeof localMessage.fromName === 'string' &&
        typeof localMessage.toId === 'string' &&
        typeof localMessage.presetId === 'string' &&
        typeof localMessage.text === 'string' &&
        typeof localMessage.createdAt === 'number'
      ) {
        return {
          type: 'direct_message',
          message: {
            id: localMessage.id,
            fromId: localMessage.fromId,
            fromName: sanitizePartyName(localMessage.fromName),
            toId: localMessage.toId,
            presetId: localMessage.presetId,
            text: localMessage.text.slice(0, 160),
            createdAt: localMessage.createdAt,
          },
        }
      }
    }
  } catch {
    return undefined
  }
  return undefined
}

function closePeer() {
  channel?.close()
  peer?.close()
  channel = undefined
  peer = undefined
}

function stopLanAnswerPolling() {
  if (lanAnswerPoll !== undefined) window.clearInterval(lanAnswerPoll)
  lanAnswerPoll = undefined
}

function stopHostedAnswerPolling() {
  if (hostedAnswerPoll !== undefined) window.clearInterval(hostedAnswerPoll)
  hostedAnswerPoll = undefined
}

function startLanAnswerPolling(set: LocalPartySetter) {
  stopLanAnswerPolling()
  lanAnswerPoll = window.setInterval(() => {
    void getSignalAnswers()
      .then((answers) => {
        const answer = answers.find((entry) => entry.answerCode.trim())
        if (!answer) return
        const name = sanitizePartyName(answer.name)
        set({
          answerCodeInput: answer.answerCode,
          pendingLanAnswerName: name,
          lastEvent: `${name} wants to join. Tap Accept Join Answer.`,
        })
      })
      .catch(() => {
        set({ lastEvent: 'Room is open. Waiting for join requests.' })
      })
  }, 1200)
}

function startHostedAnswerPolling(
  set: LocalPartySetter,
  get: () => LocalPartyState,
) {
  stopHostedAnswerPolling()
  hostedAnswerPoll = window.setInterval(() => {
    const state = get()
    if (!state.hostedRoom || state.role !== 'host' || state.answerCodeInput)
      return
    void getHostedAnswers(state.hostedRoom.roomName, state.playerId)
      .then((answers) => {
        const answer = answers.at(-1)
        if (!answer?.answerCode.trim()) return
        const name = sanitizePartyName(answer.guestName)
        set({
          answerCodeInput: answer.answerCode,
          pendingHostedAnswerName: name,
          lastEvent: `${name} wants to join ${state.hostedRoom?.roomName}. Tap Accept Join Request.`,
        })
      })
      .catch(() => {
        set({ lastEvent: 'Web room is open. Waiting for join requests.' })
      })
  }, 1500)
}

function createSessionId() {
  return `party-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`
}

function publishSignal(signal: LocalPartySignal) {
  if (!signal.sessionId) return
  const message = { app: signalBusName, signal }
  signalChannel?.postMessage(message)
  try {
    localStorage.setItem(
      signalStorageKey,
      JSON.stringify({ ...message, sentAt: Date.now() }),
    )
  } catch {
    // Storage handoff is best effort; manual copy/share remains the fallback.
  }
}

function isSignalBusMessage(
  value: unknown,
): value is { app: string; signal: LocalPartySignal } {
  return (
    isRecord(value) && value.app === signalBusName && isRecord(value.signal)
  )
}

function stopListeningForSignals() {
  signalChannel?.close()
  signalChannel = undefined
  stopSignalStorageListener?.()
  stopSignalStorageListener = undefined
}

function listenForJoinAnswer(sessionId: string, set: LocalPartySetter) {
  stopListeningForSignals()
  const handleSignal = (signal: LocalPartySignal) => {
    if (signal.sessionId !== sessionId || signal.type !== 'answer') return
    set({
      answerCodeInput: encodePartySignal(signal),
      lastEvent: `${sanitizePartyName(signal.name)} sent an answer. Tap Accept Join Answer.`,
    })
  }
  if (typeof BroadcastChannel !== 'undefined') {
    signalChannel = new BroadcastChannel(signalBusName)
    signalChannel.onmessage = (event) => {
      if (!isSignalBusMessage(event.data)) return
      handleSignal(event.data.signal)
    }
  }
  if (typeof window !== 'undefined') {
    const storageListener = (event: StorageEvent) => {
      if (event.key !== signalStorageKey || !event.newValue) return
      try {
        const parsed: unknown = JSON.parse(event.newValue)
        if (!isSignalBusMessage(parsed)) return
        handleSignal(parsed.signal)
      } catch {
        // Ignore unrelated storage events.
      }
    }
    window.addEventListener('storage', storageListener)
    stopSignalStorageListener = () =>
      window.removeEventListener('storage', storageListener)
  }
}

function waitForIceGathering(connection: RTCPeerConnection) {
  if (connection.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 8000)
    const done = () => {
      if (connection.iceGatheringState !== 'complete') return
      window.clearTimeout(timeout)
      connection.removeEventListener('icegatheringstatechange', done)
      resolve()
    }
    connection.addEventListener('icegatheringstatechange', done)
  })
}

function requireWebRtc() {
  if (typeof RTCPeerConnection === 'undefined')
    throw new Error('Local party needs WebRTC support on this device.')
}

function createPeerConnection(
  set: LocalPartySetter,
  attachChannel: (nextChannel: RTCDataChannel) => void,
) {
  requireWebRtc()
  const connection = new RTCPeerConnection({ iceServers: [] })
  connection.ondatachannel = (event) => attachChannel(event.channel)
  connection.onconnectionstatechange = () => {
    if (connection.connectionState === 'connected')
      set({ status: 'connected', error: undefined })
    if (connection.connectionState === 'failed')
      set({ status: 'error', error: 'Local party connection failed.' })
    if (connection.connectionState === 'disconnected') promoteLocalHost(set)
  }
  return connection
}

function promoteLocalHost(set: LocalPartySetter) {
  set((state) => {
    if (state.status !== 'connected' && state.status !== 'connecting') {
      return { status: 'idle', lastEvent: 'Local player disconnected.' }
    }
    return {
      status: 'hosting',
      role: 'host',
      lanHost: undefined,
      hostedRoom: undefined,
      pendingLanAnswerName: undefined,
      pendingHostedAnswerName: undefined,
      error: undefined,
      lastEvent: 'Host left. You are now hosting the local party.',
    }
  })
}

function attachDataChannel(
  nextChannel: RTCDataChannel,
  set: LocalPartySetter,
  get: () => LocalPartyState,
) {
  channel = nextChannel
  channel.onopen = () => {
    const state = get()
    stopLanAnswerPolling()
    stopHostedAnswerPolling()
    void stopSignalHost()
    if (state.hostedRoom && state.role === 'host')
      void closeHostedRoom(state.hostedRoom.roomName, state.playerId)
    set({
      status: 'connected',
      lanHost: undefined,
      hostedRoom: undefined,
      pendingLanAnswerName: undefined,
      pendingHostedAnswerName: undefined,
      error: undefined,
      lastEvent: 'Local player connected.',
    })
    sendPartyMessage({
      type: 'hello',
      id: state.playerId,
      name: state.playerName,
    })
  }
  channel.onclose = () => promoteLocalHost(set)
  channel.onerror = () =>
    set({ status: 'error', error: 'Local party data channel failed.' })
  channel.onmessage = (event) => {
    const message = parsePartyMessage(event.data)
    if (!message) return
    if (message.type === 'hello') {
      set({
        lastEvent: `${sanitizePartyName(message.name)} joined your local party.`,
      })
      return
    }
    if (message.type === 'bye') {
      set((state) => {
        const remotePlayers = { ...state.remotePlayers }
        delete remotePlayers[message.id]
        return {
          remotePlayers,
          lastEvent: `${sanitizePartyName(message.name)} left your local party.`,
        }
      })
      return
    }
    if (message.type === 'snapshot') {
      if (message.snapshot.id === get().playerId) return
      set((state) => ({
        remotePlayers: {
          ...state.remotePlayers,
          [message.snapshot.id]: makePartySnapshot({
            ...message.snapshot,
            updatedAt: Date.now(),
          }),
        },
      }))
      return
    }
    if (message.type === 'direct_message') {
      if (message.message.toId !== get().playerId) return
      set((state) => ({
        incomingDirectMessages: state.incomingDirectMessages.some(
          (item) => item.id === message.message.id,
        )
          ? state.incomingDirectMessages
          : [...state.incomingDirectMessages.slice(-40), message.message],
        lastEvent: `${sanitizePartyName(message.message.fromName)} sent you a message.`,
      }))
      return
    }
  }
}

export const useLocalPartyStore = create<LocalPartyState>((set, get) => ({
  playerId: localPlayerId,
  playerName: `Buddy${localPlayerId.slice(-3).toUpperCase()}`,
  status: 'idle',
  inviteCode: '',
  joinCodeInput: '',
  answerCode: '',
  answerCodeInput: '',
  roomName: 'Buddy Room',
  lanRooms: [],
  lanSearching: false,
  remotePlayers: {},
  incomingDirectMessages: [],
  lastEvent: 'Local party is offline.',
  setPlayerName: (name) => set({ playerName: sanitizePartyName(name) }),
  setRoomName: (name) => set({ roomName: sanitizeRoomName(name) }),
  setJoinCodeInput: (joinCodeInput) => set({ joinCodeInput }),
  setAnswerCodeInput: (answerCodeInput) => set({ answerCodeInput }),
  discoverRooms: async () => {
    if (!isLocalSignalSupported()) {
      set({
        error: 'Room discovery needs the Android APK. Use manual codes on web.',
        lastEvent: 'Manual code fallback is available below.',
      })
      return
    }
    try {
      set({
        lanSearching: true,
        error: undefined,
        lastEvent: 'Searching for LAN rooms.',
      })
      const lanRooms = await discoverSignalRooms()
      set({
        lanRooms,
        lanSearching: false,
        lastEvent:
          lanRooms.length > 0
            ? `Found ${lanRooms.length} room${lanRooms.length === 1 ? '' : 's'}.`
            : 'No LAN rooms found yet.',
      })
    } catch (error) {
      set({
        lanSearching: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not discover LAN rooms.',
        lastEvent: 'Room discovery failed. Manual codes still work.',
      })
    }
  },
  startRoomHost: async () => {
    if (!isLocalSignalSupported()) {
      set({
        error: 'Room hosting needs the Android APK. Use manual codes on web.',
        lastEvent: 'Manual code fallback is available below.',
      })
      return
    }
    try {
      stopListeningForSignals()
      stopLanAnswerPolling()
      stopHostedAnswerPolling()
      await stopSignalHost()
      closePeer()
      set({
        status: 'hosting',
        role: 'host',
        inviteCode: '',
        answerCode: '',
        answerCodeInput: '',
        hostedRoom: undefined,
        pendingLanAnswerName: undefined,
        pendingHostedAnswerName: undefined,
        error: undefined,
        remotePlayers: {},
        lastEvent: 'Starting LAN room.',
      })
      peer = createPeerConnection(set, (nextChannel) =>
        attachDataChannel(nextChannel, set, get),
      )
      attachDataChannel(
        peer.createDataChannel('blockbuddies-local-party'),
        set,
        get,
      )
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      await waitForIceGathering(peer)
      if (!peer.localDescription)
        throw new Error('Room invite could not be created.')
      const sessionId = createSessionId()
      const inviteCode = encodePartySignal({
        v: 1,
        type: 'offer',
        from: get().playerId,
        name: get().playerName,
        sessionId,
        sdp: peer.localDescription.toJSON(),
      })
      const lanHost = await startSignalHost(get().roomName, inviteCode)
      startLanAnswerPolling(set)
      set({
        inviteCode,
        lanHost,
        roomName: lanHost.roomName,
        lastEvent: `Room "${lanHost.roomName}" is open. Host approves join requests.`,
      })
    } catch (error) {
      stopLanAnswerPolling()
      await stopSignalHost()
      closePeer()
      set({
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Could not start LAN room.',
      })
    }
  },
  joinRoom: async (room) => {
    try {
      stopListeningForSignals()
      stopLanAnswerPolling()
      stopHostedAnswerPolling()
      await stopSignalHost()
      closePeer()
      set({
        status: 'joining',
        role: 'guest',
        joinCodeInput: '',
        answerCode: '',
        hostedRoom: undefined,
        pendingHostedAnswerName: undefined,
        error: undefined,
        remotePlayers: {},
        lastEvent: `Joining ${sanitizeRoomName(room.roomName)}.`,
      })
      const offerCode = await getSignalOffer(room)
      const invite = decodePartySignal(offerCode)
      if (invite.type !== 'offer') throw new Error('Room invite was not valid.')
      peer = createPeerConnection(set, (nextChannel) =>
        attachDataChannel(nextChannel, set, get),
      )
      await peer.setRemoteDescription(invite.sdp)
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      await waitForIceGathering(peer)
      if (!peer.localDescription)
        throw new Error('Join answer could not be created.')
      const signal = {
        v: 1 as const,
        type: 'answer' as const,
        from: get().playerId,
        name: get().playerName,
        sessionId: invite.sessionId,
        sdp: peer.localDescription.toJSON(),
      }
      const answerCode = encodePartySignal(signal)
      await sendSignalAnswer(room, answerCode, get().playerName)
      set({
        status: 'connecting',
        answerCode,
        lastEvent: `Join request sent to ${sanitizeRoomName(room.roomName)}. Waiting for host approval.`,
      })
    } catch (error) {
      closePeer()
      set({
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Could not join LAN room.',
      })
    }
  },
  startHostedRoom: async () => {
    if (!isHostedSignalSupported()) {
      set({
        error:
          'Web rooms are available in the Netlify web app. Use Host Room in the Android APK.',
        lastEvent: 'Hosted web rooms are unavailable here.',
      })
      return
    }
    try {
      stopListeningForSignals()
      stopLanAnswerPolling()
      stopHostedAnswerPolling()
      await stopSignalHost()
      closePeer()
      set({
        status: 'hosting',
        role: 'host',
        inviteCode: '',
        answerCode: '',
        answerCodeInput: '',
        lanHost: undefined,
        hostedRoom: undefined,
        pendingLanAnswerName: undefined,
        pendingHostedAnswerName: undefined,
        error: undefined,
        remotePlayers: {},
        lastEvent: 'Opening web party room.',
      })
      peer = createPeerConnection(set, (nextChannel) =>
        attachDataChannel(nextChannel, set, get),
      )
      attachDataChannel(
        peer.createDataChannel('blockbuddies-local-party'),
        set,
        get,
      )
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      await waitForIceGathering(peer)
      if (!peer.localDescription)
        throw new Error('Web room invite could not be created.')
      const sessionId = createSessionId()
      const inviteCode = encodePartySignal({
        v: 1,
        type: 'offer',
        from: get().playerId,
        name: get().playerName,
        sessionId,
        sdp: peer.localDescription.toJSON(),
      })
      const hostedRoom = await createHostedRoom(
        get().roomName,
        inviteCode,
        get().playerId,
        get().playerName,
      )
      startHostedAnswerPolling(set, get)
      set({
        inviteCode,
        hostedRoom,
        roomName: hostedRoom.roomName,
        lastEvent: `Web room "${hostedRoom.roomName}" is open. Share the room name, then approve join requests.`,
      })
    } catch (error) {
      stopHostedAnswerPolling()
      closePeer()
      set({
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Could not start web room.',
      })
    }
  },
  joinHostedRoom: async () => {
    if (!isHostedSignalSupported()) {
      set({
        error:
          'Web rooms are available in the Netlify web app. Use Find Rooms in the Android APK.',
        lastEvent: 'Hosted web rooms are unavailable here.',
      })
      return
    }
    try {
      stopListeningForSignals()
      stopLanAnswerPolling()
      stopHostedAnswerPolling()
      await stopSignalHost()
      closePeer()
      set({
        status: 'joining',
        role: 'guest',
        joinCodeInput: '',
        answerCode: '',
        answerCodeInput: '',
        hostedRoom: undefined,
        pendingHostedAnswerName: undefined,
        error: undefined,
        remotePlayers: {},
        lastEvent: `Finding web room "${get().roomName}".`,
      })
      const hostedRoom = await getHostedRoom(get().roomName)
      const invite = decodePartySignal(hostedRoom.offerCode)
      if (invite.type !== 'offer')
        throw new Error('Web room invite was not valid.')
      peer = createPeerConnection(set, (nextChannel) =>
        attachDataChannel(nextChannel, set, get),
      )
      await peer.setRemoteDescription(invite.sdp)
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      await waitForIceGathering(peer)
      if (!peer.localDescription)
        throw new Error('Join answer could not be created.')
      const signal = {
        v: 1 as const,
        type: 'answer' as const,
        from: get().playerId,
        name: get().playerName,
        sessionId: invite.sessionId,
        sdp: peer.localDescription.toJSON(),
      }
      const answerCode = encodePartySignal(signal)
      await sendHostedAnswer(
        hostedRoom.roomName,
        answerCode,
        get().playerId,
        get().playerName,
      )
      set({
        status: 'connecting',
        hostedRoom: {
          roomName: hostedRoom.roomName,
          hostName: hostedRoom.hostName,
          expiresAt: hostedRoom.expiresAt,
        },
        answerCode,
        lastEvent: `Join request sent to ${sanitizePartyName(hostedRoom.hostName)}. Waiting for host approval.`,
      })
    } catch (error) {
      closePeer()
      set({
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Could not join web room.',
      })
    }
  },
  startHost: async () => {
    try {
      stopListeningForSignals()
      stopLanAnswerPolling()
      stopHostedAnswerPolling()
      await stopSignalHost()
      closePeer()
      set({
        status: 'hosting',
        role: 'host',
        inviteCode: '',
        answerCode: '',
        answerCodeInput: '',
        lanHost: undefined,
        hostedRoom: undefined,
        pendingLanAnswerName: undefined,
        pendingHostedAnswerName: undefined,
        error: undefined,
        remotePlayers: {},
      })
      peer = createPeerConnection(set, (nextChannel) =>
        attachDataChannel(nextChannel, set, get),
      )
      attachDataChannel(
        peer.createDataChannel('blockbuddies-local-party'),
        set,
        get,
      )
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      await waitForIceGathering(peer)
      if (!peer.localDescription)
        throw new Error('Host invite could not be created.')
      const sessionId = createSessionId()
      listenForJoinAnswer(sessionId, set)
      set({
        inviteCode: encodePartySignal({
          v: 1,
          type: 'offer',
          from: get().playerId,
          name: get().playerName,
          sessionId,
          sdp: peer.localDescription.toJSON(),
        }),
        lastEvent: 'Invite code ready.',
      })
    } catch (error) {
      closePeer()
      stopListeningForSignals()
      stopLanAnswerPolling()
      stopHostedAnswerPolling()
      set({
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Could not start local party.',
      })
    }
  },
  startJoin: async () => {
    try {
      stopListeningForSignals()
      stopLanAnswerPolling()
      stopHostedAnswerPolling()
      await stopSignalHost()
      closePeer()
      const invite = decodePartySignal(get().joinCodeInput)
      if (invite.type !== 'offer')
        throw new Error('Paste a host invite code first.')
      set({
        status: 'joining',
        role: 'guest',
        answerCode: '',
        hostedRoom: undefined,
        pendingHostedAnswerName: undefined,
        error: undefined,
        remotePlayers: {},
        lastEvent: 'Joining local party.',
      })
      peer = createPeerConnection(set, (nextChannel) =>
        attachDataChannel(nextChannel, set, get),
      )
      await peer.setRemoteDescription(invite.sdp)
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      await waitForIceGathering(peer)
      if (!peer.localDescription)
        throw new Error('Join answer could not be created.')
      const signal = {
        v: 1 as const,
        type: 'answer' as const,
        from: get().playerId,
        name: get().playerName,
        sessionId: invite.sessionId,
        sdp: peer.localDescription.toJSON(),
      }
      publishSignal(signal)
      set({
        status: 'connecting',
        answerCode: encodePartySignal(signal),
        lastEvent: invite.sessionId
          ? `Answer sent to ${sanitizePartyName(invite.name)} if they are nearby. You can still copy it.`
          : `Answer code ready for ${sanitizePartyName(invite.name)}.`,
      })
    } catch (error) {
      closePeer()
      stopListeningForSignals()
      stopLanAnswerPolling()
      stopHostedAnswerPolling()
      set({
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Could not join local party.',
      })
    }
  },
  acceptAnswer: async () => {
    try {
      if (!peer || get().role !== 'host')
        throw new Error('Start hosting before accepting an answer.')
      const answer = decodePartySignal(get().answerCodeInput)
      if (answer.type !== 'answer')
        throw new Error('Paste a join answer code first.')
      stopHostedAnswerPolling()
      set({
        status: 'connecting',
        error: undefined,
        lastEvent: `Connecting to ${sanitizePartyName(answer.name)}.`,
      })
      await peer.setRemoteDescription(answer.sdp)
      set({
        pendingLanAnswerName: undefined,
        pendingHostedAnswerName: undefined,
        answerCodeInput: '',
      })
    } catch (error) {
      set({
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Could not accept local party answer.',
      })
    }
  },
  disconnect: () => {
    const state = get()
    sendPartyMessage({
      type: 'bye',
      id: state.playerId,
      name: state.playerName,
    })
    closePeer()
    stopListeningForSignals()
    stopLanAnswerPolling()
    stopHostedAnswerPolling()
    void stopSignalHost()
    if (state.hostedRoom && state.role === 'host')
      void closeHostedRoom(state.hostedRoom.roomName, state.playerId)
    set({
      status: 'idle',
      role: undefined,
      inviteCode: '',
      answerCode: '',
      answerCodeInput: '',
      lanHost: undefined,
      hostedRoom: undefined,
      pendingLanAnswerName: undefined,
      pendingHostedAnswerName: undefined,
      remotePlayers: {},
      incomingDirectMessages: [],
      error: undefined,
      lastEvent: 'Local party ended.',
    })
  },
  broadcastSnapshot: (snapshot) => {
    const state = get()
    const hostId =
      state.role === 'host'
        ? state.playerId
        : electLocalPartyHost(state.playerId, state.remotePlayers)
    sendPartyMessage({
      type: 'snapshot',
      snapshot: makePartySnapshot({
        ...snapshot,
        role: hostId === state.playerId ? 'host' : state.role,
        hostId,
      }),
    })
  },
  sendDirectMessage: (toId, presetId, text) => {
    const state = get()
    const message: LocalPartyDirectMessage = {
      id: `party-dm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      fromId: state.playerId,
      fromName: state.playerName,
      toId,
      presetId,
      text: text.slice(0, 160),
      createdAt: Date.now(),
    }
    sendPartyMessage({ type: 'direct_message', message })
  },
  pruneRemotePlayers: (now = Date.now()) =>
    set((state) => {
      const remotePlayers = Object.fromEntries(
        Object.entries(state.remotePlayers).filter(([, player]) =>
          isRemoteFresh(player, now),
        ),
      )
      const hostId =
        state.role === 'host'
          ? state.playerId
          : electLocalPartyHost(state.playerId, remotePlayers, now)
      const role =
        hostId === state.playerId && state.status !== 'idle'
          ? 'host'
          : state.role === 'host'
            ? 'guest'
            : state.role
      const promoted =
        state.status === 'connected' && role === 'host' && state.role !== 'host'
      return {
        remotePlayers,
        status: promoted ? 'hosting' : state.status,
        role,
        lastEvent: promoted
          ? 'Host left. You are now hosting the local party.'
          : state.lastEvent,
      }
    }),
}))
