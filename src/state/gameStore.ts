import { create } from 'zustand'
import { botProfiles } from '../data/botProfiles'
import {
  botReplyForPreset,
  findPredefinedMessage,
} from '../data/predefinedMessages'
import { questDefinitions } from '../data/quests'
import { shopItems } from '../data/shopItems'
import { getLocation } from '../data/world'
import { findBadge } from '../data/badges'
import { createInitialBot, updateBot } from '../ai/botBrain'
import { selectDialogue, type DialogueContext } from '../ai/dialogue'
import { advanceQuest, createQuestProgress } from '../ai/quests'
import { applyItem, purchaseItem } from '../ai/inventory'
import { completeTogether, touchMemory } from '../ai/relationship'
import { finishObby, obbyStart, startObby, updateCheckpoint } from '../ai/obby'
import {
  createInitialMiniGame,
  miniGameDefinition,
  startMiniGameSession,
  tickMiniGameSession,
} from '../ai/miniGames'
import {
  sanitizePartyName,
  useLocalPartyStore,
  type LocalPartyDirectMessage,
} from './localPartyStore'
import {
  createBuildMapStamp,
  createBuildPiece,
  findBuildPlacementPosition,
  maxBuildPieces,
  mergeBuildPieces,
  nextBuildPosition,
  rotateBuildYaw,
  worldBuildPlacementIssue,
} from '../ai/buildMode'
import type {
  AvatarSettings,
  BadgeId,
  BuildBlock,
  BuildPieceId,
  BotMemory,
  BotRuntime,
  ChatMessage,
  DirectMessage,
  GameSettings,
  InteriorVisit,
  LocationId,
  MessageThread,
  MiniGameId,
  MiniGameRecord,
  MiniGameRuntime,
  ObbyState,
  PlayerEmote,
  QuestId,
  QuestProgress,
  SavedAvatarStyle,
  SavedFriend,
  ShopItemId,
  Vec3,
} from '../game/types'

export type GameSave = {
  profileComplete: boolean
  playerName: string
  coins: number
  avatar: AvatarSettings
  savedAvatars: SavedAvatarStyle[]
  savedFriends: SavedFriend[]
  unlockedItems: ShopItemId[]
  questProgress: QuestProgress[]
  botMemory: Record<string, BotMemory>
  settings: GameSettings
  earnedBadges: BadgeId[]
  placedBlocks: BuildBlock[]
  miniGameRecords?: Partial<Record<MiniGameId, MiniGameRecord>>
  obbyBestTime?: number
  messageThreads?: MessageThread[]
}

type TouchInput = {
  x: number
  y: number
  lookX: number
  lookY: number
  jump: boolean
  interact: boolean
  run: boolean
}

export type InteractionPrompt =
  'sleep' | 'wake' | 'sit' | 'stand' | 'enter-vehicle' | 'exit-vehicle'

export type WorldActionRequest = {
  type: 'seat' | 'vehicle'
  id: string
  sequence: number
}

type TeleportTarget = {
  sequence: number
  position: Vec3
  yaw: number
  resetView?: boolean
}

type CustomizationSelection = {
  name: string
  cost: number
  shopItemId?: ShopItemId
  patch: Partial<AvatarSettings>
  emote?: PlayerEmote
}

export type GamePanel =
  | 'map'
  | 'quests'
  | 'shop'
  | 'avatar'
  | 'settings'
  | 'friends'
  | 'leaderboard'
  | 'badges'
  | 'build'
  | 'server'
  | 'emotes'
  | 'minigames'
  | 'messages'
  | 'tutorial'

type GameState = GameSave & {
  playerPosition: Vec3
  playerYaw: number
  teleportSequence: number
  teleportTarget?: TeleportTarget
  screen: 'menu' | 'setup-avatar' | 'setup-name' | 'game'
  saveLoaded: boolean
  bots: BotRuntime[]
  chat: ChatMessage[]
  messageThreads: MessageThread[]
  selectedMessageThreadId?: string
  nearbyLocation?: LocationId
  activeInterior?: InteriorVisit
  visitedBots: string[]
  obby: ObbyState
  miniGame: MiniGameRuntime
  touch: TouchInput
  loading: boolean
  saveStatus: 'idle' | 'saving' | 'saved'
  openPanel?: GamePanel
  playerEmote: PlayerEmote
  sleeping: boolean
  seatedSeatId?: string
  activeVehicleId?: string
  interactionPrompt?: InteractionPrompt
  worldActionRequest?: WorldActionRequest
  buildMode: boolean
  selectedBuildPiece: BuildPieceId
  selectedBuildBlockId?: string
  selectedBuildColor: string
  buildRotation: number
  setScreen: (screen: GameState['screen']) => void
  setPlayerName: (name: string) => void
  completePlayerProfile: (name: string) => void
  setPlayer: (position: Vec3, yaw: number, controllerSequence?: number) => void
  travelToLocation: (id: LocationId) => boolean
  resetToSquare: () => void
  setTouch: (input: Partial<TouchInput>) => void
  setNearbyLocation: (location?: LocationId) => void
  enterInterior: (
    interior: InteriorVisit,
    arrivalPosition: Vec3,
    arrivalYaw: number,
  ) => void
  leaveInterior: () => InteriorVisit | undefined
  tickBots: (now: number) => void
  botReact: (botId: string, context: DialogueContext) => void
  sendQuickReply: (text: string, context: DialogueContext) => void
  openMessageThread: (botId: string, contactName?: string) => void
  closeMessageThread: () => void
  sendPredefinedMessage: (botId: string, presetId: string) => void
  receiveLocalPartyMessage: (message: LocalPartyDirectMessage) => void
  startQuest: (id: QuestId) => void
  advanceQuest: (id: QuestId, amount: number) => void
  addCoins: (amount: number) => void
  awardBadge: (id: BadgeId) => void
  buyItem: (id: ShopItemId) => void
  applyOwnedItem: (id: ShopItemId) => void
  updateAvatar: (avatar: Partial<AvatarSettings>) => void
  saveCurrentAvatarStyle: (name?: string) => void
  applySavedAvatarStyle: (id: string) => void
  deleteSavedAvatarStyle: (id: string) => void
  createSavedFriend: (name?: string) => void
  toggleSavedFriendInWorld: (id: string) => void
  deleteSavedFriend: (id: string) => void
  selectCustomizationItem: (item: CustomizationSelection) => void
  setPlayerEmote: (emote: PlayerEmote) => void
  setSleeping: (sleeping: boolean) => void
  setSeatedSeat: (seatId?: string) => void
  setActiveVehicle: (vehicleId?: string) => void
  setInteractionPrompt: (prompt?: InteractionPrompt) => void
  requestWorldAction: (type: WorldActionRequest['type'], id: string) => void
  setBuildMode: (enabled: boolean) => void
  setSelectedBuildPiece: (piece: BuildPieceId) => void
  setSelectedBuildBlock: (blockId?: string) => void
  setSelectedBuildColor: (color: string) => void
  rotateBuildPiece: () => void
  placeBlock: () => void
  placeMapStamp: () => void
  removeLastBlock: () => void
  removeSelectedBlock: () => void
  mergeSharedBuildBlocks: (blocks: BuildBlock[]) => void
  beginObby: (now: number) => void
  updateObby: (now: number, checkpoints: Vec3[]) => void
  completeObby: (now: number) => void
  startMiniGame: (id: MiniGameId, now: number) => void
  tickMiniGame: (now: number, position: Vec3) => void
  cancelMiniGame: () => void
  recordBotMeet: (botId: string) => void
  updateSettings: (settings: Partial<GameSettings>) => void
  resetSave: () => void
  loadFromSave: (save: Partial<GameSave>) => void
  markSaveLoaded: () => void
  markSaving: () => void
  markSaved: () => void
  setOpenPanel: (panel?: GamePanel) => void
}

