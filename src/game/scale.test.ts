import { describe, expect, it } from 'vitest'
import { buildPieceDimensions, buildingHeightForFloors, realScale, unitsPerMeter, worldScale } from './scale'

describe('world scale', () => {
  it('uses the block avatar as a real person scale reference', () => {
    expect(unitsPerMeter).toBeCloseTo(worldScale.avatarHeightUnits / worldScale.averagePersonMeters, 5)
    expect(realScale.avatarHeight).toBeCloseTo(2.64, 2)
  })

  it('keeps doors and storeys proportional to a person', () => {
    expect(realScale.doorHeight / realScale.avatarHeight).toBeGreaterThan(1.1)
    expect(realScale.doorHeight / realScale.avatarHeight).toBeLessThan(1.2)
    expect(realScale.floorHeight / realScale.avatarHeight).toBeGreaterThan(1.75)
    expect(realScale.floorHeight / realScale.avatarHeight).toBeLessThan(1.9)
  })

  it('scales cars like real vehicles instead of toy props', () => {
    expect(realScale.carHeight / realScale.avatarHeight).toBeGreaterThan(0.75)
    expect(realScale.carHeight / realScale.avatarHeight).toBeLessThan(0.9)
    expect(realScale.carLength / realScale.avatarHeight).toBeGreaterThan(2.35)
    expect(realScale.carLength / realScale.avatarHeight).toBeLessThan(2.55)
  })

  it('uses wide sandbox roads with room for traffic and players', () => {
    expect(realScale.roadTile / realScale.carWidth).toBeGreaterThan(3.4)
    expect(realScale.roadTile / realScale.busWidth).toBeGreaterThan(2.5)
    expect(realScale.pavementWidth / realScale.avatarHeight).toBeGreaterThan(0.7)
  })

  it('makes buildings integer floor heights above door height', () => {
    expect(buildingHeightForFloors(1)).toBeGreaterThan(realScale.doorHeight)
    expect(buildingHeightForFloors(2) / realScale.avatarHeight).toBeGreaterThan(3.5)
    expect(buildPieceDimensions.house.bodyHeight).toBe(buildingHeightForFloors(2))
    expect(buildPieceDimensions.building.bodyHeight).toBe(buildingHeightForFloors(4))
  })
})
