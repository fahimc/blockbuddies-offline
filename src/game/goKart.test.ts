import { describe, expect, it } from 'vitest'
import { proceduralTerrainAt } from '../data/proceduralTownPlan'
import { getLocation } from '../data/world'
import { getWorldFeature } from '../data/worldFeatures'
import {
  footprintIntersectsGoKartTrack,
  goKartTrack,
  goKartTrackCollisionBoxes,
  goKartTrackTravelPosition,
  pointInGoKartTrackClearance,
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

  it('keeps the track on clear generated ground with a nearby grounded arrival pad', () => {
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
    expect(
      Math.hypot(
        goKartTrackTravelPosition[0] - goKartTrack.center[0],
        goKartTrackTravelPosition[2] - goKartTrack.center[2],
      ),
    ).toBeGreaterThan(goKartTrack.depth / 2)
  })

  it('defines solid perimeter barriers while leaving the lane itself open', () => {
    const boxes = goKartTrackCollisionBoxes()

    expect(boxes).toHaveLength(4)
    expect(boxes.map((box) => box.id)).toEqual([
      'go-kart-track:north-barrier',
      'go-kart-track:south-barrier',
      'go-kart-track:west-barrier',
      'go-kart-track:east-barrier',
    ])
    boxes.forEach((box) => {
      expect(box.center[1] + box.half[1]).toBeGreaterThan(0.4)
      expect(pointInGoKartTrackClearance(box.center, 0)).toBe(true)
    })
    expect(
      boxes.some(
        (box) =>
          Math.abs(box.center[0] - goKartTrack.center[0]) < box.half[0] + 0.1 &&
          Math.abs(box.center[2] - goKartTrack.center[2]) < box.half[2] + 0.1,
      ),
    ).toBe(false)
  })
})
