import type { MiniGameStatus } from '../game/types'
import type { GamePanel } from '../state/gameStore'

export type AudioCue =
  | 'panel'
  | 'coin'
  | 'travel'
  | 'vehicle-enter'
  | 'vehicle-exit'
  | 'mini-game-start'
  | 'mini-game-collect'
  | 'mini-game-complete'
  | 'mini-game-fail'

export type AudioSnapshot = {
  audioEnabled: boolean
  coins: number
  openPanel?: GamePanel
  activeInteriorId?: string
  activeVehicleId?: string
  miniGameEventSequence: number
  miniGameScore: number
  miniGameStatus: MiniGameStatus
}

export function selectAudioCues(previous: AudioSnapshot, current: AudioSnapshot): AudioCue[] {
  if (!current.audioEnabled) return []

  const cues: AudioCue[] = []
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

  if (current.activeVehicleId && current.activeVehicleId !== previous.activeVehicleId) {
    cues.push('vehicle-enter')
  } else if (previous.activeVehicleId && !current.activeVehicleId) {
    cues.push('vehicle-exit')
  }

  if (current.activeInteriorId && current.activeInteriorId !== previous.activeInteriorId) cues.push('travel')
  if (current.openPanel && current.openPanel !== previous.openPanel) cues.push('panel')

  return cues
}
