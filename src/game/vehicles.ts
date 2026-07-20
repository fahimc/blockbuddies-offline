import type { ProceduralPiece } from '../data/proceduralWorld'
import {
  playerCollisionRadius,
  pointHitsAnyBox,
  type CollisionBox,
} from './collision'
import { realScale } from './scale'
import type { Vec3 } from './types'
import {
  getGoKart,
  goKartAcceleration,
  goKartBoostSpeed,
  goKartBrakeStrength,
  goKartHeight,
  goKartLength,
  goKartMaxSpeed,
  goKartPaddockExitPosition,
  goKartReverseSpeed,
  goKartSteeringRate,
  goKartWidth,
  pointOnGoKartBoost,
} from './goKart'

export type DrivableVehicle = {
  id: string
  label: string
  kind?: 'car' | 'kart'
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
  center: [14, 0.035, -17] as Vec3,
  width: 9,
  depth: 11,
  drivewayCenter: [7.4, 0.03, -17] as Vec3,
  drivewayWidth: 4.2,
  drivewayDepth: 3.2,
  signPosition: [19, 0, -22] as Vec3,
}

export const parkedVehicleDefinitions: DrivableVehicle[] = [
  parkedVehicle('sunny-car', 'Sunny Car', '#f97316', -17.1),
  parkedVehicle('sky-car', 'Sky Car', '#38bdf8', -20.5),
  parkedVehicle('mint-car', 'Mint Car', '#22c55e', -13.7),
]

export const vehicleInteractionRadius = 1.35
export const parkingClearancePadding = 2.8
export const vehicleDriveSpeed = 11
export const vehicleReverseSpeed = 5.5
export const vehicleAcceleration = 9
export const vehicleBrakeStrength = 18
export const vehicleSteeringRate = 1.55
export const roadDriveClearancePadding = realScale.carWidth / 2 + 0.5
export const vehicleTraversableSurfaceTop = 0.2

export function createParkedVehicles() {
  return parkedVehicleDefinitions.map((vehicle) => ({
    ...vehicle,
    position: [...vehicle.position] as Vec3,
  }))
}

export function getDrivableVehicle(id: string) {
  const kart = getGoKart(id)
  if (kart) return kart
  if (id.startsWith('traffic-drive:')) {
    return {
      id,
      label: 'Traffic Car',
      color: '#f97316',
      position: [0, 0, 0] as Vec3,
      yaw: 0,
      speed: 0,
    }
  }
  return parkedVehicleDefinitions.find((vehicle) => vehicle.id === id)
}

export function nearestDrivableVehicle(
  position: Vec3,
  vehicles: DrivableVehicle[],
  maxDistance = vehicleInteractionRadius,
) {
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
  const dimensions = vehicleDimensions(vehicle)
  const dx = position[0] - vehicle.position[0]
  const dz = position[2] - vehicle.position[2]
  const cosine = Math.cos(vehicle.yaw)
  const sine = Math.sin(vehicle.yaw)
  const lateral = dx * cosine - dz * sine
  const longitudinal = dx * sine + dz * cosine
  const outsideX = Math.max(0, Math.abs(lateral) - dimensions.width / 2)
  const outsideZ = Math.max(0, Math.abs(longitudinal) - dimensions.length / 2)
  return Math.hypot(outsideX, outsideZ)
}

