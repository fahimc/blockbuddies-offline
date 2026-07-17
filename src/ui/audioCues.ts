import type { MiniGameStatus } from '../game/types'
import type { GamePanel } from '../state/gameStore'

export type AudioCue =
  | 'panel'
  | 'coin'
  | 'travel'
  | 'screen-start'
  | 'customizer-change'
  | 'chat'
  | 'message-open'
  | 'message-send'
  | 'message-receive'
  | 'error'
  | 'quest-complete'
  | 'badge'
  | 'unlock'
  | 'emote'
  | 'sit'
  | 'stand'
  | 'sleep'
  | 'wake'
  | 'build-toggle'
  | 'build-place'
  | 'build-remove'
  | 'obby-start'
  | 'obby-complete'
  | 'vehicle-enter'
  | 'vehicle-exit'
  | 'mini-game-start'
  | 'mini-game-collect'
  | 'mini-game-complete'
  | 'mini-game-fail'

export type MusicMode = 'menu' | 'customizer' | 'town' | 'interior' | 'driving' | 'mini-game'

export type AudioSnapshot = {
  audioEnabled: boolean
  screen: 'menu' | 'setup-avatar' | 'setup-name' | 'game'
  coins: number
  openPanel?: GamePanel
  activeInteriorId?: string
  activeVehicleId?: string
  buildMode: boolean
  placedBlockCount: number
  playerEmote: string
  sleeping: boolean
  seatedSeatId?: string
  completedQuestCount: number
  earnedBadgeCount: number
  unlockedItemCount: number
  lastChatId?: string
  lastChatKind?: 'system' | 'bot' | 'player'
  lastChatText?: string
  selectedMessageThreadId?: string
  directMessageCount: number
  unreadMessageCount: number
  avatarSignature: string
  obbyActive: boolean
  obbyFinished: boolean
  miniGameEventSequence: number
  miniGameScore: number
  miniGameStatus: MiniGameStatus
}

export function selectAudioCues(previous: AudioSnapshot, current: AudioSnapshot): AudioCue[] {
  if (!current.audioEnabled) return []

  const cues: AudioCue[] = []
  if (current.screen !== previous.screen) {
    if (current.screen === 'setup-avatar' || current.screen === 'setup-name' || current.screen === 'game') {
      cues.push('screen-start')
    }
  }
  if (current.avatarSignature !== previous.avatarSignature) cues.push('customizer-change')

  if (
    current.miniGameEventSequence !== previous.miniGameEventSequence &&
    current.miniGameStatus === 'running'
  ) {
    cues.push('mini-game-start')
  } else if (current.miniGameScore > previous.miniGameScore) {
    cues.push('mini-game-collect')
  } else if (previous.miniGameStatus === 'running' && current.miniGameStatus === 'completed') {
    cues.push('mini-game-complete')
  } else if (previous.miniGameStatus === 'running' && current.miniGameStatus === 'failed') {
    cues.push('mini-game-fail')
  }

  if (current.coins > previous.coins) cues.push('coin')
  if (current.completedQuestCount > previous.completedQuestCount) cues.push('quest-complete')
  if (current.earnedBadgeCount > previous.earnedBadgeCount) cues.push('badge')
  if (current.unlockedItemCount > previous.unlockedItemCount) cues.push('unlock')

  if (current.obbyActive && !previous.obbyActive) cues.push('obby-start')
  if (current.obbyFinished && !previous.obbyFinished) cues.push('obby-complete')

  if (current.activeVehicleId && current.activeVehicleId !== previous.activeVehicleId) {
    cues.push('vehicle-enter')
  } else if (previous.activeVehicleId && !current.activeVehicleId) {
    cues.push('vehicle-exit')
  }

  if (current.playerEmote !== previous.playerEmote && current.playerEmote !== 'none') cues.push('emote')
  if (current.sleeping && !previous.sleeping) cues.push('sleep')
  if (!current.sleeping && previous.sleeping) cues.push('wake')
  if (current.seatedSeatId && current.seatedSeatId !== previous.seatedSeatId) {
    cues.push('sit')
  } else if (previous.seatedSeatId && !current.seatedSeatId) {
    cues.push('stand')
  }
  if (current.buildMode !== previous.buildMode) cues.push('build-toggle')
  if (current.placedBlockCount > previous.placedBlockCount) cues.push('build-place')
  if (current.placedBlockCount < previous.placedBlockCount) cues.push('build-remove')
  if (
    current.lastChatId &&
    current.lastChatId !== previous.lastChatId &&
    (current.lastChatKind === 'player' || current.lastChatKind === 'bot')
  ) {
    cues.push('chat')
  }
  if (
    current.lastChatId &&
    current.lastChatId !== previous.lastChatId &&
    current.lastChatKind === 'system' &&
    isErrorSystemMessage(current.lastChatText)
  ) {
    cues.push('error')
  }

  if (
    current.selectedMessageThreadId &&
    current.selectedMessageThreadId !== previous.selectedMessageThreadId
  ) {
    cues.push('message-open')
  }
  if (current.directMessageCount > previous.directMessageCount) {
    cues.push(
      current.unreadMessageCount > previous.unreadMessageCount
        ? 'message-receive'
        : 'message-send',
    )
  }

  if (current.activeInteriorId && current.activeInteriorId !== previous.activeInteriorId) cues.push('travel')
  if (current.openPanel && current.openPanel !== previous.openPanel) cues.push('panel')

  return cues
}

function isErrorSystemMessage(text: string | undefined) {
  if (!text) return false
  return /\b(cannot|can't|no room|need|finish|leave|blocked|unavailable|failed)\b/i.test(text)
}

export function selectMusicMode(snapshot: AudioSnapshot): MusicMode {
  if (snapshot.miniGameStatus === 'running') return 'mini-game'
  if (snapshot.activeVehicleId) return 'driving'
  if (snapshot.activeInteriorId) return 'interior'
  if (snapshot.screen === 'setup-avatar' || snapshot.screen === 'setup-name') return 'customizer'
  if (snapshot.screen === 'menu') return 'menu'
  return 'town'
}
