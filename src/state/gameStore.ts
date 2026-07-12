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
import { canPlaceBlock, nextBuildPosition } from '../ai/buildMode'
import type {
  AvatarSettings,
  BadgeId,
  BuildBlock,
  BotMemory,
  BotRuntime,
  ChatMessage,
  GameSettings,
  LocationId,
  ObbyState,
  PlayerEmote,
  QuestId,
  QuestProgress,
  ShopItemId,
  Vec3,
} from '../game/types'

export type GameSave = {
  coins: number
  avatar: AvatarSettings
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

type GameState = GameSave & {
  playerPosition: Vec3
  playerYaw: number
  screen: 'menu' | 'game'
  bots: BotRuntime[]
  chat: ChatMessage[]
  nearbyLocation?: LocationId
  visitedBots: string[]
  obby: ObbyState
  touch: TouchInput
  loading: boolean
  saveStatus: 'idle' | 'saving' | 'saved'
  openPanel?: 'quests' | 'shop' | 'avatar' | 'settings' | 'friends' | 'leaderboard' | 'badges' | 'build' | 'server' | 'emotes'
  playerEmote: PlayerEmote
  buildMode: boolean
  selectedBuildColor: string
  setScreen: (screen: 'menu' | 'game') => void
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
  setPlayerEmote: (emote: PlayerEmote) => void
  setBuildMode: (enabled: boolean) => void
  setSelectedBuildColor: (color: string) => void
  placeBlock: () => void
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
  setOpenPanel: (panel?: GameState['openPanel']) => void
}

export const defaultAvatar: AvatarSettings = {
  bodyColor: '#9a5b43',
  shirtColor: '#5eead4',
  hat: 'none',
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
  return isLegacyDefault ? defaultAvatar : avatar
}

export const defaultSettings: GameSettings = {
  quality: 'medium',
  audio: true,
  music: true,
  reducedMotion: false,
}

function systemMessage(text: string): ChatMessage {
  return { id: crypto.randomUUID(), author: 'System', text, kind: 'system', createdAt: Date.now() }
}

function botMessage(author: string, text: string): ChatMessage {
  return { id: crypto.randomUUID(), author, text, kind: 'bot', createdAt: Date.now() }
}

function playerMessage(text: string): ChatMessage {
  return { id: crypto.randomUUID(), author: 'You', text, kind: 'player', createdAt: Date.now() }
}

function initialBots() {
  return botProfiles.map(createInitialBot)
}

function initialQuestProgress() {
  return createQuestProgress(questDefinitions)
}

const initialObby: ObbyState = {
  active: false,
  checkpoint: [16, 0.8, 12],
  startedAt: 0,
  finished: false,
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu',
  coins: 0,
  earnedBadges: ['welcome'],
  placedBlocks: [],
  avatar: defaultAvatar,
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
  selectedBuildColor: '#38bdf8',

  setScreen: (screen) => set({ screen }),
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
    set((state) => ({ chat: [...state.chat.slice(-60), playerMessage(text)] }))
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
  setSelectedBuildColor: (selectedBuildColor) => set({ selectedBuildColor }),
  placeBlock: () =>
    set((state) => {
      const position = nextBuildPosition(state.playerPosition, state.playerYaw)
      if (!canPlaceBlock(state.placedBlocks, position)) return state
      const block: BuildBlock = {
        id: crypto.randomUUID(),
        position,
        color: state.selectedBuildColor,
      }
      return {
        placedBlocks: [...state.placedBlocks, block],
        chat: [...state.chat.slice(-60), systemMessage('Block placed')],
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

  resetSave: () =>
    set({
      coins: 0,
      avatar: defaultAvatar,
      unlockedItems: [],
      earnedBadges: ['welcome'],
      placedBlocks: [],
      buildMode: false,
      playerEmote: 'none',
      selectedBuildColor: '#38bdf8',
      questProgress: initialQuestProgress(),
      botMemory: {},
      obby: initialObby,
      chat: [systemMessage('Save reset')],
    }),

  loadFromSave: (save) =>
    set((state) => ({
      coins: save.coins ?? state.coins,
      avatar: normalizeSavedAvatar(save.avatar) ?? state.avatar,
      unlockedItems: save.unlockedItems ?? state.unlockedItems,
      earnedBadges: save.earnedBadges ?? state.earnedBadges,
      placedBlocks: save.placedBlocks ?? state.placedBlocks,
      questProgress: save.questProgress ?? state.questProgress,
      botMemory: save.botMemory ?? state.botMemory,
      settings: save.settings ?? state.settings,
      obby: { ...state.obby, bestTime: save.obbyBestTime },
      loading: false,
    })),

  markSaving: () => set({ saveStatus: 'saving' }),
  markSaved: () => set({ saveStatus: 'saved' }),
}))

export function makeSaveSnapshot(state: GameState): GameSave {
  return {
    coins: state.coins,
    avatar: state.avatar,
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
