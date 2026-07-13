import { describe, expect, it } from 'vitest'
import { realScale } from './scale'
import { advanceTraffic, createTrafficVehicles, makeTrafficLanes, trafficCollisionBoxesAtTime, trafficPositionAt } from './traffic'

describe('traffic paths', () => {
  it('creates bidirectional lanes on borough road centers', () => {
    const lanes = makeTrafficLanes()

    expect(lanes.length).toBeGreaterThanOrEqual(8)
    expect(lanes.every((lane) => lane.length > 100)).toBe(true)
    expect(lanes.some((lane) => lane.id.includes('north'))).toBe(true)
    expect(lanes.some((lane) => lane.id.includes('east'))).toBe(true)
  })

  it('calculates vehicle pose along lanes with mesh-aligned yaw', () => {
    const northbound = makeTrafficLanes().find((lane) => lane.id.includes('north'))
    const eastbound = makeTrafficLanes().find((lane) => lane.id.includes('east'))
    expect(northbound).toBeDefined()
    expect(eastbound).toBeDefined()

    const eastPose = trafficPositionAt(eastbound!, eastbound!.length / 2)
    const northPose = trafficPositionAt(northbound!, northbound!.length / 2)

    expect(eastPose.position[0]).toBeCloseTo(0, 1)
    expect(eastPose.yaw).toBeCloseTo(0, 3)
    expect(northPose.yaw).toBeCloseTo(-Math.PI / 2, 3)
  })

  it('advances and wraps vehicle offsets around the lane', () => {
    const lane = makeTrafficLanes()[0]
    const vehicle = createTrafficVehicles([lane], 1)[0]
    const advanced = advanceTraffic({ ...vehicle, offset: lane.length - 1, speed: 4 }, lane, 1)

    expect(advanced.offset).toBeGreaterThanOrEqual(0)
    expect(advanced.offset).toBeLessThan(4)
  })

  it('creates collision boxes that match the car orientation on each lane', () => {
    const lanes = makeTrafficLanes()
    const northbound = lanes.find((lane) => lane.id.includes('north'))!
    const eastbound = lanes.find((lane) => lane.id.includes('east'))!
    const vehicles = [
      { id: 'north', laneId: northbound.id, offset: 0, speed: 0, color: '#fff' },
      { id: 'east', laneId: eastbound.id, offset: 0, speed: 0, color: '#fff' },
    ]

    const boxes = trafficCollisionBoxesAtTime(lanes, vehicles, 0)
    const northBox = boxes.find((box) => box.id === 'traffic:north')!
    const eastBox = boxes.find((box) => box.id === 'traffic:east')!

    expect(northBox.half[2]).toBeCloseTo(realScale.carLength / 2 + 0.12, 3)
    expect(northBox.half[0]).toBeCloseTo(realScale.carWidth / 2 + 0.12, 3)
    expect(eastBox.half[0]).toBeCloseTo(realScale.carLength / 2 + 0.12, 3)
    expect(eastBox.half[2]).toBeCloseTo(realScale.carWidth / 2 + 0.12, 3)
  })
})
