import type { Vec3 } from '../game/types'
import { buildingHeightForFloors, floorCountFromHeight, meters, realScale } from '../game/scale'
import {
  createProceduralChunkPlan,
  proceduralChunkSize,
  type PlannedParcel,
} from './proceduralTownPlan'
import {
  WorldOccupancyGrid,
  placeOnWorldGrid,
  type TerrainZone,
  type WorldObjectKind,
} from '../game/worldGrid'
import { footprintOverlapsAuthoredCore } from '../game/townPlacement'

export type ProceduralPieceKind =
  | 'ground'
  | 'water'
  | 'road'
  | 'pavement'
  | 'line'
  | 'park'
  | 'building'
  | 'door'
  | 'roof'
  | 'window'
  | 'tree-trunk'
  | 'tree-top'
  | 'lamp-post'
  | 'lamp-light'
  | 'phone-box'
  | 'landmark'

export type ProceduralPiece = {
  id: string
  kind: ProceduralPieceKind
  position: Vec3
  scale: Vec3
  color: string
  rotation?: Vec3
  emissive?: string
  emissiveIntensity?: number
}

export type ProceduralWorldInput = {
  seed: string
  center: Vec3
  viewDistance: 1 | 2 | 3
  night: boolean
}

export type ProceduralWorld = {
  pieces: ProceduralPiece[]
  buildingCount: number
  district: string
  buildableParcels: PlannedParcel[]
}

const chunkSize = proceduralChunkSize
export const roadDriveCorridorPadding = realScale.carWidth / 2 + 0.5
const doorSafeZoneRadius = 1.85
const buildingPalette = ['#f97316', '#facc15', '#93c5fd', '#a78bfa', '#fb7185', '#22c55e', '#f9a8d4']
const roofPalette = ['#ef4444', '#1d4ed8', '#7c3aed', '#0f172a', '#92400e']

export function generateProceduralWorld({ seed, center, viewDistance, night }: ProceduralWorldInput): ProceduralWorld {
  const chunks = chunkRange(center, viewDistance)
  const pieces: ProceduralPiece[] = []
  const buildableParcels: PlannedParcel[] = []

  for (const [cx, cz] of chunks) {
    const chunk = generateChunk(seed, cx, cz, night)
    pieces.push(...chunk.pieces)
    buildableParcels.push(...chunk.buildableParcels)
  }

  pieces.push(...buildLandmarks(night))

  const placedPieces = applyProceduralPlacementRules(
    removeDoorBlockerOverlaps(removeSurfaceBlockerOverlaps(removeAuthoredCoreConflicts(pieces))),
  )
  const permanentStructures = placedPieces.filter(
    (placedPiece) => placedPiece.kind === 'building' || placedPiece.kind === 'landmark',
  )

  return {
    pieces: placedPieces,
    buildingCount: placedPieces.filter(
      (placedPiece) => placedPiece.kind === 'building' && placedPiece.id.startsWith('building:'),
    ).length,
    district: districtFor(center),
    buildableParcels: buildableParcels.filter((parcel) =>
      permanentStructures.every((structure) => !overlapsTopDown(
        { position: parcel.center, scale: parcel.size },
        structure,
        0.25,
      )),
    ),
  }
}

export function districtFor([x, , z]: Vec3): string {
  if (Math.abs(x) < 28 && Math.abs(z) < 28) return 'Central Buddy Town'
  if (x < -44) return 'West Gardens'
  if (x > 48) return 'East Market'
  if (z < -36) return 'Clocktower Quarter'
  if (z > 36) return 'Builder Meadows'
  return z < 0 ? 'North Borough' : 'South Borough'
}

