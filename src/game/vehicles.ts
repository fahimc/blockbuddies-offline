import type { ProceduralPiece } from '../data/proceduralWorld'
import {
  playerCollisionRadius,
  pointHitsAnyBox,
  type CollisionBox,
} from './collision'
import { realScale } from './scale'
import type { Vec3 } from './types'

export type DrivableVehicle = {
  id: string
  label: string
  color: string
  position: Vec3
  yaw: number
  speed: number
}

export type DriveInput = {
  throttle: number
  steer: number
  brake: boolean
}

export const parkingLot = {
  center: [10, 0.035, -16] as Vec3,
  width: 9,
  depth: 11,
  drivewayCenter: [5.4, 0.03, -16] as Vec3,
  drivewayWidth: 0.4,
  drivewayDepth: 4.4,
  signPosition: [13.65, 0, -20.45] as Vec3,
}

export const parkedVehicleDefinitions: DrivableVehicle[] = [
  parkedVehicle('sunny-car', 'Sunny Car', '#f97316', -16.1),
  parkedVehicle('sky-car', 'Sky Car', '#38bdf8', -19.5),
  parkedVehicle('mint-car', 'Mint Car', '#22c55e', -12.7),
]

export const vehicleInteractionRadius = 1.35
export const vehicleDriveSpeed = 11
export const vehicleReverseSpeed = 5.5
export const vehicleAcceleration = 9
export const vehicleBrakeStrength = 18
export const vehicleSteeringRate = 1.55

export function createParkedVehicles() {
  return parkedVehicleDefinitions.map((vehicle) => ({
    ...vehicle,
    position: [...vehicle.position] as Vec3,
  }))
}

export function getDrivableVehicle(id: string) {
  return parkedVehicleDefinitions.find((vehicle) => vehicle.id === id)
}

export function nearestDrivableVehicle(position: Vec3, vehicles: DrivableVehicle[], maxDistance = vehicleInteractionRadius) {
  let nearest: DrivableVehicle | undefined
  let nearestDistance = Infinity
  for (const vehicle of vehicles) {
    const distance = distanceToVehicle(position, vehicle)
    if (distance <= maxDistance && distance < nearestDistance) {
      nearest = vehicle
      nearestDistance = distance
    }
  }
  return nearest
}

export function distanceToVehicle(position: Vec3, vehicle: DrivableVehicle) {
  const dx = position[0] - vehicle.position[0]
  const dz = position[2] - vehicle.position[2]
  const cosine = Math.cos(vehicle.yaw)
  const sine = Math.sin(vehicle.yaw)
  const lateral = dx * cosine - dz * sine
  const longitudinal = dx * sine + dz * cosine
  const outsideX = Math.max(0, Math.abs(lateral) - realScale.carWidth / 2)
  const outsideZ = Math.max(0, Math.abs(longitudinal) - realScale.carLength / 2)
  return Math.hypot(outsideX, outsideZ)
}

export function advanceDrivableVehicle(vehicle: DrivableVehicle, input: DriveInput, deltaSeconds: number) {
  const delta = Math.max(0, Math.min(deltaSeconds, 0.1))
  const throttle = clamp(input.throttle, -1, 1)
  const targetSpeed = throttle >= 0 ? throttle * vehicleDriveSpeed : throttle * vehicleReverseSpeed
  const acceleration = input.brake ? vehicleBrakeStrength : vehicleAcceleration
  let speed = moveTowards(vehicle.speed, input.brake ? 0 : targetSpeed, acceleration * delta)
  if (Math.abs(throttle) < 0.04 && !input.brake) speed = moveTowards(speed, 0, vehicleAcceleration * 0.55 * delta)

  const steeringScale = Math.min(1, Math.abs(speed) / 2.2)
  const direction = speed < 0 ? -1 : 1
  const yaw = vehicle.yaw + clamp(input.steer, -1, 1) * vehicleSteeringRate * steeringScale * direction * delta
  const position: Vec3 = [
    vehicle.position[0] + Math.sin(yaw) * speed * delta,
    vehicle.position[1],
    vehicle.position[2] + Math.cos(yaw) * speed * delta,
  ]
  return { ...vehicle, position, yaw, speed }
}

export function advanceDrivableVehicleWithCollisions(
  vehicle: DrivableVehicle,
  input: DriveInput,
  deltaSeconds: number,
  obstacles: CollisionBox[],
) {
  const candidate = clampVehicleToTown(advanceDrivableVehicle(vehicle, input, deltaSeconds))
  if (!vehicleOverlapsAnyBox(candidate, obstacles)) return candidate

  const turnOnly = { ...candidate, position: vehicle.position, speed: 0 }
  return vehicleOverlapsAnyBox(turnOnly, obstacles)
    ? { ...vehicle, speed: 0 }
    : turnOnly
}

export function drivableVehicleCollisionBox(vehicle: DrivableVehicle): CollisionBox {
  const cosine = Math.abs(Math.cos(vehicle.yaw))
  const sine = Math.abs(Math.sin(vehicle.yaw))
  const halfX = cosine * (realScale.carWidth / 2) + sine * (realScale.carLength / 2)
  const halfZ = sine * (realScale.carWidth / 2) + cosine * (realScale.carLength / 2)
  const height = realScale.wheelRadius + realScale.carBodyHeight + realScale.carCabinHeight
  return {
    id: `drivable:${vehicle.id}`,
    center: [vehicle.position[0], vehicle.position[1] + height / 2, vehicle.position[2]],
    half: [halfX + 0.08, height / 2, halfZ + 0.08],
  }
}

