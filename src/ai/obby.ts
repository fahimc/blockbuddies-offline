import type { ObbyState, Vec3 } from '../game/types'
import { avatarGroundOffset } from '../game/scale'

export type ObbyPlatform = {
  position: Vec3
  scale: Vec3
  kind: 'start' | 'jump' | 'beam' | 'checkpoint' | 'finish'
}

export const obbyPlatforms: ObbyPlatform[] = [
  { kind: 'start', position: [18, 0.75, 21], scale: [2.7, 0.35, 2.7] },
  { kind: 'jump', position: [19.7, 1.0, 22.35], scale: [1.25, 0.3, 1.25] },
  { kind: 'jump', position: [21.45, 1.22, 22.35], scale: [1.25, 0.3, 1.25] },
  { kind: 'beam', position: [23.05, 1.45, 23.2], scale: [0.9, 0.28, 2.8] },
  {
    kind: 'checkpoint',
    position: [23.05, 1.7, 24.65],
    scale: [2.2, 0.35, 2.2],
  },
  { kind: 'jump', position: [21.0, 1.95, 24.15], scale: [1.35, 0.3, 1.35] },
  { kind: 'jump', position: [19.15, 2.18, 23.1], scale: [1.35, 0.3, 1.35] },
  { kind: 'beam', position: [17.5, 2.4, 21.55], scale: [0.85, 0.28, 3.0] },
  {
    kind: 'checkpoint',
    position: [18.8, 2.65, 19.65],
    scale: [1.65, 0.32, 1.65],
  },
  { kind: 'jump', position: [20.75, 2.9, 19.2], scale: [1.2, 0.3, 1.2] },
  { kind: 'jump', position: [22.45, 3.12, 20.1], scale: [1.2, 0.3, 1.2] },
  { kind: 'finish', position: [23.35, 3.28, 21.85], scale: [2.35, 0.38, 2.35] },
]

export const obbyCheckpoints: Vec3[] = obbyPlatforms.map(
  ({ position, scale }) => [
    position[0],
    position[1] + scale[1] / 2 + avatarGroundOffset,
    position[2],
  ],
)
export const obbyStart: Vec3 = obbyCheckpoints[0]
export const obbyFinish: Vec3 = obbyCheckpoints[obbyCheckpoints.length - 1]
export const obbyFinishRadius = 1.55
export const obbyFallResetDrop = 0.75

export function startObby(now: number): ObbyState {
  return {
    active: true,
    checkpoint: obbyStart,
    startedAt: now,
    finished: false,
  }
}

export function shouldResetObbyFall(state: ObbyState, position: Vec3) {
  if (!state.active || state.finished) return false
  return (
    position[1] < -2 || position[1] < state.checkpoint[1] - obbyFallResetDrop
  )
}

export function updateCheckpoint(
  state: ObbyState,
  position: Vec3,
  checkpoints: Vec3[],
) {
  if (!state.active || state.finished) return state
  const reached = checkpoints.find((checkpoint) => {
    const dx = checkpoint[0] - position[0]
    const dz = checkpoint[2] - position[2]
    const dy = Math.abs(checkpoint[1] - position[1])
    return Math.hypot(dx, dz) < 1.2 && dy < 0.8
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
