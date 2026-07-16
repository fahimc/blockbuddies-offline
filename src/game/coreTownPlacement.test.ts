import { describe, expect, it } from 'vitest'
import { obbyPlatforms } from '../ai/obby'
import { parkingLot } from './vehicles'
import {
  coreActivityPositions,
  coreCoinPositions,
  coreReservedFootprints,
  coreRoadZones,
  coreTerrainZones,
  footprintOverlapsAuthoredCore,
} from './townPlacement'
import { terrainAt } from './worldGrid'

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

  it('keeps authored activities, coins, obby pads, and parking out of core roads', () => {
    const gameplayPoints = [
      ...Object.values(coreActivityPositions),
      ...coreCoinPositions,
      ...obbyPlatforms.map((platform) => platform.position),
      parkingLot.center,
      parkingLot.drivewayCenter,
    ]

    expect(gameplayPoints.every(([x, , z]) => terrainAt(x, z, coreTerrainZones) !== 'road')).toBe(true)
  })

  it('keeps static reserved objects out of road lanes except low road/parking surfaces', () => {
    const offenders = coreReservedFootprints.filter((footprint) =>
      coreRoadZones.some((road) =>
        Math.abs(footprint.center[0] - road.center[0]) < (footprint.size[0] + road.size[0]) / 2 &&
        Math.abs(footprint.center[2] - road.center[2]) < (footprint.size[2] + road.size[2]) / 2,
      ),
    )

    expect(offenders.map((footprint) => footprint.id)).toEqual([])
  })

  it('defines a protected authored core for procedural road suppression', () => {
    expect(footprintOverlapsAuthoredCore([18, 0, 18], [36, 0.1, 10])).toBe(true)
    expect(footprintOverlapsAuthoredCore([54, 0, 54], [8, 1, 8])).toBe(false)
  })
})