function generateChunk(seed: string, cx: number, cz: number, night: boolean): {
  pieces: ProceduralPiece[]
  buildingCount: number
  buildableParcels: PlannedParcel[]
} {
  const random = rng(`${seed}:${cx}:${cz}`)
  const plan = createProceduralChunkPlan(seed, cx, cz)
  const { centerX, centerZ, hasHorizontalRoad, hasVerticalRoad } = plan.layout
  const pieces: ProceduralPiece[] = [
    piece(`ground:${cx}:${cz}`, 'ground', [centerX, -0.12, centerZ], [chunkSize, 0.12, chunkSize], '#6fde6a'),
  ]
  let buildingCount = 0

  if (hasHorizontalRoad) {
    pieces.push(piece(`road-x:${cx}:${cz}`, 'road', [centerX, 0.01, centerZ], [chunkSize, 0.08, realScale.roadTile], '#9ca3af'))
    pieces.push(piece(`line-x:${cx}:${cz}`, 'line', [centerX, 0.065, centerZ], [chunkSize * 0.86, 0.025, 0.18], '#fde047'))
    pieces.push(piece(`pavement-x-a:${cx}:${cz}`, 'pavement', [centerX, 0.035, centerZ - realScale.roadTile * 0.66], [chunkSize, 0.055, realScale.pavementWidth], '#e5e7eb'))
    pieces.push(piece(`pavement-x-b:${cx}:${cz}`, 'pavement', [centerX, 0.035, centerZ + realScale.roadTile * 0.66], [chunkSize, 0.055, realScale.pavementWidth], '#e5e7eb'))
  }
  if (hasVerticalRoad) {
    pieces.push(piece(`road-z:${cx}:${cz}`, 'road', [centerX, 0.015, centerZ], [realScale.roadTile, 0.09, chunkSize], '#94a3b8'))
    pieces.push(piece(`line-z:${cx}:${cz}`, 'line', [centerX, 0.07, centerZ], [0.18, 0.025, chunkSize * 0.86], '#fde047'))
    pieces.push(piece(`pavement-z-a:${cx}:${cz}`, 'pavement', [centerX - realScale.roadTile * 0.66, 0.04, centerZ], [realScale.pavementWidth, 0.055, chunkSize], '#e5e7eb'))
    pieces.push(piece(`pavement-z-b:${cx}:${cz}`, 'pavement', [centerX + realScale.roadTile * 0.66, 0.04, centerZ], [realScale.pavementWidth, 0.055, chunkSize], '#e5e7eb'))
  }

  plan.parcels.forEach((parcel, index) => {
    if (parcel.use === 'park') {
      pieces.push(piece(`park:${cx}:${cz}:${index}`, 'park', parcel.center, parcel.size, '#34d399'))
      addTree(pieces, `park-tree:${cx}:${cz}:${index}`, parcel.center)
      return
    }
    if (parcel.use !== 'residential' && parcel.use !== 'commercial') return
    const floors = parcel.use === 'commercial' ? 2 : 2 + Math.floor(random() * 2)
    const height = buildingHeightForFloors(floors)
    const width = Math.min(parcel.size[0] - 0.65, meters(3.8 + random() * 0.8))
    const depth = Math.min(parcel.size[2] - 0.65, meters(3.6 + random() * 0.8))
    const color = buildingPalette[Math.floor(random() * buildingPalette.length)]
    const roof = roofPalette[Math.floor(random() * roofPalette.length)]
    addBuilding(
      pieces,
      `building:${cx}:${cz}:${index}`,
      [parcel.center[0], height / 2, parcel.center[2]],
      [width, height, depth],
      color,
      roof,
      parcel.facingYaw,
    )
    buildingCount += 1
  })

  const sidewalkPoints = plan.sidewalkFurniture
  if (random() > 0.76 && sidewalkPoints.length > 0) {
    const phonePosition = sidewalkPoints[Math.floor(random() * sidewalkPoints.length)]
    pieces.push(piece(`phone:${cx}:${cz}`, 'phone-box', [phonePosition[0], realScale.phoneBoxHeight / 2, phonePosition[2]], [realScale.phoneBoxWidth, realScale.phoneBoxHeight, realScale.phoneBoxWidth], '#dc2626'))
  }
  if ((night || random() > 0.58) && sidewalkPoints.length > 0) {
    addLamp(pieces, `lamp:${cx}:${cz}:a`, sidewalkPoints[0], night)
    if (sidewalkPoints[2]) addLamp(pieces, `lamp:${cx}:${cz}:b`, sidewalkPoints[2], night)
  }

  return {
    pieces,
    buildingCount,
    buildableParcels: plan.parcels.filter((parcel) => parcel.use === 'buildable'),
  }
}

