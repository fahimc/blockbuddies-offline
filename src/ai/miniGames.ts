import type {
  MiniGameId,
  MiniGameRecord,
  MiniGameRuntime,
  Vec3,
} from '../game/types'

export type MiniGameDefinition = {
  id: MiniGameId
  title: string
  description: string
  objective: string
  durationMs: number
  target: number
  reward: number
  startPosition: Vec3
}

export type MiniGameTarget = {
  id: string
  label: string
  position: Vec3
}

export const miniGameDefinitions: MiniGameDefinition[] = [
  {
    id: 'coin-rush',
    title: 'Coin Rush',
    description: 'Grab glowing coins before the timer runs out.',
    objective: 'Collect 8 event coins',
    durationMs: 45_000,
    target: 8,
    reward: 35,
    startPosition: [9, 0, -2],
  },
  {
    id: 'delivery-dash',
    title: 'Delivery Dash',
    description: 'Run packages between town spots in order.',
    objective: 'Visit 3 delivery pads',
    durationMs: 75_000,
    target: 3,
    reward: 45,
    startPosition: [12, 0, -5],
  },
  {
    id: 'hide-and-seek',
    title: 'Hide & Seek',
    description: 'Find buddies hiding around town.',
    objective: 'Find 3 hidden buddies',
    durationMs: 90_000,
    target: 3,
    reward: 50,
    startPosition: [0, 0, 12],
  },
]

export const coinRushTargets: MiniGameTarget[] = [
  { id: 'rush-coin-1', label: 'Coin', position: [6, 0, -2] },
  { id: 'rush-coin-2', label: 'Coin', position: [11, 0, -1] },
  { id: 'rush-coin-3', label: 'Coin', position: [14, 0, -3] },
  { id: 'rush-coin-4', label: 'Coin', position: [12, 0, -8] },
  { id: 'rush-coin-5', label: 'Coin', position: [6, 0, -7] },
  { id: 'rush-coin-6', label: 'Coin', position: [3, 0, -3] },
  { id: 'rush-coin-7', label: 'Coin', position: [2, 0, 2] },
  { id: 'rush-coin-8', label: 'Coin', position: [7, 0, 4] },
]

export const deliveryDashTargets: MiniGameTarget[] = [
  { id: 'delivery-park', label: 'Park drop-off', position: [-12, 0, -8] },
  { id: 'delivery-school', label: 'School drop-off', position: [-14, 0, 10] },
  { id: 'delivery-houses', label: 'House drop-off', position: [2, 0, 18] },
]

export const hideAndSeekTargets: MiniGameTarget[] = [
  { id: 'hide-luna', label: 'LunaBlocks', position: [-18, 0, -14] },
  { id: 'hide-max', label: 'MaxJumps', position: [7, 0, 18] },
  { id: 'hide-pip', label: 'PipPop', position: [-7, 0, 7] },
]

export function miniGameDefinition(id: MiniGameId) {
  return (
    miniGameDefinitions.find((game) => game.id === id) ?? miniGameDefinitions[0]
  )
}

export function miniGameTargets(id: MiniGameId): MiniGameTarget[] {
  if (id === 'coin-rush') return coinRushTargets
  if (id === 'delivery-dash') return deliveryDashTargets
  return hideAndSeekTargets
}

export function createInitialMiniGame(
  records: Partial<Record<MiniGameId, MiniGameRecord>> = {},
): MiniGameRuntime {
  return {
    status: 'idle',
    startedAt: 0,
    endsAt: 0,
    score: 0,
    target: 0,
    collected: [],
    records,
  }
}

export function startMiniGameSession(
  id: MiniGameId,
  now: number,
  records: Partial<Record<MiniGameId, MiniGameRecord>>,
): MiniGameRuntime {
  const definition = miniGameDefinition(id)
  return {
    activeId: id,
    status: 'running',
    startedAt: now,
    endsAt: now + definition.durationMs,
    score: 0,
    target: definition.target,
    collected: [],
    records,
  }
}

export type MiniGameTickResult = {
  state: MiniGameRuntime
  collected: MiniGameTarget[]
  completedNow: boolean
  failedNow: boolean
  reward: number
}

export function tickMiniGameSession(
  state: MiniGameRuntime,
  now: number,
  playerPosition: Vec3,
): MiniGameTickResult {
  if (state.status !== 'running' || !state.activeId) {
    return {
      state,
      collected: [],
      completedNow: false,
      failedNow: false,
      reward: 0,
    }
  }

  const definition = miniGameDefinition(state.activeId)
  const targets = miniGameTargets(state.activeId)
  const collected: MiniGameTarget[] = []
  let nextState = state

  if (state.activeId === 'delivery-dash') {
    const target = targets[state.score]
    if (target && distance2d(playerPosition, target.position) <= 1.7)
      collected.push(target)
  } else {
    for (const target of targets) {
      if (
        !state.collected.includes(target.id) &&
        distance2d(playerPosition, target.position) <= 1.35
      ) {
        collected.push(target)
      }
    }
  }

  if (collected.length > 0) {
    const collectedIds = collected.map((target) => target.id)
    nextState = {
      ...nextState,
      score: Math.min(definition.target, nextState.score + collected.length),
      collected: [...nextState.collected, ...collectedIds],
    }
  }

  if (nextState.score >= definition.target) {
    const elapsed = Math.max(1, Math.round((now - nextState.startedAt) / 1000))
    const record = nextState.records[definition.id]
    const nextRecord: MiniGameRecord = {
      plays: (record?.plays ?? 0) + 1,
      bestScore: Math.max(record?.bestScore ?? 0, nextState.score),
      bestTime: record?.bestTime ? Math.min(record.bestTime, elapsed) : elapsed,
    }
    return {
      state: {
        ...nextState,
        status: 'completed',
        activeId: undefined,
        records: { ...nextState.records, [definition.id]: nextRecord },
      },
      collected,
      completedNow: true,
      failedNow: false,
      reward: definition.reward,
    }
  }

  if (now >= nextState.endsAt) {
    const record = nextState.records[definition.id]
    const nextRecord: MiniGameRecord = {
      plays: (record?.plays ?? 0) + 1,
      bestScore: Math.max(record?.bestScore ?? 0, nextState.score),
      bestTime: record?.bestTime,
    }
    return {
      state: {
        ...nextState,
        status: 'failed',
        activeId: undefined,
        records: { ...nextState.records, [definition.id]: nextRecord },
      },
      collected,
      completedNow: false,
      failedNow: true,
      reward: 0,
    }
  }

  return {
    state: nextState,
    collected,
    completedNow: false,
    failedNow: false,
    reward: 0,
  }
}

function distance2d(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}
