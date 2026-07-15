import type {
  MiniGameId,
  MiniGameRecord,
  MiniGameRuntime,
  Vec3,
} from '../game/types'
import { createMiniGameEngine, type MiniGameDefinition, type MiniGameTarget } from './miniGameEngine'

export type { MiniGameDefinition, MiniGameTarget }

export const miniGameDefinitions: MiniGameDefinition[] = [
  {
    id: 'coin-rush',
    title: 'Coin Rush',
    description: 'Grab glowing coins before the timer runs out.',
    objective: 'Collect 8 event coins',
    durationMs: 45_000,
    target: 8,
    reward: 35,
    startPosition: [10, 0, 2],
    mode: 'collect_any',
    collectRadius: 1.55,
    pointsPerTarget: 10,
    completionBonus: 50,
    startMessage: 'Coin Rush has started! Grab every glowing coin before time runs out.',
  },
  {
    id: 'delivery-dash',
    title: 'Delivery Dash',
    description: 'Pick up one parcel, then deliver it across town in order.',
    objective: 'Pickup parcel, deliver 3 stops',
    durationMs: 95_000,
    target: 4,
    reward: 40,
    startPosition: [19, 0, 2.5],
    mode: 'ordered_route',
    collectRadius: 1.7,
    pointsPerTarget: 20,
    completionBonus: 40,
    startMessage: 'Delivery Dash has started! Pick up the parcel, then follow the map markers to each drop-off.',
  },
  {
    id: 'hide-and-seek',
    title: 'Hide & Seek',
    description: 'Find buddies hiding around town.',
    objective: 'Find 3 hidden buddies',
    durationMs: 90_000,
    target: 3,
    reward: 50,
    startPosition: [-20, 0, 23],
    mode: 'collect_any',
    collectRadius: 1.35,
    pointsPerTarget: 20,
    completionBonus: 40,
    startMessage: 'Hide & Seek has started! Find every hidden buddy.',
  },
]

export const coinRushTargets: MiniGameTarget[] = [
  { id: 'rush-coin-1', label: 'Coin', position: [6, 0, -2], coinReward: 1, kind: 'coin' },
  { id: 'rush-coin-2', label: 'Coin', position: [11, 0, -1], coinReward: 1, kind: 'coin' },
  { id: 'rush-coin-3', label: 'Coin', position: [14, 0, -3], coinReward: 1, kind: 'coin' },
  { id: 'rush-coin-4', label: 'Coin', position: [12, 0, -8], coinReward: 1, kind: 'coin' },
  { id: 'rush-coin-5', label: 'Coin', position: [6, 0, -7], coinReward: 1, kind: 'coin' },
  { id: 'rush-coin-6', label: 'Coin', position: [3, 0, -3], coinReward: 1, kind: 'coin' },
  { id: 'rush-coin-7', label: 'Coin', position: [2, 0, 2], coinReward: 1, kind: 'coin' },
  { id: 'rush-coin-8', label: 'Coin', position: [7, 0, 4], coinReward: 1, kind: 'coin' },
]

export const deliveryDashTargets: MiniGameTarget[] = [
  {
    id: 'delivery-pickup',
    label: 'Parcel pickup',
    mapLabel: 'Pickup parcel',
    position: [19, 0, -2],
    points: 5,
    kind: 'pickup',
  },
  {
    id: 'delivery-park',
    label: 'Park drop-off',
    mapLabel: 'Deliver to Park',
    position: [-12, 0, -8],
    coinReward: 8,
    timeBonusMs: 5_000,
    kind: 'dropoff',
  },
  {
    id: 'delivery-school',
    label: 'School drop-off',
    mapLabel: 'Deliver to School',
    position: [-14, 0, 10],
    coinReward: 8,
    timeBonusMs: 5_000,
    kind: 'dropoff',
  },
  {
    id: 'delivery-houses',
    label: 'House drop-off',
    mapLabel: 'Deliver to Houses',
    position: [2, 0, 18],
    coinReward: 8,
    timeBonusMs: 5_000,
    kind: 'dropoff',
  },
]

export const hideAndSeekTargets: MiniGameTarget[] = [
  { id: 'hide-luna', label: 'LunaBlocks', position: [-18, 0, -14] },
  { id: 'hide-max', label: 'MaxJumps', position: [7, 0, 18] },
  { id: 'hide-pip', label: 'PipPop', position: [-7, 0, 7] },
]

const miniGameEngine = createMiniGameEngine({
  definitions: miniGameDefinitions,
  targets: {
    'coin-rush': coinRushTargets,
    'delivery-dash': deliveryDashTargets,
    'hide-and-seek': hideAndSeekTargets,
  },
})

export function miniGameDefinition(id: MiniGameId) {
  return miniGameEngine.definition(id)
}

export function miniGameTargets(id: MiniGameId): MiniGameTarget[] {
  return miniGameEngine.targets(id)
}

export function createInitialMiniGame(
  records: Partial<Record<MiniGameId, MiniGameRecord>> = {},
): MiniGameRuntime {
  return miniGameEngine.createInitial(records)
}

export function startMiniGameSession(
  id: MiniGameId,
  now: number,
  records: Partial<Record<MiniGameId, MiniGameRecord>>,
  eventSequence = 0,
): MiniGameRuntime {
  return miniGameEngine.start(id, now, records, eventSequence)
}

export type { MiniGameTickResult } from './miniGameEngine'

export function tickMiniGameSession(
  state: MiniGameRuntime,
  now: number,
  playerPosition: Vec3,
) {
  return miniGameEngine.tick(state, now, playerPosition)
}
