import type { Vec3 } from '../game/types'
import { buildingHeightForFloors, floorCountFromHeight, meters, realScale } from '../game/scale'

export type ProceduralPieceKind =
  | 'ground'
  | 'water'
  | 'road'
  | 'pavement'
  | 'line'
  | 'park'
  | 'building'
  | 'door'
  | 'roof'
  | 'window'
  | 'tree-trunk'
  | 'tree-top'
  | 'lamp-post'
  | 'lamp-light'
  | 'bus'
  | 'phone-box'
  | 'landmark'

export type ProceduralPiece = {
  id: string
  kind: ProceduralPieceKind
  position: Vec3
  scale: Vec3
  color: string
  rotation?: Vec3
  emissive?: string
  emissiveIntensity?: number
}

export type ProceduralWorldInput = {
  seed: string
  center: Vec3
  viewDistance: 1 | 2 | 3
  night: boolean
}

export type ProceduralWorld = {
  pieces: ProceduralPiece[]
  buildingCount: number
  district: string
}

const chunkSize = 36
const riverWidth = 9
const treeRoadClearance = realScale.roadTile * 0.72 + 0.72
const buildingPalette = ['#f97316', '#facc15', '#93c5fd', '#a78bfa', '#fb7185', '#22c55e', '#f9a8d4']
const roofPalette = ['#ef4444', '#1d4ed8', '#7c3aed', '#0f172a', '#92400e']
type RandomSource = () => number

type ChunkRoadLayout = {
  x0: number
  z0: number
  centerX: number
  centerZ: number
  hasHorizontalRoad: boolean
  hasVerticalRoad: boolean
}

export function generateProceduralWorld({ seed, center, viewDistance, night }: ProceduralWorldInput): ProceduralWorld {
  const chunks = chunkRange(center, viewDistance)
  const pieces: ProceduralPiece[] = []
  let buildingCount = 0

  for (const [cx, cz] of chunks) {
    const chunk = generateChunk(seed, cx, cz, night)
    buildingCount += chunk.buildingCount
    pieces.push(...chunk.pieces)
  }

  pieces.push(...buildLandmarks(night))

  return {
    pieces,
    buildingCount,
    district: districtFor(center),
  }
}

export function districtFor([x, , z]: Vec3): string {
  if (x < -44 && Math.abs(z) < 18) return 'Westminster'
  if (x > 48 && Math.abs(z) < 18) return 'Tower Riverside'
  if (x > 18 && z < -18) return 'The City'
  if (x < -12 && z > 18) return 'South Bank'
  if (Math.abs(z) <= riverWidth) return 'River Walk'
  return z < 0 ? 'North Bank' : 'South Borough'
}

