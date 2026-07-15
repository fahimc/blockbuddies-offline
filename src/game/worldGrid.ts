import type { Vec3 } from './types'

export const worldGridCellSize = 1

export type WorldTerrain = 'ground' | 'road' | 'sidewalk' | 'park'
export type WorldObjectKind = 'building' | 'tree' | 'lamp' | 'phone-box' | 'coin' | 'activity' | 'landmark'

export type WorldFootprint = {
  id: string
  center: Vec3
  size: Vec3
}

export type TerrainZone = WorldFootprint & { terrain: Exclude<WorldTerrain, 'ground'> }

const allowedTerrain: Record<WorldObjectKind, readonly WorldTerrain[]> = {
  building: ['ground'],
  tree: ['ground', 'park'],
  lamp: ['sidewalk'],
  'phone-box': ['sidewalk'],
  coin: ['ground', 'park', 'sidewalk'],
  activity: ['ground', 'park'],
  landmark: ['ground'],
}

export function snapWorldValue(value: number) {
  return Math.round(value / worldGridCellSize) * worldGridCellSize
}

export function snapWorldPoint([x, y, z]: Vec3): Vec3 {
  return [snapWorldValue(x), y, snapWorldValue(z)]
}

export function terrainAt(x: number, z: number, zones: TerrainZone[]): WorldTerrain {
  let result: WorldTerrain = 'ground'
  for (const zone of zones) {
    if (!containsTopDown(zone, x, z)) continue
    if (zone.terrain === 'road') return 'road'
    if (zone.terrain === 'sidewalk') result = 'sidewalk'
    else if (zone.terrain === 'park' && result === 'ground') result = 'park'
  }
  return result
}

export function footprintTerrains(footprint: WorldFootprint, zones: TerrainZone[]) {
  const terrains = new Set<WorldTerrain>()
  for (const cell of footprintCells(footprint)) {
    terrains.add(terrainAt(cell.x, cell.z, zones))
  }
  return terrains
}

export function terrainAllowsObject(kind: WorldObjectKind, footprint: WorldFootprint, zones: TerrainZone[]) {
  const allowed = allowedTerrain[kind]
  return [...footprintTerrains(footprint, zones)].every((terrain) => allowed.includes(terrain))
}

export class WorldOccupancyGrid {
  private readonly occupied = new Map<string, string>()

  canReserve(footprint: WorldFootprint) {
    return footprintCells(footprint).every((cell) => !this.occupied.has(cell.key))
  }

  reserve(footprint: WorldFootprint) {
    if (!this.canReserve(footprint)) return false
    footprintCells(footprint).forEach((cell) => this.occupied.set(cell.key, footprint.id))
    return true
  }

  ownerAt(x: number, z: number) {
    return this.occupied.get(cellKey(snapWorldValue(x), snapWorldValue(z)))
  }
}

export function placeOnWorldGrid(
  kind: WorldObjectKind,
  footprint: WorldFootprint,
  zones: TerrainZone[],
  occupancy: WorldOccupancyGrid,
) {
  const snapped: WorldFootprint = { ...footprint, center: snapWorldPoint(footprint.center) }
  if (!terrainAllowsObject(kind, snapped, zones)) return undefined
  return occupancy.reserve(snapped) ? snapped : undefined
}

function footprintCells(footprint: WorldFootprint) {
  const epsilon = 0.001
  const minX = footprint.center[0] - footprint.size[0] / 2 + epsilon
  const maxX = footprint.center[0] + footprint.size[0] / 2 - epsilon
  const minZ = footprint.center[2] - footprint.size[2] / 2 + epsilon
  const maxZ = footprint.center[2] + footprint.size[2] / 2 - epsilon
  const cells: { x: number; z: number; key: string }[] = []
  const startX = Math.floor(minX / worldGridCellSize) * worldGridCellSize
  const endX = Math.floor(maxX / worldGridCellSize) * worldGridCellSize
  const startZ = Math.floor(minZ / worldGridCellSize) * worldGridCellSize
  const endZ = Math.floor(maxZ / worldGridCellSize) * worldGridCellSize

  for (let x = startX; x <= endX; x += worldGridCellSize) {
    for (let z = startZ; z <= endZ; z += worldGridCellSize) {
      cells.push({ x, z, key: cellKey(x, z) })
    }
  }
  return cells
}

function cellKey(x: number, z: number) {
  return `${x.toFixed(3)}:${z.toFixed(3)}`
}

function containsTopDown(zone: WorldFootprint, x: number, z: number) {
  return (
    Math.abs(x - zone.center[0]) <= zone.size[0] / 2 &&
    Math.abs(z - zone.center[2]) <= zone.size[2] / 2
  )
}
