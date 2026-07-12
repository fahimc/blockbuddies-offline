import { describe, expect, it } from 'vitest'
import { canPlaceBlock, nextBuildPosition } from './buildMode'

describe('build mode', () => {
  it('places ahead of the player on a snapped grid', () => {
    expect(nextBuildPosition([0.1, 0, 0.1], 0)).toEqual([0, 0.55, 2.5])
  })

  it('rejects overlapping blocks', () => {
    const position = [1, 0.55, 1] as [number, number, number]
    expect(canPlaceBlock([{ id: 'a', position, color: '#fff' }], position)).toBe(false)
  })
})