export function advanceDrivableVehicle(
  vehicle: DrivableVehicle,
  input: DriveInput,
  deltaSeconds: number,
) {
  const delta = Math.max(0, Math.min(deltaSeconds, 0.1))
  const throttle = clamp(input.throttle, -1, 1)
  const kart = vehicle.kind === 'kart'
  const forwardSpeed = kart ? goKartMaxSpeed : vehicleDriveSpeed
  const reverseSpeed = kart ? goKartReverseSpeed : vehicleReverseSpeed
  const baseAcceleration = kart ? goKartAcceleration : vehicleAcceleration
  const brakeStrength = kart ? goKartBrakeStrength : vehicleBrakeStrength
  const steeringRate = kart ? goKartSteeringRate : vehicleSteeringRate
  const targetSpeed =
    throttle >= 0 ? throttle * forwardSpeed : throttle * reverseSpeed
  const acceleration = input.brake ? brakeStrength : baseAcceleration
  let speed = moveTowards(
    vehicle.speed,
    input.brake ? 0 : targetSpeed,
    acceleration * delta,
  )
  if (Math.abs(throttle) < 0.04 && !input.brake)
    speed = moveTowards(speed, 0, baseAcceleration * 0.55 * delta)

  if (kart && throttle > 0.15 && pointOnGoKartBoost(vehicle.position))
    speed = Math.max(speed, goKartBoostSpeed)

  const steeringScale = Math.min(1, Math.abs(speed) / 2.2)
  const direction = speed < 0 ? -1 : 1
  const yaw =
    vehicle.yaw +
    clamp(input.steer, -1, 1) * steeringRate * steeringScale * direction * delta
  const position: Vec3 = [
    vehicle.position[0] + Math.sin(yaw) * speed * delta,
    vehicle.position[1],
    vehicle.position[2] + Math.cos(yaw) * speed * delta,
  ]
  return { ...vehicle, position, yaw, speed }
}

export function drivingSteerFromStrafe(strafe: number) {
  return -clamp(strafe, -1, 1)
}

export function drivingInputFromControls(
  forward: number,
  strafe: number,
  brake: boolean,
): DriveInput {
  return {
    throttle: clamp(forward, -1, 1),
    steer: drivingSteerFromStrafe(strafe),
    brake,
  }
}

export function advanceDrivableVehicleWithCollisions(
  vehicle: DrivableVehicle,
  input: DriveInput,
  deltaSeconds: number,
  obstacles: CollisionBox[],
) {
  const blockingObstacles = vehicleBlockingObstacles(obstacles)
  const candidate = advanceDrivableVehicle(vehicle, input, deltaSeconds)
  if (!vehicleSweptOverlapsAnyBox(vehicle, candidate, blockingObstacles))
    return candidate

  const turnOnly = { ...candidate, position: vehicle.position, speed: 0 }
  return vehicleOverlapsAnyBox(turnOnly, blockingObstacles)
    ? { ...vehicle, speed: 0 }
    : turnOnly
}

export function drivableVehicleCollisionBox(
  vehicle: DrivableVehicle,
): CollisionBox {
  const dimensions = vehicleDimensions(vehicle)
  const cosine = Math.abs(Math.cos(vehicle.yaw))
  const sine = Math.abs(Math.sin(vehicle.yaw))
  const halfX = cosine * (dimensions.width / 2) + sine * (dimensions.length / 2)
  const halfZ = sine * (dimensions.width / 2) + cosine * (dimensions.length / 2)
  const height = dimensions.height
  return {
    id: `drivable:${vehicle.id}`,
    center: [
      vehicle.position[0],
      vehicle.position[1] + height / 2,
      vehicle.position[2],
    ],
    half: [halfX + 0.08, height / 2, halfZ + 0.08],
  }
}

export function drivableVehicleCollisionBoxes(
  vehicles: DrivableVehicle[],
  excludeId?: string,
) {
  return vehicles
    .filter((vehicle) => vehicle.id !== excludeId)
    .map(drivableVehicleCollisionBox)
}

export function vehicleRenderYaw(headingYaw: number) {
  return headingYaw - Math.PI / 2
}

export function safeVehicleExitPosition(
  vehicle: DrivableVehicle,
  obstacles: CollisionBox[],
) {
  const dimensions = vehicleDimensions(vehicle)
  const sideDistance = dimensions.width / 2 + playerCollisionRadius + 0.42
  const cosine = Math.cos(vehicle.yaw)
  const sine = Math.sin(vehicle.yaw)
  const candidates: Vec3[] = [
    ...(vehicle.kind === 'kart'
      ? [[...goKartPaddockExitPosition] as Vec3]
      : []),
    [
      vehicle.position[0] + cosine * sideDistance,
      0,
      vehicle.position[2] - sine * sideDistance,
    ],
    [
      vehicle.position[0] - cosine * sideDistance,
      0,
      vehicle.position[2] + sine * sideDistance,
    ],
    [
      vehicle.position[0] - sine * (dimensions.length / 2 + 0.8),
      0,
      vehicle.position[2] - cosine * (dimensions.length / 2 + 0.8),
    ],
  ]
  return candidates.find((candidate) => !pointHitsAnyBox(candidate, obstacles))
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
      half: [
        parkingLot.drivewayWidth / 2,
        parkingLot.drivewayCenter[1],
        parkingLot.drivewayDepth / 2,
      ],
    },
  ]
}

