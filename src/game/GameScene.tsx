import { useFrame } from '@react-three/fiber'
import { useKeyboardControls, Html, useTexture } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { botProfiles } from '../data/botProfiles'
import { generateProceduralWorld, type ProceduralPiece } from '../data/proceduralWorld'
import { worldLocations, distance2d } from '../data/world'
import { nearestLocation, useGameStore } from '../state/gameStore'
import { makePartySnapshot, useLocalPartyStore, type LocalPartySnapshot } from '../state/localPartyStore'
import { pitchFromLookDrag, yawFromLookDrag } from './cameraControl'
import { playerCollisionRadius, resolveHorizontalCollision, separateCircleFromBoxes, type CollisionBox } from './collision'
import { buildPieceDimensions, buildingCenterPosition, buildingScale, floorCountFromHeight, realScale } from './scale'
import { createTrafficVehicles, makeTrafficLanes, trafficCollisionBoxesAtTime, trafficPositionAtTime, type TrafficLane, type TrafficVehicle } from './traffic'
import type {
  AvatarBottomStyle,
  AvatarFaceStyle,
  AvatarHairStyle,
  AvatarOutfitStyle,
  AvatarShoeStyle,
  BotRuntime,
  BuildBlock,
  ShopItemId,
  Vec3,
} from './types'

const obbyCheckpoints: Vec3[] = [
  [16, 0.8, 12],
  [18.5, 1.8, 13.5],
  [20.5, 3.1, 16],
  [22, 4.6, 18],
]

const worldHtmlZIndexRange: [number, number] = [4, 0]

const staticTownBuildings: { position: Vec3; color: string; scale: Vec3; floors: number }[] = [
  staticBuilding(-12, -8, 2, 4.2, 3.6, '#22c55e'),
  staticBuilding(12, -7, 2, 4.6, 3.8, '#fb923c'),
  staticBuilding(-14, 10, 3, 5.4, 4.2, '#a78bfa'),
  staticBuilding(2, 18, 2, 4.4, 3.8, '#facc15'),
  staticBuilding(-4, 18, 2, 3.8, 3.4, '#f9a8d4'),
  staticBuilding(8, 18, 2, 3.8, 3.4, '#93c5fd'),
]

function staticBuilding(x: number, z: number, floors: number, widthMeters: number, depthMeters: number, color: string) {
  return {
    position: buildingCenterPosition(x, z, floors),
    scale: buildingScale(floors, widthMeters, depthMeters),
    floors,
    color,
  }
}

const staticTreePositions: Vec3[] = [
  [-18, 0, -17],
  [-8, 0, -17],
  [8, 0, -17],
  [18, 0, -17],
  [-20, 0, -16],
  [-20, 0, -5],
  [-20, 0, 6],
  [-20, 0, 17],
]

const staticBenchPositions: { position: Vec3; rotation: number }[] = [
  { position: [-6, 0.35, -4], rotation: 0 },
  { position: [5.5, 0.35, -4], rotation: 0 },
  { position: [-6, 0.35, 5.2], rotation: Math.PI },
  { position: [5.5, 0.35, 5.2], rotation: Math.PI },
]

const staticLampPositions: Vec3[] = [
  [-4, 0, -7],
  [4, 0, -7],
  [-4, 0, 8],
  [4, 0, 8],
  [11, 0, -2],
  [-11, 0, 2],
]

const staticCollisionObstacles: CollisionBox[] = [
  ...staticTownBuildings.map(({ position, scale }, index) => ({
    id: `static-building:${index}`,
    center: position,
    half: [scale[0] / 2 + 0.18, scale[1] / 2, scale[2] / 2 + 0.18] as Vec3,
  })),
  ...staticTreePositions.map((position, index) => ({
    id: `static-tree:${index}`,
    center: [position[0], buildPieceDimensions.tree.height / 2, position[2]] as Vec3,
    half: [buildPieceDimensions.tree.footprint / 2, buildPieceDimensions.tree.height / 2, buildPieceDimensions.tree.footprint / 2] as Vec3,
  })),
  ...staticBenchPositions.map(({ position }, index) => ({
    id: `static-bench:${index}`,
    center: position,
    half: [1.2, 0.55, 0.45] as Vec3,
  })),
  ...staticLampPositions.map((position, index) => ({
    id: `static-lamp:${index}`,
    center: [position[0], buildPieceDimensions.lamp.height / 2, position[2]] as Vec3,
    half: [buildPieceDimensions.lamp.footprint / 2, buildPieceDimensions.lamp.height / 2, buildPieceDimensions.lamp.footprint / 2] as Vec3,
  })),
  { id: 'static-billboard', center: [-6, 1.1, 2], half: [2, 1.3, 0.35] },
]

export function GameScene() {
  return (
    <>
      <ProceduralBoroughWorld />
      <Town />
      <TrafficVehicles />
      <PlayerController />
      <Bots />
      <LocalPartyPlayers />
      <ObbyCourse />
      <CoinField />
      <ToyPickup />
      <PlacedBlocks />
    </>
  )
}

function TrafficVehicles() {
  const settings = useGameStore((state) => state.settings)
  const lanes = useMemo(() => makeTrafficLanes(), [])
  const vehicleCount = settings.quality === 'low' ? 6 : 10
  const vehicles = useMemo(() => createTrafficVehicles(lanes, vehicleCount), [lanes, vehicleCount])
  const laneById = useMemo(() => new Map(lanes.map((lane) => [lane.id, lane])), [lanes])

  return (
    <group>
      {vehicles.map((vehicle) => {
        const lane = laneById.get(vehicle.laneId)
        return lane ? <TrafficVehicleMesh key={vehicle.id} vehicle={vehicle} lane={lane} /> : null
      })}
    </group>
  )
}

function TrafficVehicleMesh({ vehicle, lane }: { vehicle: TrafficVehicle; lane: TrafficLane }) {
  const group = useRef<THREE.Group>(null)
  const initialPose = trafficPositionAtTime(lane, vehicle, performance.now() / 1000)

  useFrame(() => {
    const pose = trafficPositionAtTime(lane, vehicle, performance.now() / 1000)
    group.current?.position.set(pose.position[0], pose.position[1], pose.position[2])
    if (group.current) group.current.rotation.y = pose.yaw
  })

  return (
    <group ref={group} position={initialPose.position} rotation={[0, initialPose.yaw, 0]}>
      <CarPiece color={vehicle.color} />
    </group>
  )
}

function ProceduralBoroughWorld() {
  const settings = useGameStore((state) => state.settings)
  const [chunk, setChunk] = useState(() => {
    const playerPosition = useGameStore.getState().playerPosition
    return {
      x: Math.floor(playerPosition[0] / 36),
      z: Math.floor(playerPosition[2] / 36),
    }
  })
  useFrame(() => {
    const playerPosition = useGameStore.getState().playerPosition
    const nextChunk = {
      x: Math.floor(playerPosition[0] / 36),
      z: Math.floor(playerPosition[2] / 36),
    }
    if (nextChunk.x !== chunk.x || nextChunk.z !== chunk.z) setChunk(nextChunk)
  })
  const world = useMemo(
    () =>
      generateProceduralWorld({
        seed: settings.worldSeed || 'LONDON-2026',
        center: [chunk.x * 36 + 18, 0, chunk.z * 36 + 18],
        viewDistance: settings.worldViewDistance,
        night: settings.nightMode,
      }),
    [chunk.x, chunk.z, settings.nightMode, settings.worldSeed, settings.worldViewDistance],
  )

  if (!settings.proceduralWorld) return null

  return (
    <group>
      {world.pieces.map((piece) => (
        <ProceduralPieceMesh key={piece.id} piece={piece} />
      ))}
      <Html position={[0, 3.6, -31]} center zIndexRange={worldHtmlZIndexRange}>
        <span className="whitespace-nowrap rounded-lg bg-slate-950/80 px-3 py-1 text-xs font-black text-white shadow">
          {world.district} • {world.buildingCount} buildings
        </span>
      </Html>
    </group>
  )
}

