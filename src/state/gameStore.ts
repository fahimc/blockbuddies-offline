import { create } from 'zustand'
import { botProfiles } from '../data/botProfiles'
import { questDefinitions } from '../data/quests'
import { shopItems } from '../data/shopItems'
import { getLocation } from '../data/world'
import { findBadge } from '../data/badges'
import { createInitialBot, updateBot } from '../ai/botBrain'
import { selectDialogue, type DialogueContext } from '../ai/dialogue'
import { advanceQuest, createQuestProgress } from '../ai/quests'
import { applyItem, purchaseItem } from '../ai/inventory'
import { completeTogether, touchMemory } from '../ai/relationship'
import { finishObby, startObby, updateCheckpoint } from '../ai/obby'
import { sanitizePartyName, useLocalPartyStore } from './localPartyStore'
import {
  canPlacePiece,
  createBuildMapStamp,
  createBuildPiece,
  maxBuildPieces,
  mergeBuildPieces,
  nextBuildPosition,
  rotateBuildYaw,
} from '../ai/buildMode'
import type {
  AvatarSettings,
  BadgeId,
  BuildBlock,
  BuildPieceId,
  BotMemory,
  BotRuntime,
  ChatMessage,
  GameSettings,
  LocationId,
  ObbyState,
  PlayerEmote,
  QuestId,
  QuestProgress,
  SavedAvatarStyle,
  ShopItemId,
  Vec3,
} from '../game/types'

export type GameSave = {
  playerName: string
  coins: number
  avatar: AvatarSettings
  savedAvatars: SavedAvatarStyle[]
  unlockedItems: ShopItemId[]
  questProgress: QuestProgress[]
  botMemory: Record<string, BotMemory>
  settings: GameSettings
  earnedBadges: BadgeId[]
  placedBlocks: BuildBlock[]
  obbyBestTime?: number
}

type TouchInput = {
  x: number
  y: number
  jump: boolean
  interact: boolean
}

type CustomizationSelection = {
  name: string
  cost: number
  shopItemId?: ShopItemId
  patch: Partial<AvatarSettings>
  emote?: PlayerEmote
}

export type GamePanel = 'quests' | 'shop' | 'avatar' | 'settings' | 'friends' | 'leaderboard' | 'badges' | 'build' | 'server' | 'emotes'

