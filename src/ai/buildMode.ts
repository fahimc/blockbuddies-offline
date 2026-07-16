import { getBuildPiece } from '../data/buildPieces'
import { proceduralBuildableParcelFor, proceduralTerrainAt } from '../data/proceduralTownPlan'
import { realScale } from '../game/scale'
import { coreReservedFootprints, coreTerrainZones } from '../game/townPlacement'
import type { BuildBlock, BuildPieceId, Vec3 } from '../game/types'
import { terrainAt, type WorldTerrain } from '../game/worldGrid'

export const maxBuildPieces = 240
const halfTurn = Math.PI * 2
const quarterTurn = Math.PI / 2
const mapTileSize = realScale.roadTile

type IdFactory = () => string

type BuildMapStampOptions = {
  origin: Vec3
  yaw: number
  idFactory?: IdFactory
}

type BuildMapCell = {
  kind: BuildPieceId
  color: string
  rotation?: number
}

const starterStreetMap = [
  't.h.t',
  'rrrrr',
  'c...l',
  'rrrrr',
  's.b.h',
] as const

const mapCells: Record<string, BuildMapCell> = {
  r: { kind: 'road', color: '#334155' },
  h: { kind: 'house', color: '#60a5fa' },
  b: { kind: 'building', color: '#818cf8' },
  s: { kind: 'shop', color: '#f97316' },
  c: { kind: 'car', color: '#ef4444', rotation: quarterTurn },
  t: { kind: 'tree', color: '#16a34a' },
  l: { kind: 'lamp', color: '#facc15' },
}

export function snapBuildValue(value: number, gridSize = 0.5) {
  return Math.round(value / gridSize) * gridSize
}

export function normalizeBuildYaw(yaw: number) {
  const turns = Math.round(yaw / quarterTurn)
  return (((turns % 4) + 4) % 4) * quarterTurn
}

export function rotateBuildYaw(yaw: number) {
  return normalizeBuildYaw((yaw + quarterTurn) % halfTurn)
}

export function nextBuildPosition(playerPosition: Vec3, yaw: number, pieceId: BuildPieceId = 'block'): Vec3 {
  const piece = getBuildPiece(pieceId)
  const forwardX = Math.sin(yaw) * piece.placeDistance
  const forwardZ = Math.cos(yaw) * piece.placeDistance
  return [snapBuildValue(playerPosition[0] + forwardX), piece.y, snapBuildValue(playerPosition[2] + forwardZ)]
}

export function findBuildPlacementPosition({
  blocks,
  playerPosition,
  yaw,
  pieceId = 'block',
  worldSeed = 'LONDON-2026',
  searchRadius = 8,
}: {
  blocks: BuildBlock[]
  playerPosition: Vec3
  yaw: number
  pieceId?: BuildPieceId
  worldSeed?: string
  searchRadius?: number
}): { position?: Vec3; issue?: string } {
  const firstPosition = nextBuildPosition(playerPosition, yaw, pieceId)
  let firstIssue: string | undefined
  const seen = new Set<string>()

  const candidatePositions = [firstPosition]
  for (let radius = 1; radius <= searchRadius; radius += 1) {
    const samples = Math.max(8, radius * 8)
    for (let sample = 0; sample < samples; sample += 1) {
      const angle = (sample / samples) * halfTurn
      candidatePositions.push([
        snapBuildValue(firstPosition[0] + Math.sin(angle) * radius),
        getBuildPiece(pieceId).y,
        snapBuildValue(firstPosition[2] + Math.cos(angle) * radius),
      ])
    }
  }

  for (const candidate of candidatePositions) {
    const key = `${candidate[0]}:${candidate[2]}`
    if (seen.has(key)) continue
    seen.add(key)
    const overlapIssue = canPlacePiece(blocks, candidate, pieceId)
      ? undefined
      : 'That build cell is already occupied'
    const terrainIssue = overlapIssue ?? worldBuildPlacementIssue(candidate, pieceId, worldSeed)
    firstIssue ??= terrainIssue
    if (!terrainIssue) return { position: candidate }
  }

  return { issue: firstIssue ?? 'No clear build cell nearby' }
}

export function buildCollisionRadius(block: Pick<BuildBlock, 'kind'>) {
  return getBuildPiece(block.kind ?? 'block').footprint / 2
}

export function canPlacePiece(blocks: BuildBlock[], position: Vec3, pieceId: BuildPieceId = 'block') {
  const radius = getBuildPiece(pieceId).footprint / 2
  return !blocks.some((block) => {
    const dx = block.position[0] - position[0]
    const dz = block.position[2] - position[2]
    return Math.hypot(dx, dz) < radius + buildCollisionRadius(block) - 0.12
  })
}

export function canPlaceBlock(blocks: BuildBlock[], position: Vec3) {
  return canPlacePiece(blocks, position, 'block')
}

