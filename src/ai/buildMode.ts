import { getBuildPiece } from '../data/buildPieces'
import type { BuildBlock, BuildPieceId, Vec3 } from '../game/types'

export const maxBuildPieces = 240
const halfTurn = Math.PI * 2
const quarterTurn = Math.PI / 2
const mapTileSize = 2.2

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

export function mergeBuildPieces(existing: BuildBlock[], incoming: BuildBlock[], limit = maxBuildPieces) {
  const accepted: BuildBlock[] = []
  for (const piece of incoming) {
    if (existing.length + accepted.length >= limit) break
    if (canPlacePiece([...existing, ...accepted], piece.position, piece.kind ?? 'block')) accepted.push(piece)
  }
  return accepted
}
