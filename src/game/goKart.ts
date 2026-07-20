import type { CollisionBox } from './collision'
import type { Vec3 } from './types'
import type { DrivableVehicle } from './vehicles'

export const goKartTrack = {
  center: [216, 0, -99] as Vec3,
  width: 72,
  depth: 50,
  laneWidth: 10,
  barrierThickness: 0.42,
  barrierHeight: 0.68,
  borderClearance: 3,
}

export const goKartTotalLaps = 3
export const goKartCountdownMs = 3_200
export const goKartBoostSpeed = 18
export const goKartMaxSpeed = 15
export const goKartReverseSpeed = 5
export const goKartAcceleration = 15
export const goKartBrakeStrength = 22
export const goKartSteeringRate = 2.05
export const goKartWidth = 1.35
export const goKartLength = 1.75
export const goKartHeight = 0.72

export type KartRaceStatus =
  'idle' | 'lobby' | 'countdown' | 'racing' | 'finished'

export type KartRaceRuntime = {
  raceId?: string
  vehicleId?: string
  status: KartRaceStatus
  lap: number
  totalLaps: number
  nextCheckpoint: number
  countdownEndsAt?: number
  startedAt?: number
  currentLapStartedAt?: number
  lastLapMs?: number
  bestLapMs?: number
  finishedAt?: number
}

export type KartPartyVehicle = {
  id: string
  position: Vec3
  yaw: number
  speed: number
}

export type KartPartyRace = Pick<
  KartRaceRuntime,
  | 'raceId'
  | 'vehicleId'
  | 'status'
  | 'lap'
  | 'totalLaps'
  | 'nextCheckpoint'
  | 'countdownEndsAt'
  | 'startedAt'
  | 'finishedAt'
>

const southLaneZ =
  goKartTrack.center[2] + goKartTrack.depth / 2 - goKartTrack.laneWidth / 2
const startLineX = goKartTrack.center[0] - goKartTrack.width / 2 + 14

export const goKartStartLine = {
  center: [startLineX, 0.12, southLaneZ] as Vec3,
  half: [0.7, 1, goKartTrack.laneWidth / 2] as Vec3,
}

export const goKartCheckpoints = [
  {
    id: 'east-turn',
    center: [
      goKartTrack.center[0] + goKartTrack.width / 2 - goKartTrack.laneWidth / 2,
      0,
      goKartTrack.center[2],
    ] as Vec3,
    half: [goKartTrack.laneWidth / 2, 1, 1.4] as Vec3,
  },
  {
    id: 'north-straight',
    center: [
      goKartTrack.center[0],
      0,
      goKartTrack.center[2] - goKartTrack.depth / 2 + goKartTrack.laneWidth / 2,
    ] as Vec3,
    half: [1.4, 1, goKartTrack.laneWidth / 2] as Vec3,
  },
  {
    id: 'west-turn',
    center: [
      goKartTrack.center[0] - goKartTrack.width / 2 + goKartTrack.laneWidth / 2,
      0,
      goKartTrack.center[2],
    ] as Vec3,
    half: [goKartTrack.laneWidth / 2, 1, 1.4] as Vec3,
  },
  {
    id: 'finish-line',
    center: goKartStartLine.center,
    half: goKartStartLine.half,
  },
] as const

export const goKartBoostPads = [
  {
    id: 'south-boost',
    center: [goKartTrack.center[0] + 9, 0.11, southLaneZ] as Vec3,
    half: [2.4, 0.4, goKartTrack.laneWidth * 0.34] as Vec3,
    yaw: Math.PI / 2,
  },
  {
    id: 'north-boost',
    center: [
      goKartTrack.center[0] - 10,
      0.11,
      goKartTrack.center[2] - goKartTrack.depth / 2 + goKartTrack.laneWidth / 2,
    ] as Vec3,
    half: [2.4, 0.4, goKartTrack.laneWidth * 0.34] as Vec3,
    yaw: -Math.PI / 2,
  },
] as const

