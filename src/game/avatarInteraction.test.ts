import { describe, expect, it } from 'vitest'
import { playerCollisionRadius } from './collision'
import { realScale } from './scale'
import {
  avatarSelectionHitboxPosition,
  avatarSelectionHitboxSize,
} from './avatarInteraction'

describe('avatar interaction hitbox', () => {
  it('gives players and NPCs a body-sized tap target for messages', () => {
    expect(avatarSelectionHitboxSize[0]).toBeGreaterThan(
      playerCollisionRadius * 3,
    )
    expect(avatarSelectionHitboxSize[1]).toBeGreaterThan(realScale.avatarHeight)
    expect(avatarSelectionHitboxSize[2]).toBeGreaterThan(
      playerCollisionRadius * 3,
    )
    expect(avatarSelectionHitboxPosition[1]).toBeCloseTo(
      realScale.avatarHeight * 0.5,
    )
  })
})
