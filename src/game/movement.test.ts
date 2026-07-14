import { describe, expect, it } from 'vitest'
import { playerMovementSpeed, playerRunMultiplier, playerRunSpeed, playerWalkSpeed } from './movement'

describe('player movement speed', () => {
  it('runs at exactly twice walking speed', () => {
    expect(playerRunMultiplier).toBe(2)
    expect(playerRunSpeed).toBe(playerWalkSpeed * 2)
    expect(playerMovementSpeed(true)).toBe(playerMovementSpeed(false) * 2)
  })
})