export const goKartVehicleDefinitions: DrivableVehicle[] = [
  goKartVehicle('go-kart:red', 'Red Rocket', '#ef4444', -2.2, -2.4),
  goKartVehicle('go-kart:blue', 'Blue Bolt', '#2563eb', -2.2, 2.4),
  goKartVehicle('go-kart:green', 'Green Glide', '#16a34a', -5.3, -2.4),
  goKartVehicle('go-kart:gold', 'Gold Comet', '#f59e0b', -5.3, 2.4),
]

export const goKartTrackTravelPosition: Vec3 = [
  goKartTrack.center[0],
  0,
  goKartTrack.center[2] + goKartTrack.depth / 2 + 3,
]

export const goKartPaddockExitPosition: Vec3 = [
  startLineX + 4.2,
  0,
  goKartTrack.center[2] + goKartTrack.depth / 2 + 3,
]

export function goKartTrackCollisionBoxes(): CollisionBox[] {
  const { center, width, depth, laneWidth, barrierThickness, barrierHeight } =
    goKartTrack
  const [cx, , cz] = center
  const y = barrierHeight / 2
  const horizontalHalf: Vec3 = [
    width / 2 + barrierThickness,
    y,
    barrierThickness / 2,
  ]
  const verticalHalf: Vec3 = [
    barrierThickness / 2,
    y,
    depth / 2 + barrierThickness,
  ]

  return [
    {
      id: 'go-kart-track:north-barrier',
      center: [cx, y, cz - depth / 2 - barrierThickness / 2],
      half: horizontalHalf,
    },
    {
      id: 'go-kart-track:south-barrier',
      center: [cx, y, cz + depth / 2 + barrierThickness / 2],
      half: horizontalHalf,
    },
    {
      id: 'go-kart-track:west-barrier',
      center: [cx - width / 2 - barrierThickness / 2, y, cz],
      half: verticalHalf,
    },
    {
      id: 'go-kart-track:east-barrier',
      center: [cx + width / 2 + barrierThickness / 2, y, cz],
      half: verticalHalf,
    },
    {
      id: 'go-kart-track:center-island',
      center: [center[0], barrierHeight / 2, center[2]],
      half: [width / 2 - laneWidth, barrierHeight / 2, depth / 2 - laneWidth],
    },
  ]
}

export function createGoKarts() {
  return goKartVehicleDefinitions.map((vehicle) => ({
    ...vehicle,
    position: [...vehicle.position] as Vec3,
  }))
}

export function activeLocalGoKarts(
  vehicles: DrivableVehicle[],
  activeVehicleId?: string,
) {
  if (!isGoKartId(activeVehicleId)) return []
  return vehicles.filter((vehicle) => vehicle.id === activeVehicleId)
}

export function getGoKart(id: string) {
  return goKartVehicleDefinitions.find((vehicle) => vehicle.id === id)
}

export function isGoKartId(id: string | undefined): id is string {
  return Boolean(id && getGoKart(id))
}

export function createInitialKartRace(): KartRaceRuntime {
  return {
    status: 'idle',
    lap: 1,
    totalLaps: goKartTotalLaps,
    nextCheckpoint: 0,
  }
}

export function createKartRaceLobby(vehicleId: string): KartRaceRuntime {
  return {
    ...createInitialKartRace(),
    vehicleId,
    status: 'lobby',
  }
}

export function startKartRaceCountdown(
  race: KartRaceRuntime,
  now: number,
  raceId: string,
): KartRaceRuntime {
  if (!race.vehicleId) return race
  return {
    ...createKartRaceLobby(race.vehicleId),
    raceId,
    status: 'countdown',
    countdownEndsAt: now + goKartCountdownMs,
    startedAt: now + goKartCountdownMs,
    currentLapStartedAt: now + goKartCountdownMs,
  }
}

