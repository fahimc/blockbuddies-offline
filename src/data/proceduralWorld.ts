import type { Vec3 } from '../game/types'

export type ProceduralPieceKind =
  | 'ground'
  | 'water'
  | 'road'
  | 'pavement'
  | 'line'
  | 'park'
  | 'building'
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
const buildingPalette = ['#f97316', '#facc15', '#93c5fd', '#a78bfa', '#fb7185', '#22c55e', '#f9a8d4']
const roofPalette = ['#ef4444', '#1d4ed8', '#7c3aed', '#0f172a', '#92400e']

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
    pieces.push(piece(`road-x:${cx}:${cz}`, 'road', [centerX, 0.01, centerZ], [chunkSize, 0.08, 4.2], '#9ca3af'))
    pieces.push(piece(`line-x:${cx}:${cz}`, 'line', [centerX, 0.065, centerZ], [chunkSize * 0.8, 0.025, 0.14], '#fde047'))
    pieces.push(piece(`pavement-x-a:${cx}:${cz}`, 'pavement', [centerX, 0.035, centerZ - 3.2], [chunkSize, 0.055, 1.1], '#e5e7eb'))
    pieces.push(piece(`pavement-x-b:${cx}:${cz}`, 'pavement', [centerX, 0.035, centerZ + 3.2], [chunkSize, 0.055, 1.1], '#e5e7eb'))
  }
  if (hasVerticalRoad) {
    pieces.push(piece(`road-z:${cx}:${cz}`, 'road', [centerX, 0.015, centerZ], [4.2, 0.09, chunkSize], '#94a3b8'))
    pieces.push(piece(`line-z:${cx}:${cz}`, 'line', [centerX, 0.07, centerZ], [0.14, 0.025, chunkSize * 0.8], '#fde047'))
    pieces.push(piece(`pavement-z-a:${cx}:${cz}`, 'pavement', [centerX - 3.2, 0.04, centerZ], [1.1, 0.055, chunkSize], '#e5e7eb'))
    pieces.push(piece(`pavement-z-b:${cx}:${cz}`, 'pavement', [centerX + 3.2, 0.04, centerZ], [1.1, 0.055, chunkSize], '#e5e7eb'))
  }

  const parkChance = random()
  if (parkChance > 0.72 || (Math.abs(cx) === 1 && Math.abs(cz) === 1)) {
    pieces.push(piece(`park:${cx}:${cz}`, 'park', [centerX + 7, 0.02, centerZ - 7], [12, 0.07, 10], '#34d399'))
    for (let i = 0; i < 5; i += 1) {
      addTree(pieces, `park-tree:${cx}:${cz}:${i}`, [x0 + 7 + random() * 22, 0, z0 + 7 + random() * 22])
    }
  } else {
    const plots = [
      [x0 + 9, z0 + 9],
      [x0 + 27, z0 + 9],
      [x0 + 9, z0 + 27],
      [x0 + 27, z0 + 27],
    ] as const
    plots.forEach(([x, z], index) => {
      if ((hasHorizontalRoad && Math.abs(z - centerZ) < 6) || (hasVerticalRoad && Math.abs(x - centerX) < 6)) return
      const height = 4.2 + Math.floor(random() * 5) * 1.15
      const width = 5.2 + random() * 3.2
      const depth = 5 + random() * 3
      const color = buildingPalette[Math.floor(random() * buildingPalette.length)]
      const roof = roofPalette[Math.floor(random() * roofPalette.length)]
      addBuilding(pieces, `building:${cx}:${cz}:${index}`, [x, height / 2, z], [width, height, depth], color, roof)
      buildingCount += 1
    })
  }

  for (let i = 0; i < 4; i += 1) {
    const edgeX = x0 + 3 + random() * (chunkSize - 6)
    const edgeZ = z0 + (i % 2 === 0 ? 3 : chunkSize - 3)
    addTree(pieces, `street-tree:${cx}:${cz}:${i}`, [edgeX, 0, edgeZ])
  }

  if (hasHorizontalRoad && random() > 0.64) {
    addBus(pieces, `bus:${cx}:${cz}`, [centerX - 8 + random() * 16, 0.55, centerZ + (random() > 0.5 ? 0.9 : -0.9)])
  }
  if (random() > 0.76) {
    pieces.push(piece(`phone:${cx}:${cz}`, 'phone-box', [x0 + 4 + random() * 28, 1, z0 + 4 + random() * 28], [0.95, 2, 0.95], '#dc2626'))
  }
  if (night || random() > 0.58) {
    addLamp(pieces, `lamp:${cx}:${cz}:a`, [x0 + 5, 0, z0 + 5], night)
    addLamp(pieces, `lamp:${cx}:${cz}:b`, [x0 + 31, 0, z0 + 31], night)
  }

  return { pieces, buildingCount }
}

