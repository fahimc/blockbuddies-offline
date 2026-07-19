import {
  playerCollisionRadius,
  separateCircleFromBoxes,
  type CollisionBox,
} from './collision'
import type { Vec3 } from './types'

export const npcDragThresholdPixels = 5
export const npcDragLift = 0.28

export function npcPointerHasDragged(
  start: { x: number; y: number },
  current: { x: number; y: number },
) {
  return (
    Math.hypot(current.x - start.x, current.y - start.y) >=
    npcDragThresholdPixels
  )
}

export function safeNpcDropPosition(
  position: Vec3,
  obstacles: CollisionBox[],
): Vec3 {
  const finitePosition: Vec3 = [
    Number.isFinite(position[0]) ? position[0] : 0,
    0,
    Number.isFinite(position[2]) ? position[2] : 0,
  ]
  let safe = finitePosition
  for (let pass = 0; pass < 3; pass += 1) {
    const separated = separateCircleFromBoxes(
      safe,
      obstacles,
      playerCollisionRadius,
    )
    if (separated[0] === safe[0] && separated[2] === safe[2]) break
    safe = separated
  }
  return [safe[0], 0, safe[2]]
}