export function collisionBoxOverlapsParkingClearance(box: CollisionBox) {
  return overlapsParkingRectangle(box.center, box.half)
}

export function proceduralPieceBlocksParking(piece: ProceduralPiece) {
  if (
    piece.kind === 'ground' ||
    piece.kind === 'water' ||
    piece.kind === 'road' ||
    piece.kind === 'pavement' ||
    piece.kind === 'line'
  )
    return false
  return overlapsParkingRectangle(piece.position, [
    piece.scale[0] / 2,
    piece.scale[1] / 2,
    piece.scale[2] / 2,
  ])
}

export function pedestrianCollisionBoxes(positions: Vec3[]) {
  return positions.map((position, index): CollisionBox => ({
    id: `pedestrian:${index}`,
    center: [position[0], 1.25, position[2]],
    half: [0.58, 1.25, 0.58],
  }))
}

export function vehicleBlockingObstacles(obstacles: CollisionBox[]) {
  return obstacles.filter((box) => !isLowTraversableVehicleSurface(box))
}

function parkedVehicle(
  id: string,
  label: string,
  color: string,
  z: number,
): DrivableVehicle {
  return {
    id,
    label,
    color,
    position: [parkingLot.center[0], parkingLot.center[1] * 2, z],
    yaw: Math.PI / 2,
    speed: 0,
  }
}

function vehicleDimensions(vehicle: DrivableVehicle) {
  return vehicle.kind === 'kart'
    ? { width: goKartWidth, length: goKartLength, height: goKartHeight }
    : {
        width: realScale.carWidth,
        length: realScale.carLength,
        height:
          realScale.wheelRadius +
          realScale.carBodyHeight +
          realScale.carCabinHeight,
      }
}

function vehicleOverlapsAnyBox(
  vehicle: DrivableVehicle,
  boxes: CollisionBox[],
) {
  const vehicleBox = drivableVehicleCollisionBox(vehicle)
  return boxes.some((box) => boxesOverlap(vehicleBox, box))
}

function vehicleSweptOverlapsAnyBox(
  from: DrivableVehicle,
  to: DrivableVehicle,
  boxes: CollisionBox[],
) {
  const distance = Math.hypot(
    to.position[0] - from.position[0],
    to.position[2] - from.position[2],
  )
  const steps = Math.max(1, Math.ceil(distance / 0.28))
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps
    const sample: DrivableVehicle = {
      ...to,
      position: [
        from.position[0] + (to.position[0] - from.position[0]) * t,
        to.position[1],
        from.position[2] + (to.position[2] - from.position[2]) * t,
      ],
      yaw: from.yaw + (to.yaw - from.yaw) * t,
    }
    if (vehicleOverlapsAnyBox(sample, boxes)) return true
  }
  return false
}

function isLowTraversableVehicleSurface(box: CollisionBox) {
  if (box.center[1] + box.half[1] > vehicleTraversableSurfaceTop) return false
  return /(^|:|-)(ground|road|surface|driveway|parking|pavement|sidewalk|park)(:|-|$)/.test(
    box.id,
  )
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
  const padding = parkingClearancePadding
  const lotHalfX = parkingLot.width / 2 + padding
  const lotHalfZ = parkingLot.depth / 2 + padding
  const inLot =
    Math.abs(center[0] - parkingLot.center[0]) <= half[0] + lotHalfX &&
    Math.abs(center[2] - parkingLot.center[2]) <= half[2] + lotHalfZ
  const inDriveway =
    Math.abs(center[0] - parkingLot.drivewayCenter[0]) <=
      half[0] + parkingLot.drivewayWidth / 2 + padding &&
    Math.abs(center[2] - parkingLot.drivewayCenter[2]) <=
      half[2] + parkingLot.drivewayDepth / 2 + padding
  return inLot || inDriveway
}

function moveTowards(value: number, target: number, amount: number) {
  if (value < target) return Math.min(target, value + amount)
  return Math.max(target, value - amount)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
