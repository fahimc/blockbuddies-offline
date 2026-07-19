import { describe, expect, it } from 'vitest'
import { generateProceduralWorld } from '../data/proceduralWorld'
import { proceduralTerrainAt } from '../data/proceduralTownPlan'
import { coreTerrainZones } from './townPlacement'
import { terrainAt } from './worldGrid'
import {
  advanceFootballBall,
  createFootballBalls,
  footballBallPatchFaces,
  footballGoals,
  footballGoalForBall,
  footballKickVelocity,
  footballPitch,
  footprintIntersectsFootballPitch,
  nearestFootballBall,
  pointInFootballPitchClearance,
} from './football'

describe('football pitch and ball logic', () => {
  it('uses a long rectangular pitch with goals at the far ends of the long axis', () => {
    expect(footballPitch.length).toBeGreaterThan(footballPitch.width)
    expect(footballGoals).toHaveLength(2)
    expect(
      footballGoals.every(
        (goal) => Math.abs(goal.center[0] - footballPitch.center[0]) < 0.001,
      ),
    ).toBe(true)
    expect(
      footballGoals.map((goal) =>
        Math.abs(goal.center[2] - footballPitch.center[2]),
      ),
    ).toEqual([footballPitch.length / 2, footballPitch.length / 2])
  })

  it('places the authored pitch on clear non-road terrain', () => {
    const samples = [
      footballPitch.center,
      [
        footballPitch.center[0] - footballPitch.width / 2 + 0.5,
        0,
        footballPitch.center[2],
      ],
      [
        footballPitch.center[0] + footballPitch.width / 2 - 0.5,
        0,
        footballPitch.center[2],
      ],
      [
        footballPitch.center[0],
        0,
        footballPitch.center[2] - footballPitch.length / 2 + 0.5,
      ],
      [
        footballPitch.center[0],
        0,
        footballPitch.center[2] + footballPitch.length / 2 - 0.5,
      ],
    ] as const

    expect(
      samples.every(
        ([x, , z]) =>
          terrainAt(x, z, coreTerrainZones) !== 'road' &&
          proceduralTerrainAt(x, z) === 'ground',
      ),
    ).toBe(true)
  })

  it('keeps procedural scenery and build parcels out of the football field reservation', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: footballPitch.center,
      viewDistance: 2,
      night: false,
    })

    const sportsFieldBlockerKinds = new Set([
      'building',
      'door',
      'roof',
      'window',
      'tree-trunk',
      'tree-top',
      'lamp-post',
      'lamp-light',
      'phone-box',
      'landmark',
    ])
    const intrudingPieces = world.pieces.filter(
      (piece) =>
        sportsFieldBlockerKinds.has(piece.kind) &&
        footprintIntersectsFootballPitch(piece.position, piece.scale),
    )
    const intrudingParcels = world.buildableParcels.filter((parcel) =>
      footprintIntersectsFootballPitch(parcel.center, parcel.size),
    )

    expect(intrudingPieces).toEqual([])
    expect(intrudingParcels).toEqual([])
  })

  it('describes round ball patches instead of square cube blocks', () => {
    expect(footballBallPatchFaces).toHaveLength(5)
    expect(
      footballBallPatchFaces.every(
        (patch) => patch.radius > 0 && patch.radius < footballPitch.width / 20,
      ),
    ).toBe(true)
  })

  it('finds only nearby footballs for HUD actions', () => {
    const balls = createFootballBalls()

    expect(
      nearestFootballBall(
        [footballPitch.center[0] + 0.8, 0, footballPitch.center[2]],
        balls,
      )?.id,
    ).toBe('football-main')
    expect(
      nearestFootballBall(
        [footballPitch.center[0] + 9, 0, footballPitch.center[2]],
        balls,
      ),
    ).toBeUndefined()
  })

  it('scales kick velocity with held power in the avatar facing direction', () => {
    const soft = footballKickVelocity(Math.PI, 0)
    const hard = footballKickVelocity(Math.PI, 1)

    expect(Math.hypot(hard[0], hard[2])).toBeGreaterThan(
      Math.hypot(soft[0], soft[2]) * 2,
    )
    expect(hard[2]).toBeLessThan(0)
  })

  it('moves, slows, and keeps balls inside the pitch bounds unless they enter a goal', () => {
    const ball = {
      ...createFootballBalls()[0],
      position: [
        footballPitch.center[0] + footballPitch.width / 2 - 0.1,
        0.36,
        footballPitch.center[2],
      ] as [number, number, number],
      velocity: [12, 0, 0] as [number, number, number],
    }

    const moved = advanceFootballBall(ball, 0.25, 1000)

    expect(moved.position[0]).toBeLessThanOrEqual(
      footballPitch.center[0] + footballPitch.width / 2,
    )
    expect(moved.velocity[0]).toBeLessThan(0)
  })

  it('detects goals only through the goal mouth', () => {
    expect(
      footballGoalForBall({
        ...createFootballBalls()[0],
        position: [
          footballPitch.center[0],
          0.36,
          footballPitch.center[2] - footballPitch.length / 2 - 0.25,
        ],
      })?.id,
    ).toBe('north-goal')
    expect(
      footballGoalForBall({
        ...createFootballBalls()[0],
        position: [
          footballPitch.center[0] + footballPitch.goalWidth,
          0.36,
          footballPitch.center[2] - footballPitch.length / 2 - 0.25,
        ],
      }),
    ).toBeUndefined()
  })

  it('defines a clearance envelope for filtering trees and props around the pitch', () => {
    expect(
      pointInFootballPitchClearance([
        footballPitch.center[0] + 1,
        0,
        footballPitch.center[2] + 1,
      ]),
    ).toBe(true)
    expect(
      pointInFootballPitchClearance([
        footballPitch.center[0] + 20,
        0,
        footballPitch.center[2],
      ]),
    ).toBe(false)
  })
})