export function applyProceduralPlacementRules(pieces: ProceduralPiece[]) {
  const surfaceKinds = new Set<ProceduralPieceKind>(['ground', 'water', 'road', 'pavement', 'line', 'park'])
  const surfaces = pieces.filter((candidate) => surfaceKinds.has(candidate.kind))
  const zones: TerrainZone[] = []
  pieces.forEach((candidate) => {
    if (candidate.kind === 'road') {
      zones.push({ id: candidate.id, terrain: 'road', center: candidate.position, size: candidate.scale })
    }
    if (candidate.kind === 'pavement') {
      zones.push({ id: candidate.id, terrain: 'sidewalk', center: candidate.position, size: candidate.scale })
    }
    if (candidate.kind === 'park') {
      zones.push({ id: candidate.id, terrain: 'park', center: candidate.position, size: candidate.scale })
    }
  })
  const occupancy = new WorldOccupancyGrid()
  const placed = [...surfaces]
  const consumed = new Set<string>(surfaces.map((surface) => surface.id))

  const placeGroup = (
    anchor: ProceduralPiece,
    kind: WorldObjectKind,
    members: ProceduralPiece[],
    footprintScale = anchor.scale,
  ) => {
    members.forEach((member) => consumed.add(member.id))
    const snapped = placeOnWorldGrid(
      kind,
      { id: anchor.id, center: anchor.position, size: footprintScale },
      zones,
      occupancy,
    )
    if (!snapped) return
    const dx = snapped.center[0] - anchor.position[0]
    const dz = snapped.center[2] - anchor.position[2]
    members.forEach((member) => {
      placed.push({
        ...member,
        position: [member.position[0] + dx, member.position[1], member.position[2] + dz],
      })
    })
  }

  pieces
    .filter((candidate) => candidate.kind === 'landmark' && !candidate.id.startsWith('landmark:town-hall:'))
    .forEach((landmark) => {
      occupancy.reserve({ id: landmark.id, center: landmark.position, size: landmark.scale })
      placed.push(landmark)
      consumed.add(landmark.id)
    })

  pieces
    .filter((candidate) => candidate.kind === 'building')
    .sort((a, b) => Number(b.id.startsWith('landmark:')) - Number(a.id.startsWith('landmark:')))
    .forEach((building) => {
      const members = pieces.filter(
        (candidate) => candidate.id === building.id || candidate.id.startsWith(`${building.id}:`),
      )
      placeGroup(building, 'building', members, orientedFootprintScale(building))
    })

  pieces
    .filter((candidate) => candidate.kind === 'tree-trunk')
    .forEach((trunk) => {
      const baseId = trunk.id.replace(/:trunk$/, '')
      const members = pieces.filter((candidate) => candidate.id === `${baseId}:trunk` || candidate.id === `${baseId}:top`)
      placeGroup(trunk, 'tree', members, [realScale.treeCanopySize, trunk.scale[1], realScale.treeCanopySize])
    })

  pieces
    .filter((candidate) => candidate.kind === 'lamp-post')
    .forEach((post) => {
      const baseId = post.id.replace(/:post$/, '')
      const members = pieces.filter((candidate) => candidate.id === `${baseId}:post` || candidate.id === `${baseId}:light`)
      placeGroup(post, 'lamp', members, [Math.max(0.8, post.scale[0]), post.scale[1], Math.max(0.8, post.scale[2])])
    })

  pieces
    .filter((candidate) => candidate.kind === 'phone-box')
    .forEach((phone) => placeGroup(phone, 'phone-box', [phone]))

  pieces.forEach((candidate) => {
    if (consumed.has(candidate.id)) return
    if (candidate.kind === 'roof' || candidate.kind === 'window' || candidate.kind === 'door') {
      placed.push(candidate)
      consumed.add(candidate.id)
    }
  })

  return placed
}

function removeSurfaceBlockerOverlaps(pieces: ProceduralPiece[]) {
  const driveCorridors = pieces
    .filter((piece) => piece.kind === 'road')
    .map((road) => ({
      position: road.position,
      scale: [
        road.scale[0] + roadDriveCorridorPadding * 2,
        road.scale[1],
        road.scale[2] + roadDriveCorridorPadding * 2,
      ] as Vec3,
    }))
  const pavements = pieces.filter((piece) => piece.kind === 'pavement')
  const blockedTreePrefixes = new Set<string>()
  const blockedLampPrefixes = new Set<string>()
  const blockedPieceIds = new Set<string>()

  pieces.forEach((piece) => {
    if (!isDriveCorridorBlocker(piece)) return
    const blocksRoad = driveCorridors.some((surface) => overlapsTopDown(piece, surface, 0.04))
    const blocksPavement =
      (piece.kind === 'tree-trunk' || piece.kind === 'tree-top' || piece.kind === 'phone-box') &&
      pavements.some((surface) => overlapsTopDown(piece, surface, 0.04))
    if (!blocksRoad && !blocksPavement) return
    if (piece.kind === 'tree-trunk' || piece.kind === 'tree-top') blockedTreePrefixes.add(piece.id.replace(/:(trunk|top)$/, ''))
    else if (piece.kind === 'lamp-post' || piece.kind === 'lamp-light') blockedLampPrefixes.add(piece.id.replace(/:(post|light)$/, ''))
    else blockedPieceIds.add(piece.id)
  })

  return pieces.filter((piece) => {
    if (blockedPieceIds.has(piece.id)) return false
    if ((piece.kind === 'tree-trunk' || piece.kind === 'tree-top') && blockedTreePrefixes.has(piece.id.replace(/:(trunk|top)$/, ''))) return false
    if ((piece.kind === 'lamp-post' || piece.kind === 'lamp-light') && blockedLampPrefixes.has(piece.id.replace(/:(post|light)$/, ''))) return false
    return true
  })
}

