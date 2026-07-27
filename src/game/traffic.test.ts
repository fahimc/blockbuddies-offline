import { describe, expect, it } from 'vitest'
import { proceduralTerrainAt } from '../data/proceduralTownPlan'
import { realScale } from './scale'
import {
  advanceTraffic,
  advanceTrafficForObstacles,
  advanceTrafficForPedestrians,
  createTrafficVehicles,
  makeTrafficLanes,
  trafficCollisionBoxesAtTime,
  trafficDoubleDeckerHeight,
  trafficHeadingYaw,
  trafficPedestrianHalfWidth,
  trafficPositionAt,
  trafficVehicleDimensions,
} from './traffic'

describe('traffic paths', () => {
  it('creates bidirectional lanes on borough road centers', () => {
    const lanes = makeTrafficLanes()

    expect(lanes.length).toBeGreaterThanOrEqual(8)
    expect(lanes.every((lane) => lane.length > 100)).toBe(true)
    expect(lanes.some((lane) => lane.id.includes('north'))).toBe(true)
    expect(lanes.some((lane) => lane.id.includes('east'))).toBe(true)
  })

  it('runs one tall red and one tall blue double-decker past the Buddy Bus Stop', () => {
    const lanes = makeTrafficLanes()
    const vehicles = createTrafficVehicles(lanes, 6)
    const buses = vehicles.filter(
      (vehicle) => vehicle.kind === 'double-decker-bus',
    )

    expect(buses).toHaveLength(2)
    expect(buses.map((bus) => bus.color).sort()).toEqual(
      ['#2563eb', '#dc2626'].sort(),
    )
    expect(buses.every((bus) => bus.laneId.startsWith('road-z-54:'))).toBe(true)
    expect(trafficDoubleDeckerHeight).toBeGreaterThan(
      realScale.avatarHeight * 2,
    )
    expect(
      Math.min(
        ...buses.map((bus) => {
          const lane = lanes.find((candidate) => candidate.id === bus.laneId)!
          const pose = trafficPositionAt(lane, bus.offset)
          return Math.hypot(pose.position[0] - 45.2, pose.position[2] + 18)
        }),
      ),
    ).toBeLessThan(20)
  })

  it('calculates vehicle pose along lanes with mesh-aligned yaw', () => {
    const northbound = makeTrafficLanes().find((lane) =>
      lane.id.includes('north'),
    )
    const eastbound = makeTrafficLanes().find((lane) =>
      lane.id.includes('east'),
    )
    expect(northbound).toBeDefined()
    expect(eastbound).toBeDefined()

    const eastPose = trafficPositionAt(eastbound!, eastbound!.length / 2)
    const northPose = trafficPositionAt(northbound!, northbound!.length / 2)

    expect(eastPose.position[0]).toBeCloseTo(0, 1)
    expect(eastPose.yaw).toBeCloseTo(0, 3)
    expect(northPose.yaw).toBeCloseTo(-Math.PI / 2, 3)
  })

  it('keeps every traffic lane on the shared road terrain layer', () => {
    const lanes = makeTrafficLanes()

    expect(
      lanes.every((lane) =>
        [0, 0.25, 0.5, 0.75, 1].every((ratio) => {
          const x = lane.start[0] + (lane.end[0] - lane.start[0]) * ratio
          const z = lane.start[2] + (lane.end[2] - lane.start[2]) * ratio
          return proceduralTerrainAt(x, z) === 'road'
        }),
      ),
    ).toBe(true)
  })

  it('converts traffic lane direction to drivable heading yaw for takeovers', () => {
    const northbound = makeTrafficLanes().find((lane) =>
      lane.id.includes('north'),
    )!
    const eastbound = makeTrafficLanes().find((lane) =>
      lane.id.includes('east'),
    )!
    const westbound = makeTrafficLanes().find((lane) =>
      lane.id.includes('west'),
    )!

    expect(trafficHeadingYaw(northbound)).toBeCloseTo(0, 3)
    expect(trafficHeadingYaw(eastbound)).toBeCloseTo(Math.PI / 2, 3)
    expect(trafficHeadingYaw(westbound)).toBeCloseTo(-Math.PI / 2, 3)
  })

  it('advances and wraps vehicle offsets around the lane', () => {
    const lane = makeTrafficLanes()[0]
    const vehicle = createTrafficVehicles([lane], 1)[0]
    const advanced = advanceTraffic(
      { ...vehicle, offset: lane.length - 1, speed: 4 },
      lane,
      1,
    )

    expect(advanced.offset).toBeGreaterThanOrEqual(0)
    expect(advanced.offset).toBeLessThan(4)
  })

  it('creates collision boxes that match the car orientation on each lane', () => {
    const lanes = makeTrafficLanes()
    const northbound = lanes.find((lane) => lane.id.includes('north'))!
    const eastbound = lanes.find((lane) => lane.id.includes('east'))!
    const vehicles = [
      {
        id: 'north',
        laneId: northbound.id,
        offset: 0,
        speed: 0,
        color: '#fff',
      },
      { id: 'east', laneId: eastbound.id, offset: 0, speed: 0, color: '#fff' },
    ]

    const boxes = trafficCollisionBoxesAtTime(lanes, vehicles, 0)
    const northBox = boxes.find((box) => box.id === 'traffic:north')!
    const eastBox = boxes.find((box) => box.id === 'traffic:east')!

    expect(northBox.half[2]).toBeCloseTo(realScale.carLength / 2 + 0.12, 3)
    expect(northBox.half[0]).toBeCloseTo(realScale.carWidth / 2 + 0.12, 3)
    expect(eastBox.half[0]).toBeCloseTo(realScale.carLength / 2 + 0.12, 3)
    expect(eastBox.half[2]).toBeCloseTo(realScale.carWidth / 2 + 0.12, 3)
    expect(northBox.center[1] + northBox.half[1]).toBeCloseTo(
      0.03 +
        realScale.wheelRadius +
        realScale.carBodyHeight +
        realScale.carCabinHeight,
      3,
    )
  })

  it('gives double-decker buses larger collision and safety dimensions than cars', () => {
    const car = {
      id: 'car',
      laneId: 'lane',
      offset: 0,
      speed: 0,
      color: '#fff',
      kind: 'car' as const,
    }
    const bus = {
      ...car,
      id: 'bus',
      kind: 'double-decker-bus' as const,
    }
    const carDimensions = trafficVehicleDimensions(car)
    const busDimensions = trafficVehicleDimensions(bus)

    expect(busDimensions.length).toBeGreaterThan(carDimensions.length)
    expect(busDimensions.width).toBeGreaterThan(carDimensions.width)
    expect(busDimensions.height).toBeGreaterThan(carDimensions.height * 2)
    expect(busDimensions.width).toBeLessThan(realScale.roadTile / 2)
  })

  it('stops for a pedestrian ahead in the lane and resumes when clear', () => {
    const lane = makeTrafficLanes().find((item) => item.id.includes('east'))!
    const vehicle = {
      ...createTrafficVehicles([lane], 1)[0],
      offset: lane.length / 2,
      speed: 5,
    }
    const pose = trafficPositionAt(lane, vehicle.offset)
    const pedestrianAhead: [number, number, number] = [
      pose.position[0] + 4,
      0,
      pose.position[2],
    ]

    const stopped = advanceTrafficForPedestrians(vehicle, lane, 1, [
      pedestrianAhead,
    ])
    const resumed = advanceTrafficForPedestrians(stopped, lane, 1, [])

    expect(stopped.offset).toBe(vehicle.offset)
    expect(stopped.stopped).toBe(true)
    expect(resumed.offset).toBeGreaterThan(vehicle.offset)
    expect(resumed.stopped).toBe(false)
  })

  it('does not stop for pedestrians behind the car or clear of its lane', () => {
    const lane = makeTrafficLanes().find((item) => item.id.includes('east'))!
    const vehicle = {
      ...createTrafficVehicles([lane], 1)[0],
      offset: lane.length / 2,
      speed: 5,
    }
    const pose = trafficPositionAt(lane, vehicle.offset)
    const behind: [number, number, number] = [
      pose.position[0] - 3,
      0,
      pose.position[2],
    ]
    const onPavement: [number, number, number] = [
      pose.position[0] + 3,
      0,
      pose.position[2] + trafficPedestrianHalfWidth + 0.2,
    ]

    expect(
      advanceTrafficForPedestrians(vehicle, lane, 1, [behind]).offset,
    ).toBeGreaterThan(vehicle.offset)
    expect(
      advanceTrafficForPedestrians(vehicle, lane, 1, [onPavement]).offset,
    ).toBeGreaterThan(vehicle.offset)
  })

  it('stops behind another traffic car in the same lane', () => {
    const lane = makeTrafficLanes().find((item) => item.id.includes('east'))!
    const vehicle = {
      id: 'behind',
      laneId: lane.id,
      offset: 30,
      speed: 5,
      color: '#fff',
    }
    const ahead = {
      id: 'ahead',
      laneId: lane.id,
      offset: 33,
      speed: 3,
      color: '#000',
    }
    const clearLane = {
      id: 'other',
      laneId: `${lane.id}:other`,
      offset: 31,
      speed: 3,
      color: '#000',
    }

    expect(
      advanceTrafficForObstacles(vehicle, lane, 1, [], [vehicle, ahead])
        .stopped,
    ).toBe(true)
    expect(
      advanceTrafficForObstacles(vehicle, lane, 1, [], [vehicle, clearLane])
        .stopped,
    ).toBe(false)
  })
})