export const defaultAvatar: AvatarSettings = {
  bodyColor: '#9a5b43',
  shirtColor: '#5eead4',
  hairColor: '#5a2f16',
  hairStyle: 'spiky',
  face: 'smile',
  eyeColor: '#111827',
  accentColor: '#0b74ff',
  secondaryColor: '#ffffff',
  pantsColor: '#111827',
  topStyle: 'top-blue-hoodie',
  outfitStyle: 'hoodie',
  bottomStyle: 'jeans',
  shoeStyle: 'sneakers',
  shoeColor: '#f8fafc',
  avatarSource: 'London Explorer',
  hat: 'none',
  accessory: 'none',
  trail: 'none',
}

const legacyDefaultAvatar: AvatarSettings = {
  bodyColor: '#facc15',
  shirtColor: '#2563eb',
  hat: 'none',
  trail: 'none',
}

export function normalizeSavedAvatar(
  avatar: AvatarSettings | undefined,
): AvatarSettings | undefined {
  if (!avatar) return undefined
  const isLegacyDefault =
    avatar.bodyColor === legacyDefaultAvatar.bodyColor &&
    avatar.shirtColor === legacyDefaultAvatar.shirtColor &&
    avatar.hat === legacyDefaultAvatar.hat &&
    avatar.trail === legacyDefaultAvatar.trail
  return isLegacyDefault ? defaultAvatar : { ...defaultAvatar, ...avatar }
}

export const defaultSettings: GameSettings = {
  quality: 'medium',
  audio: true,
  music: true,
  reducedMotion: false,
  proceduralWorld: true,
  worldSeed: 'LONDON-2026',
  worldViewDistance: 1,
  nightMode: false,
  interiorCameraZoom: 1.3,
}

export const defaultPlayerName = 'BlockBuddy'

function avatarMatches(a: AvatarSettings, b: AvatarSettings) {
  return (
    JSON.stringify(normalizeSavedAvatar(a)) ===
    JSON.stringify(normalizeSavedAvatar(b))
  )
}

function hasCompletedLegacyProfile(save: Partial<GameSave>) {
  if (typeof save.profileComplete === 'boolean') return save.profileComplete
  const nameChanged = Boolean(
    save.playerName && sanitizePartyName(save.playerName) !== defaultPlayerName,
  )
  const avatarChanged = Boolean(
    save.avatar && !avatarMatches(save.avatar, defaultAvatar),
  )
  return nameChanged || avatarChanged
}

function systemMessage(text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    author: 'System',
    text,
    kind: 'system',
    createdAt: Date.now(),
  }
}

function botMessage(author: string, text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    author,
    text,
    kind: 'bot',
    createdAt: Date.now(),
  }
}

function playerMessage(author: string, text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    author,
    text,
    kind: 'player',
    createdAt: Date.now(),
  }
}

function initialBots() {
  return botProfiles.map(createInitialBot)
}