function generateChunk(seed: string, cx: number, cz: number, night: boolean): { pieces: ProceduralPiece[]; buildingCount: number } {
  const random = rng(`${seed}:${cx}:${cz}`)
  const x0 = cx * chunkSize
  const z0 = cz * chunkSize
  const centerX = x0 + chunkSize / 2
  const centerZ = z0 + chunkSize / 2
  const roadLayout = chunkRoadLayout(cx, cz)
  const pieces: ProceduralPiece[] = [
    piece(`ground:${cx}:${cz}`, 'ground', [centerX, -0.12, centerZ], [chunkSize, 0.12, chunkSize], '#6fde6a'),
  ]
  let buildingCount = 0

  if (Math.abs(centerZ) < chunkSize + riverWidth) {
    pieces.push(piece(`water:${cx}:${cz}`, 'water', [centerX, -0.04, 0], [chunkSize, 0.06, riverWidth * 2], '#38bdf8', undefined, night ? '#0ea5e9' : undefined, night ? 0.08 : 0))
  }

  const hasHorizontalRoad = Math.abs(cz) % 2 === 0
  const hasVerticalRoad = Math.abs(cx) % 2 === 0
  if (hasHorizontalRoad) {
    pieces.push(piece(`road-x:${cx}:${cz}`, 'road', [centerX, 0.01, centerZ], [chunkSize, 0.08, realScale.roadTile], '#9ca3af'))
    pieces.push(piece(`line-x:${cx}:${cz}`, 'line', [centerX, 0.065, centerZ], [chunkSize * 0.8, 0.025, 0.14], '#fde047'))
    pieces.push(piece(`pavement-x-a:${cx}:${cz}`, 'pavement', [centerX, 0.035, centerZ - realScale.roadTile * 0.72], [chunkSize, 0.055, 1.1], '#e5e7eb'))
    pieces.push(piece(`pavement-x-b:${cx}:${cz}`, 'pavement', [centerX, 0.035, centerZ + realScale.roadTile * 0.72], [chunkSize, 0.055, 1.1], '#e5e7eb'))
  }
  if (hasVerticalRoad) {
    pieces.push(piece(`road-z:${cx}:${cz}`, 'road', [centerX, 0.015, centerZ], [realScale.roadTile, 0.09, chunkSize], '#94a3b8'))
    pieces.push(piece(`line-z:${cx}:${cz}`, 'line', [centerX, 0.07, centerZ], [0.14, 0.025, chunkSize * 0.8], '#fde047'))
    pieces.push(piece(`pavement-z-a:${cx}:${cz}`, 'pavement', [centerX - realScale.roadTile * 0.72, 0.04, centerZ], [1.1, 0.055, chunkSize], '#e5e7eb'))
    pieces.push(piece(`pavement-z-b:${cx}:${cz}`, 'pavement', [centerX + realScale.roadTile * 0.72, 0.04, centerZ], [1.1, 0.055, chunkSize], '#e5e7eb'))
  }

  const parkChance = random()
  if (parkChance > 0.72 || (Math.abs(cx) === 1 && Math.abs(cz) === 1)) {
    pieces.push(piece(`park:${cx}:${cz}`, 'park', [centerX + 7, 0.02, centerZ - 7], [12, 0.07, 10], '#34d399'))
    for (let i = 0; i < 5; i += 1) {
      addTree(pieces, `park-tree:${cx}:${cz}:${i}`, findClearSceneryPoint(random, roadLayout, x0 + 7, x0 + 29, z0 + 7, z0 + 29))
    }
  } else {
    const plots = [
      [x0 + 9, z0 + 9],
      [x0 + 27, z0 + 9],
      [x0 + 9, z0 + 27],
      [x0 + 27, z0 + 27],
    ] as const
    plots.forEach(([x, z], index) => {
      if ((hasHorizontalRoad && Math.abs(z - centerZ) < 7.5) || (hasVerticalRoad && Math.abs(x - centerX) < 7.5)) return
      const floors = 2 + Math.floor(random() * 4)
      const height = buildingHeightForFloors(floors)
      const width = meters(3.8 + random() * 1.8)
      const depth = meters(3.6 + random() * 1.8)
      const color = buildingPalette[Math.floor(random() * buildingPalette.length)]
      const roof = roofPalette[Math.floor(random() * roofPalette.length)]
      addBuilding(pieces, `building:${cx}:${cz}:${index}`, [x, height / 2, z], [width, height, depth], color, roof)
      buildingCount += 1
    })
  }

  for (let i = 0; i < 4; i += 1) {
    addTree(pieces, `street-tree:${cx}:${cz}:${i}`, findStreetTreePoint(random, roadLayout, i))
  }

  if (hasHorizontalRoad && random() > 0.64) {
    addBus(pieces, `bus:${cx}:${cz}`, [centerX - 8 + random() * 16, 0, centerZ + (random() > 0.5 ? 0.9 : -0.9)])
  }
  if (random() > 0.76) {
    const phonePosition = findClearSceneryPoint(random, roadLayout, x0 + 4, x0 + 32, z0 + 4, z0 + 32)
    pieces.push(piece(`phone:${cx}:${cz}`, 'phone-box', [phonePosition[0], realScale.phoneBoxHeight / 2, phonePosition[2]], [realScale.phoneBoxWidth, realScale.phoneBoxHeight, realScale.phoneBoxWidth], '#dc2626'))
  }
  if (night || random() > 0.58) {
    addLamp(pieces, `lamp:${cx}:${cz}:a`, [x0 + 5, 0, z0 + 5], night)
    addLamp(pieces, `lamp:${cx}:${cz}:b`, [x0 + 31, 0, z0 + 31], night)
  }

  return { pieces, buildingCount }
}

function chunkRoadLayout(cx: number, cz: number): ChunkRoadLayout {
  const x0 = cx * chunkSize
  const z0 = cz * chunkSize
  return {
    x0,
    z0,
    centerX: x0 + chunkSize / 2,
    centerZ: z0 + chunkSize / 2,
    hasHorizontalRoad: Math.abs(cz) % 2 === 0,
    hasVerticalRoad: Math.abs(cx) % 2 === 0,
  }
}

