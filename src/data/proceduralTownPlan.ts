import { realScale } from '../game/scale'
import type { Vec3 } from '../game/types'
import {
  buddyRushReservedSites,
  footprintsOverlap,
  orientedBuddyRushFootprint,
} from './buddyRushWorldPlan'

export const proceduralChunkSize = 36
export const proceduralHorizontalRoadRepeat = proceduralChunkSize * 2
export const proceduralHorizontalRoadOrigin = 9
export const proceduralVerticalRoadRepeat = proceduralChunkSize * 3
export const proceduralVerticalRoadOrigin = -54

export const centralAvenue = {
  centerX: 0,
  minZ: -28.5,
  maxZ: proceduralHorizontalRoadOrigin,
}

export type PlannedParcelUse = 'residential' | 'commercial' | 'park' | 'buildable'

export type PlannedParcel = {
  id: string
  center: Vec3
  size: Vec3
  use: PlannedParcelUse
  facingYaw: number
}

export type ProceduralChunkRoadLayout = {
  x0: number
  z0: number
  centerX: number
  centerZ: number
  hasHorizontalRoad: boolean
  hasVerticalRoad: boolean
  horizontalRoadCenters: number[]
  verticalRoadCenters: number[]
  ownedHorizontalRoadCenters: number[]
  ownedVerticalRoadCenters: number[]
}

export type ProceduralChunkPlan = {
  layout: ProceduralChunkRoadLayout
  parcels: PlannedParcel[]
  sidewalkFurniture: Vec3[]
}

const parcelEdgeInset = 1
const parcelSetback = 0.8
const maximumParcelSpan = 12

export function createProceduralChunkPlan(seed: string, cx: number, cz: number): ProceduralChunkPlan {
  const layout = proceduralChunkRoadLayout(cx, cz)
  const transportHalfWidth = realScale.roadTile / 2 + realScale.pavementWidth + parcelSetback
  const xSegments = splitAvailableAxis(
    layout.x0,
    layout.x0 + proceduralChunkSize,
    layout.verticalRoadCenters,
    transportHalfWidth,
  )
  const zSegments = splitAvailableAxis(
    layout.z0,
    layout.z0 + proceduralChunkSize,
    layout.horizontalRoadCenters,
    transportHalfWidth,
  )
  const candidates = xSegments.flatMap((xSegment, xIndex) =>
    zSegments.map((zSegment, zIndex) => ({
      id: `parcel:${cx}:${cz}:${xIndex}:${zIndex}`,
      center: [(xSegment.min + xSegment.max) / 2, 0.02, (zSegment.min + zSegment.max) / 2] as Vec3,
      size: [xSegment.max - xSegment.min, 0.07, zSegment.max - zSegment.min] as Vec3,
    })),
  ).filter((parcel) => parcel.size[0] >= 5.4 && parcel.size[2] >= 5.4)

  const chunkHash = planHash(`${seed}:${cx}:${cz}`)
  const roadServed = layout.hasHorizontalRoad || layout.hasVerticalRoad
  const parkIndex = roadServed && candidates.length > 0 && chunkHash % 4 === 0
    ? chunkHash % candidates.length
    : -1
  const buildingBudget = roadServed
    ? chunkHash % 5 === 0
      ? 2
      : chunkHash % 2 === 0
        ? 1
        : 0
    : 0
  let developed = 0
  const parcels: PlannedParcel[] = candidates.map((candidate, index) => {
    const reservedForClubhouse = buddyRushReservedSites.some((site) =>
      footprintsOverlap(
        candidate.center,
        candidate.size,
        site.position,
        orientedBuddyRushFootprint(site),
        0.2,
      ),
    )
    let use: PlannedParcelUse = 'buildable'
    if (reservedForClubhouse) use = 'buildable'
    else if (index === parkIndex) use = 'park'
    else if (developed < buildingBudget) {
      use = chunkHash % 5 === 0 && developed === 0 ? 'commercial' : 'residential'
      developed += 1
    }
    return {
      ...candidate,
      use,
      facingYaw: nearestRoadFacing(candidate.center, layout),
    }
  })

  return {
    layout,
    parcels,
    sidewalkFurniture: plannedSidewalkFurniture(layout),
  }
}

