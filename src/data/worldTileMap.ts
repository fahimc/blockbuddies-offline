import { obbyPlatforms } from '../ai/obby'
import { realScale } from '../game/scale'
import { outdoorBenchFixtures } from '../game/seating'
import {
  coreActivityPositions,
  coreCoinPositions,
  coreTerrainZones,
  staticLampPositions,
  staticTownBuildings,
  staticTreePositions,
} from '../game/townPlacement'
import type { Vec3 } from '../game/types'
import { parkingLot, parkedVehicleDefinitions } from '../game/vehicles'
import {
  terrainAt,
  worldGridCellSize,
  type WorldTerrain,
} from '../game/worldGrid'
import {
  generateProceduralWorld,
  type ProceduralPiece,
} from './proceduralWorld'
import { proceduralChunkSize, proceduralTerrainAt } from './proceduralTownPlan'
import {
  footballStadiumCenter,
  footballStadiumFootprint,
  terrainOverrideForWorldFeature,
} from './worldFeatures'
import { jobDefinitions, workplaceBuildings } from './jobs'

export type WorldTileTerrain = WorldTerrain | 'parking'
export type WorldTileObjectKind =
  | 'building'
  | 'tree'
  | 'lamp'
  | 'phone-box'
  | 'coin'
  | 'activity'
  | 'landmark'
  | 'fixture'
  | 'vehicle'

export type WorldTileObject = {
  id: string
  label: string
  kind: WorldTileObjectKind
  source: 'authored' | 'procedural'
  center: Vec3
  size: Vec3
}

export type WorldTile = {
  x: number
  z: number
  terrain: WorldTileTerrain
  objectIds: string[]
}

export type WorldMapDiagnostic = {
  code: 'OBJECT_ON_FORBIDDEN_TERRAIN' | 'OBJECT_CELL_CONFLICT'
  message: string
  x: number
  z: number
  objectIds: string[]
}

export type WorldTileMap = {
  seed: string
  cellSize: number
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
  columns: number
  rows: number
  tiles: WorldTile[]
  objects: WorldTileObject[]
  diagnostics: WorldMapDiagnostic[]
}

const allowedTerrain: Record<WorldTileObjectKind, readonly WorldTileTerrain[]> =
  {
    building: ['ground', 'park'],
    tree: ['ground', 'park'],
    lamp: ['sidewalk'],
    'phone-box': ['sidewalk'],
    coin: ['ground', 'park', 'sidewalk'],
    activity: ['ground', 'park'],
    landmark: ['ground', 'park'],
    fixture: ['ground', 'park', 'sidewalk'],
    vehicle: ['parking', 'road'],
  }

export function createWorldTileMap(
  seed = 'LONDON-2026',
  viewDistance: 1 | 2 | 3 = 3,
): WorldTileMap {
  const world = generateProceduralWorld({
    seed,
    center: [proceduralChunkSize / 2, 0, proceduralChunkSize / 2],
    viewDistance,
    night: false,
  })
  const halfSpan = proceduralChunkSize * viewDistance
  const bounds = {
    minX: -halfSpan,
    maxX: proceduralChunkSize + halfSpan,
    minZ: -halfSpan,
    maxZ: proceduralChunkSize + halfSpan,
  }
  const parks = world.pieces.filter((piece) => piece.kind === 'park')
  const objects = [
    ...authoredMapObjects(),
    ...proceduralMapObjects(world.pieces),
  ].filter((object) => footprintTouchesBounds(object, bounds))
  const objectByCell = new Map<string, string[]>()
  const diagnostics: WorldMapDiagnostic[] = []
  const diagnosticKeys = new Set<string>()

  for (const object of objects) {
    for (const { x, z } of footprintCells(object.center, object.size)) {
      if (
        x < bounds.minX ||
        x >= bounds.maxX ||
        z < bounds.minZ ||
        z >= bounds.maxZ
      )
        continue
      const key = tileKey(x, z)
      const terrain = worldTerrainAt(x, z, parks)
      if (!allowedTerrain[object.kind].includes(terrain)) {
        const diagnosticKey = `terrain:${object.id}:${terrain}`
        if (!diagnosticKeys.has(diagnosticKey)) {
          diagnostics.push({
            code: 'OBJECT_ON_FORBIDDEN_TERRAIN',
            message: `${object.label} (${object.kind}) occupies ${terrain}`,
            x,
            z,
            objectIds: [object.id],
          })
          diagnosticKeys.add(diagnosticKey)
        }
      }
      const owners = objectByCell.get(key) ?? []
      const conflictingOwners = owners.filter((ownerId) =>
        canConflict(ownerId, object.id, objects),
      )
      if (conflictingOwners.length > 0) {
        const conflictIds = [...conflictingOwners, object.id].sort()
        const diagnosticKey = `conflict:${conflictIds.join(':')}`
        if (!diagnosticKeys.has(diagnosticKey)) {
          diagnostics.push({
            code: 'OBJECT_CELL_CONFLICT',
            message: `${conflictIds.join(' and ')} share an occupied tile`,
            x,
            z,
            objectIds: conflictIds,
          })
          diagnosticKeys.add(diagnosticKey)
        }
      }
      objectByCell.set(key, [...owners, object.id])
    }
  }

  const tiles: WorldTile[] = []
  for (let z = bounds.minZ; z < bounds.maxZ; z += worldGridCellSize) {
    for (let x = bounds.minX; x < bounds.maxX; x += worldGridCellSize) {
      tiles.push({
        x,
        z,
        terrain: worldTerrainAt(x, z, parks),
        objectIds: objectByCell.get(tileKey(x, z)) ?? [],
      })
    }
  }

  return {
    seed,
    cellSize: worldGridCellSize,
    bounds,
    columns: Math.round((bounds.maxX - bounds.minX) / worldGridCellSize),
    rows: Math.round((bounds.maxZ - bounds.minZ) / worldGridCellSize),
    tiles,
    objects,
    diagnostics,
  }
}

