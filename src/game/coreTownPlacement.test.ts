import { describe, expect, it } from 'vitest'
import { coreActivityPositions, coreCoinPositions } from './townPlacement'

describe('core town item placement', () => {
  it('places a useful set of ground-height coins on unique grid cells', () => {
    const cells = coreCoinPositions.map(([x, , z]) => `${x}:${z}`)

    expect(coreCoinPositions.length).toBeGreaterThanOrEqual(6)
    expect(new Set(cells).size).toBe(coreCoinPositions.length)
    expect(coreCoinPositions.every(([x, y, z]) => Number.isInteger(x) && y === 0.8 && Number.isInteger(z))).toBe(true)
  })

  it('reserves separate grid footprints for activity pads before placing coins', () => {
    const activityCells = Object.values(coreActivityPositions).map(([x, , z]) => `${x}:${z}`)
    const coinCells = new Set(coreCoinPositions.map(([x, , z]) => `${x}:${z}`))

    expect(activityCells).toHaveLength(3)
    expect(new Set(activityCells).size).toBe(3)
    expect(activityCells.every((cell) => !coinCells.has(cell))).toBe(true)
  })
})
