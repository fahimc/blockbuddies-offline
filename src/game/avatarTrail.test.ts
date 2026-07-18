import { describe, expect, it } from 'vitest'
import { trailItems } from '../data/avatarCustomization'
import { avatarTrailPieces } from './avatarTrail'
import type { ShopItemId } from './types'

describe('avatar trail visuals', () => {
  it('renders every trail item as ribbons and spark pieces instead of one placeholder circle', () => {
    const trailIds = Array.from(
      new Set(
        trailItems
          .map((item) => item.patch.trail)
          .filter((trail): trail is ShopItemId => Boolean(trail)),
      ),
    )

    expect(trailIds).toContain('trail-spark')

    trailIds.forEach((trail) => {
      const pieces = avatarTrailPieces(trail)
      const colors = new Set(pieces.map((piece) => piece.color))

      expect(pieces.length).toBeGreaterThanOrEqual(7)
      expect(pieces.some((piece) => piece.kind === 'ribbon')).toBe(true)
      expect(pieces.some((piece) => piece.kind === 'spark')).toBe(true)
      expect(colors.size).toBeGreaterThanOrEqual(4)
      expect(pieces.every((piece) => piece.position[2] < 0)).toBe(true)
    })
  })

  it('does not render a trail when none is equipped', () => {
    expect(avatarTrailPieces('none')).toEqual([])
  })
})
