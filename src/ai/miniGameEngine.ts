import type { MiniGameId, MiniGameRecord, MiniGameRuntime, Vec3 } from '../game/types'

export type MiniGameMode = 'collect_any' | 'ordered_route'

export type MiniGameDefinition = {
  id: MiniGameId
  title: string
  description: string
  objective: string
  durationMs: number
  target: number
  reward: number
  startPosition: Vec3
  mode: MiniGameMode
  collectRadius: number
  pointsPerTarget: number
  completionBonus: number
  startMessage: string
}

export type MiniGameTarget = {
  id: string
  label: string
  position: Vec3
  points?: number
}

export type MiniGameCatalog = {
  definitions: MiniGameDefinition[]
  targets: Record<MiniGameId, MiniGameTarget[]>
}

export type MiniGameTickResult = {
  state: MiniGameRuntime
  collected: MiniGameTarget[]
  pointsAwarded: number
  completedNow: boolean
  failedNow: boolean
  reward: number
}

export function createMiniGameEngine(catalog: MiniGameCatalog) {
  const definitionById = new Map(catalog.definitions.map((definition) => [definition.id, definition]))

  function definition(id: MiniGameId) {
    return definitionById.get(id) ?? catalog.definitions[0]
  }

  function targets(id: MiniGameId) {
    return catalog.targets[id] ?? []
  }

  function createInitial(records: Partial<Record<MiniGameId, MiniGameRecord>> = {}): MiniGameRuntime {
    return {
      status: 'idle',
      startedAt: 0,
      endsAt: 0,
      score: 0,
      points: 0,
      target: 0,
      collected: [],
      records,
      eventSequence: 0,
    }
  }

  function start(id: MiniGameId, now: number, records: Partial<Record<MiniGameId, MiniGameRecord>>, eventSequence = 0): MiniGameRuntime {
    const game = definition(id)
    return {
      activeId: id,
      status: 'running',
      startedAt: now,
      endsAt: now + game.durationMs,
      score: 0,
      points: 0,
      target: game.target,
      collected: [],
      records,
      eventSequence,
      announcement: {
        sequence: eventSequence,
        title: game.title,
        objective: game.objective,
        message: game.startMessage,
        startedAt: now,
        endsAt: now + game.durationMs,
      },
    }
  }

  function tick(state: MiniGameRuntime, now: number, playerPosition: Vec3): MiniGameTickResult {
    if (state.status !== 'running' || !state.activeId) {
      return unchanged(state)
    }

    const game = definition(state.activeId)
    const activeTargets = targets(state.activeId)
    const collected = collectTargets(game, activeTargets, state, playerPosition)
    let nextState = state
    let pointsAwarded = 0

    if (collected.length > 0) {
      pointsAwarded = collected.reduce((total, target) => total + (target.points ?? game.pointsPerTarget), 0)
      const collectedIds = collected.map((target) => target.id)
      nextState = {
        ...nextState,
        score: Math.min(game.target, nextState.score + collected.length),
        points: nextState.points + pointsAwarded,
        collected: [...nextState.collected, ...collectedIds],
      }
    }

    if (nextState.score >= game.target) {
      const elapsed = Math.max(1, Math.round((now - nextState.startedAt) / 1000))
      const finalPoints = nextState.points + game.completionBonus
      const record = nextState.records[game.id]
      const nextRecord: MiniGameRecord = {
        plays: (record?.plays ?? 0) + 1,
        bestScore: Math.max(record?.bestScore ?? 0, nextState.score),
        bestPoints: Math.max(record?.bestPoints ?? 0, finalPoints),
        bestTime: record?.bestTime ? Math.min(record.bestTime, elapsed) : elapsed,
      }
      return {
        state: {
          ...nextState,
          status: 'completed',
          activeId: undefined,
          points: finalPoints,
          records: { ...nextState.records, [game.id]: nextRecord },
        },
        collected,
        pointsAwarded: pointsAwarded + game.completionBonus,
        completedNow: true,
        failedNow: false,
        reward: game.reward,
      }
    }

    if (now >= nextState.endsAt) {
      const record = nextState.records[game.id]
      const nextRecord: MiniGameRecord = {
        plays: (record?.plays ?? 0) + 1,
        bestScore: Math.max(record?.bestScore ?? 0, nextState.score),
        bestPoints: Math.max(record?.bestPoints ?? 0, nextState.points),
        bestTime: record?.bestTime,
      }
      return {
        state: {
          ...nextState,
          status: 'failed',
          activeId: undefined,
          records: { ...nextState.records, [game.id]: nextRecord },
        },
        collected,
        pointsAwarded,
        completedNow: false,
        failedNow: true,
        reward: 0,
      }
    }

    return {
      state: nextState,
      collected,
      pointsAwarded,
      completedNow: false,
      failedNow: false,
      reward: 0,
    }
  }

  return { definition, targets, createInitial, start, tick }
}

function collectTargets(
  game: MiniGameDefinition,
  targets: MiniGameTarget[],
  state: MiniGameRuntime,
  playerPosition: Vec3,
) {
  if (game.mode === 'ordered_route') {
    const target = targets[state.score]
    return target && distance2d(playerPosition, target.position) <= game.collectRadius ? [target] : []
  }

  return targets.filter(
    (target) =>
      !state.collected.includes(target.id) &&
      distance2d(playerPosition, target.position) <= game.collectRadius,
  )
}

function unchanged(state: MiniGameRuntime): MiniGameTickResult {
  return {
    state,
    collected: [],
    pointsAwarded: 0,
    completedNow: false,
    failedNow: false,
    reward: 0,
  }
}

function distance2d(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}