export function proceduralChunkRoadLayout(cx: number, cz: number): ProceduralChunkRoadLayout {
  const x0 = cx * proceduralChunkSize
  const z0 = cz * proceduralChunkSize
  const x1 = x0 + proceduralChunkSize
  const z1 = z0 + proceduralChunkSize
  const transportHalfWidth = realScale.roadTile / 2 + realScale.pavementWidth + parcelSetback
  const horizontalRoadCenters = roadCentersAffectingRange(
    z0,
    z1,
    proceduralHorizontalRoadOrigin,
    proceduralHorizontalRoadRepeat,
    transportHalfWidth,
  )
  const verticalRoadCenters = roadCentersAffectingRange(
    x0,
    x1,
    proceduralVerticalRoadOrigin,
    proceduralVerticalRoadRepeat,
    transportHalfWidth,
  )
  const overlapsCentralAvenue = z1 > centralAvenue.minZ && z0 < centralAvenue.maxZ
  if (
    overlapsCentralAvenue &&
    centralAvenue.centerX + transportHalfWidth > x0 &&
    centralAvenue.centerX - transportHalfWidth < x1 &&
    !verticalRoadCenters.includes(centralAvenue.centerX)
  ) {
    verticalRoadCenters.push(centralAvenue.centerX)
  }

  return {
    x0,
    z0,
    centerX: x0 + proceduralChunkSize / 2,
    centerZ: z0 + proceduralChunkSize / 2,
    hasHorizontalRoad: horizontalRoadCenters.length > 0,
    hasVerticalRoad: verticalRoadCenters.length > 0,
    horizontalRoadCenters,
    verticalRoadCenters,
    ownedHorizontalRoadCenters: roadCentersOwnedByRange(
      z0,
      z1,
      proceduralHorizontalRoadOrigin,
      proceduralHorizontalRoadRepeat,
    ),
    ownedVerticalRoadCenters: roadCentersOwnedByRange(
      x0,
      x1,
      proceduralVerticalRoadOrigin,
      proceduralVerticalRoadRepeat,
    ),
  }
}

export function proceduralTerrainAt(x: number, z: number): 'ground' | 'road' | 'sidewalk' {
  const distanceToVerticalRoad = distanceToRepeatingLine(
    x,
    proceduralVerticalRoadOrigin,
    proceduralVerticalRoadRepeat,
  )
  const distanceToHorizontalRoad = distanceToRepeatingLine(
    z,
    proceduralHorizontalRoadOrigin,
    proceduralHorizontalRoadRepeat,
  )
  const centralAvenueDistance =
    z >= centralAvenue.minZ && z <= centralAvenue.maxZ
      ? Math.abs(x - centralAvenue.centerX)
      : Number.POSITIVE_INFINITY
  const nearestRoad = Math.min(distanceToVerticalRoad, distanceToHorizontalRoad, centralAvenueDistance)
  if (nearestRoad <= realScale.roadTile / 2) return 'road'
  if (nearestRoad <= realScale.roadTile / 2 + realScale.pavementWidth) return 'sidewalk'
  return 'ground'
}

export function proceduralBuildableParcelFor(
  seed: string,
  center: Vec3,
  size: Vec3,
): PlannedParcel | undefined {
  const cx = Math.floor(center[0] / proceduralChunkSize)
  const cz = Math.floor(center[2] / proceduralChunkSize)
  return createProceduralChunkPlan(seed, cx, cz).parcels.find(
    (parcel) => parcel.use === 'buildable' && containsFootprint(parcel, center, size),
  )
}

function splitAvailableAxis(min: number, max: number, roadCenters: number[], transportHalfWidth: number) {
  let available = [{ min: min + parcelEdgeInset, max: max - parcelEdgeInset }]
  for (const roadCenter of roadCenters) {
    const corridorMin = roadCenter - transportHalfWidth
    const corridorMax = roadCenter + transportHalfWidth
    available = available.flatMap((segment) => {
      if (corridorMax <= segment.min || corridorMin >= segment.max) return [segment]
      return [
        { min: segment.min, max: Math.min(segment.max, corridorMin) },
        { min: Math.max(segment.min, corridorMax), max: segment.max },
      ].filter((candidate) => candidate.max > candidate.min)
    })
  }

  return available.flatMap((segment) => subdivideSegment(segment.min, segment.max))
}