function addBuilding(pieces: ProceduralPiece[], id: string, position: Vec3, scale: Vec3, color: string, roofColor: string) {
  pieces.push(piece(id, 'building', position, scale, color))
  pieces.push(piece(`${id}:roof`, 'roof', [position[0], position[1] + scale[1] / 2 + 0.22, position[2]], [scale[0] * 1.08, 0.44, scale[2] * 1.08], roofColor))
  const windowRows = Math.max(1, Math.floor(scale[1] / 1.1))
  for (let row = 0; row < Math.min(windowRows, 4); row += 1) {
    const y = position[1] - scale[1] / 2 + 0.75 + row * 0.85
    pieces.push(piece(`${id}:win:${row}:l`, 'window', [position[0] - scale[0] * 0.22, y, position[2] + scale[2] / 2 + 0.03], [0.62, 0.34, 0.06], '#dbeafe', undefined, '#93c5fd', 0.12))
    pieces.push(piece(`${id}:win:${row}:r`, 'window', [position[0] + scale[0] * 0.22, y, position[2] + scale[2] / 2 + 0.03], [0.62, 0.34, 0.06], '#dbeafe', undefined, '#93c5fd', 0.12))
  }
}

function addTree(pieces: ProceduralPiece[], id: string, [x, , z]: Vec3) {
  pieces.push(piece(`${id}:trunk`, 'tree-trunk', [x, 0.9, z], [0.32, 1.8, 0.32], '#92400e'))
  pieces.push(piece(`${id}:top`, 'tree-top', [x, 2.18, z], [1.65, 1.65, 1.65], '#16a34a'))
}

function addLamp(pieces: ProceduralPiece[], id: string, [x, , z]: Vec3, night: boolean) {
  pieces.push(piece(`${id}:post`, 'lamp-post', [x, 1.1, z], [0.14, 2.2, 0.14], '#0f172a'))
  pieces.push(piece(`${id}:light`, 'lamp-light', [x, 2.38, z], [0.55, 0.55, 0.55], '#fde68a', undefined, '#facc15', night ? 0.95 : 0.32))
}

function addBus(pieces: ProceduralPiece[], id: string, position: Vec3) {
  pieces.push(piece(id, 'bus', position, [5.6, 1.05, 1.45], '#ef4444'))
  pieces.push(piece(`${id}:top`, 'bus', [position[0], position[1] + 0.72, position[2]], [4.8, 0.72, 1.22], '#dc2626'))
  pieces.push(piece(`${id}:window`, 'window', [position[0] - 0.2, position[1] + 1.12, position[2] + 0.66], [3.2, 0.42, 0.05], '#bae6fd', undefined, '#60a5fa', 0.1))
}

function buildLandmarks(night: boolean): ProceduralPiece[] {
  const pieces: ProceduralPiece[] = []
  addBuilding(pieces, 'landmark:town-hall', [0, 2.6, -34], [7, 5.2, 5.4], '#d6a06a', '#2563eb')
  pieces.push(piece('landmark:clock-tower', 'landmark', [0, 6.2, -34], [2, 7.4, 2], '#c08457'))
  pieces.push(piece('landmark:clock-face', 'window', [0, 8.6, -32.96], [1.08, 1.08, 0.08], '#f8fafc', undefined, '#fde68a', night ? 0.38 : 0.08))
  pieces.push(piece('landmark:london-eye-ring', 'landmark', [-27, 5.8, 3], [7.5, 7.5, 0.32], '#e5e7eb', [Math.PI / 2, 0, 0]))
  pieces.push(piece('landmark:shard', 'landmark', [38, 5.2, -24], [3, 10.4, 3], '#bae6fd', undefined, '#93c5fd', night ? 0.2 : 0.05))
  pieces.push(piece('landmark:tower-bridge-a', 'landmark', [52, 2.4, 7], [3.2, 4.8, 3.2], '#d6a06a'))
  pieces.push(piece('landmark:tower-bridge-b', 'landmark', [64, 2.4, 7], [3.2, 4.8, 3.2], '#d6a06a'))
  pieces.push(piece('landmark:tower-bridge-road', 'road', [58, 0.32, 7], [14, 0.35, 3.2], '#94a3b8'))
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
