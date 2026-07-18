import { playerCollisionRadius } from './collision'
import { realScale } from './scale'
import type { Vec3 } from './types'

export const avatarSelectionHitboxPosition: Vec3 = [
  0,
  realScale.avatarHeight * 0.5,
  0,
]

export const avatarSelectionHitboxSize: Vec3 = [
  playerCollisionRadius * 3.4,
  realScale.avatarHeight * 1.28,
  playerCollisionRadius * 3.4,
]
