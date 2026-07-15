import { describe, expect, it } from 'vitest'
import {
  WorldOccupancyGrid,
  placeOnWorldGrid,
  snapWorldPoint,
  terrainAllowsObject,
  type TerrainZone,
} from './worldGrid'

const zones: TerrainZone[] = [
  { id: 'road', terrain: 'road', center: [0, 0, 0], size: [8, 0, 30] },
  { id: 'walk', terrain: 'sidewalk', center: [6, 0, 0], size: [4, 0, 30] },
  { id: 'park', terrain: 'park', center: [14, 0, 0], size: [8, 0, 12] },
]

describe('invisible world placement grid', () => {
  it('snaps objects to deterministic cells', () => {
    expect(snapWorldPoint([3.49, 2, -2.51])).toEqual([3, 2, -3])
  })

  it('keeps scenery and collectibles on compatible terrain', () => {
    expect(terrainAllowsObject('tree', { id: 'tree', center: [14, 0, 0], size: [1, 1, 1] }, zones)).toBe(true)
    expect(terrainAllowsObject('lamp', { id: 'lamp', center: [6, 0, 0], size: [1, 1, 1] }, zones)).toBe(true)
    expect(terrainAllowsObject('lamp', { id: 'lamp-road', center: [0, 0, 0], size: [1, 1, 1] }, zones)).toBe(false)
    expect(terrainAllowsObject('coin', { id: 'coin-road', center: [0, 0, 0], size: [1, 1, 1] }, zones)).toBe(false)
    expect(terrainAllowsObject('building', { id: 'house-park', center: [14, 0, 0], size: [2, 1, 2] }, zones)).toBe(false)
  })

  it('gives every placed object an exclusive set of cells', () => {
    const occupancy = new WorldOccupancyGrid()
    const tree = placeOnWorldGrid('tree', { id: 'tree', center: [14.2, 0, 0.2], size: [2, 1, 2] }, zones, occupancy)
    const coin = placeOnWorldGrid('coin', { id: 'coin', center: [14.1, 0, 0.1], size: [1, 1, 1] }, zones, occupancy)
    const separateCoin = placeOnWorldGrid('coin', { id: 'coin-2', center: [17, 0, 4], size: [1, 1, 1] }, zones, occupancy)

    expect(tree).toBeDefined()
    expect(coin).toBeUndefined()
    expect(separateCoin).toBeDefined()
  })
})
