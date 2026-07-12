import type { ObbyState, Vec3 } from '../game/types'

export const obbyStart: Vec3 = [16, 0.8, 12]
export const obbyFinish: Vec3 = [22, 4.6, 18]

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
