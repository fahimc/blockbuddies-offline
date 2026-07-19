import { proceduralChunkSize } from './proceduralTownPlan'

export type ChunkCoord = {
  cx: number
  cz: number
}

export type SectorCoord = {
  sx: number
  sz: number
}

export type WorldBounds = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export const worldChunkSize = proceduralChunkSize
export const worldSectorChunkSpan = 6
export const worldSectorSize = worldChunkSize * worldSectorChunkSpan

export function worldToChunk(x: number, z: number): ChunkCoord {
  return {
    cx: Math.floor(x / worldChunkSize),
    cz: Math.floor(z / worldChunkSize),
  }
}

export function chunkToSector(cx: number, cz: number): SectorCoord {
  return {
    sx: Math.floor(cx / worldSectorChunkSpan),
    sz: Math.floor(cz / worldSectorChunkSpan),
  }
}

export function chunkKey({ cx, cz }: ChunkCoord) {
  return `${cx}:${cz}`
}

export function chunkBounds(cx: number, cz: number): WorldBounds {
  return {
    minX: cx * worldChunkSize,
    maxX: (cx + 1) * worldChunkSize,
    minZ: cz * worldChunkSize,
    maxZ: (cz + 1) * worldChunkSize,
  }
}

export function boundsToChunks(
  bounds: WorldBounds,
  overscan = 0,
): ChunkCoord[] {
  const epsilon = 0.0001
  const min = worldToChunk(bounds.minX, bounds.minZ)
  const max = worldToChunk(bounds.maxX - epsilon, bounds.maxZ - epsilon)
  const chunks: ChunkCoord[] = []
  for (let cx = min.cx - overscan; cx <= max.cx + overscan; cx += 1) {
    for (let cz = min.cz - overscan; cz <= max.cz + overscan; cz += 1) {
      chunks.push({ cx, cz })
    }
  }
  return chunks
}

export function chunkRangeAround(
  center: ChunkCoord,
  distance: number,
): ChunkCoord[] {
  const chunks: ChunkCoord[] = []
  for (let cx = center.cx - distance; cx <= center.cx + distance; cx += 1) {
    for (let cz = center.cz - distance; cz <= center.cz + distance; cz += 1) {
      chunks.push({ cx, cz })
    }
  }
  return chunks
}

export function boundsIntersect(a: WorldBounds, b: WorldBounds) {
  return (
    a.maxX > b.minX && a.minX < b.maxX && a.maxZ > b.minZ && a.minZ < b.maxZ
  )
}

export function boundsFromCenter(
  centerX: number,
  centerZ: number,
  width: number,
  depth: number,
): WorldBounds {
  return {
    minX: centerX - width / 2,
    maxX: centerX + width / 2,
    minZ: centerZ - depth / 2,
    maxZ: centerZ + depth / 2,
  }
}
