import { obbyPlatforms } from '../ai/obby'
import type { CollisionBox } from './collision'

export const obbyPlatformCollisionBoxes: CollisionBox[] = obbyPlatforms.map(
  ({ position, scale }, index) => ({
    id: `obby-platform:${index}`,
    center: position,
    half: [scale[0] / 2, scale[1] / 2, scale[2] / 2],
  }),
)

export function activeObbyCollisionBoxes(active: boolean) {
  return active ? obbyPlatformCollisionBoxes : []
}