function ProceduralPieceMesh({ piece }: { piece: ProceduralPiece }) {
  const castsShadow = piece.kind === 'building' || piece.kind === 'roof' || piece.kind === 'tree-top' || piece.kind === 'landmark'
  const receivesShadow = piece.kind !== 'line' && piece.kind !== 'lamp-light'
  const materialProps = {
    color: piece.color,
    emissive: piece.emissive,
    emissiveIntensity: piece.emissiveIntensity ?? 0,
    roughness: piece.kind === 'water' ? 0.38 : 0.78,
    metalness: piece.kind === 'water' ? 0.05 : 0,
    transparent: piece.kind === 'water',
    opacity: piece.kind === 'water' ? 0.84 : 1,
  }
  const rotation: Vec3 = piece.rotation ?? [0, 0, 0]

  return (
    <group position={piece.position} rotation={rotation}>
      {piece.kind === 'tree-top' ? (
        <mesh castShadow receiveShadow={receivesShadow} scale={piece.scale}>
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ) : null}
      {piece.kind === 'lamp-light' ? (
        <mesh castShadow={false} scale={piece.scale}>
          <sphereGeometry args={[0.5, 14, 10]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ) : null}
      {piece.id === 'landmark:london-eye-ring' ? (
        <mesh castShadow receiveShadow={receivesShadow} scale={piece.scale}>
          <torusGeometry args={[0.5, 0.035, 8, 36]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ) : null}
      {piece.id === 'landmark:shard' ? (
        <mesh castShadow receiveShadow={receivesShadow} scale={piece.scale}>
          <coneGeometry args={[0.5, 1, 4]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ) : null}
      {piece.kind !== 'tree-top' && piece.kind !== 'lamp-light' && piece.id !== 'landmark:london-eye-ring' && piece.id !== 'landmark:shard' ? (
        <mesh castShadow={castsShadow} receiveShadow={receivesShadow} scale={piece.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ) : null}
    </group>
  )
}

function proceduralPiecesToCollisionBoxes(pieces: ProceduralPiece[]) {
  return pieces.flatMap((piece): CollisionBox[] => {
    if (piece.kind === 'building' || piece.kind === 'phone-box' || piece.kind === 'tree-trunk' || piece.kind === 'lamp-post') {
      return [visibleBox(piece, piece.kind === 'building' ? 0.18 : 0.08)]
    }
    if (piece.kind === 'bus' && !piece.id.endsWith(':top')) return [visibleBox(piece, 0.12)]
    if (piece.kind === 'landmark' && piece.id !== 'landmark:london-eye-ring') return [visibleBox(piece, 0.22)]
    return []
  })
}

function buildBlocksToCollisionBoxes(blocks: BuildBlock[]) {
  return blocks.flatMap((block): CollisionBox[] => {
    if (block.kind === 'road') return []
    const half = buildCollisionHalf(block.kind ?? 'block')
    return [
      {
        id: `build:${block.id}`,
        center: [block.position[0], block.position[1] + half[1], block.position[2]],
        half,
      },
    ]
  })
}

function buildCollisionHalf(kind: BuildBlock['kind']): Vec3 {
  switch (kind) {
    case 'house':
      return [buildPieceDimensions.house.width / 2, (buildPieceDimensions.house.bodyHeight + buildPieceDimensions.house.roofHeight) / 2, buildPieceDimensions.house.depth / 2]
    case 'building':
      return [buildPieceDimensions.building.width / 2, (buildPieceDimensions.building.bodyHeight + buildPieceDimensions.building.roofHeight) / 2, buildPieceDimensions.building.depth / 2]
    case 'shop':
      return [buildPieceDimensions.shop.width / 2, (buildPieceDimensions.shop.bodyHeight + buildPieceDimensions.shop.awningHeight) / 2, buildPieceDimensions.shop.depth / 2]
    case 'car':
      return [buildPieceDimensions.car.length / 2, buildPieceDimensions.car.height / 2, buildPieceDimensions.car.width / 2]
    case 'tree':
      return [buildPieceDimensions.tree.footprint / 2, buildPieceDimensions.tree.height / 2, buildPieceDimensions.tree.footprint / 2]
    case 'lamp':
      return [buildPieceDimensions.lamp.footprint / 2, buildPieceDimensions.lamp.height / 2, buildPieceDimensions.lamp.footprint / 2]
    default:
      return [0.58, 0.58, 0.58]
  }
}

function visibleBox(piece: ProceduralPiece, padding: number): CollisionBox {
  return {
    id: `procedural:${piece.id}`,
    center: piece.position,
    half: [piece.scale[0] / 2 + padding, piece.scale[1] / 2, piece.scale[2] / 2 + padding],
  }
}

function Town() {
  const groundTexture = useTexture('/assets/kenney/prototype-textures/grid-green.png')
  const plazaTexture = useTexture('/assets/kenney/prototype-textures/grid-light.png')

  useEffect(() => {
    for (const texture of [groundTexture, plazaTexture]) {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
    }
    groundTexture.repeat.set(18, 18)
    plazaTexture.repeat.set(2, 2)
  }, [groundTexture, plazaTexture])

  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <mesh receiveShadow position={[0, -0.08, 0]}>
          <boxGeometry args={[54, 0.16, 54]} />
          <meshStandardMaterial color="#7ee36f" map={groundTexture} roughness={0.9} />
        </mesh>
        <CuboidCollider args={[27, 0.08, 27]} position={[0, -0.08, 0]} />
      </RigidBody>

      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[6, 6, 0.08, 48]} />
        <meshStandardMaterial color="#d9d9d9" map={plazaTexture} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 48]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <SpawnPad />
      <Roads />

      {worldLocations.map((location) => (
        <group key={location.id} position={location.position}>
          <Html center position={[0, 3.2, 0]} zIndexRange={worldHtmlZIndexRange}>
            <span className="whitespace-nowrap rounded-lg bg-white/90 px-3 py-1 text-sm font-black text-slate-900 shadow">
              {location.label}
            </span>
          </Html>
          <mesh receiveShadow position={[0, 0.04, 0]}>
            <cylinderGeometry args={[2.8, 2.8, 0.08, 24]} />
            <meshStandardMaterial color={location.color} />
          </mesh>
        </group>
      ))}

      {staticTownBuildings.map((building) => (
        <Building key={building.position.join(',')} position={building.position} color={building.color} scale={building.scale} />
      ))}
      <Storefront position={[12, 0, -7]} label="SHOP" color="#f97316" />
      <Storefront position={[-14, 0, 10]} label="SCHOOL" color="#a78bfa" />
      <Storefront position={[16, 0, 12]} label="OBBY" color="#ef4444" />
      <Billboard position={[-6, 0, 2]} />
      <Benches />
      <StreetLamps />

      {staticTreePositions.map((position) => (
        <Tree key={position.join(',')} position={position} />
      ))}
    </group>
  )
}

function SpawnPad() {
  const studs = useMemo(() => {
    const items: Vec3[] = []
    for (let x = -2; x <= 2; x += 1) {
      for (let z = -2; z <= 2; z += 1) items.push([x * 0.9, 0.2, z * 0.9])
    }
    return items
  }, [])
  return (
    <group>
      <mesh receiveShadow position={[0, 0.09, 0]}>
        <cylinderGeometry args={[3.4, 3.4, 0.18, 40]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.8} />
      </mesh>
      {studs.map((position) => (
        <mesh key={position.join(',')} castShadow position={position}>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function Roads() {
  return (
    <group>
      <mesh receiveShadow position={[0, 0.025, -7.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[realScale.roadTile, 22]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, 0.03, 9]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[realScale.roadTile, 32]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Building({ position, color, scale }: { position: Vec3; color: string; scale: Vec3 }) {
  const floors = floorCountFromHeight(scale[1])
  const roofHeight = realScale.roofHeight
  const doorY = -scale[1] / 2 + realScale.doorHeight / 2
  const windowRows = Array.from({ length: Math.min(floors, 6) }, (_, row) => {
    const y = -scale[1] / 2 + row * realScale.floorHeight + realScale.floorHeight * 0.62
    return y > scale[1] / 2 - realScale.windowHeight / 2 ? null : y
  }).filter((value): value is number => value !== null)

  return (
    <group position={position}>
      <mesh castShadow receiveShadow scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, scale[1] / 2 + roofHeight / 2, 0]} scale={[scale[0] * 1.08, roofHeight, scale[2] * 1.08]}>
        <coneGeometry args={[0.8, 1, 4]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, doorY, scale[2] / 2 + 0.02]} scale={[realScale.doorWidth, realScale.doorHeight, realScale.doorDepth]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7c2d12" />
      </mesh>
      {windowRows.map((y, row) => (
        <group key={row}>
          <mesh position={[-scale[0] * 0.22, y, scale[2] / 2 + 0.03]} scale={[realScale.windowWidth, realScale.windowHeight, realScale.windowDepth]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[scale[0] * 0.22, y, scale[2] / 2 + 0.03]} scale={[realScale.windowWidth, realScale.windowHeight, realScale.windowDepth]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Storefront({ position, label, color }: { position: Vec3; label: string; color: string }) {
  return (
    <group position={[position[0], realScale.doorHeight + 0.42, position[2] + 1.45]}>
      <mesh castShadow>
        <boxGeometry args={[2.8, 0.55, 0.18]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Html center position={[0, 0.01, 0.12]} zIndexRange={worldHtmlZIndexRange}>
        <span className="rounded bg-slate-950 px-2 py-1 text-xs font-black text-white shadow">
          {label}
        </span>
      </Html>
    </group>
  )
}

function Billboard({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh castShadow position={[-0.9, 1, 0]}>
        <boxGeometry args={[0.16, 2, 0.16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh castShadow position={[0.9, 1, 0]}>
        <boxGeometry args={[0.16, 2, 0.16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh castShadow position={[0, 2.1, 0]}>
        <boxGeometry args={[3.4, 1.3, 0.24]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <Html center position={[0, 2.12, 0.16]} zIndexRange={worldHtmlZIndexRange}>
        <div className="w-44 rounded bg-white px-2 py-1 text-center text-xs font-black text-slate-950 shadow">
          Welcome to BlockBuddies
        </div>
      </Html>
    </group>
  )
}

function Benches() {
  return (
    <group>
      {staticBenchPositions.map(({ position, rotation }) => (
        <group key={position.join(',')} position={position} rotation={[0, rotation, 0]}>
          <mesh castShadow position={[0, 0.15, 0]}>
            <boxGeometry args={[2.1, 0.22, 0.42]} />
            <meshStandardMaterial color="#a16207" />
          </mesh>
          <mesh castShadow position={[0, 0.55, -0.22]}>
            <boxGeometry args={[2.1, 0.55, 0.2]} />
            <meshStandardMaterial color="#92400e" />
          </mesh>
          <mesh castShadow position={[-0.7, -0.18, 0]}>
            <boxGeometry args={[0.15, 0.55, 0.15]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh castShadow position={[0.7, -0.18, 0]}>
            <boxGeometry args={[0.15, 0.55, 0.15]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function StreetLamps() {
  return (
    <group>
      {staticLampPositions.map((position) => (
        <group key={position.join(',')} position={position}>
          <mesh castShadow position={[0, realScale.lampHeight / 2, 0]}>
            <cylinderGeometry args={[0.08, 0.1, realScale.lampHeight, 10]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh castShadow position={[0, realScale.lampHeight + 0.34, 0]}>
            <sphereGeometry args={[0.34, 14, 10]} />
            <meshStandardMaterial color="#fde68a" emissive="#facc15" emissiveIntensity={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Tree({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, realScale.treeTrunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.18, 0.25, realScale.treeTrunkHeight, 8]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
      <mesh castShadow position={[0, realScale.treeTrunkHeight + realScale.treeCanopySize * 0.42, 0]}>
        <dodecahedronGeometry args={[realScale.treeCanopySize / 2, 0]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
    </group>
  )
}

function PlayerController() {
  const group = useRef<THREE.Group>(null)
  const [, getKeys] = useKeyboardControls()
  const velocityY = useRef(0)
  const yaw = useRef(0)
  const cameraPitch = useRef(0)
  const lastBuildAt = useRef(0)
  const lastPartyBroadcastAt = useRef(0)
  const movingRef = useRef(false)
  const airborneRef = useRef(false)
  const [moving, setMoving] = useState(false)
  const [airborne, setAirborne] = useState(false)
  const position = useRef(new THREE.Vector3(0, 0.9, 4))
  const setPlayer = useGameStore((state) => state.setPlayer)
  const setTouch = useGameStore((state) => state.setTouch)
  const touch = useGameStore((state) => state.touch)
  const avatar = useGameStore((state) => state.avatar)
  const playerName = useGameStore((state) => state.playerName)
  const playerEmote = useGameStore((state) => state.playerEmote)
  const settings = useGameStore((state) => state.settings)
  const placedBlocks = useGameStore((state) => state.placedBlocks)
  const buildMode = useGameStore((state) => state.buildMode)
  const placeBlock = useGameStore((state) => state.placeBlock)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const beginObby = useGameStore((state) => state.beginObby)
  const completeObby = useGameStore((state) => state.completeObby)
  const updateObby = useGameStore((state) => state.updateObby)
  const obby = useGameStore((state) => state.obby)
  const setNearbyLocation = useGameStore((state) => state.setNearbyLocation)
  const advanceQuest = useGameStore((state) => state.advanceQuest)
  const botReact = useGameStore((state) => state.botReact)
  const recordBotMeet = useGameStore((state) => state.recordBotMeet)
  const bots = useGameStore((state) => state.bots)
  const visitedBots = useGameStore((state) => state.visitedBots)
  const partyPlayerId = useLocalPartyStore((state) => state.playerId)
  const partyPlayerName = useLocalPartyStore((state) => state.playerName)
  const broadcastSnapshot = useLocalPartyStore((state) => state.broadcastSnapshot)
  const trafficLanes = useMemo(() => makeTrafficLanes(), [])
  const trafficVehicleCount = settings.quality === 'low' ? 6 : 10
  const trafficVehicles = useMemo(() => createTrafficVehicles(trafficLanes, trafficVehicleCount), [trafficLanes, trafficVehicleCount])
  const [collisionChunk, setCollisionChunk] = useState(() => ({
    x: Math.floor(position.current.x / 36),
    z: Math.floor(position.current.z / 36),
  }))
  const collisionObstacles = useMemo(() => {
    const proceduralObstacles = settings.proceduralWorld
      ? proceduralPiecesToCollisionBoxes(
          generateProceduralWorld({
            seed: settings.worldSeed || 'LONDON-2026',
            center: [collisionChunk.x * 36 + 18, 0, collisionChunk.z * 36 + 18],
            viewDistance: settings.worldViewDistance,
            night: settings.nightMode,
          }).pieces,
        )
      : []

    return [...staticCollisionObstacles, ...proceduralObstacles, ...buildBlocksToCollisionBoxes(placedBlocks)]
  }, [collisionChunk.x, collisionChunk.z, placedBlocks, settings.nightMode, settings.proceduralWorld, settings.worldSeed, settings.worldViewDistance])

  useFrame((state, delta) => {
    const nextCollisionChunk = {
      x: Math.floor(position.current.x / 36),
      z: Math.floor(position.current.z / 36),
    }
    if (nextCollisionChunk.x !== collisionChunk.x || nextCollisionChunk.z !== collisionChunk.z) setCollisionChunk(nextCollisionChunk)

    const keys = getKeys()
    const forward = Number(keys.forward) - Number(keys.back) + -touch.y
    const strafe = Number(keys.right) - Number(keys.left) + touch.x
    const isMoving = Math.abs(forward) > 0.05 || Math.abs(strafe) > 0.05
    if (isMoving !== movingRef.current) {
      movingRef.current = isMoving
      setMoving(isMoving)
    }
    const turning = strafe * 1.8 * delta
    yaw.current -= turning
    if (Math.abs(touch.lookX) > 0.01 || Math.abs(touch.lookY) > 0.01) {
      yaw.current = yawFromLookDrag(yaw.current, touch.lookX)
      cameraPitch.current = pitchFromLookDrag(cameraPitch.current, touch.lookY)
      setTouch({ lookX: 0, lookY: 0 })
    }

    const direction = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current))
    const side = new THREE.Vector3(direction.z, 0, -direction.x)
    const speed = keys.forward || keys.back || Math.abs(touch.y) > 0.1 ? 8 : 5
    const desiredPosition = position.current.clone()
    desiredPosition.addScaledVector(direction, forward * speed * delta)
    desiredPosition.addScaledVector(side, strafe * speed * 0.7 * delta)
    const trafficObstacles = trafficCollisionBoxesAtTime(trafficLanes, trafficVehicles, performance.now() / 1000)
    const resolvedPosition = resolveHorizontalCollision(
      [position.current.x, position.current.y, position.current.z],
      [desiredPosition.x, desiredPosition.y, desiredPosition.z],
      [...collisionObstacles, ...trafficObstacles],
      playerCollisionRadius,
    )
    const separatedPosition = separateCircleFromBoxes(resolvedPosition, trafficObstacles, playerCollisionRadius + 0.05)
    position.current.x = separatedPosition[0]
    position.current.z = separatedPosition[2]
    velocityY.current -= 25 * delta
    if ((keys.jump || touch.jump) && position.current.y <= 0.91) velocityY.current = 9
    position.current.y += velocityY.current * delta
    if (position.current.y < 0.9) {
      position.current.y = 0.9
      velocityY.current = 0
    }
    const isAirborne = position.current.y > 0.94
    if (isAirborne !== airborneRef.current) {
      airborneRef.current = isAirborne
      setAirborne(isAirborne)
    }
    if (position.current.y < -2 && obby.active) {
      position.current.set(obby.checkpoint[0], obby.checkpoint[1] + 0.8, obby.checkpoint[2])
      velocityY.current = 0
    }

    group.current?.position.copy(position.current)
    if (group.current) group.current.rotation.y = yaw.current
    const mobile = state.size.width < 640
    const cameraDistance = mobile ? -13 : -8
    const cameraHeight = (mobile ? 7.4 : 5) + cameraPitch.current * 3.2
    const lookHeight = 1.4 + cameraPitch.current * 1.1
    const cameraTarget = position.current
      .clone()
      .add(new THREE.Vector3(Math.sin(yaw.current) * cameraDistance, cameraHeight, Math.cos(yaw.current) * cameraDistance))
    state.camera.position.lerp(cameraTarget, 0.12)
    state.camera.lookAt(position.current.x, position.current.y + lookHeight, position.current.z)
    setPlayer([position.current.x, position.current.y - 0.9, position.current.z], yaw.current)
    if (performance.now() - lastPartyBroadcastAt.current > 120) {
      broadcastSnapshot(
        makePartySnapshot({
          id: partyPlayerId,
          name: partyPlayerName,
          position: [position.current.x, position.current.y - 0.9, position.current.z],
          yaw: yaw.current,
          avatar,
          action: isAirborne ? 'jump' : isMoving ? 'run' : 'idle',
        }),
      )
      lastPartyBroadcastAt.current = performance.now()
    }

    const nearby = nearestLocation([position.current.x, 0, position.current.z])
    setNearbyLocation(nearby)
    if (nearby === 'park') advanceQuest('visit-park', 1)
    if (nearby === 'obby' && (keys.interact || touch.interact) && !obby.active) beginObby(performance.now())
    if (nearby === 'shop' && (keys.interact || touch.interact)) useGameStore.getState().setOpenPanel('shop')
    if (buildMode && (keys.interact || touch.interact) && performance.now() - lastBuildAt.current > 350) {
      placeBlock()
      lastBuildAt.current = performance.now()
    }

    updateObby(performance.now(), obbyCheckpoints)
    if (distance2d([position.current.x, 0, position.current.z], [22, 0, 18]) < 1.8 && obby.active) {
      completeObby(performance.now())
      bots.slice(0, 2).forEach((bot) => botReact(bot.id, 'questComplete'))
    }

    bots.forEach((bot) => {
      if (distance2d(bot.position, [position.current.x, 0, position.current.z]) < 2.4) {
        if (!visitedBots.includes(bot.id)) advanceQuest('meet-three-buddies', 1)
        recordBotMeet(bot.id)
      }
    })
  })

  return (
    <group ref={group} position={playerPosition}>
      {avatar.trail !== 'none' ? (
        <mesh position={[0, 0.15, -0.8]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color="#f0abfc" emissive="#f0abfc" emissiveIntensity={0.8} />
        </mesh>
      ) : null}
      <BlockAvatar
        bodyColor={avatar.bodyColor}
        shirtColor={avatar.shirtColor}
        hairColor={avatar.hairColor}
        hairStyle={avatar.hairStyle}
        pantsColor={avatar.pantsColor}
        eyeColor={avatar.eyeColor}
        accentColor={avatar.accentColor}
        secondaryColor={avatar.secondaryColor}
        outfitStyle={avatar.outfitStyle}
        bottomStyle={avatar.bottomStyle}
        shoeStyle={avatar.shoeStyle}
        shoeColor={avatar.shoeColor}
        accessory={avatar.accessory}
        face={avatar.face}
        username={playerName}
        hat={avatar.hat !== 'none'}
        emote={playerEmote}
        action={airborne ? 'jump' : moving ? 'run' : 'idle'}
      />
    </group>
  )
}

function LocalPartyPlayers() {
  const lastPruneAt = useRef(0)
  const remotePlayerRecord = useLocalPartyStore((state) => state.remotePlayers)
  const pruneRemotePlayers = useLocalPartyStore((state) => state.pruneRemotePlayers)
  const remotePlayers = useMemo(() => Object.values(remotePlayerRecord), [remotePlayerRecord])

  useFrame(() => {
    const now = Date.now()
    if (now - lastPruneAt.current > 1000) {
      pruneRemotePlayers(now)
      lastPruneAt.current = now
    }
  })

  return (
    <>
      {remotePlayers.map((player) => (
        <LocalPartyAvatar key={player.id} player={player} />
      ))}
    </>
  )
}

function LocalPartyAvatar({ player }: { player: LocalPartySnapshot }) {
  return (
    <group position={[player.position[0], player.position[1] + 0.9, player.position[2]]} rotation={[0, player.yaw, 0]}>
      <BlockAvatar
        bodyColor={player.avatar.bodyColor}
        shirtColor={player.avatar.shirtColor}
        hairColor={player.avatar.hairColor}
        hairStyle={player.avatar.hairStyle}
        pantsColor={player.avatar.pantsColor}
        eyeColor={player.avatar.eyeColor}
        accentColor={player.avatar.accentColor}
        secondaryColor={player.avatar.secondaryColor}
        outfitStyle={player.avatar.outfitStyle}
        bottomStyle={player.avatar.bottomStyle}
        shoeStyle={player.avatar.shoeStyle}
        shoeColor={player.avatar.shoeColor}
        accessory={player.avatar.accessory}
        face={player.avatar.face}
        username={player.name}
        hat={player.avatar.hat !== 'none'}
        action={player.action}
      />
    </group>
  )
}

function Bots() {
  const bots = useGameStore((state) => state.bots)
  const tickBots = useGameStore((state) => state.tickBots)
  const settings = useGameStore((state) => state.settings)

  useFrame(() => {
    if (!settings.reducedMotion) tickBots(performance.now())
  })

  return (
    <>
      {bots.map((bot) => {
        const profile = botProfiles.find((entry) => entry.id === bot.id) ?? botProfiles[0]
        return <BotAvatar key={bot.id} bot={bot} username={profile.username} color={profile.color} shirtColor={profile.shirtColor} />
      })}
    </>
  )
}

function BotAvatar({ bot, username, color, shirtColor }: { bot: BotRuntime; username: string; color: string; shirtColor: string }) {
  const jumpLift = bot.action === 'jump' ? Math.max(0, Math.sin(performance.now() / 170)) * 0.18 : 0
  const dx = bot.target[0] - bot.position[0]
  const dz = bot.target[2] - bot.position[2]
  const yaw = bot.action === 'walk' || bot.action === 'run' ? Math.atan2(dx, dz) : 0
  return (
    <group position={[bot.position[0], 0.9 + jumpLift, bot.position[2]]} rotation={[0, yaw, 0]}>
      <BlockAvatar
        bodyColor={color}
        shirtColor={shirtColor}
        hairStyle={username.length % 3 === 0 ? 'bob' : username.length % 2 === 0 ? 'short' : 'spiky'}
        hairColor={username.length % 2 === 0 ? '#3b1f12' : '#111827'}
        pantsColor="#1f2937"
        outfitStyle={username.length % 2 === 0 ? 'tee' : 'hoodie'}
        bottomStyle="jeans"
        shoeStyle="sneakers"
        username={username}
        hat={bot.action === 'cheer'}
        emote={bot.action === 'cheer' ? 'cheer' : bot.action === 'wave' ? 'wave' : 'none'}
        action={bot.action}
      />
      {bot.speech && bot.speechUntil > Date.now() ? (
        <Html center position={[0, 3.2, 0]} zIndexRange={worldHtmlZIndexRange}>
          <div className="max-w-40 rounded-lg bg-white px-3 py-2 text-center text-xs font-black text-slate-900 shadow">
            {bot.speech}
          </div>
        </Html>
      ) : null}
    </group>
  )
}

type BlockAvatarProps = {
  bodyColor: string
  shirtColor: string
  hairColor?: string
  hairStyle?: AvatarHairStyle
  pantsColor?: string
  eyeColor?: string
  accentColor?: string
  secondaryColor?: string
  outfitStyle?: AvatarOutfitStyle
  bottomStyle?: AvatarBottomStyle
  shoeStyle?: AvatarShoeStyle
  shoeColor?: string
  accessory?: ShopItemId | 'none' | string
  face?: AvatarFaceStyle | string
  username: string
  showName?: boolean
  hat?: boolean
  emote?: 'none' | 'wave' | 'cheer' | 'dance' | 'sit'
  action?: BotRuntime['action']
}

export function BlockAvatar({
  bodyColor,
  shirtColor,
  hairColor = '#5a2f16',
  hairStyle = 'spiky',
  pantsColor = '#111827',
  eyeColor = '#111827',
  accentColor = '#0b74ff',
  secondaryColor = '#ffffff',
  outfitStyle = 'hoodie',
  bottomStyle = 'jeans',
  shoeStyle = 'sneakers',
  shoeColor = '#f8fafc',
  accessory = 'none',
  face = 'smile',
  username,
  showName = true,
  hat,
  emote = 'none',
  action = 'idle',
}: BlockAvatarProps) {
  const body = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null)
  const rightLeg = useRef<THREE.Group>(null)
  const actionRef = useRef(action)
  const emoteRef = useRef(emote)
  actionRef.current = action
  emoteRef.current = emote

  useFrame(({ clock }) => {
    const currentAction = actionRef.current
    const currentEmote = emoteRef.current
    const walking = currentAction === 'walk' || currentAction === 'run'
    const strideSpeed = currentAction === 'run' ? 11 : 7.5
    const stride = walking ? Math.sin(clock.elapsedTime * strideSpeed) * 0.72 : 0
    const sideStride = walking ? Math.sin(clock.elapsedTime * strideSpeed) * 0.16 : 0
    const idle = walking ? 0 : Math.sin(clock.elapsedTime * 2.2) * 0.035
    const wave = currentEmote === 'wave' || currentEmote === 'cheer' ? -1.05 + Math.sin(clock.elapsedTime * 7) * 0.18 : 0
    const cheer = currentEmote === 'cheer' ? -1.0 + Math.cos(clock.elapsedTime * 8) * 0.14 : 0
    const danceTilt = currentEmote === 'dance' ? Math.sin(clock.elapsedTime * 5.2) * 0.22 : 0

    if (body.current) {
      body.current.rotation.z = danceTilt
      body.current.position.y = currentAction === 'jump' ? 0.1 : Math.abs(stride) * 0.025 + idle
    }
    if (leftLeg.current) {
      leftLeg.current.rotation.x = stride
      leftLeg.current.rotation.z = sideStride
    }
    if (rightLeg.current) {
      rightLeg.current.rotation.x = -stride
      rightLeg.current.rotation.z = -sideStride
    }
    if (leftArm.current) {
      leftArm.current.rotation.x = wave || -stride * 0.72
      leftArm.current.rotation.z = walking ? -sideStride * 0.7 : 0
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = cheer || stride * 0.72
      rightArm.current.rotation.z = walking ? sideStride * 0.7 : 0
    }
  })

  const sitDrop = emote === 'sit' ? -0.35 : 0
  const faceStyle = face === 'wow' ? 'surprised' : face
  return (
    <group position={[0, sitDrop, 0]}>
      {showName ? (
        <Html center position={[0, 2.15, 0]} zIndexRange={worldHtmlZIndexRange}>
          <span className="whitespace-nowrap rounded bg-slate-950/80 px-2 py-1 text-xs font-black text-white shadow">
            {username}
          </span>
        </Html>
      ) : null}
      <group ref={body} position={[0, -0.9, 0]}>
        <group ref={leftLeg} position={[-0.22, 0.64, 0]}>
          <AvatarLeg
            bodyColor={bodyColor}
            pantsColor={pantsColor}
            bottomStyle={bottomStyle}
            shoeStyle={shoeStyle}
            shoeColor={shoeColor}
          />
        </group>
        <group ref={rightLeg} position={[0.22, 0.64, 0]}>
          <AvatarLeg
            bodyColor={bodyColor}
            pantsColor={pantsColor}
            bottomStyle={bottomStyle}
            shoeStyle={shoeStyle}
            shoeColor={shoeColor}
          />
        </group>

        <AvatarTorso
          bodyColor={bodyColor}
          shirtColor={shirtColor}
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          outfitStyle={outfitStyle}
          bottomStyle={bottomStyle}
        />
        <mesh castShadow position={[0, 1.55, 0]}>
          <boxGeometry args={[0.7, 0.16, 0.4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.7} />
        </mesh>

        <group ref={leftArm} position={[-0.58, 1.45, 0]}>
          <AvatarArm bodyColor={bodyColor} shirtColor={shirtColor} outfitStyle={outfitStyle} />
        </group>
        <group ref={rightArm} position={[0.58, 1.45, 0]}>
          <AvatarArm bodyColor={bodyColor} shirtColor={shirtColor} outfitStyle={outfitStyle} />
        </group>

        <mesh castShadow position={[0, 1.92, 0]}>
          <boxGeometry args={[0.62, 0.62, 0.58]} />
          <meshStandardMaterial color={bodyColor} roughness={0.66} />
        </mesh>
        <AvatarHair hairStyle={hairStyle} hairColor={hairColor} accentColor={accentColor} />
        <AvatarFace face={faceStyle} eyeColor={eyeColor} accentColor={accentColor} />
        {hat ? (
          <mesh castShadow position={[0, 2.45, 0]}>
            <cylinderGeometry args={[0.38, 0.5, 0.18, 5]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        ) : null}
        <AvatarAccessory accessory={accessory} accentColor={accentColor} secondaryColor={secondaryColor} />
      </group>
    </group>
  )
}

function AvatarLeg({
  bodyColor,
  pantsColor,
  bottomStyle,
  shoeStyle,
  shoeColor,
}: {
  bodyColor: string
  pantsColor: string
  bottomStyle: AvatarBottomStyle
  shoeStyle: AvatarShoeStyle
  shoeColor: string
}) {
  const bareLeg = bottomStyle === 'shorts' || bottomStyle === 'skirt' || bottomStyle === 'none'
  const legColor = bottomStyle === 'none' ? bodyColor : pantsColor
  const shoeHeight = shoeStyle === 'boots' || shoeStyle === 'highTops' ? 0.2 : 0.12

  return (
    <>
      <mesh castShadow position={[0, -0.32, 0]}>
        <boxGeometry args={[0.26, 0.64, 0.28]} />
        <meshStandardMaterial color={legColor} roughness={0.72} />
      </mesh>
      {bareLeg && bottomStyle !== 'none' ? (
        <mesh castShadow position={[0, -0.5, 0.01]}>
          <boxGeometry args={[0.27, 0.3, 0.29]} />
          <meshStandardMaterial color={bodyColor} roughness={0.7} />
        </mesh>
      ) : null}
      {shoeStyle !== 'none' ? (
        <mesh castShadow position={[0, -0.68, 0.08]}>
          <boxGeometry args={[0.32, shoeHeight, shoeStyle === 'sandals' ? 0.34 : 0.44]} />
          <meshStandardMaterial color={shoeColor} roughness={0.6} />
        </mesh>
      ) : null}
    </>
  )
}

function AvatarTorso({
  bodyColor,
  shirtColor,
  accentColor,
  secondaryColor,
  outfitStyle,
  bottomStyle,
}: {
  bodyColor: string
  shirtColor: string
  accentColor: string
  secondaryColor: string
  outfitStyle: AvatarOutfitStyle
  bottomStyle: AvatarBottomStyle
}) {
  const torsoColor = outfitStyle === 'none' ? bodyColor : shirtColor

  return (
    <group>
      <mesh castShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.82, 0.94, 0.38]} />
        <meshStandardMaterial color={torsoColor} roughness={0.7} />
      </mesh>
      {outfitStyle === 'hoodie' ? (
        <>
          <mesh castShadow position={[-0.09, 1.2, 0.205]}>
            <boxGeometry args={[0.035, 0.44, 0.03]} />
            <meshStandardMaterial color={secondaryColor} />
          </mesh>
          <mesh castShadow position={[0.09, 1.2, 0.205]}>
            <boxGeometry args={[0.035, 0.44, 0.03]} />
            <meshStandardMaterial color={secondaryColor} />
          </mesh>
          <mesh castShadow position={[0, 0.82, 0.215]}>
            <boxGeometry args={[0.42, 0.22, 0.04]} />
            <meshStandardMaterial color={accentColor} roughness={0.66} />
          </mesh>
        </>
      ) : null}
      {outfitStyle === 'jacket' ? (
        <>
          <mesh castShadow position={[-0.21, 1.08, 0.215]}>
            <boxGeometry args={[0.26, 0.82, 0.045]} />
            <meshStandardMaterial color={accentColor} />
          </mesh>
          <mesh castShadow position={[0.21, 1.08, 0.215]}>
            <boxGeometry args={[0.26, 0.82, 0.045]} />
            <meshStandardMaterial color={accentColor} />
          </mesh>
        </>
      ) : null}
      {outfitStyle === 'suit' ? (
        <>
          <mesh castShadow position={[0, 1.18, 0.216]}>
            <boxGeometry args={[0.28, 0.74, 0.045]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh castShadow position={[0, 1.05, 0.25]}>
            <boxGeometry args={[0.08, 0.48, 0.05]} />
            <meshStandardMaterial color={accentColor} />
          </mesh>
        </>
      ) : null}
      {outfitStyle === 'sport' ? (
        <mesh castShadow position={[0, 1.08, 0.215]}>
          <boxGeometry args={[0.72, 0.16, 0.045]} />
          <meshStandardMaterial color={secondaryColor} />
        </mesh>
      ) : null}
      {outfitStyle === 'armour' ? (
        <mesh castShadow position={[0, 1.06, 0.235]}>
          <boxGeometry args={[0.6, 0.52, 0.06]} />
          <meshStandardMaterial color={accentColor} metalness={0.15} roughness={0.55} />
        </mesh>
      ) : null}
      {outfitStyle === 'pajamas'
        ? [0, 1, 2].map((index) => (
            <mesh key={index} castShadow position={[-0.22 + index * 0.22, 1.06, 0.22]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color={secondaryColor} />
            </mesh>
          ))
        : null}
      {outfitStyle === 'tank' ? (
        <mesh castShadow position={[0, 1.15, 0.22]}>
          <boxGeometry args={[0.52, 0.56, 0.045]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
      ) : null}
      {bottomStyle === 'skirt' ? (
        <mesh castShadow position={[0, 0.52, 0]}>
          <boxGeometry args={[0.94, 0.22, 0.44]} />
          <meshStandardMaterial color={accentColor} roughness={0.72} />
        </mesh>
      ) : null}
    </group>
  )
}

function AvatarArm({
  bodyColor,
  shirtColor,
  outfitStyle,
}: {
  bodyColor: string
  shirtColor: string
  outfitStyle: AvatarOutfitStyle
}) {
  const sleeveColor = outfitStyle === 'tank' || outfitStyle === 'none' ? bodyColor : shirtColor
  const sleeveHeight = outfitStyle === 'tee' || outfitStyle === 'sport' ? 0.36 : 0.48

  return (
    <>
      <mesh castShadow position={[0, -0.19, 0]}>
        <boxGeometry args={[0.24, sleeveHeight, 0.24]} />
        <meshStandardMaterial color={sleeveColor} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, -0.57, 0]}>
        <boxGeometry args={[0.24, 0.3, 0.24]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
    </>
  )
}

function AvatarHair({
  hairStyle,
  hairColor,
  accentColor,
}: {
  hairStyle: AvatarHairStyle
  hairColor: string
  accentColor: string
}) {
  const normalized = hairStyle === 'curly' ? 'curls' : hairStyle === 'side' || hairStyle === 'flat' ? 'short' : hairStyle
  if (normalized === 'none') return null
  if (normalized === 'beanie') {
    return (
      <mesh castShadow position={[0, 2.31, 0]}>
        <cylinderGeometry args={[0.38, 0.34, 0.24, 12]} />
        <meshStandardMaterial color={accentColor} roughness={0.78} />
      </mesh>
    )
  }

  return (
    <group>
      <mesh castShadow position={[0, 2.27, -0.02]}>
        <boxGeometry args={[0.66, 0.16, 0.62]} />
        <meshStandardMaterial color={hairColor} roughness={0.82} />
      </mesh>
      {normalized === 'spiky'
        ? [-0.24, -0.08, 0.1, 0.26].map((x, index) => (
            <mesh key={index} castShadow position={[x, 2.42, 0.04]} rotation={[0, 0, (index - 1.5) * 0.3]}>
              <boxGeometry args={[0.14, 0.28, 0.18]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          ))
        : null}
      {normalized === 'bob' || normalized === 'long' ? (
        <>
          <mesh castShadow position={[-0.36, 2.08, 0]}>
            <boxGeometry args={[0.13, normalized === 'long' ? 0.56 : 0.36, 0.56]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0.36, 2.08, 0]}>
            <boxGeometry args={[0.13, normalized === 'long' ? 0.56 : 0.36, 0.56]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        </>
      ) : null}
      {normalized === 'curls'
        ? [-0.28, -0.14, 0, 0.14, 0.28].map((x) => (
            <mesh key={x} castShadow position={[x, 2.34, 0.12]}>
              <dodecahedronGeometry args={[0.13, 0]} />
              <meshStandardMaterial color={hairColor} roughness={0.82} />
            </mesh>
          ))
        : null}
      {normalized === 'mohawk'
        ? [-0.18, 0, 0.18].map((z) => (
            <mesh key={z} castShadow position={[0, 2.45, z]}>
              <boxGeometry args={[0.16, 0.34, 0.12]} />
              <meshStandardMaterial color={hairColor} roughness={0.82} />
            </mesh>
          ))
        : null}
    </group>
  )
}

function AvatarFace({
  face,
  eyeColor,
  accentColor,
}: {
  face: string
  eyeColor: string
  accentColor: string
}) {
  const cool = face === 'cool'
  const sleepy = face === 'sleepy'
  const robot = face === 'robot'
  const surprised = face === 'surprised' || face === 'wow'

  return (
    <>
      {cool ? (
        <mesh castShadow position={[0, 1.97, 0.36]}>
          <boxGeometry args={[0.52, 0.12, 0.04]} />
          <meshStandardMaterial color="#111827" roughness={0.5} />
        </mesh>
      ) : (
        <>
          <mesh castShadow position={[-0.22, 1.96, 0.31]}>
            <boxGeometry args={[sleepy ? 0.12 : 0.07, sleepy ? 0.025 : robot ? 0.11 : 0.07, 0.03]} />
            <meshStandardMaterial color={robot ? accentColor : eyeColor} emissive={robot ? accentColor : undefined} emissiveIntensity={robot ? 0.32 : 0} />
          </mesh>
          <mesh castShadow position={[0.22, 1.96, 0.31]}>
            <boxGeometry args={[sleepy ? 0.12 : 0.07, sleepy ? 0.025 : robot ? 0.11 : 0.07, 0.03]} />
            <meshStandardMaterial color={robot ? accentColor : eyeColor} emissive={robot ? accentColor : undefined} emissiveIntensity={robot ? 0.32 : 0} />
          </mesh>
        </>
      )}
      {face !== 'plain' ? (
        <mesh castShadow position={[0, 1.78, 0.32]}>
          <boxGeometry args={[surprised ? 0.12 : face === 'happy' ? 0.32 : 0.24, surprised ? 0.14 : 0.05, 0.03]} />
          <meshStandardMaterial color={robot ? accentColor : '#7c2d12'} emissive={robot ? accentColor : undefined} emissiveIntensity={robot ? 0.2 : 0} />
        </mesh>
      ) : null}
    </>
  )
}

function AvatarAccessory({
  accessory,
  accentColor,
  secondaryColor,
}: {
  accessory?: ShopItemId | 'none' | string
  accentColor: string
  secondaryColor: string
}) {
  if (!accessory || accessory === 'none') return null
  const value = String(accessory)

  if (value.includes('headphones')) {
    return (
      <group>
        <mesh castShadow position={[-0.42, 1.98, 0]}>
          <boxGeometry args={[0.1, 0.34, 0.24]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <mesh castShadow position={[0.42, 1.98, 0]}>
          <boxGeometry args={[0.1, 0.34, 0.24]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <mesh castShadow position={[0, 2.26, 0]}>
          <boxGeometry args={[0.68, 0.06, 0.08]} />
          <meshStandardMaterial color={accentColor} />
        </mesh>
      </group>
    )
  }

  if (value.includes('backpack') || value.includes('wing-pack')) {
    return (
      <mesh castShadow position={[0, 1.08, -0.27]}>
        <boxGeometry args={[0.72, 0.78, 0.18]} />
        <meshStandardMaterial color={accentColor} roughness={0.7} />
      </mesh>
    )
  }

  if (value.includes('halo')) {
    return (
      <mesh castShadow position={[0, 2.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.36, 0.025, 8, 24]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.35} />
      </mesh>
    )
  }

  if (value.includes('wings')) {
    return (
      <group>
        <mesh castShadow position={[-0.52, 1.18, -0.28]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[0.32, 0.72, 0.12]} />
          <meshStandardMaterial color={accentColor} roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0.52, 1.18, -0.28]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[0.32, 0.72, 0.12]} />
          <meshStandardMaterial color={accentColor} roughness={0.7} />
        </mesh>
      </group>
    )
  }

  if (value.includes('pet')) {
    return (
      <group position={[0.72, 0.34, 0.25]}>
        <mesh castShadow position={[0, 0.34, 0]}>
          <boxGeometry args={[0.28, 0.32, 0.22]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 0.63, 0.03]}>
          <boxGeometry args={[0.22, 0.2, 0.18]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
      </group>
    )
  }

  return (
    <mesh castShadow position={[0, 1.97, 0.36]}>
      <boxGeometry args={[0.62, 0.12, 0.04]} />
      <meshStandardMaterial color="#111827" roughness={0.5} />
    </mesh>
  )
}

function ObbyCourse() {
  const beginObby = useGameStore((state) => state.beginObby)
  return (
    <group>
      {obbyCheckpoints.map((position, index) => (
        <mesh
          key={position.join(',')}
          castShadow
          receiveShadow
          position={position}
          scale={index === 0 || index === obbyCheckpoints.length - 1 ? [2.2, 0.35, 2.2] : [1.7, 0.3, 1.7]}
          onClick={() => (index === 0 ? beginObby(performance.now()) : undefined)}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={index === obbyCheckpoints.length - 1 ? '#22c55e' : '#ef4444'} />
        </mesh>
      ))}
    </group>
  )
}

function CoinField() {
  const addCoins = useGameStore((state) => state.addCoins)
  const coins = useMemo<Vec3[]>(() => [[-6, 0.8, -5], [-9, 0.8, -10], [6, 0.8, -4], [10, 0.8, 4], [3, 0.8, 13], [-10, 0.8, 9], [14, 0.8, 10], [18, 2.6, 14], [20, 4, 16], [22, 5.4, 18]], [])
  return (
    <>
      {coins.map((position, index) => (
        <mesh key={index} position={position} onClick={() => addCoins(1)}>
          <cylinderGeometry args={[0.28, 0.28, 0.08, 18]} />
          <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </>
  )
}

function ToyPickup() {
  const advanceQuest = useGameStore((state) => state.advanceQuest)
  return (
    <mesh position={[5, 0.55, 20]} onClick={() => advanceQuest('find-toy', 1)}>
      <dodecahedronGeometry args={[0.45, 0]} />
      <meshStandardMaterial color="#f0abfc" emissive="#f0abfc" emissiveIntensity={0.35} />
    </mesh>
  )
}

function PlacedBlocks() {
  const blocks = useGameStore((state) => state.placedBlocks)
  return (
    <>
      {blocks.map((block) => (
        <BuildPiece key={block.id} block={block} />
      ))}
    </>
  )
}

function BuildPiece({ block }: { block: BuildBlock }) {
  const rotation = block.rotation ?? 0
  return (
    <group position={block.position} rotation={[0, rotation, 0]}>
      {block.kind === 'road' ? <RoadPiece color={block.color} /> : null}
      {block.kind === 'house' ? <HousePiece color={block.color} /> : null}
      {block.kind === 'building' ? <BuildingPiece color={block.color} /> : null}
      {block.kind === 'shop' ? <ShopPiece color={block.color} /> : null}
      {block.kind === 'car' ? <CarPiece color={block.color} /> : null}
      {block.kind === 'tree' ? <TreePiece color={block.color} /> : null}
      {block.kind === 'lamp' ? <LampPiece color={block.color} /> : null}
      {!block.kind || block.kind === 'block' ? <BlockPiece color={block.color} /> : null}
    </group>
  )
}

function BlockPiece({ color }: { color: string }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.72} />
    </mesh>
  )
}

function RoadPiece({ color }: { color: string }) {
  return (
    <group>
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[realScale.roadTile, 0.08, realScale.roadTile]} />
        <meshStandardMaterial color={color} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[0.12, 0.02, realScale.roadTile * 0.64]} />
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.12} />
      </mesh>
    </group>
  )
}

function HousePiece({ color }: { color: string }) {
  const { width, depth, bodyHeight, roofHeight } = buildPieceDimensions.house
  const windowY = realScale.floorHeight * 1.43

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, bodyHeight / 2, 0]}>
        <boxGeometry args={[width, bodyHeight, depth]} />
        <meshStandardMaterial color={color} roughness={0.76} />
      </mesh>
      <mesh castShadow position={[0, bodyHeight + roofHeight / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[Math.max(width, depth) * 0.74, roofHeight, 4]} />
        <meshStandardMaterial color="#ef4444" roughness={0.78} />
      </mesh>
      <mesh position={[0, realScale.doorHeight / 2, depth / 2 + 0.03]}>
        <boxGeometry args={[realScale.doorWidth, realScale.doorHeight, realScale.doorDepth]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.82} />
      </mesh>
      <mesh position={[-width * 0.26, windowY, depth / 2 + 0.04]}>
        <boxGeometry args={[realScale.windowWidth, realScale.windowHeight, realScale.windowDepth]} />
        <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[width * 0.26, windowY, depth / 2 + 0.04]}>
        <boxGeometry args={[realScale.windowWidth, realScale.windowHeight, realScale.windowDepth]} />
        <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.12} />
      </mesh>
    </group>
  )
}

function BuildingPiece({ color }: { color: string }) {
  const { width, depth, bodyHeight, roofHeight, floors } = buildPieceDimensions.building
  const windowRows = Array.from({ length: floors }, (_, row) => realScale.floorHeight * row + realScale.floorHeight * 0.62)

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, bodyHeight / 2, 0]}>
        <boxGeometry args={[width, bodyHeight, depth]} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>
      {windowRows.map((height) => (
        <group key={height}>
          <mesh position={[-width * 0.24, height, depth / 2 + 0.04]}>
            <boxGeometry args={[realScale.windowWidth, realScale.windowHeight, realScale.windowDepth]} />
            <meshStandardMaterial color="#dbeafe" emissive="#93c5fd" emissiveIntensity={0.14} />
          </mesh>
          <mesh position={[width * 0.24, height, depth / 2 + 0.04]}>
            <boxGeometry args={[realScale.windowWidth, realScale.windowHeight, realScale.windowDepth]} />
            <meshStandardMaterial color="#dbeafe" emissive="#93c5fd" emissiveIntensity={0.14} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, realScale.doorHeight / 2, depth / 2 + 0.05]}>
        <boxGeometry args={[realScale.doorWidth, realScale.doorHeight, realScale.doorDepth]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, bodyHeight + roofHeight / 2, 0]}>
        <boxGeometry args={[width * 1.08, roofHeight, depth * 1.08]} />
        <meshStandardMaterial color="#1e293b" roughness={0.76} />
      </mesh>
    </group>
  )
}

function ShopPiece({ color }: { color: string }) {
  const { width, depth, bodyHeight, awningHeight } = buildPieceDimensions.shop

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, bodyHeight / 2, 0]}>
        <boxGeometry args={[width, bodyHeight, depth]} />
        <meshStandardMaterial color={color} roughness={0.74} />
      </mesh>
      <mesh castShadow position={[0, bodyHeight + awningHeight / 2, 0.18]}>
        <boxGeometry args={[width * 1.08, awningHeight, depth * 1.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.78} />
      </mesh>
      <mesh castShadow position={[0, realScale.doorHeight + 0.45, depth / 2 + 0.08]}>
        <boxGeometry args={[width * 0.9, 0.38, 0.34]} />
        <meshStandardMaterial color="#ffffff" roughness={0.72} />
      </mesh>
      <mesh position={[0, realScale.doorHeight / 2, depth / 2 + 0.05]}>
        <boxGeometry args={[realScale.doorWidth, realScale.doorHeight, realScale.doorDepth]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.82} />
      </mesh>
    </group>
  )
}

function CarPiece({ color }: { color: string }) {
  const bodyY = realScale.wheelRadius + realScale.carBodyHeight / 2
  const cabinY = realScale.wheelRadius + realScale.carBodyHeight + realScale.carCabinHeight / 2

  return (
    <group>
      <mesh castShadow position={[0, bodyY, 0]}>
        <boxGeometry args={[realScale.carLength, realScale.carBodyHeight, realScale.carWidth]} />
        <meshStandardMaterial color={color} roughness={0.68} />
      </mesh>
      <mesh castShadow position={[0.08, cabinY, -0.02]}>
        <boxGeometry args={[realScale.carLength * 0.46, realScale.carCabinHeight, realScale.carWidth * 0.78]} />
        <meshStandardMaterial color="#bfdbfe" roughness={0.58} />
      </mesh>
      {[-realScale.carLength * 0.32, realScale.carLength * 0.32].map((x) =>
        [-realScale.carWidth * 0.48, realScale.carWidth * 0.48].map((z) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, realScale.wheelRadius, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[realScale.wheelRadius, realScale.wheelRadius, realScale.carWidth * 0.12, 12]} />
            <meshStandardMaterial color="#111827" roughness={0.8} />
          </mesh>
        )),
      )}
    </group>
  )
}

function TreePiece({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, realScale.treeTrunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.18, 0.26, realScale.treeTrunkHeight, 8]} />
        <meshStandardMaterial color="#92400e" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, realScale.treeTrunkHeight + realScale.treeCanopySize * 0.42, 0]}>
        <dodecahedronGeometry args={[realScale.treeCanopySize / 2, 0]} />
        <meshStandardMaterial color={color} roughness={0.74} />
      </mesh>
    </group>
  )
}

function LampPiece({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, realScale.lampHeight / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.1, realScale.lampHeight, 8]} />
        <meshStandardMaterial color="#111827" roughness={0.78} />
      </mesh>
      <mesh castShadow position={[0, realScale.lampHeight + 0.28, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
      </mesh>
    </group>
  )
}
