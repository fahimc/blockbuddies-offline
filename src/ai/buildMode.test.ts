import { describe, expect, it } from 'vitest'
import {
  canPlaceBlock,
  canPlacePiece,
  createBuildMapStamp,
  createBuildPiece,
  mergeBuildPieces,
  nextBuildPosition,
  rotateBuildYaw,
} from './buildMode'

describe('build mode', () => {
  it('places ahead of the player on a snapped grid', () => {
    expect(nextBuildPosition([0.1, 0, 0.1], 0)).toEqual([0, 0.55, 2.5])
    expect(nextBuildPosition([0.1, 0, 0.1], 0, 'road')).toEqual([0, 0.05, 3])
  })

  it('rejects overlapping legacy blocks', () => {
    const position = [1, 0.55, 1] as [number, number, number]
    expect(canPlaceBlock([{ id: 'a', position, color: '#fff' }], position)).toBe(false)
  })

  it('uses larger footprints for buildings and roads', () => {
    const house = createBuildPiece({
      id: 'house-1',
      kind: 'house',
      position: [4, 0, 4],
      color: '#60a5fa',
    })

    expect(canPlacePiece([house], [4.5, 0.05, 4], 'road')).toBe(false)
    expect(canPlacePiece([house], [8, 0.05, 4], 'road')).toBe(true)
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

    expect(accepted).toHaveLength(stamp.length - 3)
    expect(accepted.map((piece) => piece.id)).not.toEqual(expect.arrayContaining(['piece-0', 'piece-8', 'piece-15']))
  })
})
