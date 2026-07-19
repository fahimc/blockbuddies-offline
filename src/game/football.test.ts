import { describe, expect, it } from 'vitest'
import { coreTerrainZones } from './townPlacement'
import { terrainAt } from './worldGrid'
import {
  advanceFootballBall,
  createFootballBalls,
  footballGoalForBall,
  footballKickVelocity,
  footballPitch,
  nearestFootballBall,
  pointInFootballPitchClearance,
} from './football'

describe('football pitch and ball logic', () => {
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
      samples.every(([x, , z]) => terrainAt(x, z, coreTerrainZones) !== 'road'),
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
