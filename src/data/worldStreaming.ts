import type { Vec3 } from '../game/types'
import {
  chunkKey,
  chunkRangeAround,
  worldToChunk,
  type ChunkCoord,
} from './worldCoordinates'

export type ChunkRequestReason = 'active' | 'predicted' | 'prefetch'

export type ChunkRequest = ChunkCoord & {
  priority: number
  reason: ChunkRequestReason
}

export function predictChunkRequests({
  position,
  velocity,
  viewDistance,
  lookAheadSeconds = 1.25,
  prefetchDistance = 1,
}: {
  position: Vec3
  velocity: Vec3
  viewDistance: number
  lookAheadSeconds?: number
  prefetchDistance?: number
}): ChunkRequest[] {
  const current = worldToChunk(position[0], position[2])
  const predicted = worldToChunk(
    position[0] + velocity[0] * lookAheadSeconds,
    position[2] + velocity[2] * lookAheadSeconds,
  )
  const requests = new Map<string, ChunkRequest>()

  const add = (coord: ChunkCoord, reason: ChunkRequestReason, base: number) => {
    const distance = Math.max(
      Math.abs(coord.cx - current.cx),
      Math.abs(coord.cz - current.cz),
    )
    const request = { ...coord, reason, priority: base - distance }
    const key = chunkKey(coord)
    const existing = requests.get(key)
    if (!existing || request.priority > existing.priority)
      requests.set(key, request)
  }

  chunkRangeAround(current, viewDistance).forEach((coord) =>
    add(coord, 'active', 300),
  )
  chunkRangeAround(predicted, viewDistance).forEach((coord) =>
    add(coord, 'predicted', 200),
  )
  chunkRangeAround(predicted, viewDistance + prefetchDistance).forEach(
    (coord) => add(coord, 'prefetch', 100),
  )

  return [...requests.values()].sort(
    (a, b) => b.priority - a.priority || a.cx - b.cx || a.cz - b.cz,
  )
}