function isDriveCorridorBlocker(piece: ProceduralPiece) {
  return (
    piece.kind === 'tree-trunk' ||
    piece.kind === 'tree-top' ||
    piece.kind === 'lamp-post' ||
    piece.kind === 'lamp-light' ||
    piece.kind === 'phone-box'
  )
}

function removeAuthoredCoreConflicts(pieces: ProceduralPiece[]) {
  return pieces.filter((piece) => {
    if (piece.id.startsWith('landmark:')) return true
    if (piece.kind === 'ground' || piece.kind === 'water') return true
    return !footprintOverlapsAuthoredCore(piece.position, orientedFootprintScale(piece), 0.08)
  })
}

function removeDoorBlockerOverlaps(pieces: ProceduralPiece[]) {
  const doorZones = pieces
    .filter((piece) => piece.kind === 'door')
    .map((door) => {
      const yaw = door.rotation?.[1] ?? 0
      return {
        position: [
          door.position[0] + Math.sin(yaw) * 0.72,
          0,
          door.position[2] + Math.cos(yaw) * 0.72,
        ] as Vec3,
        scale: [doorSafeZoneRadius * 2, 2, doorSafeZoneRadius * 2] as Vec3,
      }
    })
  if (doorZones.length === 0) return pieces

  const blockedTreePrefixes = new Set<string>()
  const blockedLampPrefixes = new Set<string>()
  const blockedPieceIds = new Set<string>()

  pieces.forEach((piece) => {
    if (!isDoorBlocker(piece) || !doorZones.some((zone) => overlapsTopDown(piece, zone, 0.04))) return
    if (piece.kind === 'tree-trunk') blockedTreePrefixes.add(piece.id.replace(/:trunk$/, ''))
    else if (piece.kind === 'lamp-post') blockedLampPrefixes.add(piece.id.replace(/:post$/, ''))
    else blockedPieceIds.add(piece.id)
  })

  return pieces.filter((piece) => {
    if (blockedPieceIds.has(piece.id)) return false
    if ((piece.kind === 'tree-trunk' || piece.kind === 'tree-top') && blockedTreePrefixes.has(piece.id.replace(/:(trunk|top)$/, ''))) return false
    if ((piece.kind === 'lamp-post' || piece.kind === 'lamp-light') && blockedLampPrefixes.has(piece.id.replace(/:(post|light)$/, ''))) return false
    return true
  })
}

function isDoorBlocker(piece: ProceduralPiece) {
  return piece.kind === 'tree-trunk' || piece.kind === 'lamp-post' || piece.kind === 'phone-box'
}

function overlapsTopDown(
  a: { position: Vec3; scale: Vec3 },
  b: { position: Vec3; scale: Vec3 },
  padding = 0,
) {
  const xOverlap = Math.abs(a.position[0] - b.position[0]) < (a.scale[0] + b.scale[0]) / 2 + padding
  const zOverlap = Math.abs(a.position[2] - b.position[2]) < (a.scale[2] + b.scale[2]) / 2 + padding
  return xOverlap && zOverlap
}

function addBuilding(
  pieces: ProceduralPiece[],
  id: string,
  position: Vec3,
  scale: Vec3,
  color: string,
  roofColor: string,
  facingYaw = 0,
) {
  const rotation: Vec3 = [0, facingYaw, 0]
  const frontOffset = rotateTopDown(0, scale[2] / 2 + 0.04, facingYaw)
  pieces.push(piece(id, 'building', position, scale, color, rotation))
  pieces.push(piece(`${id}:roof`, 'roof', [position[0], position[1] + scale[1] / 2 + realScale.roofHeight / 2, position[2]], [scale[0] * 1.08, realScale.roofHeight, scale[2] * 1.08], roofColor, rotation))
  pieces.push(piece(`${id}:door`, 'door', [position[0] + frontOffset[0], realScale.doorHeight / 2, position[2] + frontOffset[1]], [realScale.doorWidth, realScale.doorHeight, realScale.doorDepth], '#7c2d12', rotation))
  const windowRows = Math.max(1, floorCountFromHeight(scale[1]))
  for (let row = 0; row < Math.min(windowRows, 6); row += 1) {
    const y = row * realScale.floorHeight + realScale.floorHeight * 0.62
    if (y > scale[1] - realScale.windowHeight / 2) continue
    const left = rotateTopDown(-scale[0] * 0.24, scale[2] / 2 + 0.05, facingYaw)
    const right = rotateTopDown(scale[0] * 0.24, scale[2] / 2 + 0.05, facingYaw)
    pieces.push(piece(`${id}:win:${row}:l`, 'window', [position[0] + left[0], y, position[2] + left[1]], [realScale.windowWidth, realScale.windowHeight, realScale.windowDepth], '#dbeafe', rotation, '#93c5fd', 0.12))
    pieces.push(piece(`${id}:win:${row}:r`, 'window', [position[0] + right[0], y, position[2] + right[1]], [realScale.windowWidth, realScale.windowHeight, realScale.windowDepth], '#dbeafe', rotation, '#93c5fd', 0.12))
  }
}

