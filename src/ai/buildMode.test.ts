import { describe, expect, it } from 'vitest'
import { getBuildPiece } from '../data/buildPieces'
import { buildPieceDimensions, realScale } from '../game/scale'
import { createProceduralChunkPlan } from '../data/proceduralTownPlan'
import {
  canPlaceBlock,
  canPlacePiece,
  buildPlacementClearsPlayer,
  createBuildMapStamp,
  createBuildPiece,
  findBuildPlacementPosition,
  mergeBuildPieces,
  nextBuildPosition,
  rotateBuildYaw,
  worldBuildPlacementIssue,
} from './buildMode'

describe('build mode', () => {
  it('places ahead of the player on a snapped grid', () => {
    expect(nextBuildPosition([0.1, 0, 0.1], 0)).toEqual([0, 0.55, 2.5])
    expect(nextBuildPosition([0.1, 0, 0.1], 0, 'road')).toEqual([0, 0.05, 5])
  })

  it('rejects overlapping legacy blocks', () => {
    const position = [1, 0.55, 1] as [number, number, number]
    expect(
      canPlaceBlock([{ id: 'a', position, color: '#fff' }], position),
    ).toBe(false)
  })

  it('uses larger footprints for buildings and roads', () => {
    const house = createBuildPiece({
      id: 'house-1',
      kind: 'house',
      position: [4, 0, 4],
      color: '#60a5fa',
    })

    expect(canPlacePiece([house], [4.5, 0.05, 4], 'road')).toBe(false)
    expect(canPlacePiece([house], [13, 0.05, 4], 'road')).toBe(true)
    expect(getBuildPiece('house').footprint).toBeCloseTo(
      Math.max(
        buildPieceDimensions.house.width,
        buildPieceDimensions.house.depth,
      ),
      2,
    )
    expect(getBuildPiece('car').footprint).toBeCloseTo(realScale.carLength, 2)
  })

  it('keeps structure fallback cells outside the player collision area', () => {
    expect(buildPlacementClearsPlayer([2, 0, 0], [0, 0, 0], 'house')).toBe(
      false,
    )
    expect(buildPlacementClearsPlayer([4, 0, 0], [0, 0, 0], 'house')).toBe(true)
    expect(buildPlacementClearsPlayer([0, 0, 0], [0, 0, 0], 'road')).toBe(true)
  })

  it('rotates build pieces in quarter turns', () => {
    expect(rotateBuildYaw(0)).toBeCloseTo(Math.PI / 2)
    expect(rotateBuildYaw((Math.PI / 2) * 3)).toBe(0)
  })

  it('creates a deterministic procedural street stamp', () => {
    let nextId = 0
    const stamp = createBuildMapStamp({
      origin: [10, 0, 10],
      yaw: 0,
      idFactory: () => `piece-${nextId++}`,
    })

    expect(stamp).toHaveLength(18)
    expect(stamp.filter((piece) => piece.kind === 'road')).toHaveLength(10)
    expect(stamp[0]).toMatchObject({ id: 'piece-0', kind: 'tree' })
  })

  it('filters procedural pieces against existing custom world pieces', () => {
    let nextId = 0
    const stamp = createBuildMapStamp({
      origin: [0, 0, 0],
      yaw: 0,
      idFactory: () => `piece-${nextId++}`,
    })
    const accepted = mergeBuildPieces([stamp[0]], stamp)

    expect(accepted.length).toBeLessThan(stamp.length)
    expect(accepted.map((piece) => piece.id)).not.toContain('piece-0')
    expect(
      accepted.every((piece, index) =>
        accepted
          .slice(index + 1)
          .every((other) => canPlacePiece([piece], other.position, other.kind)),
      ),
    ).toBe(true)
  })

  it('rejects roads, reserved town cells, and developed procedural parcels', () => {
    expect(worldBuildPlacementIssue([0, 0, -7], 'house')).toContain('road')
    expect(worldBuildPlacementIssue([12, 0, -7], 'tree')).toBe(
      'That cell is reserved for the town layout',
    )

    const developed = [-2, -1, 0, 1, 2]
      .flatMap((cx) =>
        [-2, -1, 0, 1, 2].flatMap(
          (cz) => createProceduralChunkPlan('LONDON-2026', cx, cz).parcels,
        ),
      )
      .find(
        (parcel) => parcel.use === 'residential' || parcel.use === 'commercial',
      )
    expect(developed).toBeDefined()
    if (developed) {
      expect(worldBuildPlacementIssue(developed.center, 'block')).toBe(
        'Build inside an empty parcel beside the road',
      )
    }
  })

  it('allows building inside a complete empty parcel and lamps on clear sidewalks', () => {
    const empty = createProceduralChunkPlan('LONDON-2026', 2, 1).parcels.find(
      (parcel) => parcel.use === 'buildable',
    )
    expect(empty).toBeDefined()
    if (empty)
      expect(worldBuildPlacementIssue(empty.center, 'block')).toBeUndefined()
    expect(worldBuildPlacementIssue([7, 0, -8], 'lamp')).toBeUndefined()
  })

  it('finds a nearby legal cell when the first build target is blocked', () => {
    const empty = createProceduralChunkPlan('LONDON-2026', 2, 1).parcels.find(
      (parcel) => parcel.use === 'buildable',
    )
    expect(empty).toBeDefined()
    if (!empty) return

    const playerPosition: [number, number, number] = [
      empty.center[0],
      0,
      empty.center[2] - getBuildPiece('block').placeDistance,
    ]
    const firstPosition = nextBuildPosition(playerPosition, 0, 'block')
    const blocked = createBuildPiece({
      id: 'occupied-cell',
      kind: 'block',
      position: firstPosition,
    })

    const placement = findBuildPlacementPosition({
      blocks: [blocked],
      playerPosition,
      yaw: 0,
      pieceId: 'block',
    })

    expect(placement.issue).toBeUndefined()
    expect(placement.position).toBeDefined()
    expect(placement.position).not.toEqual(firstPosition)
    expect(canPlacePiece([blocked], placement.position!, 'block')).toBe(true)
    expect(
      worldBuildPlacementIssue(placement.position!, 'block'),
    ).toBeUndefined()
  })
})
