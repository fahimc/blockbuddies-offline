import { describe, expect, it } from 'vitest'
import { advanceTraffic, createTrafficVehicles, makeTrafficLanes, trafficPositionAt } from './traffic'

describe('traffic paths', () => {
  it('creates bidirectional lanes on borough road centers', () => {
    const lanes = makeTrafficLanes()

    expect(lanes.length).toBeGreaterThanOrEqual(8)
    expect(lanes.every((lane) => lane.length > 100)).toBe(true)
    expect(lanes.some((lane) => lane.id.includes('north'))).toBe(true)
    expect(lanes.some((lane) => lane.id.includes('east'))).toBe(true)
  })

  it('calculates vehicle pose along a lane with correct yaw', () => {
    const eastbound = makeTrafficLanes().find((lane) => lane.id.includes('east'))
    expect(eastbound).toBeDefined()

    const pose = trafficPositionAt(eastbound!, eastbound!.length / 2)

    expect(pose.position[0]).toBeCloseTo(0, 1)
    expect(pose.yaw).toBeCloseTo(Math.PI / 2, 3)
  })

  it('advances and wraps vehicle offsets around the lane', () => {
    const lane = makeTrafficLanes()[0]
    const vehicle = createTrafficVehicles([lane], 1)[0]
    const advanced = advanceTraffic({ ...vehicle, offset: lane.length - 1, speed: 4 }, lane, 1)

    expect(advanced.offset).toBeGreaterThanOrEqual(0)
    expect(advanced.offset).toBeLessThan(4)
  })
})