function makeId(prefix: string) {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${randomId}`
}

function directMessage(
  presetId: string,
  text: string,
  from: DirectMessage['from'],
  read: boolean,
): DirectMessage {
  return {
    id: makeId('dm'),
    presetId,
    text,
    from,
    read,
    createdAt: Date.now(),
  }
}

const starterMessageIds = ['greeting-008', 'game-001', 'quest-001', 'fun-003']
const friendRoutes: LocationId[][] = [
  ['spawn', 'park', 'shop', 'houses'],
  ['spawn', 'school', 'obby', 'park'],
  ['parking', 'shop', 'hall', 'spawn'],
]

function createInitialMessageThreads(): MessageThread[] {
  const now = Date.now()
  return botProfiles.map((bot, index) => {
    const presetId = starterMessageIds[index]
    const preset = presetId ? findPredefinedMessage(presetId) : undefined
    const messages = preset
      ? [
          {
            id: makeId('dm'),
            presetId: preset.id,
            text: preset.text,
            from: 'bot' as const,
            read: false,
            createdAt: now + index,
          },
        ]
      : []
    return {
      id: bot.id,
      botId: bot.id,
      botName: bot.username,
      messages,
      updatedAt: messages[0]?.createdAt ?? now,
    }
  })
}

function sanitizeSavedFriends(
  friends: SavedFriend[] | undefined,
): SavedFriend[] {
  if (!friends?.length) return []
  return friends.slice(0, 12).map((friend, index) => ({
    ...friend,
    name: sanitizePartyName(friend.name || `Friend ${index + 1}`),
    avatar: normalizeSavedAvatar(friend.avatar) ?? defaultAvatar,
    route: friend.route?.length
      ? friend.route
      : friendRoutes[index % friendRoutes.length],
    inWorld: Boolean(friend.inWorld),
  }))
}

function ensureMessageThreads(threads?: MessageThread[]): MessageThread[] {
  const now = Date.now()
  const botThreads = botProfiles.map((bot) => {
    const existing = threads?.find((thread) => thread.botId === bot.id)
    return {
      id: bot.id,
      botId: bot.id,
      botName: bot.username,
      messages: existing?.messages ?? [],
      updatedAt: existing?.updatedAt ?? now,
    }
  })
  const extraThreads =
    threads?.filter(
      (thread) => !botProfiles.some((bot) => bot.id === thread.botId),
    ) ?? []
  return [...botThreads, ...extraThreads]
}

function ensureMessageThread(
  threads: MessageThread[],
  contactId: string,
  contactName = 'LocalBuddy',
): MessageThread[] {
  const ensured = ensureMessageThreads(threads)
  if (ensured.some((thread) => thread.botId === contactId)) return ensured
  return [
    ...ensured,
    {
      id: contactId,
      botId: contactId,
      botName: sanitizePartyName(contactName),
      messages: [],
      updatedAt: Date.now(),
    },
  ]
}

function addDirectMessage(
  threads: MessageThread[],
  botId: string,
  message: DirectMessage,
  contactName?: string,
): MessageThread[] {
  return ensureMessageThread(threads, botId, contactName).map((thread) =>
    thread.botId === botId
      ? {
          ...thread,
          messages: [...thread.messages.slice(-80), message],
          updatedAt: message.createdAt,
        }
      : thread,
  )
}

function markThreadRead(
  threads: MessageThread[],
  botId: string,
): MessageThread[] {
  return ensureMessageThreads(threads).map((thread) =>
    thread.botId === botId
      ? {
          ...thread,
          messages: thread.messages.map((message) =>
            message.from === 'bot' ? { ...message, read: true } : message,
          ),
        }
      : thread,
  )
}

function localPartyDirectMessage(
  message: LocalPartyDirectMessage,
): DirectMessage {
  return {
    id: message.id,
    presetId: message.presetId,
    text: message.text,
    from: 'bot',
    read: false,
    createdAt: message.createdAt,
  }
}

function initialQuestProgress() {
  return createQuestProgress(questDefinitions)
}

const initialObby: ObbyState = {
  active: false,
  checkpoint: obbyStart,
  startedAt: 0,
  finished: false,
}

const initialMiniGame = createInitialMiniGame()

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu',
  profileComplete: false,
  saveLoaded: false,
  playerName: defaultPlayerName,
  coins: 0,
  earnedBadges: ['welcome'],
  placedBlocks: [],
  avatar: defaultAvatar,
  savedAvatars: [],
  savedFriends: [],
  unlockedItems: [],
  questProgress: initialQuestProgress(),
  botMemory: {},
  settings: defaultSettings,
  playerPosition: [0, 0, 4],
  playerYaw: 0,
  teleportSequence: 0,
  bots: initialBots(),
  chat: [
    systemMessage('Local server started'),
    ...botProfiles
      .slice(0, 4)
      .map((bot) => systemMessage(`${bot.username} joined the local server`)),
  ],
  messageThreads: createInitialMessageThreads(),
  selectedMessageThreadId: undefined,
  visitedBots: [],
  obby: initialObby,
  miniGame: initialMiniGame,
  touch: {
    x: 0,
    y: 0,
    lookX: 0,
    lookY: 0,
    jump: false,
    interact: false,
    run: false,
  },
  loading: false,
  saveStatus: 'idle',
  playerEmote: 'none',
  sleeping: false,
  seatedSeatId: undefined,
  activeVehicleId: undefined,
  worldActionRequest: undefined,
  buildMode: false,
  selectedBuildPiece: 'block',
  selectedBuildBlockId: undefined,
  selectedBuildColor: '#38bdf8',
  buildRotation: 0,

  setScreen: (screen) => set({ screen }),
  setPlayerName: (name) => {
    const playerName = sanitizePartyName(name)
    useLocalPartyStore.getState().setPlayerName(playerName)
    set({ playerName })
  },
  completePlayerProfile: (name) => {
    const playerName = sanitizePartyName(name) || defaultPlayerName
    useLocalPartyStore.getState().setPlayerName(playerName)
    set((state) => {
      const alreadySaved = state.savedAvatars.some((style) =>
        avatarMatches(style.avatar, state.avatar),
      )
      const saved: SavedAvatarStyle = {
        id: makeId('avatar-style'),
        name: playerName,
        avatar: { ...state.avatar, avatarSource: playerName },
        createdAt: Date.now(),
      }
      return {
        playerName,
        profileComplete: true,
        savedAvatars: alreadySaved
          ? state.savedAvatars
          : [saved, ...state.savedAvatars].slice(0, 18),
      }
    })
  },
  setPlayer: (playerPosition, playerYaw, controllerSequence) =>
    set((state) => {
      if (
        state.teleportTarget &&
        controllerSequence !== state.teleportTarget.sequence
      )
        return state
      return { playerPosition, playerYaw, teleportTarget: undefined }
    }),
  travelToLocation: (id) => {
    const state = get()
    if (state.obby.active || state.miniGame.status === 'running') {
      set({
        chat: [
          ...state.chat.slice(-60),
          systemMessage('Finish or cancel the active game before travelling'),
        ],
      })
      return false
    }

    const destination = getLocation(id)
    set((current) => {
      const teleportSequence = current.teleportSequence + 1
      return {
        playerPosition: [...destination.travelPosition],
        playerYaw: destination.travelYaw,
        teleportSequence,
        teleportTarget: {
          sequence: teleportSequence,
          position: [...destination.travelPosition],
          yaw: destination.travelYaw,
        },
        activeInterior: undefined,
        nearbyLocation: destination.id,
        openPanel: undefined,
        buildMode: false,
        sleeping: false,
        seatedSeatId: undefined,
        activeVehicleId: undefined,
        interactionPrompt: undefined,
        worldActionRequest: undefined,
        playerEmote: 'none',
        touch: {
          x: 0,
          y: 0,
          lookX: 0,
          lookY: 0,
          jump: false,
          interact: false,
          run: false,
        },
        chat: [
          ...current.chat.slice(-60),
          systemMessage(`Travelled to ${destination.label}`),
        ],
      }
    })
    return true
  },
  resetToSquare: () =>
    set((state) => {
      const destination = getLocation('spawn')
      const teleportSequence = state.teleportSequence + 1
      return {
        playerPosition: [...destination.travelPosition],
        playerYaw: destination.travelYaw,
        teleportSequence,
        teleportTarget: {
          sequence: teleportSequence,
          position: [...destination.travelPosition],
          yaw: destination.travelYaw,
          resetView: true,
        },
        activeInterior: undefined,
        nearbyLocation: destination.id,
        openPanel: undefined,
        buildMode: false,
        sleeping: false,
        seatedSeatId: undefined,
        activeVehicleId: undefined,
        interactionPrompt: undefined,
        worldActionRequest: undefined,
        playerEmote: 'none',
        obby: { ...state.obby, active: false },
        miniGame: {
          ...state.miniGame,
          activeId: undefined,
          status: 'idle',
          score: 0,
          target: 0,
          collected: [],
        },
        touch: {
          x: 0,
          y: 0,
          lookX: 0,
          lookY: 0,
          jump: false,
          interact: false,
          run: false,
        },
        chat: [...state.chat.slice(-60), systemMessage('Reset to Spawn Plaza')],
      }
    }),
  setTouch: (input) =>
    set((state) => ({ touch: { ...state.touch, ...input } })),
  setNearbyLocation: (nearbyLocation) => set({ nearbyLocation }),
  enterInterior: (activeInterior, arrivalPosition, arrivalYaw) =>
    set((state) => {
      const teleportSequence = state.teleportSequence + 1
      return {
        activeInterior,
        playerPosition: [...arrivalPosition],
        playerYaw: arrivalYaw,
        teleportSequence,
        teleportTarget: {
          sequence: teleportSequence,
          position: [...arrivalPosition],
          yaw: arrivalYaw,
          resetView: true,
        },
        nearbyLocation: undefined,
        openPanel: undefined,
        buildMode: false,
        sleeping: false,
        seatedSeatId: undefined,
        activeVehicleId: undefined,
        interactionPrompt: undefined,
        worldActionRequest: undefined,
        touch: {
          x: 0,
          y: 0,
          lookX: 0,
          lookY: 0,
          jump: false,
          interact: false,
          run: false,
        },
        chat: [
          ...state.chat.slice(-60),
          systemMessage(`Entered ${activeInterior.title}`),
        ],
      }
    }),
  leaveInterior: () => {
    const activeInterior = get().activeInterior
    if (!activeInterior) return undefined
    set((state) => {
      const teleportSequence = state.teleportSequence + 1
      return {
        activeInterior: undefined,
        playerPosition: [...activeInterior.returnPosition],
        playerYaw: activeInterior.returnYaw,
        teleportSequence,
        teleportTarget: {
          sequence: teleportSequence,
          position: [...activeInterior.returnPosition],
          yaw: activeInterior.returnYaw,
          resetView: true,
        },
        sleeping: false,
        seatedSeatId: undefined,
        activeVehicleId: undefined,
        interactionPrompt: undefined,
        worldActionRequest: undefined,
        touch: {
          x: 0,
          y: 0,
          lookX: 0,
          lookY: 0,
          jump: false,
          interact: false,
          run: false,
        },
        chat: [
          ...state.chat.slice(-60),
          systemMessage(`Left ${activeInterior.title}`),
        ],
      }
    })
    return activeInterior
  },
  setOpenPanel: (openPanel) => set({ openPanel }),

  tickBots: (now) =>
    set((state) => {
      let seed = now
      const random = () => {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
      }
      return {
        bots: state.bots.map((bot) => {
          const profile =
            botProfiles.find((item) => item.id === bot.id) ?? botProfiles[0]
          return updateBot({
            bot,
            profile,
            playerPosition: state.playerPosition,
            now,
            random,
          })
        }),
      }
    }),

  botReact: (botId, context) =>
    set((state) => {
      const profile = botProfiles.find((bot) => bot.id === botId)
      if (!profile) return state
      const memory = state.botMemory[botId]
      const line = selectDialogue(profile, context, Date.now(), memory)
      const inboxMessage = directMessage(
        `bot-${context}`,
        line,
        'bot',
        state.openPanel === 'messages' &&
          state.selectedMessageThreadId === botId,
      )
      return {
        bots: state.bots.map((bot) =>
          bot.id === botId
            ? { ...bot, speech: line, speechUntil: Date.now() + 3200 }
            : bot,
        ),
        chat: [...state.chat.slice(-60), botMessage(profile.username, line)],
        messageThreads: addDirectMessage(
          state.messageThreads,
          botId,
          inboxMessage,
        ),
      }
    }),

  sendQuickReply: (text, context) => {
    set((state) => ({
      chat: [...state.chat.slice(-60), playerMessage(state.playerName, text)],
    }))
    get().awardBadge('social-buddy')
    const nearest = get().bots[0]
    if (nearest) get().botReact(nearest.id, context)
  },

  openMessageThread: (botId, contactName) =>
    set((state) => ({
      openPanel: 'messages',
      selectedMessageThreadId: botId,
      messageThreads: markThreadRead(
        ensureMessageThread(state.messageThreads, botId, contactName),
        botId,
      ),
    })),

  closeMessageThread: () => set({ selectedMessageThreadId: undefined }),

  sendPredefinedMessage: (botId, presetId) => {
    const preset = findPredefinedMessage(presetId)
    const profile = botProfiles.find((bot) => bot.id === botId)
    if (!preset) return
    if (!profile) {
      const contactName =
        get().messageThreads.find((thread) => thread.botId === botId)
          ?.botName ??
        useLocalPartyStore.getState().remotePlayers[botId]?.name ??
        'LocalBuddy'
      const outgoing = directMessage(preset.id, preset.text, 'player', true)
      useLocalPartyStore
        .getState()
        .sendDirectMessage(botId, preset.id, preset.text)
      set((state) => ({
        messageThreads: addDirectMessage(
          ensureMessageThread(state.messageThreads, botId, contactName),
          botId,
          outgoing,
          contactName,
        ),
        chat: [
          ...state.chat.slice(-60),
          playerMessage(state.playerName, preset.text),
        ],
      }))
      get().awardBadge('social-buddy')
      return
    }
    const reply = botReplyForPreset(preset.id)
    const outgoing = directMessage(preset.id, preset.text, 'player', true)
    const replyMessage = reply
      ? directMessage(
          reply.id,
          reply.text,
          'bot',
          get().openPanel === 'messages' &&
            get().selectedMessageThreadId === botId,
        )
      : undefined

    set((state) => ({
      messageThreads: replyMessage
        ? addDirectMessage(
            addDirectMessage(state.messageThreads, botId, outgoing),
            botId,
            replyMessage,
          )
        : addDirectMessage(state.messageThreads, botId, outgoing),
      bots: replyMessage
        ? state.bots.map((bot) =>
            bot.id === botId
              ? {
                  ...bot,
                  speech: replyMessage.text,
                  speechUntil: Date.now() + 3200,
                }
              : bot,
          )
        : state.bots,
      chat: replyMessage
        ? [
            ...state.chat.slice(-58),
            playerMessage(state.playerName, preset.text),
            botMessage(profile.username, replyMessage.text),
          ]
        : [
            ...state.chat.slice(-60),
            playerMessage(state.playerName, preset.text),
          ],
    }))
    get().awardBadge('social-buddy')
  },

  receiveLocalPartyMessage: (message) =>
    set((state) => ({
      messageThreads: addDirectMessage(
        ensureMessageThread(
          state.messageThreads,
          message.fromId,
          message.fromName,
        ),
        message.fromId,
        localPartyDirectMessage(message),
        message.fromName,
      ),
      chat: [
        ...state.chat.slice(-60),
        botMessage(message.fromName, message.text),
      ],
    })),

  startQuest: (id) =>
    set((state) => ({
      questProgress: state.questProgress.map((quest) =>
        quest.id === id ? { ...quest, started: true } : quest,
      ),
      chat: [...state.chat.slice(-60), systemMessage('Quest started')],
    })),

  advanceQuest: (id, amount) =>
    set((state) => {
      const definition = questDefinitions.find((quest) => quest.id === id)
      if (!definition) return state
      let coins = state.coins
      let completed = false
      const questProgress = state.questProgress.map((quest) => {
        if (quest.id !== id) return quest
        const result = advanceQuest(quest, definition, amount)
        completed = result.completedNow
        if (completed) coins += definition.reward
        return result.progress
      })
      return {
        coins,
        questProgress,
        chat: completed
          ? [
              ...state.chat.slice(-60),
              systemMessage(
                `${definition.title} complete! +${definition.reward} coins`,
              ),
            ]
          : state.chat,
      }
    }),

  addCoins: (amount) => {
    set((state) => ({ coins: Math.max(0, state.coins + amount) }))
    if (get().coins >= 10) get().awardBadge('coin-starter')
    if (amount > 0) get().advanceQuest('collect-10-coins', amount)
  },

  awardBadge: (id) =>
    set((state) => {
      if (state.earnedBadges.includes(id)) return state
      const badge = findBadge(id)
      return {
        earnedBadges: [...state.earnedBadges, id],
        chat: badge
          ? [
              ...state.chat.slice(-60),
              systemMessage(`Badge earned: ${badge.title}`),
            ]
          : state.chat,
      }
    }),

  buyItem: (id) =>
    set((state) => {
      const item = shopItems.find((entry) => entry.id === id)
      if (!item) return state
      const result = purchaseItem(state.coins, state.unlockedItems, item)
      return {
        coins: result.coins,
        unlockedItems: result.unlocked,
        avatar: result.purchased ? applyItem(state.avatar, item) : state.avatar,
        chat: result.purchased
          ? [...state.chat.slice(-60), systemMessage(`Unlocked ${item.name}`)]
          : state.chat,
      }
    }),

  setPlayerEmote: (playerEmote) => {
    set({ playerEmote, sleeping: false, interactionPrompt: undefined })
    if (playerEmote !== 'none') {
      set((state) => ({
        chat: [
          ...state.chat.slice(-60),
          systemMessage(`You used ${playerEmote}`),
        ],
      }))
      window.setTimeout(() => {
        if (useGameStore.getState().playerEmote === playerEmote)
          useGameStore.setState({ playerEmote: 'none' })
      }, 2600)
    }
  },
  setSleeping: (sleeping) =>
    set((state) =>
      state.sleeping === sleeping
        ? state
        : {
            sleeping,
            seatedSeatId: sleeping ? undefined : state.seatedSeatId,
            activeVehicleId: sleeping ? undefined : state.activeVehicleId,
            playerEmote: sleeping ? 'none' : state.playerEmote,
            interactionPrompt: sleeping ? 'wake' : undefined,
            chat: [
              ...state.chat.slice(-60),
              systemMessage(sleeping ? 'You are sleeping' : 'You woke up'),
            ],
          },
    ),
  setSeatedSeat: (seatedSeatId) =>
    set((state) =>
      state.seatedSeatId === seatedSeatId
        ? state
        : {
            seatedSeatId,
            sleeping: false,
            activeVehicleId: seatedSeatId ? undefined : state.activeVehicleId,
            playerEmote: seatedSeatId ? 'none' : state.playerEmote,
            interactionPrompt: seatedSeatId ? 'stand' : undefined,
            chat: [
              ...state.chat.slice(-60),
              systemMessage(seatedSeatId ? 'You sat down' : 'You stood up'),
            ],
          },
    ),
  setActiveVehicle: (activeVehicleId) =>
    set((state) =>
      state.activeVehicleId === activeVehicleId
        ? state
        : {
            activeVehicleId,
            sleeping: false,
            seatedSeatId: undefined,
            playerEmote: 'none',
            interactionPrompt: activeVehicleId ? 'exit-vehicle' : undefined,
            chat: [
              ...state.chat.slice(-60),
              systemMessage(
                activeVehicleId ? 'You started driving' : 'You left the car',
              ),
            ],
          },
    ),
  setInteractionPrompt: (interactionPrompt) =>
    set((state) =>
      state.interactionPrompt === interactionPrompt
        ? state
        : { interactionPrompt },
    ),
  requestWorldAction: (type, id) =>
    set((state) => ({
      worldActionRequest: {
        type,
        id,
        sequence: (state.worldActionRequest?.sequence ?? 0) + 1,
      },
    })),

  setBuildMode: (buildMode) =>
    set((state) =>
      buildMode && state.activeInterior
        ? {
            buildMode: false,
            chat: [
              ...state.chat.slice(-60),
              systemMessage('Leave the building before using build mode'),
            ],
          }
        : {
            buildMode,
            selectedBuildBlockId: undefined,
            seatedSeatId: buildMode ? undefined : state.seatedSeatId,
            activeVehicleId: buildMode ? undefined : state.activeVehicleId,
            interactionPrompt: buildMode ? undefined : state.interactionPrompt,
          },
    ),
  setSelectedBuildPiece: (selectedBuildPiece) => set({ selectedBuildPiece }),
  setSelectedBuildBlock: (selectedBuildBlockId) =>
    set({ selectedBuildBlockId }),
  setSelectedBuildColor: (selectedBuildColor) => set({ selectedBuildColor }),
  rotateBuildPiece: () =>
    set((state) => ({ buildRotation: rotateBuildYaw(state.buildRotation) })),
  placeBlock: () =>
    set((state) => {
      if (state.activeInterior) {
        return {
          chat: [
            ...state.chat.slice(-60),
            systemMessage('Leave the building before placing world pieces'),
          ],
        }
      }
      if (state.placedBlocks.length >= maxBuildPieces) {
        return {
          chat: [
            ...state.chat.slice(-60),
            systemMessage('Custom world limit reached'),
          ],
        }
      }
      const placement = findBuildPlacementPosition({
        blocks: state.placedBlocks,
        playerPosition: state.playerPosition,
        yaw: state.playerYaw,
        pieceId: state.selectedBuildPiece,
        worldSeed: state.settings.worldSeed,
      })
      if (!placement.position) {
        return {
          chat: [
            ...state.chat.slice(-60),
            systemMessage(placement.issue ?? 'No clear build cell nearby'),
          ],
        }
      }
      const block: BuildBlock = {
        ...createBuildPiece({
          id: crypto.randomUUID(),
          kind: state.selectedBuildPiece,
          position: placement.position,
          color: state.selectedBuildColor,
          rotation: state.buildRotation,
        }),
      }
      return {
        placedBlocks: [...state.placedBlocks, block],
        selectedBuildBlockId: block.id,
        chat: [...state.chat.slice(-60), systemMessage('World piece placed')],
        earnedBadges: state.earnedBadges.includes('builder')
          ? state.earnedBadges
          : [...state.earnedBadges, 'builder'],
      }
    }),
  placeMapStamp: () =>
    set((state) => {
      if (state.activeInterior) {
        return {
          chat: [
            ...state.chat.slice(-60),
            systemMessage('Leave the building before adding street maps'),
          ],
        }
      }
      if (state.placedBlocks.length >= maxBuildPieces) {
        return {
          chat: [
            ...state.chat.slice(-60),
            systemMessage('Custom world limit reached'),
          ],
        }
      }
      const origin = nextBuildPosition(
        state.playerPosition,
        state.playerYaw,
        'road',
      )
      const stamp = createBuildMapStamp({
        origin,
        yaw: state.buildRotation,
        idFactory: () => crypto.randomUUID(),
      })
      const accepted = mergeBuildPieces(
        state.placedBlocks,
        stamp,
        maxBuildPieces,
        (piece) =>
          !worldBuildPlacementIssue(
            piece.position,
            piece.kind ?? 'block',
            state.settings.worldSeed,
          ),
      )
      if (accepted.length === 0) {
        return {
          chat: [
            ...state.chat.slice(-60),
            systemMessage('No room for that street map'),
          ],
        }
      }
      return {
        placedBlocks: [...state.placedBlocks, ...accepted],
        chat: [
          ...state.chat.slice(-60),
          systemMessage(`Street map added: ${accepted.length} pieces`),
        ],
        earnedBadges: state.earnedBadges.includes('builder')
          ? state.earnedBadges
          : [...state.earnedBadges, 'builder'],
      }
    }),
  removeLastBlock: () =>
    set((state) => {
      const removedId = state.placedBlocks.at(-1)?.id
      return {
        placedBlocks: state.placedBlocks.slice(0, -1),
        selectedBuildBlockId:
          state.selectedBuildBlockId === removedId
            ? undefined
            : state.selectedBuildBlockId,
        chat: [...state.chat.slice(-60), systemMessage('Last block removed')],
      }
    }),
  removeSelectedBlock: () =>
    set((state) => {
      if (!state.selectedBuildBlockId) return state
      const selectedExists = state.placedBlocks.some(
        (block) => block.id === state.selectedBuildBlockId,
      )
      if (!selectedExists) return { selectedBuildBlockId: undefined }
      return {
        placedBlocks: state.placedBlocks.filter(
          (block) => block.id !== state.selectedBuildBlockId,
        ),
        selectedBuildBlockId: undefined,
        chat: [
          ...state.chat.slice(-60),
          systemMessage('Selected world piece removed'),
        ],
      }
    }),
  mergeSharedBuildBlocks: (blocks) =>
    set((state) => {
      const incoming = blocks.filter(
        (block) =>
          !state.placedBlocks.some((existing) => existing.id === block.id),
      )
      if (incoming.length === 0) return state
      const accepted = mergeBuildPieces(
        state.placedBlocks,
        incoming,
        maxBuildPieces,
        (piece) =>
          !worldBuildPlacementIssue(
            piece.position,
            piece.kind ?? 'block',
            state.settings.worldSeed,
          ),
      )
      if (accepted.length === 0) return state
      return {
        placedBlocks: [...state.placedBlocks, ...accepted],
        chat: [
          ...state.chat.slice(-60),
          systemMessage(
            `Local party build synced: ${accepted.length} piece${accepted.length === 1 ? '' : 's'}`,
          ),
        ],
        earnedBadges: state.earnedBadges.includes('builder')
          ? state.earnedBadges
          : [...state.earnedBadges, 'builder'],
      }
    }),

  applyOwnedItem: (id) =>
    set((state) => {
      const item = shopItems.find((entry) => entry.id === id)
      if (!item || !state.unlockedItems.includes(id)) return state
      return { avatar: applyItem(state.avatar, item) }
    }),
  updateAvatar: (avatar) =>
    set((state) => ({ avatar: { ...state.avatar, ...avatar } })),
  saveCurrentAvatarStyle: (name) =>
    set((state) => {
      const fallbackName =
        state.avatar.avatarSource ?? `${state.playerName}'s Style`
      const styleName = sanitizePartyName(name ?? fallbackName) || fallbackName
      const saved: SavedAvatarStyle = {
        id: makeId('avatar-style'),
        name: styleName,
        avatar: { ...state.avatar, avatarSource: styleName },
        createdAt: Date.now(),
      }
      return {
        savedAvatars: [
          saved,
          ...state.savedAvatars.filter((style) => style.name !== styleName),
        ].slice(0, 18),
        chat: [
          ...state.chat.slice(-60),
          systemMessage(`Saved avatar style: ${styleName}`),
        ],
      }
    }),
  applySavedAvatarStyle: (id) =>
    set((state) => {
      const style = state.savedAvatars.find((entry) => entry.id === id)
      if (!style) return state
      return {
        avatar: normalizeSavedAvatar(style.avatar) ?? state.avatar,
        chat: [
          ...state.chat.slice(-60),
          systemMessage(`Equipped saved style: ${style.name}`),
        ],
      }
    }),
  deleteSavedAvatarStyle: (id) =>
    set((state) => ({
      savedAvatars: state.savedAvatars.filter((style) => style.id !== id),
    })),
  createSavedFriend: (name) =>
    set((state) => {
      const friendName =
        sanitizePartyName(
          name ?? `${state.playerName} Friend ${state.savedFriends.length + 1}`,
        ) || `Friend ${state.savedFriends.length + 1}`
      const friend: SavedFriend = {
        id: makeId('saved-friend'),
        name: friendName,
        avatar: {
          ...state.avatar,
          avatarSource: `${friendName} Style`,
          shirtColor:
            state.savedFriends.length % 2 === 0 ? '#60a5fa' : '#f472b6',
          accentColor:
            state.savedFriends.length % 3 === 0
              ? '#22c55e'
              : state.avatar.accentColor,
        },
        inWorld: true,
        route: friendRoutes[state.savedFriends.length % friendRoutes.length],
        createdAt: Date.now(),
      }
      return {
        savedFriends: [friend, ...state.savedFriends].slice(0, 12),
        messageThreads: ensureMessageThread(
          state.messageThreads,
          friend.id,
          friend.name,
        ),
        chat: [
          ...state.chat.slice(-60),
          systemMessage(`${friend.name} was added as a game friend`),
        ],
      }
    }),
  toggleSavedFriendInWorld: (id) =>
    set((state) => ({
      savedFriends: state.savedFriends.map((friend) =>
        friend.id === id ? { ...friend, inWorld: !friend.inWorld } : friend,
      ),
    })),
  deleteSavedFriend: (id) =>
    set((state) => ({
      savedFriends: state.savedFriends.filter((friend) => friend.id !== id),
      messageThreads: state.messageThreads.filter(
        (thread) => thread.botId !== id,
      ),
    })),
  selectCustomizationItem: (item) => {
    set((state) => {
      const itemId = item.shopItemId
      const requiresUnlock =
        itemId !== undefined &&
        item.cost > 0 &&
        !state.unlockedItems.includes(itemId)
      if (requiresUnlock && state.coins < item.cost) {
        return {
          chat: [
            ...state.chat.slice(-60),
            systemMessage(`Need ${item.cost} coins for ${item.name}`),
          ],
        }
      }

      const unlockedItems =
        requiresUnlock && itemId
          ? [...state.unlockedItems, itemId]
          : state.unlockedItems
      const coins = requiresUnlock ? state.coins - item.cost : state.coins
      return {
        coins,
        unlockedItems,
        avatar: { ...state.avatar, ...item.patch },
        playerEmote: item.emote ?? state.playerEmote,
        chat: [
          ...state.chat.slice(-60),
          systemMessage(
            `${requiresUnlock ? 'Unlocked' : 'Equipped'} ${item.name}`,
          ),
        ],
      }
    })
    if (item.emote && item.emote !== 'none') {
      window.setTimeout(() => {
        if (useGameStore.getState().playerEmote === item.emote)
          useGameStore.setState({ playerEmote: 'none' })
      }, 2600)
    }
  },

  beginObby: (now) =>
    set((state) => {
      const teleportSequence = state.teleportSequence + 1
      return {
        obby: { ...startObby(now), bestTime: state.obby.bestTime },
        playerPosition: obbyStart,
        teleportSequence,
        teleportTarget: {
          sequence: teleportSequence,
          position: obbyStart,
          yaw: 0,
        },
        seatedSeatId: undefined,
        activeVehicleId: undefined,
        interactionPrompt: undefined,
        worldActionRequest: undefined,
        chat: [
          ...state.chat.slice(-60),
          systemMessage('Beginner obby started'),
        ],
      }
    }),

  updateObby: (_now, checkpoints) =>
    set((state) => ({
      obby: updateCheckpoint(state.obby, state.playerPosition, checkpoints),
    })),

  completeObby: (now) =>
    set((state) => {
      const result = finishObby(state.obby, now)
      return {
        obby: result.state,
        coins: state.coins + result.reward,
        earnedBadges: state.earnedBadges.includes('obby-rookie')
          ? state.earnedBadges
          : [...state.earnedBadges, 'obby-rookie'],
        questProgress: state.questProgress.map((quest) =>
          quest.id === 'beginner-obby'
            ? { ...quest, started: true, completed: true, progress: 1 }
            : quest,
        ),
        chat: [
          ...state.chat.slice(-60),
          systemMessage(`Obby complete! +${result.reward} coins`),
        ],
      }
    }),

  startMiniGame: (id, now) =>
    set((state) => {
      if (state.activeInterior) {
        return {
          chat: [
            ...state.chat.slice(-60),
            systemMessage('Leave the building before starting a mini game'),
          ],
        }
      }
      const definition = miniGameDefinition(id)
      const teleportSequence = state.teleportSequence + 1
      const eventSequence = state.miniGame.eventSequence + 1
      return {
        miniGame: startMiniGameSession(
          id,
          now,
          state.miniGame.records,
          eventSequence,
        ),
        playerPosition: definition.startPosition,
        teleportSequence,
        teleportTarget: {
          sequence: teleportSequence,
          position: definition.startPosition,
          yaw: 0,
        },
        activeInterior: undefined,
        buildMode: false,
        seatedSeatId: undefined,
        activeVehicleId: undefined,
        interactionPrompt: undefined,
        worldActionRequest: undefined,
        openPanel: undefined,
        chat: [
          ...state.chat.slice(-60),
          systemMessage(
            `Mini game started for all players: ${definition.title}`,
          ),
          systemMessage(`${definition.title}: ${definition.objective}`),
        ],
      }
    }),

  tickMiniGame: (now, position) =>
    set((state) => {
      if (state.miniGame.status !== 'running') return state
      const activeId = state.miniGame.activeId
      const result = tickMiniGameSession(state.miniGame, now, position)
      if (result.state === state.miniGame) return state
      const definition = activeId ? miniGameDefinition(activeId) : undefined
      const collectedMessages = result.collected.map((target) => {
        const coinText = target.coinReward
          ? `, +${target.coinReward} ${target.coinReward === 1 ? 'coin' : 'coins'}`
          : ''
        return systemMessage(
          `${target.label} collected! +${target.points ?? definition?.pointsPerTarget ?? 0} pts${coinText}${target.timeBonusMs ? `, +${Math.round(target.timeBonusMs / 1000)}s` : ''} (${result.state.score}/${result.state.target})`,
        )
      })
      const completedMessages =
        result.completedNow && definition
          ? [
              systemMessage(
                `${definition.title} complete! ${result.state.points} pts, +${result.reward} coins`,
              ),
              ...(!state.earnedBadges.includes('mini-game-star')
                ? [systemMessage('Badge earned: Mini Game Star')]
                : []),
              botMessage('SunnyBot', `Nice run in ${definition.title}!`),
            ]
          : []
      const failedMessages =
        result.failedNow && definition
          ? [
              systemMessage(
                `${definition.title} ended. Try again for the reward!`,
              ),
            ]
          : []
      return {
        miniGame: result.state,
        coins: state.coins + result.coinsAwarded + result.reward,
        earnedBadges:
          result.completedNow && !state.earnedBadges.includes('mini-game-star')
            ? [...state.earnedBadges, 'mini-game-star']
            : state.earnedBadges,
        chat: [
          ...state.chat.slice(-60),
          ...collectedMessages,
          ...completedMessages,
          ...failedMessages,
        ],
      }
    }),

  cancelMiniGame: () =>
    set((state) => ({
      miniGame: {
        ...state.miniGame,
        activeId: undefined,
        status: 'idle',
        score: 0,
        points: 0,
        target: 0,
        collected: [],
        announcement: undefined,
      },
      chat:
        state.miniGame.status === 'running'
          ? [...state.chat.slice(-60), systemMessage('Mini game cancelled')]
          : state.chat,
    })),

  recordBotMeet: (botId) =>
    set((state) => {
      const now = Date.now()
      const existing = state.botMemory[botId]
      const firstMeet = !state.visitedBots.includes(botId)
      if (existing && !firstMeet && now - existing.lastInteraction < 10000)
        return state
      const memory = touchMemory(existing, botId, now)
      const profile = botProfiles.find((bot) => bot.id === botId)
      const line = profile
        ? selectDialogue(profile, 'nearby', now, memory)
        : undefined
      const inboxMessage =
        line && profile
          ? directMessage(
              'bot-nearby',
              line,
              'bot',
              state.openPanel === 'messages' &&
                state.selectedMessageThreadId === botId,
            )
          : undefined
      return {
        visitedBots: firstMeet
          ? [...state.visitedBots, botId]
          : state.visitedBots,
        botMemory: { ...state.botMemory, [botId]: memory },
        earnedBadges:
          firstMeet &&
          state.visitedBots.length + 1 >= 3 &&
          !state.earnedBadges.includes('friend-maker')
            ? [...state.earnedBadges, 'friend-maker']
            : state.earnedBadges,
        bots: line
          ? state.bots.map((bot) =>
              bot.id === botId
                ? { ...bot, speech: line, speechUntil: now + 3000 }
                : bot,
            )
          : state.bots,
        chat: line
          ? [
              ...state.chat.slice(-60),
              botMessage(profile?.username ?? 'Buddy', line),
            ]
          : state.chat,
        messageThreads: inboxMessage
          ? addDirectMessage(state.messageThreads, botId, inboxMessage)
          : state.messageThreads,
      }
    }),

  updateSettings: (settings) =>
    set((state) => ({ settings: { ...state.settings, ...settings } })),

  resetSave: () => {
    useLocalPartyStore.getState().setPlayerName(defaultPlayerName)
    const teleportSequence = get().teleportSequence + 1
    set({
      profileComplete: false,
      playerName: defaultPlayerName,
      coins: 0,
      avatar: defaultAvatar,
      savedAvatars: [],
      savedFriends: [],
      unlockedItems: [],
      earnedBadges: ['welcome'],
      placedBlocks: [],
      settings: defaultSettings,
      buildMode: false,
      selectedBuildBlockId: undefined,
      playerEmote: 'none',
      sleeping: false,
      seatedSeatId: undefined,
      activeVehicleId: undefined,
      interactionPrompt: undefined,
      worldActionRequest: undefined,
      touch: {
        x: 0,
        y: 0,
        lookX: 0,
        lookY: 0,
        jump: false,
        interact: false,
        run: false,
      },
      selectedBuildPiece: 'block',
      selectedBuildColor: '#38bdf8',
      buildRotation: 0,
      activeInterior: undefined,
      nearbyLocation: undefined,
      playerPosition: [0, 0, 4],
      playerYaw: 0,
      teleportSequence,
      teleportTarget: {
        sequence: teleportSequence,
        position: [0, 0, 4],
        yaw: 0,
      },
      questProgress: initialQuestProgress(),
      botMemory: {},
      obby: initialObby,
      miniGame: createInitialMiniGame(),
      chat: [systemMessage('Save reset')],
      messageThreads: createInitialMessageThreads(),
      selectedMessageThreadId: undefined,
    })
  },

  loadFromSave: (save) =>
    set((state) => {
      const playerName = save.playerName
        ? sanitizePartyName(save.playerName)
        : state.playerName
      useLocalPartyStore.getState().setPlayerName(playerName)
      return {
        profileComplete: hasCompletedLegacyProfile(save),
        playerName,
        coins: save.coins ?? state.coins,
        avatar: normalizeSavedAvatar(save.avatar) ?? state.avatar,
        savedAvatars: save.savedAvatars ?? state.savedAvatars,
        savedFriends: sanitizeSavedFriends(
          save.savedFriends ?? state.savedFriends,
        ),
        unlockedItems: save.unlockedItems ?? state.unlockedItems,
        earnedBadges: save.earnedBadges ?? state.earnedBadges,
        placedBlocks: save.placedBlocks ?? state.placedBlocks,
        questProgress: save.questProgress ?? state.questProgress,
        botMemory: save.botMemory ?? state.botMemory,
        settings: { ...state.settings, ...save.settings },
        obby: { ...state.obby, bestTime: save.obbyBestTime },
        miniGame: createInitialMiniGame(
          save.miniGameRecords ?? state.miniGame.records,
        ),
        messageThreads: ensureMessageThreads(
          save.messageThreads ?? state.messageThreads,
        ),
        selectedMessageThreadId: undefined,
        activeInterior: undefined,
        sleeping: false,
        seatedSeatId: undefined,
        activeVehicleId: undefined,
        interactionPrompt: undefined,
        worldActionRequest: undefined,
        loading: false,
      }
    }),

  markSaveLoaded: () => set({ saveLoaded: true }),
  markSaving: () => set({ saveStatus: 'saving' }),
  markSaved: () => set({ saveStatus: 'saved' }),
}))

