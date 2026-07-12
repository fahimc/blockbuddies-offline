import { create } from 'zustand'
import type { AvatarSettings, BotRuntime, Vec3 } from '../game/types'

export type LocalPartyStatus = 'idle' | 'hosting' | 'joining' | 'connecting' | 'connected' | 'error'
export type LocalPartyRole = 'host' | 'guest'
export type LocalPartySignalType = 'offer' | 'answer'

export type LocalPartySignal = {
  v: 1
  type: LocalPartySignalType
  from: string
  name: string
  sdp: RTCSessionDescriptionInit
}

export type LocalPartySnapshot = {
  id: string
  name: string
  position: Vec3
  yaw: number
  avatar: AvatarSettings
  action: BotRuntime['action']
  updatedAt: number
}

type LocalPartyMessage =
  | { type: 'hello'; id: string; name: string }
  | { type: 'snapshot'; snapshot: LocalPartySnapshot }
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
  error?: string
  remotePlayers: Record<string, LocalPartySnapshot>
  lastEvent: string
  setPlayerName: (name: string) => void
  setJoinCodeInput: (code: string) => void
  setAnswerCodeInput: (code: string) => void
  startHost: () => Promise<void>
  startJoin: () => Promise<void>
  acceptAnswer: () => Promise<void>
  disconnect: () => void
  broadcastSnapshot: (snapshot: LocalPartySnapshot) => void
  pruneRemotePlayers: (now?: number) => void
}

type LocalPartySetter = (
  partial: Partial<LocalPartyState> | ((state: LocalPartyState) => Partial<LocalPartyState>),
) => void

const localPlayerId = `local-${Math.random().toString(36).slice(2, 8)}`

let peer: RTCPeerConnection | undefined
let channel: RTCDataChannel | undefined

