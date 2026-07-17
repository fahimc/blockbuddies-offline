import { describe, expect, it } from 'vitest'
import { obbyPlatforms, obbyStart } from '../ai/obby'
import { collisionBoxesBlockingPlayer, playerIsGrounded } from './collision'
import { activeObbyCollisionBoxes, obbyPlatformCollisionBoxes } from './obbyPhysics'

describe('obby platform collision', () => {
  it('uses collision boxes that exactly match every rendered platform mesh', () => {
    expect(obbyPlatformCollisionBoxes).toHaveLength(obbyPlatforms.length)
    obbyPlatformCollisionBoxes.forEach((box, index) => {
      expect(box.center).toEqual(obbyPlatforms[index].position)
      expect(box.half).toEqual(obbyPlatforms[index].scale.map((value) => value / 2))
    })
  })

  it('does not leave inactive red platforms as invisible world blockers', () => {
    expect(activeObbyCollisionBoxes(false)).toEqual([])
    expect(activeObbyCollisionBoxes(true)).toEqual(obbyPlatformCollisionBoxes)
  })

  it('spawns the player with their feet on the first platform instead of inside it', () => {
    expect(playerIsGrounded(obbyStart, obbyPlatformCollisionBoxes)).toBe(true)
    expect(collisionBoxesBlockingPlayer(obbyPlatformCollisionBoxes, obbyStart[1])).not.toContain(
      obbyPlatformCollisionBoxes[0],
    )
  })
})
