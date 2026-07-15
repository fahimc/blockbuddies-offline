import { describe, expect, it } from 'vitest'
import { avatarGroundOffset, buildPieceDimensions, buildingCenterPosition, buildingScale } from './scale'
import {
  buildBlockInteriorEntrance,
  exteriorDoorClearanceDistance,
  filterEntranceSafeZoneCollisions,
  interiorCollisionBoxes,
  interiorEntryYaw,
  interiorExitPosition,
  interiorExitRadius,
  interiorSpawnPosition,
  interiorStandingY,
  houseBedCenter,
  houseBedSleepPosition,
  houseBedWakePosition,
  isNearHouseBed,
  makeInteriorVisit,
  nearestInteriorEntrance,
  proceduralDoorEntrance,
  staticBuildingEntrance,
} from './interiors'
import type { BuildBlock } from './types'
import { collidesCircleWithBox, playerCollisionRadius, type CollisionBox } from './collision'
import type { ProceduralPiece } from '../data/proceduralWorld'

describe('interior entrances', () => {
  it('creates a doorway trigger in front of static buildings', () => {
    const center = buildingCenterPosition(12, -7, 2)
    const scale = buildingScale(2, 4.6, 3.8)
    const entrance = staticBuildingEntrance({
      id: 'coin-shop',
      title: 'Coin Shop',
      kind: 'shop',
      center,
      scale,
    })

    expect(entrance.position[0]).toBeCloseTo(12)
    expect(entrance.position[2]).toBeGreaterThan(-7 + scale[2] / 2)
    expect(entrance.returnPosition[2]).toBeGreaterThan(entrance.position[2])
    expect(entrance.returnPosition[2] - entrance.position[2]).toBeCloseTo(exteriorDoorClearanceDistance)
    expect(nearestInteriorEntrance(entrance.returnPosition, [entrance])).toBeUndefined()
    expect(makeInteriorVisit(entrance)).toMatchObject({ id: 'coin-shop', title: 'Coin Shop', kind: 'shop' })
  })

  it('rotates built-house doorway triggers with the placed piece', () => {
    const block: BuildBlock = {
      id: 'home-1',
      kind: 'house',
      position: [4, 0, 8],
      color: '#60a5fa',
      rotation: Math.PI / 2,
    }

    const entrance = buildBlockInteriorEntrance(block)

    expect(entrance).toBeDefined()
    expect(entrance?.kind).toBe('house')
    expect(entrance?.position[0]).toBeGreaterThan(4 + buildPieceDimensions.house.depth / 2)
    expect(entrance?.position[2]).toBeCloseTo(8)
    expect((entrance?.returnPosition[0] ?? 0) - (entrance?.position[0] ?? 0)).toBeCloseTo(exteriorDoorClearanceDistance)
    expect(entrance ? nearestInteriorEntrance(entrance.returnPosition, [entrance]) : undefined).toBeUndefined()
    expect(entrance?.returnYaw).toBeCloseTo(Math.PI / 2)
  })

  it('maps procedural doors into enterable homes and places', () => {
    const door: ProceduralPiece = {
      id: 'building:1:2:0:door',
      kind: 'door',
      position: [18, 1.5, 23],
      scale: [1, 3, 0.12],
      color: '#7c2d12',
    }

    const entrance = proceduralDoorEntrance(door)

    expect(entrance).toMatchObject({ id: 'procedural:building:1:2:0:door', kind: 'house', title: 'Borough House' })
    expect(entrance?.position[2]).toBeGreaterThan(23)
    expect(entrance?.returnPosition[2]).toBeGreaterThan(entrance?.position[2] ?? 0)
    expect((entrance?.returnPosition[2] ?? 0) - (entrance?.position[2] ?? 0)).toBeCloseTo(exteriorDoorClearanceDistance)
    expect(entrance ? nearestInteriorEntrance(entrance.returnPosition, [entrance]) : undefined).toBeUndefined()
  })

  it('selects only doorways that the player has actually walked into', () => {
    const near = staticBuildingEntrance({
      id: 'near-house',
      title: 'Near House',
      kind: 'house',
      center: [0, 0, 0],
      scale: [4, 4, 4],
    })
    const far = staticBuildingEntrance({
      id: 'far-shop',
      title: 'Far Shop',
      kind: 'shop',
      center: [12, 0, 0],
      scale: [4, 4, 4],
    })

    expect(nearestInteriorEntrance([near.position[0], 0, near.position[2] + 0.2], [near, far])?.id).toBe('near-house')
    expect(nearestInteriorEntrance([near.position[0], 0, near.position[2] + 1.8], [near, far])).toBeUndefined()
  })

  it('keeps an exit doorway open while walls and furniture still collide', () => {
    const boxes = interiorCollisionBoxes('school')

    expect(interiorStandingY).toBe(avatarGroundOffset)
    expect(boxes.some((box) => box.id === 'interior:front-left-wall')).toBe(true)
    expect(boxes.some((box) => box.id === 'interior:front-right-wall')).toBe(true)
    expect(boxes.some((box) => box.id === 'interior:teacher-desk')).toBe(true)
    expect(boxes.filter((box) => box.id.startsWith('interior:chair-'))).toHaveLength(6)
    expect(boxes.filter((box) => box.id.startsWith('interior:desk-'))).toHaveLength(6)
    expect(interiorExitRadius).toBeGreaterThan(0.9)
    expect(Math.hypot(interiorSpawnPosition[0] - interiorExitPosition[0], interiorSpawnPosition[2] - interiorExitPosition[2])).toBeGreaterThan(
      interiorExitRadius + playerCollisionRadius + 0.75,
    )
    expect(Math.cos(interiorEntryYaw)).toBeGreaterThan(0.99)
    expect(interiorSpawnPosition[2] + Math.cos(interiorEntryYaw)).toBeGreaterThan(interiorSpawnPosition[2])
    expect(boxes.every((box) => Math.hypot(box.center[0] - interiorExitPosition[0], box.center[2] - interiorExitPosition[2]) > 0.8)).toBe(true)
  })

  it('filters tree and lamp collision out of doorway safe zones', () => {
    const entrance = staticBuildingEntrance({
      id: 'safe-house',
      title: 'Safe House',
      kind: 'house',
      center: [0, 0, 0],
      scale: [4, 4, 4],
    })
    const boxes: CollisionBox[] = [
      { id: 'static-tree:blocked', center: [entrance.position[0] + 0.2, 1, entrance.position[2]], half: [0.8, 1, 0.8] },
      { id: 'static-lamp:blocked', center: [entrance.position[0] - 0.3, 1, entrance.position[2]], half: [0.3, 1, 0.3] },
      { id: 'static-building:kept', center: [0, 2, 0], half: [2, 2, 2] },
      { id: 'static-tree:kept', center: [8, 1, 8], half: [0.8, 1, 0.8] },
    ]

    expect(filterEntranceSafeZoneCollisions(boxes, [entrance]).map((box) => box.id)).toEqual([
      'static-building:kept',
      'static-tree:kept',
    ])
  })

  it('provides a reachable bed sleep position and a collision-free wake point', () => {
    const boxes = interiorCollisionBoxes('house')
    const bed = boxes.find((box) => box.id === 'interior:house-bed')!

    expect(bed.center).toEqual(houseBedCenter)
    expect(houseBedSleepPosition[1]).toBeCloseTo(interiorStandingY + bed.center[1] + bed.half[1])
    expect(houseBedSleepPosition[2]).toBeLessThan(houseBedCenter[2])
    expect(isNearHouseBed(houseBedWakePosition)).toBe(true)
    expect(collidesCircleWithBox(houseBedWakePosition[0], houseBedWakePosition[2], playerCollisionRadius, bed)).toBe(false)
    expect(
      boxes
        .every((box) => Math.hypot(box.center[0] - houseBedWakePosition[0], box.center[2] - houseBedWakePosition[2]) > 0.9),
    ).toBe(true)
  })
})
