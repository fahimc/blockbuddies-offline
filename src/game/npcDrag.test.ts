import { describe, expect, it } from 'vitest'
import { pointHitsAnyBox } from './collision'
import {
  npcDragThresholdPixels,
  npcPointerHasDragged,
  safeNpcDropPosition,
} from './npcDrag'

describe('NPC direct dragging', () => {
  it('waits for deliberate pointer movement before treating a click as a drag', () => {
    expect(npcPointerHasDragged({ x: 10, y: 10 }, { x: 12, y: 12 })).toBe(false)
    expect(
      npcPointerHasDragged(
        { x: 10, y: 10 },
        { x: 10 + npcDragThresholdPixels, y: 10 },
      ),
    ).toBe(true)
  })

  it('pushes a dropped NPC outside blocking world geometry', () => {
    const obstacles = [
      {
        id: 'building',
        center: [4, 2, -3] as [number, number, number],
        half: [2, 2, 2] as [number, number, number],
      },
    ]

    const safe = safeNpcDropPosition([4, 0, -3], obstacles)

    expect(pointHitsAnyBox(safe, obstacles)).toBe(false)
    expect(safe[1]).toBe(0)
  })

  it('recovers invalid pointer projections to a finite ground position', () => {
    expect(
      safeNpcDropPosition(
        [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
        [],
      ),
    ).toEqual([0, 0, 0])
  })
})