function rotateTopDown(x: number, z: number, yaw: number): [number, number] {
  return [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)]
}

function orientedFootprintScale(piece: ProceduralPiece): Vec3 {
  const yaw = piece.rotation?.[1] ?? 0
  const cosine = Math.abs(Math.cos(yaw))
  const sine = Math.abs(Math.sin(yaw))
  return [
    piece.scale[0] * cosine + piece.scale[2] * sine,
    piece.scale[1],
    piece.scale[0] * sine + piece.scale[2] * cosine,
  ]
}

function addTree(pieces: ProceduralPiece[], id: string, [x, , z]: Vec3) {
  pieces.push(piece(`${id}:trunk`, 'tree-trunk', [x, realScale.treeTrunkHeight / 2, z], [0.32, realScale.treeTrunkHeight, 0.32], '#92400e'))
  pieces.push(piece(`${id}:top`, 'tree-top', [x, realScale.treeTrunkHeight + realScale.treeCanopySize * 0.42, z], [realScale.treeCanopySize, realScale.treeCanopySize, realScale.treeCanopySize], '#16a34a'))
}

function addLamp(pieces: ProceduralPiece[], id: string, [x, , z]: Vec3, night: boolean) {
  pieces.push(piece(`${id}:post`, 'lamp-post', [x, realScale.lampHeight / 2, z], [0.14, realScale.lampHeight, 0.14], '#0f172a'))
  pieces.push(piece(`${id}:light`, 'lamp-light', [x, realScale.lampHeight + 0.28, z], [0.55, 0.55, 0.55], '#fde68a', undefined, '#facc15', night ? 0.95 : 0.32))
}

function buildLandmarks(night: boolean): ProceduralPiece[] {
  const pieces: ProceduralPiece[] = []
  addBuilding(pieces, 'landmark:town-hall', [0, buildingHeightForFloors(3) / 2, -34], [meters(5.8), buildingHeightForFloors(3), meters(5.2)], '#d6a06a', '#2563eb')
  pieces.push(piece('landmark:town-hall:clock-tower', 'landmark', [0, buildingHeightForFloors(3) + buildingHeightForFloors(2) / 2, -34], [meters(1.6), buildingHeightForFloors(2), meters(1.6)], '#c08457'))
  pieces.push(piece('landmark:town-hall:clock-face', 'window', [0, buildingHeightForFloors(4.25), -32.96], [1.08, 1.08, 0.08], '#f8fafc', undefined, '#fde68a', night ? 0.38 : 0.08))
  return pieces
}

function piece(
  id: string,
  kind: ProceduralPieceKind,
  position: Vec3,
  scale: Vec3,
  color: string,
  rotation?: Vec3,
  emissive?: string,
  emissiveIntensity?: number,
): ProceduralPiece {
  return { id, kind, position, scale, color, ...(rotation ? { rotation } : {}), ...(emissive ? { emissive, emissiveIntensity } : {}) }
}

function chunkRange(center: Vec3, viewDistance: 1 | 2 | 3): [number, number][] {
  const cx = Math.floor(center[0] / chunkSize)
  const cz = Math.floor(center[2] / chunkSize)
  const chunks: [number, number][] = []
  for (let x = cx - viewDistance; x <= cx + viewDistance; x += 1) {
    for (let z = cz - viewDistance; z <= cz + viewDistance; z += 1) chunks.push([x, z])
  }
  return chunks
}

export function hashSeed(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function rng(seed: string) {
  let state = hashSeed(seed)
  return () => {
    state += 0x6d2b79f5
    let result = Math.imul(state ^ (state >>> 15), 1 | state)
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}