function subdivideSegment(min: number, max: number) {
  const length = max - min
  if (length <= 0) return []
  const count = Math.max(1, Math.ceil(length / maximumParcelSpan))
  const span = length / count
  return Array.from({ length: count }, (_, index) => ({
    min: min + index * span,
    max: min + (index + 1) * span,
  }))
}

function nearestRoadFacing([x, , z]: Vec3, layout: ProceduralChunkRoadLayout) {
  const candidates: Array<{ distance: number; yaw: number }> = []
  for (const roadZ of layout.horizontalRoadCenters) {
    candidates.push({ distance: Math.abs(z - roadZ), yaw: z < roadZ ? 0 : Math.PI })
  }
  for (const roadX of layout.verticalRoadCenters) {
    candidates.push({ distance: Math.abs(x - roadX), yaw: x < roadX ? Math.PI / 2 : -Math.PI / 2 })
  }
  candidates.sort((a, b) => a.distance - b.distance)
  return candidates[0]?.yaw ?? 0
}

function plannedSidewalkFurniture(layout: ProceduralChunkRoadLayout): Vec3[] {
  const points: Vec3[] = []
  const furnitureOffset = realScale.roadTile / 2 + realScale.pavementWidth * 0.72
  const along = [7, proceduralChunkSize - 7]

  for (const roadZ of layout.ownedHorizontalRoadCenters) {
    for (const xOffset of along) {
      const x = layout.x0 + xOffset
      points.push([x, 0, roadZ - furnitureOffset], [x, 0, roadZ + furnitureOffset])
    }
  }
  for (const roadX of layout.ownedVerticalRoadCenters) {
    for (const zOffset of along) {
      const z = layout.z0 + zOffset
      points.push([roadX - furnitureOffset, 0, z], [roadX + furnitureOffset, 0, z])
    }
  }
  return points.filter(([x, , z], index) =>
    proceduralTerrainAt(x, z) === 'sidewalk' &&
    points.findIndex(([otherX, , otherZ]) => otherX === x && otherZ === z) === index,
  )
}

export function horizontalRoadCentersBetween(min: number, max: number) {
  return roadCentersAffectingRange(
    min,
    max,
    proceduralHorizontalRoadOrigin,
    proceduralHorizontalRoadRepeat,
    realScale.roadTile / 2,
  )
}

export function verticalRoadCentersBetween(min: number, max: number) {
  return roadCentersAffectingRange(
    min,
    max,
    proceduralVerticalRoadOrigin,
    proceduralVerticalRoadRepeat,
    realScale.roadTile / 2,
  )
}

function roadCentersAffectingRange(min: number, max: number, origin: number, repeat: number, padding: number) {
  const first = Math.floor((min - padding - origin) / repeat)
  const last = Math.ceil((max + padding - origin) / repeat)
  const centers: number[] = []
  for (let index = first; index <= last; index += 1) {
    const center = origin + repeat * index
    if (center + padding > min && center - padding < max) centers.push(center)
  }
  return centers
}

function roadCentersOwnedByRange(min: number, max: number, origin: number, repeat: number) {
  const first = Math.ceil((min - origin) / repeat)
  const last = Math.ceil((max - origin) / repeat) - 1
  const centers: number[] = []
  for (let index = first; index <= last; index += 1) centers.push(origin + repeat * index)
  return centers
}

function distanceToRepeatingLine(value: number, origin: number, repeat: number) {
  const normalized = ((value - origin) % repeat + repeat) % repeat
  return Math.min(normalized, repeat - normalized)
}

function containsFootprint(parcel: PlannedParcel, center: Vec3, size: Vec3) {
  return (
    Math.abs(center[0] - parcel.center[0]) + size[0] / 2 <= parcel.size[0] / 2 &&
    Math.abs(center[2] - parcel.center[2]) + size[2] / 2 <= parcel.size[2] / 2
  )
}

function planHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