function findStreetTreePoint(random: RandomSource, layout: ChunkRoadLayout, index: number): Vec3 {
  const roadEdgeOffset = treeRoadClearance + 0.78
  if (layout.hasHorizontalRoad) {
    const z = layout.centerZ + (index % 2 === 0 ? -roadEdgeOffset : roadEdgeOffset)
    const point = sampleClearBand(random, layout, layout.x0 + 4, layout.x0 + chunkSize - 4, z - 0.35, z + 0.35)
    if (point) return point
  }

  if (layout.hasVerticalRoad) {
    const x = layout.centerX + (index % 2 === 0 ? -roadEdgeOffset : roadEdgeOffset)
    const point = sampleClearBand(random, layout, x - 0.35, x + 0.35, layout.z0 + 4, layout.z0 + chunkSize - 4)
    if (point) return point
  }

  const edgeBands = [
    [layout.x0 + 3, layout.x0 + chunkSize - 3, layout.z0 + 2.8, layout.z0 + 4.2],
    [layout.x0 + 3, layout.x0 + chunkSize - 3, layout.z0 + chunkSize - 4.2, layout.z0 + chunkSize - 2.8],
    [layout.x0 + 2.8, layout.x0 + 4.2, layout.z0 + 3, layout.z0 + chunkSize - 3],
    [layout.x0 + chunkSize - 4.2, layout.x0 + chunkSize - 2.8, layout.z0 + 3, layout.z0 + chunkSize - 3],
  ] as const
  const band = edgeBands[index % edgeBands.length]
  return findClearSceneryPoint(random, layout, band[0], band[1], band[2], band[3])
}

function findClearSceneryPoint(
  random: RandomSource,
  layout: ChunkRoadLayout,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): Vec3 {
  const sampled = sampleClearBand(random, layout, minX, maxX, minZ, maxZ)
  if (sampled) return sampled

  const candidates: Vec3[] = [
    [minX, 0, minZ],
    [maxX, 0, minZ],
    [minX, 0, maxZ],
    [maxX, 0, maxZ],
    [layout.x0 + 5, 0, layout.z0 + 5],
    [layout.x0 + chunkSize - 5, 0, layout.z0 + 5],
    [layout.x0 + 5, 0, layout.z0 + chunkSize - 5],
    [layout.x0 + chunkSize - 5, 0, layout.z0 + chunkSize - 5],
  ]
  return candidates.find((candidate) => !isRoadOrPavementPosition(candidate[0], candidate[2], layout)) ?? candidates[0]
}

function sampleClearBand(
  random: RandomSource,
  layout: ChunkRoadLayout,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
) {
  for (let attempt = 0; attempt < 28; attempt += 1) {
    const x = minX + random() * Math.max(0, maxX - minX)
    const z = minZ + random() * Math.max(0, maxZ - minZ)
    if (!isRoadOrPavementPosition(x, z, layout)) return [x, 0, z] as Vec3
  }
  return undefined
}

function isRoadOrPavementPosition(x: number, z: number, layout: ChunkRoadLayout) {
  if (layout.hasHorizontalRoad && Math.abs(z - layout.centerZ) < treeRoadClearance) return true
  if (layout.hasVerticalRoad && Math.abs(x - layout.centerX) < treeRoadClearance) return true
  return false
}

function addBuilding(pieces: ProceduralPiece[], id: string, position: Vec3, scale: Vec3, color: string, roofColor: string) {
  pieces.push(piece(id, 'building', position, scale, color))
  pieces.push(piece(`${id}:roof`, 'roof', [position[0], position[1] + scale[1] / 2 + realScale.roofHeight / 2, position[2]], [scale[0] * 1.08, realScale.roofHeight, scale[2] * 1.08], roofColor))
  pieces.push(piece(`${id}:door`, 'door', [position[0], realScale.doorHeight / 2, position[2] + scale[2] / 2 + 0.04], [realScale.doorWidth, realScale.doorHeight, realScale.doorDepth], '#7c2d12'))
  const windowRows = Math.max(1, floorCountFromHeight(scale[1]))
  for (let row = 0; row < Math.min(windowRows, 6); row += 1) {
    const y = row * realScale.floorHeight + realScale.floorHeight * 0.62
    if (y > scale[1] - realScale.windowHeight / 2) continue
    pieces.push(piece(`${id}:win:${row}:l`, 'window', [position[0] - scale[0] * 0.24, y, position[2] + scale[2] / 2 + 0.05], [realScale.windowWidth, realScale.windowHeight, realScale.windowDepth], '#dbeafe', undefined, '#93c5fd', 0.12))
    pieces.push(piece(`${id}:win:${row}:r`, 'window', [position[0] + scale[0] * 0.24, y, position[2] + scale[2] / 2 + 0.05], [realScale.windowWidth, realScale.windowHeight, realScale.windowDepth], '#dbeafe', undefined, '#93c5fd', 0.12))
  }
}

function addTree(pieces: ProceduralPiece[], id: string, [x, , z]: Vec3) {
  pieces.push(piece(`${id}:trunk`, 'tree-trunk', [x, realScale.treeTrunkHeight / 2, z], [0.32, realScale.treeTrunkHeight, 0.32], '#92400e'))
  pieces.push(piece(`${id}:top`, 'tree-top', [x, realScale.treeTrunkHeight + realScale.treeCanopySize * 0.42, z], [realScale.treeCanopySize, realScale.treeCanopySize, realScale.treeCanopySize], '#16a34a'))
}

