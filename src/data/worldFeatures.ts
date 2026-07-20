import type { Vec3 } from '../game/types'
import { goKartTrack } from '../game/goKart'
import { authoredCoreBounds } from '../game/townPlacement'
import {
  boundsFromCenter,
  boundsIntersect,
  boundsToChunks,
  chunkBounds,
  chunkKey,
  worldChunkSize,
  type ChunkCoord,
  type WorldBounds,
} from './worldCoordinates'

export const worldGeneratorVersion = 2

export type WorldFeatureKind =
  'authored-region' | 'landmark' | 'activity-district'

export type WorldFeature = {
  id: string
  label: string
  kind: WorldFeatureKind
  center: Vec3
  bounds: WorldBounds
  ownerChunk: ChunkCoord
  blocksProceduralObjects: boolean
  color: string
}

export const footballStadiumCenter: Vec3 = [90, 0, -42]
export const footballStadiumFootprint = {
  width: 18,
  depth: 24,
}
export const footballStadiumTravelPosition: Vec3 = [90, 0, -32.8]

export const stadiumAccessRoadBounds: WorldBounds = {
  minX: footballStadiumCenter[0] - 3.2,
  maxX: footballStadiumCenter[0] + 3.2,
  minZ: -63,
  maxZ: footballStadiumCenter[2] - footballStadiumFootprint.depth / 2,
}

export const worldFeatures: WorldFeature[] = [
  {
    id: 'central-buddy-town',
    label: 'Central Buddy Town',
    kind: 'authored-region',
    center: [0, 0, 0],
    bounds: { ...authoredCoreBounds },
    ownerChunk: { cx: 0, cz: 0 },
    blocksProceduralObjects: true,
    color: '#38bdf8',
  },
  {
    id: 'clocktower-hall',
    label: 'Clocktower Hall',
    kind: 'landmark',
    center: [0, 0, -34],
    bounds: boundsFromCenter(0, -34, 12, 15),
    ownerChunk: { cx: 0, cz: -1 },
    blocksProceduralObjects: true,
    color: '#c08457',
  },
  {
    id: 'builder-meadows',
    label: 'Builder Meadows',
    kind: 'activity-district',
    center: [67, 0, 54],
    bounds: boundsFromCenter(67, 54, 24, 24),
    ownerChunk: { cx: 1, cz: 1 },
    blocksProceduralObjects: false,
    color: '#14b8a6',
  },
  {
    id: 'football-stadium',
    label: 'Football Stadium',
    kind: 'landmark',
    center: footballStadiumCenter,
    bounds: boundsFromCenter(
      footballStadiumCenter[0],
      footballStadiumCenter[2],
      footballStadiumFootprint.width,
      footballStadiumFootprint.depth,
    ),
    ownerChunk: { cx: 2, cz: -2 },
    blocksProceduralObjects: true,
    color: '#16a34a',
  },
  {
    id: 'go-kart-track',
    label: 'Go Kart Track',
    kind: 'activity-district',
    center: goKartTrack.center,
    bounds: boundsFromCenter(
      goKartTrack.center[0],
      goKartTrack.center[2],
      goKartTrack.width + goKartTrack.borderClearance * 2,
      goKartTrack.depth + goKartTrack.borderClearance * 2,
    ),
    ownerChunk: { cx: 2, cz: -1 },
    blocksProceduralObjects: true,
    color: '#f97316',
  },
]

const featureById = new Map(
  worldFeatures.map((feature) => [feature.id, feature]),
)
const featureIdsByChunk = new Map<string, string[]>()

worldFeatures.forEach((feature) => {
  boundsToChunks(feature.bounds).forEach((coord) => {
    const key = chunkKey(coord)
    featureIdsByChunk.set(key, [
      ...(featureIdsByChunk.get(key) ?? []),
      feature.id,
    ])
  })
})

export function getWorldFeature(id: string) {
  return featureById.get(id)
}

export function worldFeaturesForChunk(cx: number, cz: number) {
  return (featureIdsByChunk.get(chunkKey({ cx, cz })) ?? []).flatMap((id) => {
    const feature = featureById.get(id)
    return feature ? [feature] : []
  })
}

export function worldFeaturesInBounds(bounds: WorldBounds) {
  const ids = new Set<string>()
  boundsToChunks(bounds).forEach(({ cx, cz }) => {
    worldFeaturesForChunk(cx, cz).forEach((feature) => ids.add(feature.id))
  })
  return [...ids].flatMap((id) => {
    const feature = featureById.get(id)
    return feature && boundsIntersect(feature.bounds, bounds) ? [feature] : []
  })
}

export function worldFeatureVisible(
  featureId: string,
  center: Vec3,
  viewDistance: number,
) {
  const feature = getWorldFeature(featureId)
  if (!feature) return false
  const centerChunk = {
    cx: Math.floor(center[0] / worldChunkSize),
    cz: Math.floor(center[2] / worldChunkSize),
  }
  const visibleBounds = {
    minX: chunkBounds(centerChunk.cx - viewDistance, centerChunk.cz).minX,
    maxX: chunkBounds(centerChunk.cx + viewDistance, centerChunk.cz).maxX,
    minZ: chunkBounds(centerChunk.cx, centerChunk.cz - viewDistance).minZ,
    maxZ: chunkBounds(centerChunk.cx, centerChunk.cz + viewDistance).maxZ,
  }
  return boundsIntersect(feature.bounds, visibleBounds)
}

export function footprintOverlapsBlockingWorldFeature(
  center: Vec3,
  size: Vec3,
  padding = 0,
) {
  const bounds = boundsFromCenter(
    center[0],
    center[2],
    size[0] + padding * 2,
    size[2] + padding * 2,
  )
  if (boundsIntersect(stadiumAccessRoadBounds, bounds)) return true
  return worldFeatures.some(
    (feature) =>
      feature.blocksProceduralObjects &&
      boundsIntersect(feature.bounds, bounds),
  )
}

export function terrainOverrideForWorldFeature(x: number, z: number) {
  const stadium = getWorldFeature('football-stadium')
  if (
    stadium &&
    x >= stadium.bounds.minX &&
    x <= stadium.bounds.maxX &&
    z >= stadium.bounds.minZ &&
    z <= stadium.bounds.maxZ
  ) {
    return 'park' as const
  }
  const kart = getWorldFeature('go-kart-track')
  if (
    kart &&
    x >= kart.bounds.minX &&
    x <= kart.bounds.maxX &&
    z >= kart.bounds.minZ &&
    z <= kart.bounds.maxZ
  ) {
    return 'park' as const
  }
  if (
    x >= stadiumAccessRoadBounds.minX &&
    x <= stadiumAccessRoadBounds.maxX &&
    z >= stadiumAccessRoadBounds.minZ &&
    z <= stadiumAccessRoadBounds.maxZ
  ) {
    return 'road' as const
  }
  return undefined
}
