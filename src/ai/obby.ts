import type { ObbyState, Vec3 } from '../game/types'
import { avatarGroundOffset } from '../game/scale'

export type ObbyPlatform = {
  position: Vec3
  scale: Vec3
}

export const obbyPlatforms: ObbyPlatform[] = [
  { position: [18, 0.8, 21], scale: [2.2, 0.35, 2.2] },
  { position: [20.5, 1.8, 23], scale: [1.7, 0.3, 1.7] },
  { position: [23, 3.1, 21.5], scale: [1.7, 0.3, 1.7] },
  { position: [24.5, 4.6, 24], scale: [2.2, 0.35, 2.2] },
]

export const obbyCheckpoints: Vec3[] = obbyPlatforms.map(({ position, scale }) => [
  position[0],
  position[1] + scale[1] / 2 + avatarGroundOffset,
  position[2],
])
export const obbyStart: Vec3 = obbyCheckpoints[0]
export const obbyFinish: Vec3 = obbyCheckpoints[obbyCheckpoints.length - 1]

export function startObby(now: number): ObbyState {
  return {
    active: true,
    checkpoint: obbyStart,
    startedAt: now,
    finished: false,
  }
}

export function updateCheckpoint(state: ObbyState, position: Vec3, checkpoints: Vec3[]) {
  if (!state.active || state.finished) return state
  const reached = checkpoints.find((checkpoint) => {
    const dx = checkpoint[0] - position[0]
    const dz = checkpoint[2] - position[2]
    return Math.hypot(dx, dz) < 1.2
  })
  return reached ? { ...state, checkpoint: reached } : state
}

export function finishObby(state: ObbyState, now: number) {
  if (!state.active || state.finished) return { state, reward: 0 }
  const elapsed = Math.max(1, Math.round((now - state.startedAt) / 1000))
  return {
    state: {
      ...state,
      active: false,
      finished: true,
      bestTime: state.bestTime ? Math.min(state.bestTime, elapsed) : elapsed,
    },
    reward: 50,
  }
}
