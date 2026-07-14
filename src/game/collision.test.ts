import { describe, expect, it } from 'vitest'
import {
  collisionBoxesBlockingPlayer,
  collidesCircleWithBox,
  playerIsGrounded,
  resolveHorizontalCollision,
  resolvePlayerVerticalCollision,
  separateCircleFromBoxes,
  type CollisionBox,
} from './collision'
import { avatarGroundOffset } from './scale'

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

  it('separates the player from moving obstacle boxes that overlap them', () => {
    const separated = separateCircleFromBoxes([2, 0.9, 0], [wall], 0.42)

    expect(collidesCircleWithBox(separated[0], separated[2], 0.42, wall)).toBe(false)
    expect(separated[0]).not.toBe(2)
  })

  it('blocks obstacle sides below their top but allows movement while standing on top', () => {
    const crate: CollisionBox = { id: 'crate', center: [0, 0.5, 0], half: [1, 0.5, 1] }

    expect(collisionBoxesBlockingPlayer([crate], avatarGroundOffset)).toEqual([crate])
    expect(collisionBoxesBlockingPlayer([crate], avatarGroundOffset + 1)).toEqual([])
  })

  it('lands a falling player on the highest solid object top', () => {
    const lowCrate: CollisionBox = { id: 'low', center: [0, 0.5, 0], half: [1, 0.5, 1] }
    const highCrate: CollisionBox = { id: 'high', center: [0, 1.25, 0], half: [0.7, 0.25, 0.7] }
    const point: [number, number, number] = [0, avatarGroundOffset + 2, 0]
    const result = resolvePlayerVerticalCollision({
      point,
      desiredY: avatarGroundOffset + 1.2,
      boxes: [lowCrate, highCrate],
    })

    expect(result).toEqual({ y: avatarGroundOffset + 1.5, grounded: true, surfaceId: 'high' })
    expect(playerIsGrounded([0, result.y, 0], [lowCrate, highCrate])).toBe(true)
  })

  it('steps onto low surfaces and falls back to the world floor', () => {
    const curb: CollisionBox = { id: 'curb', center: [0, 0.08, 0], half: [1, 0.08, 1] }
    const stepped = resolvePlayerVerticalCollision({
      point: [0, avatarGroundOffset, 0],
      desiredY: avatarGroundOffset - 0.05,
      boxes: [curb],
    })
    const grounded = resolvePlayerVerticalCollision({
      point: [3, avatarGroundOffset + 0.5, 0],
      desiredY: avatarGroundOffset - 0.1,
      boxes: [curb],
    })

    expect(stepped).toEqual({ y: avatarGroundOffset + 0.16, grounded: true, surfaceId: 'curb' })
    expect(grounded).toEqual({ y: avatarGroundOffset, grounded: true, surfaceId: 'ground' })
  })

  it('stops the avatar head at solid undersides while jumping', () => {
    const ceiling: CollisionBox = { id: 'ceiling', center: [0, 3, 0], half: [2, 0.25, 2] }
    const result = resolvePlayerVerticalCollision({
      point: [0, avatarGroundOffset, 0],
      desiredY: avatarGroundOffset + 1,
      boxes: [ceiling],
    })

    expect(result.grounded).toBe(false)
    expect(result.surfaceId).toBe('ceiling')
    expect(result.y).toBeLessThan(avatarGroundOffset + 1)
  })
})
