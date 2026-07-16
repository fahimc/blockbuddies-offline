import { realScale } from '../game/scale'
import type { Vec3 } from '../game/types'

export const proceduralChunkSize = 36
export const proceduralRoadRepeat = proceduralChunkSize * 2
export const proceduralRoadOrigin = proceduralChunkSize / 2

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
    layout.hasVerticalRoad ? layout.centerX : undefined,
    transportHalfWidth,
  )
  const zSegments = splitAvailableAxis(
    layout.z0,
    layout.z0 + proceduralChunkSize,
    layout.hasHorizontalRoad ? layout.centerZ : undefined,
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
    let use: PlannedParcelUse = 'buildable'
    if (index === parkIndex) use = 'park'
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
  return {
    x0,
    z0,
    centerX: x0 + proceduralChunkSize / 2,
    centerZ: z0 + proceduralChunkSize / 2,
    hasHorizontalRoad: Math.abs(cz) % 2 === 0,
    hasVerticalRoad: Math.abs(cx) % 2 === 0,
  }
}

export function proceduralTerrainAt(x: number, z: number): 'ground' | 'road' | 'sidewalk' {
  const distanceToVerticalRoad = distanceToRepeatingLine(x, proceduralRoadOrigin, proceduralRoadRepeat)
  const distanceToHorizontalRoad = distanceToRepeatingLine(z, proceduralRoadOrigin, proceduralRoadRepeat)
  const nearestRoad = Math.min(distanceToVerticalRoad, distanceToHorizontalRoad)
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

function splitAvailableAxis(min: number, max: number, roadCenter: number | undefined, transportHalfWidth: number) {
  const available = roadCenter === undefined
    ? [{ min: min + parcelEdgeInset, max: max - parcelEdgeInset }]
    : [
        { min: min + parcelEdgeInset, max: roadCenter - transportHalfWidth },
        { min: roadCenter + transportHalfWidth, max: max - parcelEdgeInset },
      ]

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
  if (layout.hasHorizontalRoad) {
    candidates.push({ distance: Math.abs(z - layout.centerZ), yaw: z < layout.centerZ ? 0 : Math.PI })
  }
  if (layout.hasVerticalRoad) {
    candidates.push({ distance: Math.abs(x - layout.centerX), yaw: x < layout.centerX ? Math.PI / 2 : -Math.PI / 2 })
  }
  candidates.sort((a, b) => a.distance - b.distance)
  return candidates[0]?.yaw ?? 0
}

function plannedSidewalkFurniture(layout: ProceduralChunkRoadLayout): Vec3[] {
  const points: Vec3[] = []
  const furnitureOffset = realScale.roadTile / 2 + realScale.pavementWidth * 0.78
  const along = [7, proceduralChunkSize - 7]

  if (layout.hasHorizontalRoad) {
    for (const xOffset of along) {
      const x = layout.x0 + xOffset
      if (layout.hasVerticalRoad && Math.abs(x - layout.centerX) <= realScale.roadTile / 2 + realScale.pavementWidth) continue
      points.push([x, 0, layout.centerZ - furnitureOffset], [x, 0, layout.centerZ + furnitureOffset])
    }
  }
  if (layout.hasVerticalRoad) {
    for (const zOffset of along) {
      const z = layout.z0 + zOffset
      if (layout.hasHorizontalRoad && Math.abs(z - layout.centerZ) <= realScale.roadTile / 2 + realScale.pavementWidth) continue
      points.push([layout.centerX - furnitureOffset, 0, z], [layout.centerX + furnitureOffset, 0, z])
    }
  }
  return points
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
