import { describe, expect, it } from 'vitest'
import { generateProceduralWorld } from '../data/proceduralWorld'
import { proceduralTerrainAt } from '../data/proceduralTownPlan'
import { getWorldFeature } from '../data/worldFeatures'
import { parkingLot } from './vehicles'
import { authoredCoreBounds, coreTerrainZones } from './townPlacement'
import { terrainAt } from './worldGrid'
import {
  advanceFootballBall,
  createFootballBalls,
  footballBallPatchFaces,
  footballGoals,
  footballGoalForBall,
  footballGoalPostCollisionBoxes,
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

  it('adds solid collision boxes to each goal post and crossbar', () => {
    const boxes = footballGoalPostCollisionBoxes()

    expect(boxes).toHaveLength(footballGoals.length * 3)
    footballGoals.forEach((goal) => {
      const goalBoxes = boxes.filter((box) => box.id.includes(goal.id))
      const leftPost = goalBoxes.find((box) => box.id.endsWith('left-post'))
      const rightPost = goalBoxes.find((box) => box.id.endsWith('right-post'))
      const crossbar = goalBoxes.find((box) => box.id.endsWith('crossbar'))

      expect(leftPost).toBeDefined()
      expect(rightPost).toBeDefined()
      expect(crossbar).toBeDefined()
      expect(leftPost?.center[1]).toBeGreaterThan(0.5)
      expect(rightPost?.center[1]).toBeGreaterThan(0.5)
      expect(crossbar?.center[1]).toBeGreaterThan(leftPost?.center[1] ?? 0)
      expect(crossbar?.half[0]).toBeGreaterThan(footballPitch.goalWidth / 2)
    })
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

  it('places the pitch on its deterministic feature grid outside the authored core', () => {
    const pitchFootprint = {
      position: footballPitch.center,
      scale: [footballPitch.width, 1, footballPitch.length],
    } as { position: [number, number, number]; scale: [number, number, number] }
    const parkingFootprint = {
      position: parkingLot.center,
      scale: [parkingLot.width, 1, parkingLot.depth],
    } as { position: [number, number, number]; scale: [number, number, number] }

    const feature = getWorldFeature('football-stadium')
    expect(feature?.center).toEqual(footballPitch.center)
    expect(feature?.ownerChunk).toEqual({ cx: 2, cz: -2 })
    expect(footballPitch.center[0] - footballPitch.width / 2).toBeGreaterThan(
      authoredCoreBounds.maxX,
    )
    expect(overlapsTopDown(pitchFootprint, parkingFootprint, 0.2)).toBe(false)
  })

  it('keeps procedural scenery out of the football field reservation', () => {
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

    expect(intrudingPieces).toEqual([])
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

function overlapsTopDown(
  a: {
    position: [number, number, number]
    scale: [number, number, number]
  },
  b: {
    position: [number, number, number]
    scale: [number, number, number]
  },
  padding = 0,
) {
  const xOverlap =
    Math.abs(a.position[0] - b.position[0]) <
    (a.scale[0] + b.scale[0]) / 2 + padding
  const zOverlap =
    Math.abs(a.position[2] - b.position[2]) <
    (a.scale[2] + b.scale[2]) / 2 + padding
  return xOverlap && zOverlap
}
