import type { ProceduralPiece } from '../data/proceduralWorld'
import type { BuildBlock, InteriorKind, InteriorVisit, Vec3 } from './types'
import { buildPieceDimensions } from './scale'
import type { CollisionBox } from './collision'

export type InteriorEntrance = {
  id: string
  title: string
  kind: InteriorKind
  position: Vec3
  radius: number
  returnPosition: Vec3
  returnYaw: number
}

export const interiorSpawnPosition: Vec3 = [0, 0, -4.45]
export const interiorExitPosition: Vec3 = [0, 0, -5.95]
export const interiorExitRadius = 1.05
export const interiorStandingY = 1
export const entranceSafeZoneRadius = 1.85

const roomHalfWidth = 7
const roomHalfDepth = 6.5
const wallThickness = 0.36
const doorHalfWidth = 1.05

export function makeInteriorVisit(entrance: InteriorEntrance): InteriorVisit {
  return {
    id: entrance.id,
    title: entrance.title,
    kind: entrance.kind,
    returnPosition: entrance.returnPosition,
    returnYaw: entrance.returnYaw,
  }
}

export function nearestInteriorEntrance(position: Vec3, entrances: InteriorEntrance[], maxDistance = 1.05) {
  let nearest: InteriorEntrance | undefined
  let nearestDistance = Infinity
  for (const entrance of entrances) {
    const distance = distance2d(position, entrance.position)
    if (distance <= Math.min(maxDistance, entrance.radius) && distance < nearestDistance) {
      nearest = entrance
      nearestDistance = distance
    }
  }
  return nearest
}

export function filterEntranceSafeZoneCollisions(boxes: CollisionBox[], entrances: InteriorEntrance[]) {
  if (entrances.length === 0) return boxes
  return boxes.filter((box) => !isEntranceBlockerCollision(box.id) || !entrances.some((entrance) => collisionBoxOverlapsEntrance(box, entrance)))
}

export function staticBuildingEntrance({
  id,
  title,
  kind,
  center,
  scale,
  yaw = 0,
}: {
  id: string
  title: string
  kind: InteriorKind
  center: Vec3
  scale: Vec3
  yaw?: number
}): InteriorEntrance {
  return buildingEntrance({
    id,
    title,
    kind,
    origin: [center[0], 0, center[2]],
    depth: scale[2],
    yaw,
  })
}

export function buildBlockInteriorEntrance(block: BuildBlock): InteriorEntrance | undefined {
  if (block.kind !== 'house' && block.kind !== 'building' && block.kind !== 'shop') return undefined
  const kind = block.kind === 'shop' ? 'shop' : block.kind === 'house' ? 'house' : 'building'
  const dimensions =
    block.kind === 'house'
      ? buildPieceDimensions.house
      : block.kind === 'shop'
        ? buildPieceDimensions.shop
        : buildPieceDimensions.building
  const label = block.kind === 'shop' ? 'Built Shop' : block.kind === 'house' ? 'Built House' : 'Built Tower'
  return buildingEntrance({
    id: `build:${block.id}`,
    title: label,
    kind,
    origin: [block.position[0], 0, block.position[2]],
    depth: dimensions.depth,
    yaw: block.rotation ?? 0,
  })
}

export function proceduralDoorEntrance(piece: ProceduralPiece): InteriorEntrance | undefined {
  if (piece.kind !== 'door') return undefined
  const title = piece.id.startsWith('landmark:town-hall') ? 'Town Hall' : piece.id.includes('shop') ? 'Borough Shop' : 'Borough House'
  return {
    id: `procedural:${piece.id}`,
    title,
    kind: title.includes('Shop') ? 'shop' : title === 'Town Hall' ? 'school' : 'house',
    position: [piece.position[0], 0, piece.position[2] + 0.34],
    radius: 1.05,
    returnPosition: [piece.position[0], 0, piece.position[2] + 1.35],
    returnYaw: 0,
  }
}

