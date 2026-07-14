import { realScale } from './scale'
import type { CollisionBox } from './collision'
import type { Vec3 } from './types'

export type TrafficLane = {
  id: string
  start: Vec3
  end: Vec3
  direction: Vec3
  length: number
}

export type TrafficVehicle = {
  id: string
  laneId: string
  offset: number
  speed: number
  color: string
  stopped?: boolean
}

export type TrafficPose = {
  position: Vec3
  yaw: number
}

const trafficRoadCenters = [18, -54, 90]
const trafficExtent = 94
const laneOffset = realScale.roadTile * 0.22
const trafficColors = ['#ef4444', '#f97316', '#2563eb', '#22c55e', '#eab308', '#8b5cf6', '#06b6d4', '#f43f5e']
export const trafficPedestrianLookAhead = realScale.carLength + 1.5
export const trafficPedestrianHalfWidth = realScale.carWidth / 2 + 0.72

export function makeTrafficLanes(): TrafficLane[] {
  const lanes: TrafficLane[] = []
  for (const center of trafficRoadCenters) {
    lanes.push(
      lane(`road-z-${center}:north`, [center + laneOffset, 0, -trafficExtent], [center + laneOffset, 0, trafficExtent]),
      lane(`road-z-${center}:south`, [center - laneOffset, 0, trafficExtent], [center - laneOffset, 0, -trafficExtent]),
      lane(`road-x-${center}:east`, [-trafficExtent, 0, center - laneOffset], [trafficExtent, 0, center - laneOffset]),
      lane(`road-x-${center}:west`, [trafficExtent, 0, center + laneOffset], [-trafficExtent, 0, center + laneOffset]),
    )
  }
  return lanes
}

export function createTrafficVehicles(lanes: TrafficLane[], count = 10): TrafficVehicle[] {
  return lanes.slice(0, count).map((lane, index) => ({
    id: `traffic-${index}`,
    laneId: lane.id,
    offset: wrapDistance(lane.length * ((index * 0.37) % 1), lane.length),
    speed: 4.2 + (index % 4) * 0.72,
    color: trafficColors[index % trafficColors.length],
  }))
}

export function advanceTraffic(vehicle: TrafficVehicle, lane: TrafficLane, deltaSeconds: number): TrafficVehicle {
  return {
    ...vehicle,
    offset: wrapDistance(vehicle.offset + vehicle.speed * Math.max(0, deltaSeconds), lane.length),
    stopped: false,
  }
}

export function advanceTrafficForPedestrians(
  vehicle: TrafficVehicle,
  lane: TrafficLane,
  deltaSeconds: number,
  pedestrianPositions: Vec3[],
): TrafficVehicle {
  if (hasPedestrianAhead(vehicle, lane, pedestrianPositions)) {
    return { ...vehicle, stopped: true }
  }
  return advanceTraffic(vehicle, lane, deltaSeconds)
}

export function hasPedestrianAhead(vehicle: TrafficVehicle, lane: TrafficLane, pedestrianPositions: Vec3[]) {
  const pose = trafficPositionAt(lane, vehicle.offset)
  const sideX = -lane.direction[2]
  const sideZ = lane.direction[0]

  return pedestrianPositions.some((pedestrian) => {
    const relativeX = pedestrian[0] - pose.position[0]
    const relativeZ = pedestrian[2] - pose.position[2]
    const ahead = relativeX * lane.direction[0] + relativeZ * lane.direction[2]
    const lateral = Math.abs(relativeX * sideX + relativeZ * sideZ)
    return ahead >= -0.1 && ahead <= trafficPedestrianLookAhead && lateral <= trafficPedestrianHalfWidth
  })
}

export function trafficPositionAt(lane: TrafficLane, offset: number): TrafficPose {
  const distance = wrapDistance(offset, lane.length)
  return {
    position: [
      lane.start[0] + lane.direction[0] * distance,
      0.03,
      lane.start[2] + lane.direction[2] * distance,
    ],
    // The low-poly car mesh is modelled lengthwise on local X, not local Z.
    yaw: Math.atan2(-lane.direction[2], lane.direction[0]),
  }
}

export function trafficPositionAtTime(lane: TrafficLane, vehicle: TrafficVehicle, timeSeconds: number): TrafficPose {
  return trafficPositionAt(lane, vehicle.offset + vehicle.speed * Math.max(0, timeSeconds))
}

export function trafficCollisionBoxesAtTime(lanes: TrafficLane[], vehicles: TrafficVehicle[], timeSeconds: number): CollisionBox[] {
  return trafficCollisionBoxes(
    lanes,
    vehicles.map((vehicle) => ({
      ...vehicle,
      offset: vehicle.offset + vehicle.speed * Math.max(0, timeSeconds),
    })),
  )
}

export function trafficCollisionBoxes(lanes: TrafficLane[], vehicles: TrafficVehicle[]): CollisionBox[] {
  const laneById = new Map(lanes.map((laneItem) => [laneItem.id, laneItem]))
  return vehicles.flatMap((vehicle) => {
    const vehicleLane = laneById.get(vehicle.laneId)
    if (!vehicleLane) return []
    const pose = trafficPositionAt(vehicleLane, vehicle.offset)
    const horizontal = Math.abs(vehicleLane.direction[0]) >= Math.abs(vehicleLane.direction[2])
    return [
      {
        id: `traffic:${vehicle.id}`,
        center: [pose.position[0], realScale.wheelRadius + realScale.carHeight / 2, pose.position[2]],
        half: horizontal
          ? [realScale.carLength / 2 + 0.12, realScale.carHeight / 2, realScale.carWidth / 2 + 0.12]
          : [realScale.carWidth / 2 + 0.12, realScale.carHeight / 2, realScale.carLength / 2 + 0.12],
      } satisfies CollisionBox,
    ]
  })
}

function lane(id: string, start: Vec3, end: Vec3): TrafficLane {
  const x = end[0] - start[0]
  const z = end[2] - start[2]
  const length = Math.hypot(x, z)
  return {
    id,
    start,
    end,
    direction: length > 0 ? [x / length, 0, z / length] : [0, 0, 1],
    length,
  }
}

function wrapDistance(offset: number, length: number) {
  if (length <= 0) return 0
  return ((offset % length) + length) % length
}
