import type { Vec3 } from './types'
import { avatarGroundOffset, avatarVisualHeight } from './scale'

export type CollisionBox = {
  id: string
  center: Vec3
  half: Vec3
}

export const playerCollisionRadius = 0.42
export const collisionSkin = 0.035
export const maxWalkableStepHeight = 0.24

export type VerticalCollisionResult = {
  y: number
  grounded: boolean
  surfaceId?: string
}

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

export function collisionBoxTop(box: CollisionBox) {
  return box.center[1] + box.half[1]
}

export function collisionBoxBottom(box: CollisionBox) {
  return box.center[1] - box.half[1]
}

export function playerVerticalBounds(rootY: number) {
  const bottom = rootY - avatarGroundOffset
  return { bottom, top: bottom + avatarVisualHeight }
}

export function collisionBoxesBlockingPlayer(
  boxes: CollisionBox[],
  playerRootY: number,
  stepHeight = maxWalkableStepHeight,
) {
  const player = playerVerticalBounds(playerRootY)
  return boxes.filter((box) => {
    const boxTop = collisionBoxTop(box)
    const boxBottom = collisionBoxBottom(box)
    const canStepOntoTop = boxTop - player.bottom <= stepHeight + collisionSkin
    const alreadyAboveTop = player.bottom >= boxTop - collisionSkin
    return !canStepOntoTop && !alreadyAboveTop && player.top > boxBottom + collisionSkin
  })
}

export function playerIsGrounded(
  point: Vec3,
  boxes: CollisionBox[],
  groundY = 0,
  radius = playerCollisionRadius,
) {
  const feetY = point[1] - avatarGroundOffset
  if (Math.abs(feetY - groundY) <= collisionSkin * 2) return true
  return boxes.some(
    (box) =>
      collidesCircleWithBox(point[0], point[2], radius, box) &&
      Math.abs(feetY - collisionBoxTop(box)) <= collisionSkin * 2,
  )
}

export function resolvePlayerVerticalCollision({
  point,
  desiredY,
  boxes,
  groundY = 0,
  radius = playerCollisionRadius,
  stepHeight = maxWalkableStepHeight,
}: {
  point: Vec3
  desiredY: number
  boxes: CollisionBox[]
  groundY?: number
  radius?: number
  stepHeight?: number
}): VerticalCollisionResult {
  const current = playerVerticalBounds(point[1])
  const desired = playerVerticalBounds(desiredY)
  const overlapping = boxes.filter((box) => collidesCircleWithBox(point[0], point[2], radius, box))

  if (desiredY > point[1]) {
    const ceiling = overlapping
      .map((box) => ({ id: box.id, height: collisionBoxBottom(box) }))
      .filter(({ height }) => height >= current.top - collisionSkin && height <= desired.top + collisionSkin)
      .sort((a, b) => a.height - b.height)[0]
    if (ceiling) {
      return {
        y: ceiling.height - avatarVisualHeight + avatarGroundOffset - collisionSkin,
        grounded: false,
        surfaceId: ceiling.id,
      }
    }
    return { y: desiredY, grounded: false }
  }

  const reachableTop = current.bottom + stepHeight + collisionSkin
  const supports = overlapping
    .map((box) => ({ id: box.id, height: collisionBoxTop(box) }))
    .filter(({ height }) => height <= reachableTop && height >= desired.bottom - collisionSkin)

  if (groundY <= reachableTop && groundY >= desired.bottom - collisionSkin) {
    supports.push({ id: 'ground', height: groundY })
  }

  const support = supports.sort((a, b) => b.height - a.height)[0]
  if (!support) return { y: desiredY, grounded: false }
  return {
    y: support.height + avatarGroundOffset,
    grounded: true,
    surfaceId: support.id,
  }
}

export function resolveHorizontalCollision(current: Vec3, desired: Vec3, boxes: CollisionBox[], radius = playerCollisionRadius): Vec3 {
  if (!pointHitsAnyBox(desired, boxes, radius)) return desired

  const xOnly: Vec3 = [desired[0], desired[1], current[2]]
  if (!pointHitsAnyBox(xOnly, boxes, radius)) return xOnly

  const zOnly: Vec3 = [current[0], desired[1], desired[2]]
  if (!pointHitsAnyBox(zOnly, boxes, radius)) return zOnly

  return current
}

export function separateCircleFromBoxes(point: Vec3, boxes: CollisionBox[], radius = playerCollisionRadius): Vec3 {
  let x = point[0]
  let z = point[2]
  const epsilon = 0.001

  for (const box of boxes) {
    const minX = box.center[0] - box.half[0] - radius
    const maxX = box.center[0] + box.half[0] + radius
    const minZ = box.center[2] - box.half[2] - radius
    const maxZ = box.center[2] + box.half[2] + radius
    if (x < minX || x > maxX || z < minZ || z > maxZ) continue

    const pushes = [
      { axis: 'x' as const, amount: minX - x - epsilon },
      { axis: 'x' as const, amount: maxX - x + epsilon },
      { axis: 'z' as const, amount: minZ - z - epsilon },
      { axis: 'z' as const, amount: maxZ - z + epsilon },
    ].sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount))
    const push = pushes[0]
    if (push.axis === 'x') x += push.amount
    else z += push.amount
  }

  return [x, point[1], z]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