export function interiorCollisionBoxes(kind: InteriorKind): CollisionBox[] {
  const shared: CollisionBox[] = [
    { id: 'interior:back-wall', center: [0, 1.8, roomHalfDepth + wallThickness / 2], half: [roomHalfWidth, 1.8, wallThickness / 2] },
    { id: 'interior:left-wall', center: [-roomHalfWidth - wallThickness / 2, 1.8, 0], half: [wallThickness / 2, 1.8, roomHalfDepth] },
    { id: 'interior:right-wall', center: [roomHalfWidth + wallThickness / 2, 1.8, 0], half: [wallThickness / 2, 1.8, roomHalfDepth] },
    { id: 'interior:front-left-wall', center: [-(roomHalfWidth + doorHalfWidth) / 2, 1.8, -roomHalfDepth - wallThickness / 2], half: [(roomHalfWidth - doorHalfWidth) / 2, 1.8, wallThickness / 2] },
    { id: 'interior:front-right-wall', center: [(roomHalfWidth + doorHalfWidth) / 2, 1.8, -roomHalfDepth - wallThickness / 2], half: [(roomHalfWidth - doorHalfWidth) / 2, 1.8, wallThickness / 2] },
  ]

  return [...shared, ...interiorFurnitureCollisionBoxes(kind)]
}

export function interiorFurnitureCollisionBoxes(kind: InteriorKind): CollisionBox[] {
  if (kind === 'shop') {
    return [
      { id: 'interior:shop-counter', center: [0, 0.55, 3.9], half: [2.15, 0.55, 0.55] },
      { id: 'interior:shop-left-shelf', center: [-5.1, 0.95, 0.8], half: [0.42, 0.95, 2.1] },
      { id: 'interior:shop-right-shelf', center: [5.1, 0.95, 0.8], half: [0.42, 0.95, 2.1] },
    ]
  }
  if (kind === 'school') {
    return [
      { id: 'interior:teacher-desk', center: [0, 0.45, 4.25], half: [1.45, 0.45, 0.52] },
      { id: 'interior:desk-a', center: [-2.4, 0.38, 0.9], half: [0.72, 0.38, 0.52] },
      { id: 'interior:desk-b', center: [0, 0.38, 0.9], half: [0.72, 0.38, 0.52] },
      { id: 'interior:desk-c', center: [2.4, 0.38, 0.9], half: [0.72, 0.38, 0.52] },
    ]
  }
  if (kind === 'building') {
    return [
      { id: 'interior:lobby-desk', center: [0, 0.5, 3.8], half: [1.8, 0.5, 0.48] },
      { id: 'interior:lobby-sofa-a', center: [-4.1, 0.42, 0.6], half: [0.55, 0.42, 1.45] },
      { id: 'interior:lobby-sofa-b', center: [4.1, 0.42, 0.6], half: [0.55, 0.42, 1.45] },
    ]
  }
  return [
    { id: 'interior:house-sofa', center: [-4.1, 0.45, 1.3], half: [0.58, 0.45, 1.6] },
    { id: 'interior:house-bed', center: [3.8, 0.38, 2.8], half: [1.3, 0.38, 1.75] },
    { id: 'interior:house-table', center: [0, 0.42, 1.15], half: [0.88, 0.42, 0.88] },
  ]
}

export function interiorRoomHalfSize() {
  return { width: roomHalfWidth, depth: roomHalfDepth, wallThickness, doorHalfWidth }
}

function collisionBoxOverlapsEntrance(box: CollisionBox, entrance: InteriorEntrance) {
  const closestX = clamp(entrance.position[0], box.center[0] - box.half[0], box.center[0] + box.half[0])
  const closestZ = clamp(entrance.position[2], box.center[2] - box.half[2], box.center[2] + box.half[2])
  return Math.hypot(entrance.position[0] - closestX, entrance.position[2] - closestZ) <= entranceSafeZoneRadius
}

function isEntranceBlockerCollision(id: string) {
  return /tree|lamp|phone|bus|bench|build:(car|tree|lamp):/.test(id)
}

function buildingEntrance({
  id,
  title,
  kind,
  origin,
  depth,
  yaw,
}: {
  id: string
  title: string
  kind: InteriorKind
  origin: Vec3
  depth: number
  yaw: number
}): InteriorEntrance {
  const outward = directionFromYaw(yaw)
  const doorDistance = depth / 2 + 0.55
  const doorPosition: Vec3 = [origin[0] + outward[0] * doorDistance, 0, origin[2] + outward[1] * doorDistance]
  return {
    id,
    title,
    kind,
    position: doorPosition,
    radius: 1.15,
    returnPosition: [doorPosition[0] + outward[0] * 1.15, 0, doorPosition[2] + outward[1] * 1.15],
    returnYaw: yaw,
  }
}

function directionFromYaw(yaw: number): [number, number] {
  return [Math.sin(yaw), Math.cos(yaw)]
}

function distance2d(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