export function syncKartRaceStart(
  local: KartRaceRuntime,
  remote: KartPartyRace,
  now: number,
): KartRaceRuntime {
  if (
    !local.vehicleId ||
    !remote.raceId ||
    (remote.status !== 'countdown' && remote.status !== 'racing')
  )
    return local
  if (local.raceId === remote.raceId) return local
  const startedAt = remote.startedAt ?? remote.countdownEndsAt ?? now
  const countdownEndsAt = remote.countdownEndsAt ?? startedAt
  return {
    ...createKartRaceLobby(local.vehicleId),
    raceId: remote.raceId,
    status: now >= countdownEndsAt ? 'racing' : 'countdown',
    countdownEndsAt,
    startedAt,
    currentLapStartedAt: startedAt,
  }
}

export function advanceKartRace(
  race: KartRaceRuntime,
  position: Vec3,
  now: number,
): KartRaceRuntime {
  let current = race
  if (
    current.status === 'countdown' &&
    current.countdownEndsAt !== undefined &&
    now >= current.countdownEndsAt
  ) {
    const startedAt = current.startedAt ?? current.countdownEndsAt
    current = {
      ...current,
      status: 'racing',
      startedAt,
      currentLapStartedAt: startedAt,
    }
  }
  if (current.status !== 'racing') return current

  const checkpoint = goKartCheckpoints[current.nextCheckpoint]
  if (!checkpoint || !pointInZone(position, checkpoint.center, checkpoint.half))
    return current

  if (current.nextCheckpoint < goKartCheckpoints.length - 1)
    return { ...current, nextCheckpoint: current.nextCheckpoint + 1 }

  const lapStartedAt = current.currentLapStartedAt ?? current.startedAt ?? now
  const lapMs = Math.max(0, now - lapStartedAt)
  const bestLapMs = Math.min(current.bestLapMs ?? Infinity, lapMs)
  if (current.lap >= current.totalLaps)
    return {
      ...current,
      status: 'finished',
      nextCheckpoint: goKartCheckpoints.length,
      lastLapMs: lapMs,
      bestLapMs,
      finishedAt: now,
    }
  return {
    ...current,
    lap: current.lap + 1,
    nextCheckpoint: 0,
    currentLapStartedAt: now,
    lastLapMs: lapMs,
    bestLapMs,
  }
}

export function kartRaceProgress(race: KartPartyRace | KartRaceRuntime) {
  if (race.status === 'finished') return race.totalLaps * 100 + 100
  return Math.max(0, race.lap - 1) * 100 + race.nextCheckpoint * 25
}

export function kartRaceElapsed(
  race: KartPartyRace | KartRaceRuntime,
  now: number,
) {
  if (!race.startedAt) return 0
  return Math.max(0, (race.finishedAt ?? now) - race.startedAt)
}

export function pointOnGoKartBoost(position: Vec3) {
  return goKartBoostPads.some((pad) =>
    pointInZone(position, pad.center, pad.half),
  )
}

export function pointInGoKartTrackClearance(position: Vec3, padding = 0) {
  return footprintIntersectsGoKartTrack(position, [0, 0, 0], padding)
}

export function footprintIntersectsGoKartTrack(
  center: Vec3,
  size: Vec3,
  padding = 0,
) {
  const halfWidth =
    goKartTrack.width / 2 + goKartTrack.borderClearance + padding + size[0] / 2
  const halfDepth =
    goKartTrack.depth / 2 + goKartTrack.borderClearance + padding + size[2] / 2
  return (
    Math.abs(center[0] - goKartTrack.center[0]) <= halfWidth &&
    Math.abs(center[2] - goKartTrack.center[2]) <= halfDepth
  )
}

function goKartVehicle(
  id: string,
  label: string,
  color: string,
  xOffset: number,
  zOffset: number,
): DrivableVehicle {
  return {
    id,
    label,
    kind: 'kart',
    color,
    position: [startLineX + xOffset, 0.08, southLaneZ + zOffset],
    yaw: Math.PI / 2,
    speed: 0,
  }
}

function pointInZone(position: Vec3, center: Vec3, half: Vec3) {
  return (
    Math.abs(position[0] - center[0]) <= half[0] &&
    Math.abs(position[2] - center[2]) <= half[2]
  )
}