type GameState = GameSave & {
  playerPosition: Vec3
  playerYaw: number
  screen: 'menu' | 'setup-avatar' | 'setup-name' | 'game'
  bots: BotRuntime[]
  chat: ChatMessage[]
  nearbyLocation?: LocationId
  visitedBots: string[]
  obby: ObbyState
  touch: TouchInput
  loading: boolean
  saveStatus: 'idle' | 'saving' | 'saved'
  openPanel?: GamePanel
  playerEmote: PlayerEmote
  buildMode: boolean
  selectedBuildPiece: BuildPieceId
  selectedBuildColor: string
  buildRotation: number
  setScreen: (screen: GameState['screen']) => void
  setPlayerName: (name: string) => void
  setPlayer: (position: Vec3, yaw: number) => void
  setTouch: (input: Partial<TouchInput>) => void
  setNearbyLocation: (location?: LocationId) => void
  tickBots: (now: number) => void
  botReact: (botId: string, context: DialogueContext) => void
  sendQuickReply: (text: string, context: DialogueContext) => void
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
  selectCustomizationItem: (item: CustomizationSelection) => void
  setPlayerEmote: (emote: PlayerEmote) => void
  setBuildMode: (enabled: boolean) => void
  setSelectedBuildPiece: (piece: BuildPieceId) => void
  setSelectedBuildColor: (color: string) => void
  rotateBuildPiece: () => void
  placeBlock: () => void
  placeMapStamp: () => void
  removeLastBlock: () => void
  beginObby: (now: number) => void
  updateObby: (now: number, checkpoints: Vec3[]) => void
  completeObby: (now: number) => void
  recordBotMeet: (botId: string) => void
  updateSettings: (settings: Partial<GameSettings>) => void
  resetSave: () => void
  loadFromSave: (save: Partial<GameSave>) => void
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

export function normalizeSavedAvatar(avatar: AvatarSettings | undefined): AvatarSettings | undefined {
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
}

export const defaultPlayerName = 'BlockBuddy'

function systemMessage(text: string): ChatMessage {
  return { id: crypto.randomUUID(), author: 'System', text, kind: 'system', createdAt: Date.now() }
}

function botMessage(author: string, text: string): ChatMessage {
  return { id: crypto.randomUUID(), author, text, kind: 'bot', createdAt: Date.now() }
}

function playerMessage(author: string, text: string): ChatMessage {
  return { id: crypto.randomUUID(), author, text, kind: 'player', createdAt: Date.now() }
}

function initialBots() {
  return botProfiles.map(createInitialBot)
}

function initialQuestProgress() {
  return createQuestProgress(questDefinitions)
}

function makeId(prefix: string) {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${randomId}`
}

const initialObby: ObbyState = {
  active: false,
  checkpoint: [16, 0.8, 12],
  startedAt: 0,
  finished: false,
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu',
  playerName: defaultPlayerName,
  coins: 0,
  earnedBadges: ['welcome'],
  placedBlocks: [],
  avatar: defaultAvatar,
  savedAvatars: [],
  unlockedItems: [],
  questProgress: initialQuestProgress(),
  botMemory: {},
  settings: defaultSettings,
  playerPosition: [0, 0, 4],
  playerYaw: 0,
  bots: initialBots(),
  chat: [
    systemMessage('Local server started'),
    ...botProfiles.slice(0, 4).map((bot) => systemMessage(`${bot.username} joined the local server`)),
  ],
  visitedBots: [],
  obby: initialObby,
  touch: { x: 0, y: 0, jump: false, interact: false },
  loading: false,
  saveStatus: 'idle',
  playerEmote: 'none',
  buildMode: false,
  selectedBuildPiece: 'block',
  selectedBuildColor: '#38bdf8',
  buildRotation: 0,

  setScreen: (screen) => set({ screen }),
  setPlayerName: (name) => {
    const playerName = sanitizePartyName(name)
    useLocalPartyStore.getState().setPlayerName(playerName)
    set({ playerName })
  },
  setPlayer: (playerPosition, playerYaw) => set({ playerPosition, playerYaw }),
  setTouch: (input) => set((state) => ({ touch: { ...state.touch, ...input } })),
  setNearbyLocation: (nearbyLocation) => set({ nearbyLocation }),
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
          const profile = botProfiles.find((item) => item.id === bot.id) ?? botProfiles[0]
          return updateBot({ bot, profile, playerPosition: state.playerPosition, now, random })
        }),
      }
    }),

  botReact: (botId, context) =>
    set((state) => {
      const profile = botProfiles.find((bot) => bot.id === botId)
      if (!profile) return state
      const memory = state.botMemory[botId]
      const line = selectDialogue(profile, context, Date.now(), memory)
      return {
        bots: state.bots.map((bot) =>
          bot.id === botId ? { ...bot, speech: line, speechUntil: Date.now() + 3200 } : bot,
        ),
        chat: [...state.chat.slice(-60), botMessage(profile.username, line)],
      }
    }),

  sendQuickReply: (text, context) => {
    set((state) => ({ chat: [...state.chat.slice(-60), playerMessage(state.playerName, text)] }))
    get().awardBadge('social-buddy')
    const nearest = get().bots[0]
    if (nearest) get().botReact(nearest.id, context)
  },

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
          ? [...state.chat.slice(-60), systemMessage(`${definition.title} complete! +${definition.reward} coins`)]
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
          ? [...state.chat.slice(-60), systemMessage(`Badge earned: ${badge.title}`)]
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
    set({ playerEmote })
    if (playerEmote !== 'none') {
      set((state) => ({ chat: [...state.chat.slice(-60), systemMessage(`You used ${playerEmote}`)] }))
      window.setTimeout(() => {
        if (useGameStore.getState().playerEmote === playerEmote) useGameStore.setState({ playerEmote: 'none' })
      }, 2600)
    }
  },

  setBuildMode: (buildMode) => set({ buildMode }),
  setSelectedBuildPiece: (selectedBuildPiece) => set({ selectedBuildPiece }),
  setSelectedBuildColor: (selectedBuildColor) => set({ selectedBuildColor }),
  rotateBuildPiece: () => set((state) => ({ buildRotation: rotateBuildYaw(state.buildRotation) })),
  placeBlock: () =>
    set((state) => {
      if (state.placedBlocks.length >= maxBuildPieces) {
        return {
          chat: [...state.chat.slice(-60), systemMessage('Custom world limit reached')],
        }
      }
      const position = nextBuildPosition(state.playerPosition, state.playerYaw, state.selectedBuildPiece)
      if (!canPlacePiece(state.placedBlocks, position, state.selectedBuildPiece)) return state
      const block: BuildBlock = {
        ...createBuildPiece({
          id: crypto.randomUUID(),
          kind: state.selectedBuildPiece,
          position,
          color: state.selectedBuildColor,
          rotation: state.buildRotation,
        }),
      }
      return {
        placedBlocks: [...state.placedBlocks, block],
        chat: [...state.chat.slice(-60), systemMessage('World piece placed')],
        earnedBadges: state.earnedBadges.includes('builder')
          ? state.earnedBadges
          : [...state.earnedBadges, 'builder'],
      }
    }),
  placeMapStamp: () =>
    set((state) => {
      if (state.placedBlocks.length >= maxBuildPieces) {
        return {
          chat: [...state.chat.slice(-60), systemMessage('Custom world limit reached')],
        }
      }
      const origin = nextBuildPosition(state.playerPosition, state.playerYaw, 'road')
      const stamp = createBuildMapStamp({
        origin,
        yaw: state.buildRotation,
        idFactory: () => crypto.randomUUID(),
      })
      const accepted = mergeBuildPieces(state.placedBlocks, stamp, maxBuildPieces)
      if (accepted.length === 0) {
        return {
          chat: [...state.chat.slice(-60), systemMessage('No room for that street map')],
        }
      }
      return {
        placedBlocks: [...state.placedBlocks, ...accepted],
        chat: [...state.chat.slice(-60), systemMessage(`Street map added: ${accepted.length} pieces`)],
        earnedBadges: state.earnedBadges.includes('builder')
          ? state.earnedBadges
          : [...state.earnedBadges, 'builder'],
      }
    }),
  removeLastBlock: () =>
    set((state) => ({
      placedBlocks: state.placedBlocks.slice(0, -1),
      chat: [...state.chat.slice(-60), systemMessage('Last block removed')],
    })),

  applyOwnedItem: (id) =>
    set((state) => {
      const item = shopItems.find((entry) => entry.id === id)
      if (!item || !state.unlockedItems.includes(id)) return state
      return { avatar: applyItem(state.avatar, item) }
    }),
  updateAvatar: (avatar) => set((state) => ({ avatar: { ...state.avatar, ...avatar } })),
  saveCurrentAvatarStyle: (name) =>
    set((state) => {
      const fallbackName = state.avatar.avatarSource ?? `${state.playerName}'s Style`
      const styleName = sanitizePartyName(name ?? fallbackName) || fallbackName
      const saved: SavedAvatarStyle = {
        id: makeId('avatar-style'),
        name: styleName,
        avatar: { ...state.avatar, avatarSource: styleName },
        createdAt: Date.now(),
      }
      return {
        savedAvatars: [saved, ...state.savedAvatars.filter((style) => style.name !== styleName)].slice(0, 18),
        chat: [...state.chat.slice(-60), systemMessage(`Saved avatar style: ${styleName}`)],
      }
    }),
  applySavedAvatarStyle: (id) =>
    set((state) => {
      const style = state.savedAvatars.find((entry) => entry.id === id)
      if (!style) return state
      return {
        avatar: normalizeSavedAvatar(style.avatar) ?? state.avatar,
        chat: [...state.chat.slice(-60), systemMessage(`Equipped saved style: ${style.name}`)],
      }
    }),
  deleteSavedAvatarStyle: (id) =>
    set((state) => ({
      savedAvatars: state.savedAvatars.filter((style) => style.id !== id),
    })),
  selectCustomizationItem: (item) => {
    set((state) => {
      const itemId = item.shopItemId
      const requiresUnlock = itemId !== undefined && item.cost > 0 && !state.unlockedItems.includes(itemId)
      if (requiresUnlock && state.coins < item.cost) {
        return {
          chat: [...state.chat.slice(-60), systemMessage(`Need ${item.cost} coins for ${item.name}`)],
        }
      }

      const unlockedItems =
        requiresUnlock && itemId ? [...state.unlockedItems, itemId] : state.unlockedItems
      const coins = requiresUnlock ? state.coins - item.cost : state.coins
      return {
        coins,
        unlockedItems,
        avatar: { ...state.avatar, ...item.patch },
        playerEmote: item.emote ?? state.playerEmote,
        chat: [
          ...state.chat.slice(-60),
          systemMessage(`${requiresUnlock ? 'Unlocked' : 'Equipped'} ${item.name}`),
        ],
      }
    })
    if (item.emote && item.emote !== 'none') {
      window.setTimeout(() => {
        if (useGameStore.getState().playerEmote === item.emote) useGameStore.setState({ playerEmote: 'none' })
      }, 2600)
    }
  },

  beginObby: (now) =>
    set((state) => ({
      obby: { ...startObby(now), bestTime: state.obby.bestTime },
      playerPosition: [16, 0.8, 12],
      chat: [...state.chat.slice(-60), systemMessage('Beginner obby started')],
    })),

  updateObby: (_now, checkpoints) =>
    set((state) => ({ obby: updateCheckpoint(state.obby, state.playerPosition, checkpoints) })),

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
          quest.id === 'beginner-obby' ? { ...quest, started: true, completed: true, progress: 1 } : quest,
        ),
        chat: [
          ...state.chat.slice(-60),
          systemMessage(`Obby complete! +${result.reward} coins`),
        ],
      }
    }),

  recordBotMeet: (botId) =>
    set((state) => {
      const now = Date.now()
      const existing = state.botMemory[botId]
      const firstMeet = !state.visitedBots.includes(botId)
      if (existing && !firstMeet && now - existing.lastInteraction < 10000) return state
      const memory = touchMemory(existing, botId, now)
      const profile = botProfiles.find((bot) => bot.id === botId)
      const line = profile ? selectDialogue(profile, 'nearby', now, memory) : undefined
      return {
        visitedBots: firstMeet ? [...state.visitedBots, botId] : state.visitedBots,
        botMemory: { ...state.botMemory, [botId]: memory },
        earnedBadges:
          firstMeet && state.visitedBots.length + 1 >= 3 && !state.earnedBadges.includes('friend-maker')
            ? [...state.earnedBadges, 'friend-maker']
            : state.earnedBadges,
        bots: line
          ? state.bots.map((bot) =>
              bot.id === botId ? { ...bot, speech: line, speechUntil: now + 3000 } : bot,
            )
          : state.bots,
        chat: line ? [...state.chat.slice(-60), botMessage(profile?.username ?? 'Buddy', line)] : state.chat,
      }
    }),

  updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),

  resetSave: () => {
    useLocalPartyStore.getState().setPlayerName(defaultPlayerName)
    set({
      playerName: defaultPlayerName,
      coins: 0,
      avatar: defaultAvatar,
      savedAvatars: [],
      unlockedItems: [],
      earnedBadges: ['welcome'],
      placedBlocks: [],
      settings: defaultSettings,
      buildMode: false,
      playerEmote: 'none',
      selectedBuildPiece: 'block',
      selectedBuildColor: '#38bdf8',
      buildRotation: 0,
      questProgress: initialQuestProgress(),
      botMemory: {},
      obby: initialObby,
      chat: [systemMessage('Save reset')],
    })
  },

  loadFromSave: (save) =>
    set((state) => {
      const playerName = save.playerName ? sanitizePartyName(save.playerName) : state.playerName
      useLocalPartyStore.getState().setPlayerName(playerName)
      return {
        playerName,
        coins: save.coins ?? state.coins,
        avatar: normalizeSavedAvatar(save.avatar) ?? state.avatar,
        savedAvatars: save.savedAvatars ?? state.savedAvatars,
        unlockedItems: save.unlockedItems ?? state.unlockedItems,
        earnedBadges: save.earnedBadges ?? state.earnedBadges,
        placedBlocks: save.placedBlocks ?? state.placedBlocks,
        questProgress: save.questProgress ?? state.questProgress,
        botMemory: save.botMemory ?? state.botMemory,
        settings: { ...state.settings, ...save.settings },
        obby: { ...state.obby, bestTime: save.obbyBestTime },
        loading: false,
      }
    }),

  markSaving: () => set({ saveStatus: 'saving' }),
  markSaved: () => set({ saveStatus: 'saved' }),
}))

export function makeSaveSnapshot(state: GameState): GameSave {
  return {
    playerName: state.playerName,
    coins: state.coins,
    avatar: state.avatar,
    savedAvatars: state.savedAvatars,
    unlockedItems: state.unlockedItems,
    earnedBadges: state.earnedBadges,
    placedBlocks: state.placedBlocks,
    questProgress: state.questProgress,
    botMemory: state.botMemory,
    settings: state.settings,
    obbyBestTime: state.obby.bestTime,
  }
}

export function completeQuestWithBot(botId: string) {
  const state = useGameStore.getState()
  const existing = state.botMemory[botId] ?? touchMemory(undefined, botId, Date.now())
  useGameStore.setState({
    botMemory: { ...state.botMemory, [botId]: completeTogether(existing, Date.now()) },
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