export function drivableVehicleCollisionBoxes(vehicles: DrivableVehicle[], excludeId?: string) {
  return vehicles
    .filter((vehicle) => vehicle.id !== excludeId)
    .map(drivableVehicleCollisionBox)
}

export function vehicleRenderYaw(headingYaw: number) {
  return headingYaw - Math.PI / 2
}

export function safeVehicleExitPosition(vehicle: DrivableVehicle, obstacles: CollisionBox[]) {
  const sideDistance = realScale.carWidth / 2 + playerCollisionRadius + 0.42
  const cosine = Math.cos(vehicle.yaw)
  const sine = Math.sin(vehicle.yaw)
  const candidates: Vec3[] = [
    [vehicle.position[0] + cosine * sideDistance, 0, vehicle.position[2] - sine * sideDistance],
    [vehicle.position[0] - cosine * sideDistance, 0, vehicle.position[2] + sine * sideDistance],
    [vehicle.position[0] - sine * (realScale.carLength / 2 + 0.8), 0, vehicle.position[2] - cosine * (realScale.carLength / 2 + 0.8)],
  ]
  return candidates.find((candidate) => withinTown(candidate) && !pointHitsAnyBox(candidate, obstacles))
}

export function parkingLotCollisionBoxes(): CollisionBox[] {
  return [
    {
      id: 'parking:surface',
      center: parkingLot.center,
      half: [parkingLot.width / 2, parkingLot.center[1], parkingLot.depth / 2],
    },
    {
      id: 'parking:driveway',
      center: parkingLot.drivewayCenter,
      half: [parkingLot.drivewayWidth / 2, parkingLot.drivewayCenter[1], parkingLot.drivewayDepth / 2],
    },
    {
      id: 'parking:sign',
      center: [parkingLot.signPosition[0], 1.1, parkingLot.signPosition[2]],
      half: [0.55, 1.1, 0.2],
    },
  ]
}

export function collisionBoxOverlapsParkingClearance(box: CollisionBox) {
  return overlapsParkingRectangle(box.center, box.half)
}

export function proceduralPieceBlocksParking(piece: ProceduralPiece) {
  if (piece.kind === 'ground' || piece.kind === 'water' || piece.kind === 'road' || piece.kind === 'pavement' || piece.kind === 'line') return false
  return overlapsParkingRectangle(piece.position, [piece.scale[0] / 2, piece.scale[1] / 2, piece.scale[2] / 2])
}

export function pedestrianCollisionBoxes(positions: Vec3[]) {
  return positions.map((position, index): CollisionBox => ({
    id: `pedestrian:${index}`,
    center: [position[0], 1.25, position[2]],
    half: [0.58, 1.25, 0.58],
  }))
}

function parkedVehicle(id: string, label: string, color: string, z: number): DrivableVehicle {
  return {
    id,
    label,
    color,
    position: [parkingLot.center[0], parkingLot.center[1] * 2, z],
    yaw: -Math.PI / 2,
    speed: 0,
  }
}

function vehicleOverlapsAnyBox(vehicle: DrivableVehicle, boxes: CollisionBox[]) {
  const vehicleBox = drivableVehicleCollisionBox(vehicle)
  return boxes.some((box) => boxesOverlap(vehicleBox, box))
}

function boxesOverlap(a: CollisionBox, b: CollisionBox) {
  return (
    Math.abs(a.center[0] - b.center[0]) < a.half[0] + b.half[0] &&
    Math.abs(a.center[2] - b.center[2]) < a.half[2] + b.half[2] &&
    a.center[1] - a.half[1] < b.center[1] + b.half[1] &&
    a.center[1] + a.half[1] > b.center[1] - b.half[1]
  )
}

function overlapsParkingRectangle(center: Vec3, half: Vec3) {
  const padding = 0.45
  const lotHalfX = parkingLot.width / 2 + padding
  const lotHalfZ = parkingLot.depth / 2 + padding
  const inLot =
    Math.abs(center[0] - parkingLot.center[0]) <= half[0] + lotHalfX &&
    Math.abs(center[2] - parkingLot.center[2]) <= half[2] + lotHalfZ
  const inDriveway =
    Math.abs(center[0] - parkingLot.drivewayCenter[0]) <= half[0] + parkingLot.drivewayWidth / 2 + padding &&
    Math.abs(center[2] - parkingLot.drivewayCenter[2]) <= half[2] + parkingLot.drivewayDepth / 2 + padding
  return inLot || inDriveway
}

function clampVehicleToTown(vehicle: DrivableVehicle) {
  const margin = realScale.carLength / 2 + 0.4
  return {
    ...vehicle,
    position: [
      clamp(vehicle.position[0], -24 + margin, 24 - margin),
      vehicle.position[1],
      clamp(vehicle.position[2], -24 + margin, 24 - margin),
    ] as Vec3,
  }
}

function withinTown(position: Vec3) {
  return Math.abs(position[0]) <= 23.5 && Math.abs(position[2]) <= 23.5
}

function moveTowards(value: number, target: number, amount: number) {
  if (value < target) return Math.min(target, value + amount)
  return Math.max(target, value - amount)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