export function sanitizePartyName(input: string) {
  const cleaned = input.replace(/[^\w -]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18)
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
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new TextDecoder().decode(bytes)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function assertPartySignal(value: unknown): asserts value is LocalPartySignal {
  if (!isRecord(value)) throw new Error('Invite code is not a local party signal.')
  if (value.v !== 1) throw new Error('Invite code version is not supported.')
  if (value.type !== 'offer' && value.type !== 'answer') throw new Error('Invite code type is not supported.')
  if (typeof value.from !== 'string' || typeof value.name !== 'string') throw new Error('Invite code is missing a player.')
  if (!isRecord(value.sdp) || (value.sdp.type !== 'offer' && value.sdp.type !== 'answer') || typeof value.sdp.sdp !== 'string') {
    throw new Error('Invite code does not include a WebRTC session.')
  }
}

export function encodePartySignal(signal: LocalPartySignal) {
  return encodeUtf8Base64(JSON.stringify(signal))
}

export function decodePartySignal(code: string) {
  try {
    const parsed: unknown = JSON.parse(decodeUtf8Base64(code))
    assertPartySignal(parsed)
    return parsed
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Invite code could not be read.', { cause: error })
  }
}

export function makePartySnapshot(snapshot: Omit<LocalPartySnapshot, 'updatedAt'> & { updatedAt?: number }): LocalPartySnapshot {
  return {
    ...snapshot,
    name: sanitizePartyName(snapshot.name),
    position: [snapshot.position[0], snapshot.position[1], snapshot.position[2]],
    updatedAt: snapshot.updatedAt ?? Date.now(),
  }
}

export function isRemoteFresh(snapshot: LocalPartySnapshot, now = Date.now(), ttlMs = 5000) {
  return now - snapshot.updatedAt <= ttlMs
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
      if (typeof message.id === 'string' && typeof message.name === 'string') return { type: message.type, id: message.id, name: message.name }
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
        return { type: 'snapshot', snapshot: snapshot as LocalPartySnapshot }
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

function waitForIceGathering(connection: RTCPeerConnection) {
  if (connection.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 2500)
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
  if (typeof RTCPeerConnection === 'undefined') throw new Error('Local party needs WebRTC support on this device.')
}

function createPeerConnection(set: LocalPartySetter, attachChannel: (nextChannel: RTCDataChannel) => void) {
  requireWebRtc()
  const connection = new RTCPeerConnection({ iceServers: [] })
  connection.ondatachannel = (event) => attachChannel(event.channel)
  connection.onconnectionstatechange = () => {
    if (connection.connectionState === 'connected') set({ status: 'connected', error: undefined })
    if (connection.connectionState === 'failed') set({ status: 'error', error: 'Local party connection failed.' })
    if (connection.connectionState === 'disconnected') set({ status: 'idle', lastEvent: 'Local player disconnected.' })
  }
  return connection
}

function attachDataChannel(nextChannel: RTCDataChannel, set: LocalPartySetter, get: () => LocalPartyState) {
  channel = nextChannel
  channel.onopen = () => {
    const state = get()
    set({ status: 'connected', error: undefined, lastEvent: 'Local player connected.' })
    sendPartyMessage({ type: 'hello', id: state.playerId, name: state.playerName })
  }
  channel.onclose = () => set({ status: 'idle', remotePlayers: {}, lastEvent: 'Local player disconnected.' })
  channel.onerror = () => set({ status: 'error', error: 'Local party data channel failed.' })
  channel.onmessage = (event) => {
    const message = parsePartyMessage(event.data)
    if (!message) return
    if (message.type === 'hello') {
      set({ lastEvent: `${sanitizePartyName(message.name)} joined your local party.` })
      return
    }
    if (message.type === 'bye') {
      set((state) => {
        const remotePlayers = { ...state.remotePlayers }
        delete remotePlayers[message.id]
        return { remotePlayers, lastEvent: `${sanitizePartyName(message.name)} left your local party.` }
      })
      return
    }
    if (message.snapshot.id === get().playerId) return
    set((state) => ({
      remotePlayers: {
        ...state.remotePlayers,
        [message.snapshot.id]: makePartySnapshot({ ...message.snapshot, updatedAt: Date.now() }),
      },
    }))
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
  remotePlayers: {},
  lastEvent: 'Local party is offline.',
  setPlayerName: (name) => set({ playerName: sanitizePartyName(name) }),
  setJoinCodeInput: (joinCodeInput) => set({ joinCodeInput }),
  setAnswerCodeInput: (answerCodeInput) => set({ answerCodeInput }),
  startHost: async () => {
    try {
      closePeer()
      set({ status: 'hosting', role: 'host', inviteCode: '', answerCode: '', answerCodeInput: '', error: undefined, remotePlayers: {} })
      peer = createPeerConnection(set, (nextChannel) => attachDataChannel(nextChannel, set, get))
      attachDataChannel(peer.createDataChannel('blockbuddies-local-party'), set, get)
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      await waitForIceGathering(peer)
      if (!peer.localDescription) throw new Error('Host invite could not be created.')
      set({
        inviteCode: encodePartySignal({
          v: 1,
          type: 'offer',
          from: get().playerId,
          name: get().playerName,
          sdp: peer.localDescription.toJSON(),
        }),
        lastEvent: 'Invite code ready.',
      })
    } catch (error) {
      closePeer()
      set({ status: 'error', error: error instanceof Error ? error.message : 'Could not start local party.' })
    }
  },
  startJoin: async () => {
    try {
      closePeer()
      const invite = decodePartySignal(get().joinCodeInput)
      if (invite.type !== 'offer') throw new Error('Paste a host invite code first.')
      set({ status: 'joining', role: 'guest', answerCode: '', error: undefined, remotePlayers: {}, lastEvent: 'Joining local party.' })
      peer = createPeerConnection(set, (nextChannel) => attachDataChannel(nextChannel, set, get))
      await peer.setRemoteDescription(invite.sdp)
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      await waitForIceGathering(peer)
      if (!peer.localDescription) throw new Error('Join answer could not be created.')
      set({
        status: 'connecting',
        answerCode: encodePartySignal({
          v: 1,
          type: 'answer',
          from: get().playerId,
          name: get().playerName,
          sdp: peer.localDescription.toJSON(),
        }),
        lastEvent: `Answer code ready for ${sanitizePartyName(invite.name)}.`,
      })
    } catch (error) {
      closePeer()
      set({ status: 'error', error: error instanceof Error ? error.message : 'Could not join local party.' })
    }
  },
  acceptAnswer: async () => {
    try {
      if (!peer || get().role !== 'host') throw new Error('Start hosting before accepting an answer.')
      const answer = decodePartySignal(get().answerCodeInput)
      if (answer.type !== 'answer') throw new Error('Paste a join answer code first.')
      set({ status: 'connecting', error: undefined, lastEvent: `Connecting to ${sanitizePartyName(answer.name)}.` })
      await peer.setRemoteDescription(answer.sdp)
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Could not accept local party answer.' })
    }
  },
  disconnect: () => {
    const state = get()
    sendPartyMessage({ type: 'bye', id: state.playerId, name: state.playerName })
    closePeer()
    set({
      status: 'idle',
      role: undefined,
      inviteCode: '',
      answerCode: '',
      answerCodeInput: '',
      remotePlayers: {},
      error: undefined,
      lastEvent: 'Local party ended.',
    })
  },
  broadcastSnapshot: (snapshot) => sendPartyMessage({ type: 'snapshot', snapshot: makePartySnapshot(snapshot) }),
  pruneRemotePlayers: (now = Date.now()) =>
    set((state) => ({
      remotePlayers: Object.fromEntries(Object.entries(state.remotePlayers).filter(([, player]) => isRemoteFresh(player, now))),
    })),
}))
