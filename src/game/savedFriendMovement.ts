import {
  proceduralHorizontalRoadOrigin,
  proceduralHorizontalRoadRepeat,
  proceduralVerticalRoadOrigin,
  proceduralVerticalRoadRepeat,
} from '../data/proceduralTownPlan'
import { worldLocations } from '../data/world'
import type { SavedFriend, SavedFriendMovement, Vec3 } from './types'

export const savedFriendWalkSpeed = 3.2
export const savedFriendArrivalRadius = 0.12
const maximumWorldCoordinate = 1_000_000

export function fallbackSavedFriendPosition(
  route: readonly string[],
  index = 0,
): Vec3 {
  const location =
    worldLocations.find((entry) => entry.id === route[0]) ?? worldLocations[0]
  if (!location) return [0, 0, 0]
  const offset = (index % 4) * 0.9
  return [location.position[0] + offset, 0, location.position[2] - offset]
}

export function normalizeSavedFriendPosition(
  value: unknown,
  fallback: Vec3 = [0, 0, 0],
): Vec3 {
  if (!Array.isArray(value) || value.length < 3) return [...fallback]
  const x = Number(value[0])
  const z = Number(value[2])
  if (!Number.isFinite(x) || !Number.isFinite(z)) return [...fallback]
  return [
    clamp(x, -maximumWorldCoordinate, maximumWorldCoordinate),
    0,
    clamp(z, -maximumWorldCoordinate, maximumWorldCoordinate),
  ]
}

export function snapSavedFriendDestination(position: Vec3): Vec3 {
  const normalized = normalizeSavedFriendPosition(position)
  return [roundToHalf(normalized[0]), 0, roundToHalf(normalized[2])]
}

export function createSavedFriendNavigationPath(
  startInput: Vec3,
  destinationInput: Vec3,
): Vec3[] {
  const start = snapSavedFriendDestination(startInput)
  const destination = snapSavedFriendDestination(destinationInput)
  if (distance2d(start, destination) <= 14)
    return compactWaypoints([start, destination])

  const startRoadZ = nearestRepeatingLine(
    start[2],
    proceduralHorizontalRoadOrigin,
    proceduralHorizontalRoadRepeat,
  )
  const destinationRoadZ = nearestRepeatingLine(
    destination[2],
    proceduralHorizontalRoadOrigin,
    proceduralHorizontalRoadRepeat,
  )
  const connectionX = nearestRepeatingLine(
    (start[0] + destination[0]) / 2,
    proceduralVerticalRoadOrigin,
    proceduralVerticalRoadRepeat,
  )

  return compactWaypoints([
    start,
    [start[0], 0, startRoadZ],
    [connectionX, 0, startRoadZ],
    [connectionX, 0, destinationRoadZ],
    [destination[0], 0, destinationRoadZ],
    destination,
  ])
}

export function createSavedFriendMovement(
  friend: SavedFriend,
  destinationInput: Vec3,
  startedAt = Date.now(),
  index = 0,
): SavedFriendMovement {
  const start = savedFriendPositionAt(friend, startedAt, index)
  const destination = snapSavedFriendDestination(destinationInput)
  return {
    mode: 'walk',
    startedAt,
    speed: savedFriendWalkSpeed,
    waypoints: createSavedFriendNavigationPath(start, destination),
    destination,
  }
}

export function sanitizeSavedFriendMovement(
  value: unknown,
): SavedFriendMovement | undefined {
  if (!value || typeof value !== 'object') return undefined
  const movement = value as Partial<SavedFriendMovement>
  if (movement.mode !== 'walk' || !Array.isArray(movement.waypoints))
    return undefined
  const waypoints = movement.waypoints
    .slice(0, 8)
    .map((point) => normalizeSavedFriendPosition(point))
  if (waypoints.length < 2) return undefined
  const destination = normalizeSavedFriendPosition(
    movement.destination,
    waypoints.at(-1) ?? [0, 0, 0],
  )
  const startedAt = Number(movement.startedAt)
  const speed = Number(movement.speed)
  if (!Number.isFinite(startedAt)) return undefined
  return {
    mode: 'walk',
    startedAt,
    speed: Number.isFinite(speed) ? clamp(speed, 0.5, 8) : savedFriendWalkSpeed,
    waypoints,
    destination,
  }
}

export function savedFriendPositionAt(
  friend: Pick<SavedFriend, 'position' | 'movement' | 'route'>,
  now = Date.now(),
  index = 0,
): Vec3 {
  const fallback = fallbackSavedFriendPosition(friend.route, index)
  const restingPosition = normalizeSavedFriendPosition(
    friend.position,
    fallback,
  )
  const movement = friend.movement
  if (!movement?.waypoints?.length) return restingPosition

  const distanceTravelled =
    Math.max(0, (now - movement.startedAt) / 1000) * movement.speed
  let remaining = distanceTravelled
  for (let waypoint = 1; waypoint < movement.waypoints.length; waypoint += 1) {
    const from = movement.waypoints[waypoint - 1]
    const to = movement.waypoints[waypoint]
    if (!from || !to) continue
    const length = distance2d(from, to)
    if (remaining <= length) {
      if (length <= savedFriendArrivalRadius) return [...to]
      const progress = remaining / length
      return [
        from[0] + (to[0] - from[0]) * progress,
        0,
        from[2] + (to[2] - from[2]) * progress,
      ]
    }
    remaining -= length
  }
  return normalizeSavedFriendPosition(
    movement.destination,
    movement.waypoints.at(-1) ?? restingPosition,
  )
}

export function savedFriendIsMoving(
  friend: Pick<SavedFriend, 'position' | 'movement' | 'route'>,
  now = Date.now(),
  index = 0,
) {
  if (!friend.movement) return false
  return (
    distance2d(
      savedFriendPositionAt(friend, now, index),
      friend.movement.destination,
    ) > savedFriendArrivalRadius
  )
}

export function savedFriendTravelSeconds(movement: SavedFriendMovement) {
  return Math.ceil(pathLength(movement.waypoints) / movement.speed)
}

function pathLength(waypoints: Vec3[]) {
  return waypoints.slice(1).reduce((total, point, index) => {
    const previous = waypoints[index]
    return previous ? total + distance2d(previous, point) : total
  }, 0)
}

function compactWaypoints(waypoints: Vec3[]) {
  return waypoints.filter((point, index) => {
    const previous = waypoints[index - 1]
    return index === 0 || !previous || distance2d(point, previous) > 0.05
  })
}

function nearestRepeatingLine(value: number, origin: number, repeat: number) {
  return origin + Math.round((value - origin) / repeat) * repeat
}

function distance2d(first: Vec3, second: Vec3) {
  return Math.hypot(first[0] - second[0], first[2] - second[2])
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