export function worldBuildPlacementIssue(
  position: Vec3,
  pieceId: BuildPieceId,
  worldSeed = 'LONDON-2026',
) {
  const definition = getBuildPiece(pieceId)
  const footprintSize: Vec3 = [definition.footprint, 1, definition.footprint]
  const footprint = { id: `build-preview:${pieceId}`, center: position, size: footprintSize }
  const insideCoreTown = Math.abs(position[0]) <= 27 && Math.abs(position[2]) <= 27

  if (insideCoreTown && coreReservedFootprints.some((reserved) => footprintsOverlap(footprint, reserved, 0.25))) {
    return 'That cell is reserved for the town layout'
  }

  const terrains = sampledBuildTerrains(position, footprintSize)
  const allowed = allowedBuildTerrain[pieceId]
  if ([...terrains].some((terrain) => !allowed.includes(terrain))) {
    return `${definition.label} cannot be placed on ${[...terrains].join(' / ')}`
  }

  const usesGround = terrains.has('ground')
  const canUseExistingTransport = pieceId === 'car' || pieceId === 'lamp'
  if (
    !insideCoreTown &&
    usesGround &&
    !canUseExistingTransport &&
    !proceduralBuildableParcelFor(worldSeed, position, footprintSize)
  ) {
    return 'Build inside an empty parcel beside the road'
  }
  return undefined
}

export function createBuildPiece({
  id,
  kind,
  position,
  color,
  rotation = 0,
}: {
  id: string
  kind: BuildPieceId
  position: Vec3
  color?: string
  rotation?: number
}): BuildBlock {
  return {
    id,
    kind,
    position: [position[0], getBuildPiece(kind).y, position[2]],
    color: color ?? getBuildPiece(kind).defaultColor,
    rotation: normalizeBuildYaw(rotation),
  }
}

export function createBuildMapStamp({ origin, yaw, idFactory = () => crypto.randomUUID() }: BuildMapStampOptions) {
  const rotation = normalizeBuildYaw(yaw)
  const centerRow = (starterStreetMap.length - 1) / 2
  const centerCol = (starterStreetMap[0].length - 1) / 2
  const sin = Math.sin(rotation)
  const cos = Math.cos(rotation)
  const pieces: BuildBlock[] = []

  starterStreetMap.forEach((row, rowIndex) => {
    Array.from(row).forEach((cell, colIndex) => {
      const mapCell = mapCells[cell]
      if (!mapCell) return
      const localX = (colIndex - centerCol) * mapTileSize
      const localZ = (rowIndex - centerRow) * mapTileSize
      const worldX = origin[0] + localX * cos + localZ * sin
      const worldZ = origin[2] - localX * sin + localZ * cos
      pieces.push(
        createBuildPiece({
          id: idFactory(),
          kind: mapCell.kind,
          position: [snapBuildValue(worldX), 0, snapBuildValue(worldZ)],
          color: mapCell.color,
          rotation: rotation + (mapCell.rotation ?? 0),
        }),
      )
    })
  })

  return pieces
}

export function mergeBuildPieces(
  existing: BuildBlock[],
  incoming: BuildBlock[],
  limit = maxBuildPieces,
  isWorldPlacementAllowed: (piece: BuildBlock) => boolean = () => true,
) {
  const accepted: BuildBlock[] = []
  for (const piece of incoming) {
    if (existing.length + accepted.length >= limit) break
    if (
      isWorldPlacementAllowed(piece) &&
      canPlacePiece([...existing, ...accepted], piece.position, piece.kind ?? 'block')
    ) accepted.push(piece)
  }
  return accepted
}

const allowedBuildTerrain: Record<BuildPieceId, readonly WorldTerrain[]> = {
  block: ['ground'],
  road: ['ground'],
  house: ['ground'],
  building: ['ground'],
  shop: ['ground'],
  car: ['ground', 'road'],
  tree: ['ground', 'park'],
  lamp: ['ground', 'sidewalk'],
}

function sampledBuildTerrains(center: Vec3, size: Vec3) {
  const terrains = new Set<WorldTerrain>()
  const halfX = size[0] / 2
  const halfZ = size[2] / 2
  const minX = Math.ceil(center[0] - halfX + 0.01)
  const maxX = Math.floor(center[0] + halfX - 0.01)
  const minZ = Math.ceil(center[2] - halfZ + 0.01)
  const maxZ = Math.floor(center[2] + halfZ - 0.01)
  for (let x = minX; x <= maxX; x += 1) {
    for (let z = minZ; z <= maxZ; z += 1) {
      terrains.add(
        Math.abs(x) <= 27 && Math.abs(z) <= 27
          ? terrainAt(x, z, coreTerrainZones)
          : proceduralTerrainAt(x, z),
      )
    }
  }
  return terrains
}

function footprintsOverlap(
  a: { center: Vec3; size: Vec3 },
  b: { center: Vec3; size: Vec3 },
  padding = 0,
) {
  return (
    Math.abs(a.center[0] - b.center[0]) < (a.size[0] + b.size[0]) / 2 + padding &&
    Math.abs(a.center[2] - b.center[2]) < (a.size[2] + b.size[2]) / 2 + padding
  )
}
