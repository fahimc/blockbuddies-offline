import type { Vec3 } from './types'

export type CollisionBox = {
  id: string
  center: Vec3
  half: Vec3
}

export const playerCollisionRadius = 0.42

export function collidesCircleWithBox(x: number, z: number, radius: number, box: CollisionBox) {
  const closestX = clamp(x, box.center[0] - box.half[0], box.center[0] + box.half[0])
  const closestZ = clamp(z, box.center[2] - box.half[2], box.center[2] + box.half[2])
  const dx = x - closestX
  const dz = z - closestZ
  return dx * dx + dz * dz < radius * radius
}

export function pointHitsAnyBox(point: Vec3, boxes: CollisionBox[], radius = playerCollisionRadius) {
  return boxes.some((box) => collidesCircleWithBox(point[0], point[2], radius, box))
}

export function resolveHorizontalCollision(current: Vec3, desired: Vec3, boxes: CollisionBox[], radius = playerCollisionRadius): Vec3 {
  if (!pointHitsAnyBox(desired, boxes, radius)) return desired

  const xOnly: Vec3 = [desired[0], desired[1], current[2]]
  if (!pointHitsAnyBox(xOnly, boxes, radius)) return xOnly

  const zOnly: Vec3 = [current[0], desired[1], desired[2]]
  if (!pointHitsAnyBox(zOnly, boxes, radius)) return zOnly

  return current
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
