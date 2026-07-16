import { describe, expect, it } from 'vitest'
import { realScale } from '../game/scale'
import {
  createProceduralChunkPlan,
  proceduralBuildableParcelFor,
  proceduralTerrainAt,
} from './proceduralTownPlan'

describe('procedural town plan', () => {
  it('creates deterministic road-served parcels and leaves empty parcels for players', () => {
    const first = createProceduralChunkPlan('BUDDY-TOWN', 2, 1)
    const second = createProceduralChunkPlan('BUDDY-TOWN', 2, 1)

    expect(first).toEqual(second)
    expect(first.layout.hasVerticalRoad).toBe(true)
    expect(first.parcels.some((parcel) => parcel.use === 'buildable')).toBe(true)
    expect(first.parcels.every((parcel) => parcel.size[0] >= 5.4 && parcel.size[2] >= 5.4)).toBe(true)
  })

  it('keeps every planned parcel outside road and sidewalk cells', () => {
    const plans = [
      createProceduralChunkPlan('BUDDY-TOWN', 0, 0),
      createProceduralChunkPlan('BUDDY-TOWN', 1, 0),
      createProceduralChunkPlan('BUDDY-TOWN', 0, 1),
    ]

    expect(plans.flatMap((plan) => plan.parcels).every((parcel) => {
      const halfX = parcel.size[0] / 2
      const halfZ = parcel.size[2] / 2
      return [
        [parcel.center[0] - halfX, parcel.center[2] - halfZ],
        [parcel.center[0] + halfX, parcel.center[2] - halfZ],
        [parcel.center[0] - halfX, parcel.center[2] + halfZ],
        [parcel.center[0] + halfX, parcel.center[2] + halfZ],
      ].every(([x, z]) => proceduralTerrainAt(x, z) === 'ground')
    })).toBe(true)
  })

  it('places street furniture on sidewalks but outside driving lanes', () => {
    const plan = createProceduralChunkPlan('BUDDY-TOWN', 1, 0)

    expect(plan.sidewalkFurniture.length).toBeGreaterThan(0)
    expect(plan.sidewalkFurniture.every(([x, , z]) => proceduralTerrainAt(x, z) === 'sidewalk')).toBe(true)
    expect(new Set(plan.sidewalkFurniture.map(([x, , z]) => `${x}:${z}`)).size).toBe(plan.sidewalkFurniture.length)
    expect(realScale.pavementWidth).toBeGreaterThan(realScale.avatarHeight)
  })

  it('finds buildable parcels only when a complete footprint fits', () => {
    const plan = createProceduralChunkPlan('BUDDY-TOWN', 2, 1)
    const parcel = plan.parcels.find((candidate) => candidate.use === 'buildable')
    expect(parcel).toBeDefined()
    if (!parcel) return

    expect(proceduralBuildableParcelFor('BUDDY-TOWN', parcel.center, [2, 1, 2])?.id).toBe(parcel.id)
    expect(proceduralBuildableParcelFor('BUDDY-TOWN', parcel.center, [parcel.size[0] + 1, 1, 2])).toBeUndefined()
  })
})
