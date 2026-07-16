import { outdoorBenchFixtures } from './seating'
import { buildingCenterPosition, buildingScale, realScale } from './scale'
import type { InteriorKind, Vec3 } from './types'
import {
  WorldOccupancyGrid,
  placeOnWorldGrid,
  terrainAt,
  type TerrainZone,
  type WorldFootprint,
} from './worldGrid'

export type StaticTownBuilding = {
  id: string
  title: string
  interiorKind: InteriorKind
  position: Vec3
  color: string
  scale: Vec3
  floors: number
}

export const staticTownBuildings: StaticTownBuilding[] = [
  staticBuilding('park-clubhouse', 'Park Clubhouse', 'house', -12, -8, 2, 4.2, 3.6, '#22c55e'),
  staticBuilding('coin-shop', 'Coin Shop', 'shop', 12, -7, 2, 4.6, 3.8, '#fb923c'),
  staticBuilding('skill-school', 'Skill School', 'school', -22, 10, 3, 5.4, 4.2, '#a78bfa'),
  staticBuilding('buddy-house-a', 'Buddy House', 'house', 2, 18, 2, 4.4, 3.8, '#facc15'),
  staticBuilding('buddy-house-b', 'Pink Buddy House', 'house', -4, 18, 2, 3.8, 3.4, '#f9a8d4'),
  staticBuilding('buddy-house-c', 'Blue Buddy House', 'house', 8, 18, 2, 3.8, 3.4, '#93c5fd'),
]

export const staticTreePositions: Vec3[] = [
  [-18, 0, -17],
  [-10, 0, -16],
  [18, 0, -18],
  [22, 0, -8],
  [-20, 0, -5],
  [-24, 0, 3],
  [-20, 0, 17],
]

export const staticLampPositions: Vec3[] = [
  [-7, 0, -14],
  [7, 0, -14],
  [-7, 0, -2],
  [7, 0, -2],
  [-10, 0, 16],
  [10, 0, 16],
]

export const coreRoadZones: TerrainZone[] = [
  { id: 'core-road-vertical', terrain: 'road', center: [0, 0, -7.5], size: [realScale.roadTile, 0.08, 22] },
  { id: 'core-road-horizontal', terrain: 'road', center: [0, 0, 9], size: [32, 0.08, realScale.roadTile] },
]

export const authoredCoreBounds = {
  minX: -27,
  maxX: 27,
  minZ: -27,
  maxZ: 27,
}

export function footprintOverlapsAuthoredCore(center: Vec3, size: Vec3, padding = 0) {
  const minX = center[0] - size[0] / 2 - padding
  const maxX = center[0] + size[0] / 2 + padding
  const minZ = center[2] - size[2] / 2 - padding
  const maxZ = center[2] + size[2] / 2 + padding
  return (
    maxX > authoredCoreBounds.minX &&
    minX < authoredCoreBounds.maxX &&
    maxZ > authoredCoreBounds.minZ &&
    minZ < authoredCoreBounds.maxZ
  )
}

const coreSidewalkOffset = realScale.roadTile / 2 + realScale.pavementWidth / 2

export const coreTerrainZones: TerrainZone[] = [
  ...coreRoadZones,
  { id: 'core-walk-vertical-west', terrain: 'sidewalk', center: [-coreSidewalkOffset, 0, -7.5], size: [realScale.pavementWidth, 0.06, 22] },
  { id: 'core-walk-vertical-east', terrain: 'sidewalk', center: [coreSidewalkOffset, 0, -7.5], size: [realScale.pavementWidth, 0.06, 22] },
  { id: 'core-walk-horizontal-south', terrain: 'sidewalk', center: [0, 0, 9 - coreSidewalkOffset], size: [32, 0.06, realScale.pavementWidth] },
  { id: 'core-walk-horizontal-north', terrain: 'sidewalk', center: [0, 0, 9 + coreSidewalkOffset], size: [32, 0.06, realScale.pavementWidth] },
  { id: 'core-buddy-park', terrain: 'park', center: [-12, 0, -8], size: [13, 0.06, 12] },
]

export const coreReservedFootprints: WorldFootprint[] = [
  ...staticTownBuildings.map((building) => ({ id: building.id, center: building.position, size: building.scale })),
  ...staticTreePositions.map((position, index) => ({
    id: `tree:${index}`,
    center: position,
    size: [realScale.treeCanopySize, 1, realScale.treeCanopySize] as Vec3,
  })),
  ...staticLampPositions.map((position, index) => ({ id: `lamp:${index}`, center: position, size: [1, 1, 1] as Vec3 })),
  ...outdoorBenchFixtures.map((fixture, index) => ({ id: `bench:${index}`, center: fixture.position, size: [2.2, 1, 1] as Vec3 })),
  { id: 'billboard', center: [-11, 0, 2], size: [4.2, 1, 1] },
]

const coreItemLayout = placeCoreItems()

export const coreActivityPositions = coreItemLayout.activities
export const coreCoinPositions = coreItemLayout.coins

function staticBuilding(
  id: string,
  title: string,
  interiorKind: InteriorKind,
  x: number,
  z: number,
  floors: number,
  widthMeters: number,
  depthMeters: number,
  color: string,
): StaticTownBuilding {
  return {
    id,
    title,
    interiorKind,
    position: buildingCenterPosition(x, z, floors),
    scale: buildingScale(floors, widthMeters, depthMeters),
    floors,
    color,
  }
}

function placeCoreItems() {
  const occupancy = new WorldOccupancyGrid()
  coreReservedFootprints.forEach((footprint) => occupancy.reserve(footprint))
  const activityCandidates = {
    'coin-rush': [15, 0, -2] as Vec3,
    'delivery-dash': [21, 0, -12] as Vec3,
    'hide-and-seek': [-20, 0, 23] as Vec3,
  }
  const activities = Object.fromEntries(
    Object.entries(activityCandidates).map(([id, center]) => {
      const placed = placeOnWorldGrid(
        'activity',
        { id: `activity:${id}`, center, size: [2.6, 1, 2.6] },
        coreTerrainZones,
        occupancy,
      )
      if (!placed) throw new Error(`Invalid core activity placement: ${id}`)
      return [id, placed.center]
    }),
  ) as Record<keyof typeof activityCandidates, Vec3>

  const coinCandidates: Vec3[] = [
    [-18, 0.8, -11],
    [-16, 0.8, -2],
    [-10, 0.8, -1],
    [9, 0.8, -2],
    [15, 0.8, -11],
    [22, 0.8, -14],
    [18, 0.8, 17],
    [-18, 0.8, 18],
    [10, 0.8, 23],
    [-10, 0.8, 23],
  ]
  const coins = coinCandidates.flatMap((candidate, index) => {
    const placed = placeOnWorldGrid(
      'coin',
      { id: `coin:${index}`, center: candidate, size: [0.8, 1, 0.8] },
      coreTerrainZones,
      occupancy,
    )
    return placed ? [placed.center] : []
  })
  const roadCoins = coins.filter(([x, , z]) => terrainAt(x, z, coreTerrainZones) === 'road')
  if (roadCoins.length > 0) throw new Error(`Core coins placed on roads: ${roadCoins.map((position) => position.join(',')).join('; ')}`)
  return { activities, coins }
}