export function worldTerrainAt(
  x: number,
  z: number,
  proceduralParks: ProceduralPiece[] = [],
): WorldTileTerrain {
  const featureTerrain = terrainOverrideForWorldFeature(x, z)
  if (featureTerrain) return featureTerrain
  const generatedTerrain = proceduralTerrainAt(x, z)
  if (generatedTerrain === 'road' || generatedTerrain === 'sidewalk')
    return generatedTerrain
  if (
    containsTopDown(
      parkingLot.center,
      [parkingLot.width, 1, parkingLot.depth],
      x,
      z,
    )
  )
    return 'parking'
  if (
    containsTopDown(
      parkingLot.drivewayCenter,
      [parkingLot.drivewayWidth, 1, parkingLot.drivewayDepth],
      x,
      z,
    )
  )
    return 'parking'
  if (terrainAt(x, z, coreTerrainZones) === 'park') return 'park'
  if (
    proceduralParks.some((park) =>
      containsTopDown(park.position, park.scale, x, z),
    )
  )
    return 'park'
  return 'ground'
}

function authoredMapObjects(): WorldTileObject[] {
  return [
    ...staticTownBuildings.map((building) =>
      mapObject(
        `authored:${building.id}`,
        building.title,
        'building',
        'authored',
        building.position,
        building.scale,
      ),
    ),
    ...staticTreePositions.map((center, index) =>
      mapObject(
        `authored:tree:${index}`,
        `Town tree ${index + 1}`,
        'tree',
        'authored',
        center,
        [realScale.treeCanopySize, 1, realScale.treeCanopySize],
      ),
    ),
    ...staticLampPositions.map((center, index) =>
      mapObject(
        `authored:lamp:${index}`,
        `Street lamp ${index + 1}`,
        'lamp',
        'authored',
        center,
        [0.8, 1, 0.8],
      ),
    ),
    ...outdoorBenchFixtures.map((fixture, index) =>
      mapObject(
        `authored:bench:${index}`,
        `Bench ${index + 1}`,
        'fixture',
        'authored',
        fixture.position,
        [2.2, 1, 1],
      ),
    ),
    ...Object.entries(coreActivityPositions).map(([id, center]) =>
      mapObject(
        `authored:activity:${id}`,
        id.replaceAll('-', ' '),
        'activity',
        'authored',
        center,
        [2.6, 1, 2.6],
      ),
    ),
    ...coreCoinPositions.map((center, index) =>
      mapObject(
        `authored:coin:${index}`,
        `Coin ${index + 1}`,
        'coin',
        'authored',
        center,
        [0.8, 1, 0.8],
      ),
    ),
    ...obbyPlatforms.map((platform, index) =>
      mapObject(
        `authored:obby:${index}`,
        `Obby platform ${index + 1}`,
        'activity',
        'authored',
        platform.position,
        platform.scale,
      ),
    ),
    ...parkedVehicleDefinitions.map((vehicle) =>
      mapObject(
        `authored:vehicle:${vehicle.id}`,
        vehicle.label,
        'vehicle',
        'authored',
        vehicle.position,
        [realScale.carLength, 1, realScale.carWidth],
      ),
    ),
    mapObject(
      'authored:football-stadium',
      'Football Stadium',
      'landmark',
      'authored',
      footballStadiumCenter,
      [footballStadiumFootprint.width, 1, footballStadiumFootprint.depth],
    ),
    ...workplaceBuildings.map((building) =>
      mapObject(
        `authored:workplace:${building.id}`,
        building.label,
        'building',
        'authored',
        building.position,
        building.size,
      ),
    ),
    ...jobDefinitions.flatMap((job) =>
      job.tasks.flatMap((task) => [
        mapObject(
          `authored:job-task:${task.id}`,
          task.label,
          'activity',
          'authored',
          task.position,
          [1.2, 1, 1.2],
        ),
        ...task.variants
          .filter(
            (variant) =>
              variant.position &&
              (variant.position[0] !== task.position[0] ||
                variant.position[2] !== task.position[2]),
          )
          .map((variant) =>
            mapObject(
              `authored:job-task:${task.id}:${variant.id}`,
              `${task.label}: ${variant.orderLabel}`,
              'activity',
              'authored',
              variant.position!,
              [1.2, 1, 1.2],
            ),
          ),
      ]),
    ),
  ]
}

