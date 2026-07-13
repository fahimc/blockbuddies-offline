import { realScale } from './scale'
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
}

export type TrafficPose = {
  position: Vec3
  yaw: number
}

const trafficRoadCenters = [18, -54, 90]
const trafficExtent = 94
const laneOffset = realScale.roadTile * 0.22
const trafficColors = ['#ef4444', '#f97316', '#2563eb', '#22c55e', '#eab308', '#8b5cf6', '#06b6d4', '#f43f5e']

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
  }
}

export function trafficPositionAt(lane: TrafficLane, offset: number): TrafficPose {
  const distance = wrapDistance(offset, lane.length)
  return {
    position: [
      lane.start[0] + lane.direction[0] * distance,
      0.03,
      lane.start[2] + lane.direction[2] * distance,
    ],
    yaw: Math.atan2(lane.direction[0], lane.direction[2]),
  }
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