export function makeSaveSnapshot(state: GameState): GameSave {
  return {
    profileComplete: state.profileComplete,
    playerName: state.playerName,
    coins: state.coins,
    avatar: state.avatar,
    savedAvatars: state.savedAvatars,
    savedFriends: sanitizeSavedFriends(state.savedFriends),
    unlockedItems: state.unlockedItems,
    earnedBadges: state.earnedBadges,
    placedBlocks: state.placedBlocks,
    questProgress: state.questProgress,
    botMemory: state.botMemory,
    settings: state.settings,
    obbyBestTime: state.obby.bestTime,
    miniGameRecords: state.miniGame.records,
    messageThreads: ensureMessageThreads(state.messageThreads),
  }
}

export function completeQuestWithBot(botId: string) {
  const state = useGameStore.getState()
  const existing =
    state.botMemory[botId] ?? touchMemory(undefined, botId, Date.now())
  useGameStore.setState({
    botMemory: {
      ...state.botMemory,
      [botId]: completeTogether(existing, Date.now()),
    },
  })
}

export function nearestLocation(position: Vec3): LocationId | undefined {
  const match = ['park', 'shop', 'school', 'obby', 'houses']
    .map((id) => getLocation(id as LocationId))
    .find((location) => {
      const dx = location.position[0] - position[0]
      const dz = location.position[2] - position[2]
      return Math.hypot(dx, dz) < 4
    })
  return match?.id
}