function proceduralMapObjects(pieces: ProceduralPiece[]): WorldTileObject[] {
  return pieces.flatMap((piece): WorldTileObject[] => {
    if (piece.kind === 'building') {
      return [
        mapObject(
          piece.id,
          piece.id.startsWith('landmark:') ? 'Clocktower Hall' : piece.id,
          piece.id.startsWith('landmark:') ? 'landmark' : 'building',
          'procedural',
          piece.position,
          orientedFootprint(piece),
        ),
      ]
    }
    if (piece.kind === 'tree-trunk') {
      return [
        mapObject(piece.id, piece.id, 'tree', 'procedural', piece.position, [
          realScale.treeCanopySize,
          1,
          realScale.treeCanopySize,
        ]),
      ]
    }
    if (piece.kind === 'lamp-post') {
      return [
        mapObject(
          piece.id,
          piece.id,
          'lamp',
          'procedural',
          piece.position,
          [0.8, 1, 0.8],
        ),
      ]
    }
    if (piece.kind === 'phone-box') {
      return [
        mapObject(
          piece.id,
          piece.id,
          'phone-box',
          'procedural',
          piece.position,
          piece.scale,
        ),
      ]
    }
    return []
  })
}

function mapObject(
  id: string,
  label: string,
  kind: WorldTileObjectKind,
  source: WorldTileObject['source'],
  center: Vec3,
  size: Vec3,
): WorldTileObject {
  return { id, label, kind, source, center, size }
}

function footprintCells(center: Vec3, size: Vec3) {
  const halfCell = worldGridCellSize / 2
  const minX =
    Math.ceil(
      (center[0] - size[0] / 2 - halfCell + 0.001) / worldGridCellSize,
    ) * worldGridCellSize
  const maxX =
    Math.floor(
      (center[0] + size[0] / 2 + halfCell - 0.001) / worldGridCellSize,
    ) * worldGridCellSize
  const minZ =
    Math.ceil(
      (center[2] - size[2] / 2 - halfCell + 0.001) / worldGridCellSize,
    ) * worldGridCellSize
  const maxZ =
    Math.floor(
      (center[2] + size[2] / 2 + halfCell - 0.001) / worldGridCellSize,
    ) * worldGridCellSize
  const cells: Array<{ x: number; z: number }> = []
  for (let x = minX; x <= maxX; x += worldGridCellSize) {
    for (let z = minZ; z <= maxZ; z += worldGridCellSize) cells.push({ x, z })
  }
  return cells
}

function orientedFootprint(piece: ProceduralPiece): Vec3 {
  const yaw = piece.rotation?.[1] ?? 0
  const cosine = Math.abs(Math.cos(yaw))
  const sine = Math.abs(Math.sin(yaw))
  return [
    piece.scale[0] * cosine + piece.scale[2] * sine,
    piece.scale[1],
    piece.scale[0] * sine + piece.scale[2] * cosine,
  ]
}

function canConflict(
  firstId: string,
  secondId: string,
  objects: WorldTileObject[],
) {
  if (
    firstId.startsWith('authored:obby:') &&
    secondId.startsWith('authored:obby:')
  )
    return false
  const first = objects.find((object) => object.id === firstId)
  const second = objects.find((object) => object.id === secondId)
  if (!first || !second) return false
  if (first.kind === 'coin' || second.kind === 'coin') return true
  if (first.kind === 'activity' || second.kind === 'activity') return true
  return first.kind !== 'lamp' || second.kind !== 'fixture'
}

function footprintTouchesBounds(
  object: WorldTileObject,
  bounds: WorldTileMap['bounds'],
) {
  return (
    object.center[0] + object.size[0] / 2 > bounds.minX &&
    object.center[0] - object.size[0] / 2 < bounds.maxX &&
    object.center[2] + object.size[2] / 2 > bounds.minZ &&
    object.center[2] - object.size[2] / 2 < bounds.maxZ
  )
}

function containsTopDown(center: Vec3, size: Vec3, x: number, z: number) {
  return (
    Math.abs(x - center[0]) <= size[0] / 2 &&
    Math.abs(z - center[2]) <= size[2] / 2
  )
}

function tileKey(x: number, z: number) {
  return `${x}:${z}`
}
