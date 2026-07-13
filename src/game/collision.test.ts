import { describe, expect, it } from 'vitest'
import { collidesCircleWithBox, resolveHorizontalCollision, type CollisionBox } from './collision'

const wall: CollisionBox = {
  id: 'wall',
  center: [2, 1, 0],
  half: [0.5, 1, 2],
}

describe('collision resolver', () => {
  it('detects a player circle overlapping a visible object box', () => {
    expect(collidesCircleWithBox(1.7, 0, 0.42, wall)).toBe(true)
    expect(collidesCircleWithBox(0.8, 0, 0.42, wall)).toBe(false)
  })

  it('slides along the unblocked axis instead of stopping completely', () => {
    const resolved = resolveHorizontalCollision([0.8, 0.9, -1], [1.7, 0.9, -0.2], [wall], 0.42)

    expect(resolved[0]).toBe(0.8)
    expect(resolved[2]).toBe(-0.2)
  })

  it('keeps the current position when both axes are blocked', () => {
    const corner: CollisionBox = {
      id: 'corner',
      center: [1.2, 1, -0.2],
      half: [0.35, 1, 0.35],
    }

    expect(resolveHorizontalCollision([1.2, 0.9, -1], [1.7, 0.9, -0.2], [wall, corner], 0.42)).toEqual([1.2, 0.9, -1])
  })
})
