import { describe, expect, it } from 'vitest'
import { proceduralTerrainAt } from '../data/proceduralTownPlan'
import { getLocation } from '../data/world'
import { getWorldFeature } from '../data/worldFeatures'
import {
  activeLocalGoKarts,
  advanceKartRace,
  createGoKarts,
  createKartRaceLobby,
  footprintIntersectsGoKartTrack,
  goKartCheckpoints,
  goKartTrack,
  goKartTrackCollisionBoxes,
  goKartTrackTravelPosition,
  pointInGoKartTrackClearance,
  startKartRaceCountdown,
  syncKartRaceStart,
} from './goKart'
import { footballPitch, footprintIntersectsFootballPitch } from './football'

describe('go-kart track placement and collision', () => {
  it('registers a remote map destination that does not overlap the football pitch', () => {
    const location = getLocation('kart')
    const feature = getWorldFeature('go-kart-track')

    expect(location.label).toBe('Go Kart Track')
    expect(location.position).toEqual(goKartTrack.center)
    expect(location.travelPosition).toEqual(goKartTrackTravelPosition)
    expect(feature?.center).toEqual(goKartTrack.center)
    expect(feature?.ownerChunk).toEqual({ cx: 6, cz: -3 })
    expect(feature?.blocksProceduralObjects).toBe(true)
    expect(
      footprintIntersectsFootballPitch(
        goKartTrack.center,
        [goKartTrack.width, 1, goKartTrack.depth],
        0.25,
      ),
    ).toBe(false)
    expect(
      footprintIntersectsGoKartTrack(
        footballPitch.center,
        [footballPitch.width, 1, footballPitch.length],
        0.25,
      ),
    ).toBe(false)
  })

  it('relocates the larger track onto clear generated ground with an outside paddock arrival', () => {
    const samples = [
      goKartTrack.center,
      [
        goKartTrack.center[0] - goKartTrack.width / 2 + 1,
        0,
        goKartTrack.center[2],
      ],
      [
        goKartTrack.center[0] + goKartTrack.width / 2 - 1,
        0,
        goKartTrack.center[2],
      ],
      [
        goKartTrack.center[0],
        0,
        goKartTrack.center[2] - goKartTrack.depth / 2 + 1,
      ],
      [
        goKartTrack.center[0],
        0,
        goKartTrack.center[2] + goKartTrack.depth / 2 - 1,
      ],
    ] as const

    expect(
      samples.every(([x, , z]) => proceduralTerrainAt(x, z) === 'ground'),
    ).toBe(true)
    expect(goKartTrackTravelPosition[1]).toBe(0)
    expect(pointInGoKartTrackClearance(goKartTrackTravelPosition)).toBe(true)
    expect(goKartTrack.center).toEqual([216, 0, -99])
    expect(goKartTrack.width).toBeGreaterThanOrEqual(70)
    expect(goKartTrack.depth).toBeGreaterThanOrEqual(48)
    expect(goKartTrackTravelPosition[2]).toBeGreaterThan(
      goKartTrack.center[2] + goKartTrack.depth / 2,
    )
  })

  it('defines solid perimeter barriers while leaving the lane itself open', () => {
    const boxes = goKartTrackCollisionBoxes()

    expect(boxes).toHaveLength(5)
    expect(boxes.map((box) => box.id)).toEqual([
      'go-kart-track:north-barrier',
      'go-kart-track:south-barrier',
      'go-kart-track:west-barrier',
      'go-kart-track:east-barrier',
      'go-kart-track:center-island',
    ])
    boxes.forEach((box) => {
      expect(box.center[1] + box.half[1]).toBeGreaterThan(0.4)
      expect(pointInGoKartTrackClearance(box.center, 0)).toBe(true)
    })
    expect(
      boxes
        .slice(0, 4)
        .some(
          (box) =>
            Math.abs(box.center[0] - goKartTrack.center[0]) <
              box.half[0] + 0.1 &&
            Math.abs(box.center[2] - goKartTrack.center[2]) < box.half[2] + 0.1,
        ),
    ).toBe(false)
    expect(boxes.at(-1)?.center).toEqual([
      goKartTrack.center[0],
      goKartTrack.barrierHeight / 2,
      goKartTrack.center[2],
    ])
  })
})

describe('go-kart race rules', () => {
  it('creates four distinct player-ready karts on the starting grid', () => {
    const karts = createGoKarts()

    expect(karts).toHaveLength(4)
    expect(new Set(karts.map((kart) => kart.id)).size).toBe(4)
    expect(new Set(karts.map((kart) => kart.position.join(':'))).size).toBe(4)
    expect(karts.every((kart) => kart.kind === 'kart')).toBe(true)
    expect(goKartTrack.laneWidth).toBeGreaterThanOrEqual(10)
    const pairDistances = karts.flatMap((kart, index) =>
      karts
        .slice(index + 1)
        .map((other) =>
          Math.hypot(
            kart.position[0] - other.position[0],
            kart.position[2] - other.position[2],
          ),
        ),
    )
    expect(Math.min(...pairDistances)).toBeGreaterThan(3)
  })

  it('returns no empty track karts and only the local player kart after joining', () => {
    const karts = createGoKarts()

    expect(activeLocalGoKarts(karts, undefined)).toEqual([])
    expect(activeLocalGoKarts(karts, 'sunny-car')).toEqual([])
    expect(
      activeLocalGoKarts(karts, 'go-kart:green').map((kart) => kart.id),
    ).toEqual(['go-kart:green'])
  })

  it('requires every ordered checkpoint before counting each of three laps', () => {
    let race = startKartRaceCountdown(
      createKartRaceLobby('go-kart:red'),
      1_000,
      'race-one',
    )
    race = advanceKartRace(race, goKartTrack.center, 4_200)
    expect(race.status).toBe('racing')

    const skippedFinish = advanceKartRace(
      race,
      goKartCheckpoints.at(-1)!.center,
      4_300,
    )
    expect(skippedFinish.nextCheckpoint).toBe(0)
    expect(skippedFinish.lap).toBe(1)

    for (let lap = 1; lap <= 3; lap += 1) {
      for (const checkpoint of goKartCheckpoints)
        race = advanceKartRace(race, checkpoint.center, 4_300 + lap * 1_000)
    }

    expect(race.status).toBe('finished')
    expect(race.lap).toBe(3)
    expect(race.finishedAt).toBe(7_300)
    expect(race.bestLapMs).toBeGreaterThanOrEqual(0)
  })

  it('lets a guest adopt the host countdown while keeping their own kart', () => {
    const guest = createKartRaceLobby('go-kart:blue')
    const synced = syncKartRaceStart(
      guest,
      {
        raceId: 'host-race',
        vehicleId: 'go-kart:red',
        status: 'countdown',
        lap: 1,
        totalLaps: 3,
        nextCheckpoint: 0,
        countdownEndsAt: 10_000,
        startedAt: 10_000,
      },
      8_000,
    )

    expect(synced).toMatchObject({
      raceId: 'host-race',
      vehicleId: 'go-kart:blue',
      status: 'countdown',
      countdownEndsAt: 10_000,
    })
  })
})