function addLamp(pieces: ProceduralPiece[], id: string, [x, , z]: Vec3, night: boolean) {
  pieces.push(piece(`${id}:post`, 'lamp-post', [x, realScale.lampHeight / 2, z], [0.14, realScale.lampHeight, 0.14], '#0f172a'))
  pieces.push(piece(`${id}:light`, 'lamp-light', [x, realScale.lampHeight + 0.28, z], [0.55, 0.55, 0.55], '#fde68a', undefined, '#facc15', night ? 0.95 : 0.32))
}

function addBus(pieces: ProceduralPiece[], id: string, position: Vec3) {
  const lowerHeight = realScale.busHeight * 0.42
  const upperHeight = realScale.busHeight * 0.58
  pieces.push(piece(id, 'bus', [position[0], lowerHeight / 2, position[2]], [realScale.busLength, lowerHeight, realScale.busWidth], '#ef4444'))
  pieces.push(piece(`${id}:top`, 'bus', [position[0], lowerHeight + upperHeight / 2, position[2]], [realScale.busLength * 0.9, upperHeight, realScale.busWidth * 0.86], '#dc2626'))
  pieces.push(piece(`${id}:window`, 'window', [position[0] - 0.2, lowerHeight + upperHeight * 0.56, position[2] + realScale.busWidth * 0.44], [realScale.busLength * 0.55, realScale.windowHeight, realScale.windowDepth], '#bae6fd', undefined, '#60a5fa', 0.1))
}

function buildLandmarks(night: boolean): ProceduralPiece[] {
  const pieces: ProceduralPiece[] = []
  addBuilding(pieces, 'landmark:town-hall', [0, buildingHeightForFloors(3) / 2, -34], [meters(5.8), buildingHeightForFloors(3), meters(5.2)], '#d6a06a', '#2563eb')
  pieces.push(piece('landmark:clock-tower', 'landmark', [0, buildingHeightForFloors(3) + buildingHeightForFloors(2) / 2, -34], [meters(1.6), buildingHeightForFloors(2), meters(1.6)], '#c08457'))
  pieces.push(piece('landmark:clock-face', 'window', [0, buildingHeightForFloors(4.25), -32.96], [1.08, 1.08, 0.08], '#f8fafc', undefined, '#fde68a', night ? 0.38 : 0.08))
  pieces.push(piece('landmark:london-eye-ring', 'landmark', [-27, buildingHeightForFloors(2), 3], [buildingHeightForFloors(3), buildingHeightForFloors(3), 0.32], '#e5e7eb', [Math.PI / 2, 0, 0]))
  pieces.push(piece('landmark:shard', 'landmark', [38, buildingHeightForFloors(7) / 2, -24], [meters(2.6), buildingHeightForFloors(7), meters(2.6)], '#bae6fd', undefined, '#93c5fd', night ? 0.2 : 0.05))
  pieces.push(piece('landmark:tower-bridge-a', 'landmark', [52, buildingHeightForFloors(3) / 2, 7], [meters(3.1), buildingHeightForFloors(3), meters(3.1)], '#d6a06a'))
  pieces.push(piece('landmark:tower-bridge-b', 'landmark', [64, buildingHeightForFloors(3) / 2, 7], [meters(3.1), buildingHeightForFloors(3), meters(3.1)], '#d6a06a'))
  pieces.push(piece('landmark:tower-bridge-road', 'road', [58, 0.32, 7], [14, 0.35, realScale.roadTile], '#94a3b8'))
  return pieces
}

function piece(
  id: string,
  kind: ProceduralPieceKind,
  position: Vec3,
  scale: Vec3,
  color: string,
  rotation?: Vec3,
  emissive?: string,
  emissiveIntensity?: number,
): ProceduralPiece {
  return { id, kind, position, scale, color, ...(rotation ? { rotation } : {}), ...(emissive ? { emissive, emissiveIntensity } : {}) }
}

function chunkRange(center: Vec3, viewDistance: 1 | 2 | 3): [number, number][] {
  const cx = Math.floor(center[0] / chunkSize)
  const cz = Math.floor(center[2] / chunkSize)
  const chunks: [number, number][] = []
  for (let x = cx - viewDistance; x <= cx + viewDistance; x += 1) {
    for (let z = cz - viewDistance; z <= cz + viewDistance; z += 1) chunks.push([x, z])
  }
  return chunks
}

export function hashSeed(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function rng(seed: string) {
  let state = hashSeed(seed)
  return () => {
    state += 0x6d2b79f5
    let result = Math.imul(state ^ (state >>> 15), 1 | state)
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}
