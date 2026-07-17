import { useFrame } from '@react-three/fiber'
import { Edges, useKeyboardControls, Html, useTexture } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Armchair, BedDouble, CarFront, MessageCircle } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react'
import * as THREE from 'three'
import { botProfiles } from '../data/botProfiles'
import { miniGameDefinition, miniGameTargets } from '../ai/miniGames'
import { obbyCheckpoints, obbyPlatforms } from '../ai/obby'
import { buildGridOverlayForPlayer, findBuildPlacementPosition } from '../ai/buildMode'
import {
  generateProceduralWorld,
  type ProceduralPiece,
} from '../data/proceduralWorld'
import { getBuildPiece } from '../data/buildPieces'
import { worldLocations, distance2d } from '../data/world'
import { nearestLocation, useGameStore } from '../state/gameStore'
import {
  makePartySnapshot,
  useLocalPartyStore,
  type LocalPartySnapshot,
} from '../state/localPartyStore'
import { pitchFromLookDrag, yawFromLookDrag } from './cameraControl'
import {
  classroomStations,
  classroomTeacher,
  classroomTeacherDesk,
  classroomWhiteboard,
} from './classroom'
import {
  collisionSkin,
  collisionBoxesBlockingPlayer,
  playerCollisionRadius,
  playerIsGrounded,
  resolveHorizontalCollision,
  resolvePlayerVerticalCollision,
  separateCircleFromBoxes,
  type CollisionBox,
} from './collision'
import { activeObbyCollisionBoxes } from './obbyPhysics'
import {
  buildBlockInteriorEntrance,
  filterEntranceSafeZoneCollisions,
  houseBedCenter,
  houseBedHeadboardZ,
  houseBedHalfSize,
  houseBedPillowCenter,
  houseBedSleepPosition,
  houseBedWakePosition,
  interiorCollisionBoxes,
  interiorEntryYaw,
  interiorExitPosition,
  interiorExitRadius,
  interiorRoomHalfSize,
  interiorSpawnPosition,
  interiorStandingY,
  isNearHouseBed,
  makeInteriorVisit,
  nearestInteriorEntrance,
  proceduralDoorEntrance,
  staticBuildingEntrance,
  type InteriorEntrance,
} from './interiors'
import {
  avatarBodyBaseY,
  avatarGroundOffset,
  avatarSitDrop,
  buildPieceDimensions,
  floorCountFromHeight,
  realScale,
} from './scale'
import {
  nearestSeatTarget,
  outdoorBenchFixtures,
  seatDistance,
  seatMarkerRadius,
  seatsForContext,
} from './seating'
import {
  cameraRelativeMovement,
  cameraViewHeading,
  orbitYawForCameraHeading,
  playerMovementSpeed,
  playerStrafeFromInput,
} from './movement'
import { avatarSleepRotation } from './sleepPose'
import {
  coreActivityPositions,
  coreCoinPositions,
  footprintOverlapsAuthoredCore,
  coreTerrainZones,
  staticLampPositions,
  staticTownBuildings,
  staticTreePositions,
} from './townPlacement'
import {
  advanceTrafficForObstacles,
  createTrafficVehicles,
  makeTrafficLanes,
  trafficCollisionBoxes,
  trafficHeadingYaw,
  trafficPositionAt,
  type TrafficLane,
  type TrafficVehicle,
} from './traffic'
import {
  advanceDrivableVehicleWithCollisions,
  createParkedVehicles,
  collisionBoxOverlapsParkingClearance,
  distanceToVehicle,
  drivingInputFromControls,
  drivableVehicleCollisionBoxes,
  nearestDrivableVehicle,
  parkingLot,
  parkingLotCollisionBoxes,
  pedestrianCollisionBoxes,
  proceduralPieceBlocksParking,
  safeVehicleExitPosition,
  vehicleRenderYaw,
  type DrivableVehicle,
} from './vehicles'
import type {
  AvatarBottomStyle,
  AvatarSettings,
  AvatarFaceStyle,
  AvatarHairStyle,
  AvatarOutfitStyle,
  AvatarShoeStyle,
  BotRuntime,
  BuildBlock,
  BuildPieceId,
  InteriorKind,
  InteriorVisit,
  ShopItemId,
  Vec3,
} from './types'

const worldHtmlZIndexRange: [number, number] = [4, 0]
const worldActionZIndexRange: [number, number] = [26, 25]

const staticCollisionObstacles: CollisionBox[] = [
  ...staticTownBuildings.map(({ position, scale }, index) => ({
    id: `static-building:${index}`,
    center: position,
    half: [scale[0] / 2 + 0.18, scale[1] / 2, scale[2] / 2 + 0.18] as Vec3,
  })),
  ...staticTreePositions
    .filter((position) => !staticTreeBlocksParking(position))
    .map((position, index) => ({
      id: `static-tree:${index}`,
      center: [
        position[0],
        buildPieceDimensions.tree.height / 2,
        position[2],
      ] as Vec3,
      half: [
        buildPieceDimensions.tree.footprint / 2,
        buildPieceDimensions.tree.height / 2,
        buildPieceDimensions.tree.footprint / 2,
      ] as Vec3,
    })),
  ...outdoorBenchFixtures.map(({ position }, index) => ({
    id: `static-bench:${index}`,
    center: position,
    half: [1.2, 0.55, 0.45] as Vec3,
  })),
  ...staticLampPositions
    .filter((position) => !staticLampBlocksParking(position))
    .map((position, index) => ({
      id: `static-lamp:${index}`,
      center: [
        position[0],
        buildPieceDimensions.lamp.height / 2,
        position[2],
      ] as Vec3,
      half: [
        buildPieceDimensions.lamp.footprint / 2,
        buildPieceDimensions.lamp.height / 2,
        buildPieceDimensions.lamp.footprint / 2,
      ] as Vec3,
    })),
  { id: 'static-billboard', center: [-11, 1.1, 2], half: [2, 1.3, 0.35] },
]

const staticInteriorEntrances: InteriorEntrance[] = staticTownBuildings.map(
  (building) =>
    staticBuildingEntrance({
      id: `static:${building.id}`,
      title: building.title,
      kind: building.interiorKind,
      center: building.position,
      scale: building.scale,
    }),
)

export function GameScene() {
  const activeInterior = useGameStore((state) => state.activeInterior)
  if (activeInterior) {
    return (
      <>
        <InteriorWorld interior={activeInterior} />
        <PlayerController key={`interior:${activeInterior.id}`} />
        <LocalPartyPlayers />
      </>
    )
  }

  return <OutdoorWorld />
}

function OutdoorWorld() {
  const settings = useGameStore((state) => state.settings)
  const teleportSequence = useGameStore((state) => state.teleportSequence)
  const trafficLanes = useMemo(() => makeTrafficLanes(), [])
  const trafficVehicleCount = settings.quality === 'low' ? 6 : 10
  const initialTrafficVehicles = useMemo(
    () => createTrafficVehicles(trafficLanes, trafficVehicleCount),
    [trafficLanes, trafficVehicleCount],
  )
  const trafficRuntime = useRef<TrafficVehicle[]>(initialTrafficVehicles)
  const parkedVehicles = useMemo(() => createParkedVehicles(), [])
  const drivableRuntime = useRef<DrivableVehicle[]>(parkedVehicles)

  useEffect(() => {
    trafficRuntime.current = initialTrafficVehicles
  }, [initialTrafficVehicles])

  useEffect(() => {
    drivableRuntime.current = parkedVehicles
  }, [parkedVehicles])

  return (
    <>
      <ProceduralBoroughWorld />
      <Town />
      <SeatActionMarkers />
      <ParkingLot vehicles={parkedVehicles} runtime={drivableRuntime} />
      <TrafficVehicles
        lanes={trafficLanes}
        vehicles={initialTrafficVehicles}
        runtime={trafficRuntime}
        drivableRuntime={drivableRuntime}
      />
      <PlayerController
        key={`outdoor:${teleportSequence}`}
        trafficLanes={trafficLanes}
        trafficRuntime={trafficRuntime}
        drivableRuntime={drivableRuntime}
      />
      <Bots />
      <SavedFriendPlayers />
      <LocalPartyPlayers />
      <ObbyCourse />
      <CoinField />
      <MiniGameWorld />
      <ToyPickup />
      <PlacedBlocks />
      <RemotePlacedBlocks />
      <BuildModeOverlay />
    </>
  )
}

function TrafficVehicles({
  lanes,
  vehicles,
  runtime,
  drivableRuntime,
}: {
  lanes: TrafficLane[]
  vehicles: TrafficVehicle[]
  runtime: MutableRefObject<TrafficVehicle[]>
  drivableRuntime: MutableRefObject<DrivableVehicle[]>
}) {
  const laneById = useMemo(
    () => new Map(lanes.map((lane) => [lane.id, lane])),
    [lanes],
  )

  useFrame((_, delta) => {
    const game = useGameStore.getState()
    const party = useLocalPartyStore.getState()
    const pedestrians: Vec3[] = [
      game.playerPosition,
      ...game.bots.map((bot) => bot.position),
      ...Object.values(party.remotePlayers)
        .filter((player) => !player.interiorId)
        .map((player) => player.position),
    ]
    runtime.current = runtime.current.map((vehicle) => {
      const vehicleLane = laneById.get(vehicle.laneId)
      return vehicleLane
        ? advanceTrafficForObstacles(
            vehicle,
            vehicleLane,
            Math.min(delta, 0.1),
            pedestrians,
            runtime.current,
          )
        : vehicle
    })
  })

  return (
    <group>
      {vehicles.map((vehicle) => {
        const lane = laneById.get(vehicle.laneId)
        return lane ? (
          <TrafficVehicleMesh
            key={vehicle.id}
            vehicle={vehicle}
            lane={lane}
            runtime={runtime}
            drivableRuntime={drivableRuntime}
          />
        ) : null
      })}
    </group>
  )
}

function TrafficVehicleMesh({
  vehicle,
  lane,
  runtime,
  drivableRuntime,
}: {
  vehicle: TrafficVehicle
  lane: TrafficLane
  runtime: MutableRefObject<TrafficVehicle[]>
  drivableRuntime: MutableRefObject<DrivableVehicle[]>
}) {
  const group = useRef<THREE.Group>(null)
  const initialPose = trafficPositionAt(lane, vehicle.offset)
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const setActiveVehicle = useGameStore((state) => state.setActiveVehicle)
  const [nearby, setNearby] = useState(false)

  useFrame(() => {
    const current =
      runtime.current.find((item) => item.id === vehicle.id) ?? vehicle
    if (!runtime.current.some((item) => item.id === vehicle.id)) {
      if (group.current) group.current.visible = false
      if (nearby) setNearby(false)
      return
    }
    const pose = trafficPositionAt(lane, current.offset)
    group.current?.position.set(
      pose.position[0],
      pose.position[1],
      pose.position[2],
    )
    if (group.current) group.current.rotation.y = pose.yaw
    const playerPosition = useGameStore.getState().playerPosition
    const nextNearby =
      !activeVehicleId &&
      Math.hypot(
        playerPosition[0] - pose.position[0],
        playerPosition[2] - pose.position[2],
      ) <= 3.2
    if (nextNearby !== nearby) setNearby(nextNearby)
  })

  const driveTrafficCar = () => {
    const current = runtime.current.find((item) => item.id === vehicle.id)
    if (!current || activeVehicleId) return
    const pose = trafficPositionAt(lane, current.offset)
    const drivableId = `traffic-drive:${current.id}`
    runtime.current = runtime.current.filter((item) => item.id !== current.id)
    drivableRuntime.current = [
      ...drivableRuntime.current.filter((item) => item.id !== drivableId),
      {
        id: drivableId,
        label: 'Traffic Car',
        color: current.color,
        position: [pose.position[0], pose.position[1] + 0.04, pose.position[2]],
        yaw: trafficHeadingYaw(lane),
        speed: 0,
      },
    ]
    setActiveVehicle(drivableId)
  }

  return (
    <group
      ref={group}
      position={initialPose.position}
      rotation={[0, initialPose.yaw, 0]}
    >
      <CarPiece color={vehicle.color} />
      {nearby ? (
        <Html
          center
          position={[0, 2.45, 0]}
          zIndexRange={worldActionZIndexRange}
        >
          <button
            type="button"
            className="bb-world-action-button"
            data-testid={`traffic-drive-${vehicle.id}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              driveTrafficCar()
            }}
          >
            <CarFront size={18} aria-hidden />
            Drive Traffic Car
          </button>
        </Html>
      ) : null}
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
    [
      chunk.x,
      chunk.z,
      settings.nightMode,
      settings.worldSeed,
      settings.worldViewDistance,
    ],
  )

  if (!settings.proceduralWorld) return null

  return (
    <group>
      {world.pieces
        .filter(
          (piece) =>
            !proceduralPieceBlocksParking(piece) &&
            !proceduralObjectInsideCoreTown(piece),
        )
        .map((piece) => (
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
  const castsShadow =
    piece.kind === 'building' ||
    piece.kind === 'roof' ||
    piece.kind === 'tree-top' ||
    piece.kind === 'landmark'
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
      {piece.kind !== 'tree-top' &&
      piece.kind !== 'lamp-light' &&
      piece.id !== 'landmark:london-eye-ring' &&
      piece.id !== 'landmark:shard' ? (
        <mesh
          castShadow={castsShadow}
          receiveShadow={receivesShadow}
          scale={piece.scale}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ) : null}
    </group>
  )
}

function InteriorWorld({ interior }: { interior: InteriorVisit }) {
  const room = interiorRoomHalfSize()
  const theme = interiorTheme(interior.kind)

  return (
    <group data-testid="interior-world">
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[room.width * 2, 0.1, room.depth * 2]} />
        <meshStandardMaterial color={theme.floor} roughness={0.86} />
      </mesh>
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <boxGeometry args={[room.width * 1.45, 0.04, room.depth * 1.08]} />
        <meshStandardMaterial color={theme.rug} roughness={0.72} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[0, 1.8, room.depth + room.wallThickness / 2]}
      >
        <boxGeometry args={[room.width * 2, 3.6, room.wallThickness]} />
        <meshStandardMaterial color={theme.wall} roughness={0.74} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[-room.width - room.wallThickness / 2, 1.8, 0]}
      >
        <boxGeometry args={[room.wallThickness, 3.6, room.depth * 2]} />
        <meshStandardMaterial color={theme.wall} roughness={0.74} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[room.width + room.wallThickness / 2, 1.8, 0]}
      >
        <boxGeometry args={[room.wallThickness, 3.6, room.depth * 2]} />
        <meshStandardMaterial color={theme.wall} roughness={0.74} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[
          -(room.width + room.doorHalfWidth) / 2,
          1.8,
          -room.depth - room.wallThickness / 2,
        ]}
      >
        <boxGeometry
          args={[room.width - room.doorHalfWidth, 3.6, room.wallThickness]}
        />
        <meshStandardMaterial color={theme.wall} roughness={0.74} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[
          (room.width + room.doorHalfWidth) / 2,
          1.8,
          -room.depth - room.wallThickness / 2,
        ]}
      >
        <boxGeometry
          args={[room.width - room.doorHalfWidth, 3.6, room.wallThickness]}
        />
        <meshStandardMaterial color={theme.wall} roughness={0.74} />
      </mesh>
      <mesh
        castShadow
        position={[
          0,
          realScale.doorHeight / 2,
          -room.depth - room.wallThickness / 2 + 0.03,
        ]}
      >
        <boxGeometry
          args={[
            realScale.doorWidth * 1.2,
            realScale.doorHeight,
            realScale.doorDepth,
          ]}
        />
        <meshStandardMaterial color="#7c2d12" roughness={0.82} />
      </mesh>
      <mesh position={interiorExitPosition}>
        <cylinderGeometry
          args={[interiorExitRadius, interiorExitRadius, 0.06, 24]}
        />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={0.28}
          transparent
          opacity={0.6}
        />
      </mesh>
      <Html
        center
        position={[0, 2.65, -room.depth + 0.25]}
        zIndexRange={worldHtmlZIndexRange}
      >
        <span className="whitespace-nowrap rounded-lg bg-slate-950/85 px-3 py-1 text-xs font-black text-white shadow">
          Exit to town
        </span>
      </Html>
      <Html center position={[0, 3.2, 2.7]} zIndexRange={worldHtmlZIndexRange}>
        <span className="whitespace-nowrap rounded-xl bg-white/95 px-4 py-2 text-sm font-black text-slate-950 shadow">
          {interior.title}
        </span>
      </Html>
      <InteriorProps kind={interior.kind} />
      <SeatActionMarkers />
      <group position={[4.8, interiorStandingY, -1.8]} rotation={[0, -0.55, 0]}>
        <BlockAvatar
          bodyColor="#f2b07e"
          shirtColor={theme.buddyShirt}
          hairColor="#5a2f16"
          hairStyle={interior.kind === 'school' ? 'bob' : 'short'}
          pantsColor="#1f2937"
          outfitStyle="hoodie"
          bottomStyle="jeans"
          shoeStyle="sneakers"
          username={
            interior.kind === 'shop'
              ? 'ShopBuddy'
              : interior.kind === 'school'
                ? 'ClassBuddy'
                : 'HomeBuddy'
          }
          emote="wave"
          action="idle"
        />
      </group>
    </group>
  )
}

function InteriorProps({ kind }: { kind: InteriorKind }) {
  if (kind === 'shop') {
    return (
      <group>
        <InteriorBox
          position={[0, 0.55, 3.9]}
          scale={[4.3, 1.1, 1.1]}
          color="#0f172a"
        />
        <InteriorBox
          position={[0, 1.2, 3.32]}
          scale={[3.6, 0.22, 0.12]}
          color="#facc15"
        />
        <InteriorShelf x={-5.1} color="#38bdf8" />
        <InteriorShelf x={5.1} color="#f472b6" />
        {[-1.1, 0, 1.1].map((x) => (
          <mesh key={x} castShadow position={[x, 1.35, 3.2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 18]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#f59e0b"
              emissiveIntensity={0.16}
            />
          </mesh>
        ))}
      </group>
    )
  }
  if (kind === 'school') {
    return (
      <group>
        <InteriorBox
          position={classroomWhiteboard.position}
          scale={[
            classroomWhiteboard.size[0] + 0.24,
            classroomWhiteboard.size[1] + 0.24,
            0.16,
          ]}
          color="#1e3a8a"
        />
        <InteriorBox
          position={[
            classroomWhiteboard.position[0],
            classroomWhiteboard.position[1],
            classroomWhiteboard.position[2] - 0.09,
          ]}
          scale={classroomWhiteboard.size}
          color="#f8fafc"
        />
        <Html
          center
          position={[
            0,
            classroomWhiteboard.position[1],
            classroomWhiteboard.position[2] - 0.18,
          ]}
          zIndexRange={worldHtmlZIndexRange}
        >
          <span
            data-testid="classroom-whiteboard"
            className="pointer-events-none select-none whitespace-nowrap rounded bg-white/90 px-3 py-1 text-xs font-black text-blue-950"
          >
            {classroomWhiteboard.lesson}
          </span>
        </Html>
        <InteriorBox
          position={classroomTeacherDesk.position}
          scale={classroomTeacherDesk.size}
          color="#a16207"
        />
        {classroomStations.map((station) => (
          <group key={station.id}>
            <InteriorBox
              position={station.deskPosition}
              scale={[1.44, 0.76, 1.04]}
              color="#facc15"
            />
            <ClassroomChair position={station.chairPosition} />
          </group>
        ))}
        <group
          position={[
            classroomTeacher.position[0],
            interiorStandingY,
            classroomTeacher.position[2],
          ]}
          rotation={[0, classroomTeacher.yaw, 0]}
        >
          <BlockAvatar
            bodyColor="#c9825a"
            shirtColor="#1d4ed8"
            hairColor="#3b1f12"
            hairStyle="bob"
            pantsColor="#172554"
            outfitStyle="suit"
            bottomStyle="jeans"
            shoeStyle="sneakers"
            accentColor="#facc15"
            username={classroomTeacher.name}
            emote="wave"
            action="idle"
          />
        </group>
      </group>
    )
  }
  if (kind === 'building') {
    return (
      <group>
        <InteriorBox
          position={[0, 0.5, 3.8]}
          scale={[3.6, 1, 0.96]}
          color="#334155"
        />
        <SofaModel
          position={[-4.1, 0, 0.6]}
          rotation={Math.PI / 2}
          color="#2563eb"
        />
        <SofaModel
          position={[4.1, 0, 0.6]}
          rotation={-Math.PI / 2}
          color="#2563eb"
        />
        <InteriorBox
          position={[0, 2.1, 5.95]}
          scale={[3.7, 1, 0.12]}
          color="#bae6fd"
          emissive="#38bdf8"
        />
      </group>
    )
  }
  return (
    <group>
      <SofaModel
        position={[-4.1, 0, 1.3]}
        rotation={Math.PI / 2}
        color="#60a5fa"
      />
      <HouseBed />
      <InteriorBox
        position={[0, 0.42, 1.15]}
        scale={[1.76, 0.84, 1.76]}
        color="#a16207"
      />
      <InteriorBox
        position={[0, 1.15, 1.15]}
        scale={[0.72, 0.16, 0.72]}
        color="#fde68a"
      />
    </group>
  )
}

function proceduralObjectInsideCoreTown(piece: ProceduralPiece) {
  if (piece.id.startsWith('landmark:')) return false
  if (
    piece.kind === 'ground' ||
    piece.kind === 'water' ||
    piece.kind === 'road' ||
    piece.kind === 'pavement' ||
    piece.kind === 'line'
  )
    return false
  return footprintOverlapsAuthoredCore(piece.position, piece.scale, 0.08)
}

function ClassroomChair({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <InteriorBox
        position={[0, 0.48, 0]}
        scale={[0.72, 0.16, 0.72]}
        color="#2563eb"
      />
      <InteriorBox
        position={[0, 0.82, -0.31]}
        scale={[0.72, 0.62, 0.14]}
        color="#1d4ed8"
      />
      {[-0.27, 0.27].flatMap((x) =>
        [-0.27, 0.27].map((z) => (
          <InteriorBox
            key={`${x}-${z}`}
            position={[x, 0.22, z]}
            scale={[0.1, 0.44, 0.1]}
            color="#334155"
          />
        )),
      )}
    </group>
  )
}

function SofaModel({
  position,
  rotation,
  color,
}: {
  position: Vec3
  rotation: number
  color: string
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <InteriorBox
        position={[0, 0.38, 0]}
        scale={[3.2, 0.42, 1.08]}
        color={color}
      />
      <InteriorBox
        position={[0, 0.82, -0.48]}
        scale={[3.2, 0.92, 0.2]}
        color={color}
      />
      <InteriorBox
        position={[-1.5, 0.58, 0]}
        scale={[0.2, 0.72, 1.08]}
        color={color}
      />
      <InteriorBox
        position={[1.5, 0.58, 0]}
        scale={[0.2, 0.72, 1.08]}
        color={color}
      />
    </group>
  )
}

function SeatActionMarkers() {
  const activeInterior = useGameStore((state) => state.activeInterior)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const seatedSeatId = useGameStore((state) => state.seatedSeatId)
  const seats = useMemo(
    () => seatsForContext(activeInterior?.kind),
    [activeInterior?.kind],
  )

  return (
    <group>
      {seats.map((seat) => {
        const occupied = seatedSeatId === seat.id
        if (!occupied && seatDistance(playerPosition, seat) > seatMarkerRadius)
          return null
        return (
          <Html
            key={seat.id}
            center
            position={[
              seat.position[0],
              seat.position[1] + 1.2,
              seat.position[2],
            ]}
            zIndexRange={worldActionZIndexRange}
          >
            <button
              type="button"
              className="bb-world-action-button"
              data-testid={`seat-action-${seat.id}`}
              aria-label={occupied ? 'Stand up' : `Sit on ${seat.label}`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                pulseWorldAction('seat', seat.id)
              }}
            >
              <Armchair size={18} aria-hidden />
              {occupied ? 'Stand' : 'Sit'}
            </button>
          </Html>
        )
      })}
    </group>
  )
}

function pulseWorldAction(type: 'seat' | 'vehicle', id: string) {
  useGameStore.getState().requestWorldAction(type, id)
}

function ParkingLot({
  vehicles,
  runtime,
}: {
  vehicles: DrivableVehicle[]
  runtime: MutableRefObject<DrivableVehicle[]>
}) {
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const visibleVehicles =
    activeVehicleId || runtime.current.length > 0 ? runtime.current : vehicles

  return (
    <group data-testid="parking-lot">
      <mesh receiveShadow position={parkingLot.center}>
        <boxGeometry
          args={[parkingLot.width, parkingLot.center[1] * 2, parkingLot.depth]}
        />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={parkingLot.drivewayCenter}>
        <boxGeometry
          args={[
            parkingLot.drivewayWidth,
            parkingLot.drivewayCenter[1] * 2,
            parkingLot.drivewayDepth,
          ]}
        />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      {[-21.3, -17.8, -14.4, -10.7].map((z) => (
        <mesh key={z} position={[parkingLot.center[0], 0.078, z]}>
          <boxGeometry args={[parkingLot.width * 0.9, 0.02, 0.1]} />
          <meshStandardMaterial
            color="#f8fafc"
            emissive="#f8fafc"
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
      <group position={parkingLot.signPosition}>
        <mesh castShadow position={[0, 1.05, 0]}>
          <boxGeometry args={[0.12, 2.1, 0.12]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh castShadow position={[0, 2.05, 0]}>
          <boxGeometry args={[1.05, 0.85, 0.12]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
        <Html
          center
          position={[0, 2.05, 0.08]}
          zIndexRange={worldHtmlZIndexRange}
        >
          <span className="pointer-events-none select-none text-2xl font-black text-white">
            P
          </span>
        </Html>
      </group>
      <Html
        center
        position={[parkingLot.center[0], 3.15, parkingLot.center[2] + 4.35]}
        zIndexRange={worldHtmlZIndexRange}
      >
        <span
          data-testid="parking-lot-label"
          className="pointer-events-none select-none whitespace-nowrap rounded-lg bg-white/95 px-3 py-1 text-xs font-black text-slate-950 shadow"
        >
          Buddy Parking - tap a car to drive
        </span>
      </Html>
      {visibleVehicles.map((vehicle) => (
        <DrivableVehicleMesh
          key={vehicle.id}
          vehicle={vehicle}
          runtime={runtime}
        />
      ))}
    </group>
  )
}

function DrivableVehicleMesh({
  vehicle,
  runtime,
}: {
  vehicle: DrivableVehicle
  runtime: MutableRefObject<DrivableVehicle[]>
}) {
  const group = useRef<THREE.Group>(null)
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const avatar = useGameStore((state) => state.avatar)
  const [nearby, setNearby] = useState(false)
  const occupied = activeVehicleId === vehicle.id

  useFrame(() => {
    const current =
      runtime.current.find((item) => item.id === vehicle.id) ?? vehicle
    group.current?.position.set(
      current.position[0],
      current.position[1],
      current.position[2],
    )
    if (group.current) group.current.rotation.y = vehicleRenderYaw(current.yaw)
    const state = useGameStore.getState()
    const nextNearby =
      (!state.activeVehicleId || state.activeVehicleId === vehicle.id) &&
      !state.activeInterior &&
      distanceToVehicle(state.playerPosition, current) <= 2.3
    if (nextNearby !== nearby) setNearby(nextNearby)
  })

  return (
    <group
      ref={group}
      position={vehicle.position}
      rotation={[0, vehicleRenderYaw(vehicle.yaw), 0]}
      onClick={(event) => {
        event.stopPropagation()
        pulseWorldAction('vehicle', vehicle.id)
      }}
    >
      <CarPiece color={vehicle.color} occupied={occupied} />
      {occupied ? (
        <group
          position={[-0.1, 1.15, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={0.56}
        >
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
            accessory="none"
            face={avatar.face}
            username="Driver"
            showName={false}
            emote="sit"
            action="idle"
          />
        </group>
      ) : null}
      {nearby ? (
        <Html
          center
          position={[0, 2.85, 0]}
          zIndexRange={worldActionZIndexRange}
        >
          <button
            type="button"
            className={`bb-world-action-button ${occupied ? 'vehicle-exit-world' : ''}`}
            data-testid={`vehicle-action-${vehicle.id}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              pulseWorldAction('vehicle', vehicle.id)
            }}
          >
            <CarFront size={18} aria-hidden />
            {occupied ? 'Exit car' : `Drive ${vehicle.label}`}
          </button>
        </Html>
      ) : !occupied ? (
        <Html center position={[0, 2.65, 0]} zIndexRange={worldHtmlZIndexRange}>
          <span className="pointer-events-none select-none whitespace-nowrap rounded-full bg-slate-950/90 px-3 py-1 text-xs font-black text-white shadow">
            Drive
          </span>
        </Html>
      ) : null}
    </group>
  )
}

function HouseBed() {
  const sleeping = useGameStore((state) => state.sleeping)
  const setTouch = useGameStore((state) => state.setTouch)
  const [nearby, setNearby] = useState(false)

  useFrame(() => {
    const state = useGameStore.getState()
    const nextNearby =
      state.activeInterior?.kind === 'house' &&
      isNearHouseBed(state.playerPosition)
    if (nextNearby !== nearby) setNearby(nextNearby)
  })

  const requestBedAction = () => {
    const state = useGameStore.getState()
    if (
      state.activeInterior?.kind !== 'house' ||
      (!state.sleeping && !isNearHouseBed(state.playerPosition))
    )
      return
    if (state.touch.interact) return
    setTouch({ interact: true })
    window.setTimeout(
      () => useGameStore.getState().setTouch({ interact: false }),
      100,
    )
  }

  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        position={houseBedCenter}
        onClick={(event) => {
          event.stopPropagation()
          requestBedAction()
        }}
      >
        <boxGeometry
          args={[
            houseBedHalfSize[0] * 2,
            houseBedHalfSize[1] * 2,
            houseBedHalfSize[2] * 2,
          ]}
        />
        <meshStandardMaterial color="#f9a8d4" roughness={0.76} />
      </mesh>
      <InteriorBox
        position={[houseBedCenter[0], 0.94, houseBedHeadboardZ]}
        scale={[2.6, 1.12, 0.24]}
        color="#be185d"
      />
      <InteriorBox
        position={houseBedPillowCenter}
        scale={[1.7, 0.18, 0.72]}
        color="#f8fafc"
      />
      {nearby || sleeping ? (
        <Html
          center
          position={[houseBedCenter[0], 1.75, houseBedCenter[2]]}
          zIndexRange={worldActionZIndexRange}
        >
          <button
            type="button"
            className="bb-world-action-button"
            data-testid="bed-action-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              requestBedAction()
            }}
          >
            <BedDouble size={18} aria-hidden />
            {sleeping ? 'Wake up' : 'Sleep'}
          </button>
        </Html>
      ) : null}
    </group>
  )
}

function InteriorShelf({ x, color }: { x: number; color: string }) {
  return (
    <group>
      <InteriorBox
        position={[x, 0.95, 0.8]}
        scale={[0.84, 1.9, 4.2]}
        color="#e5e7eb"
      />
      {[-0.8, 0.2, 1.2].map((z, index) => (
        <InteriorBox
          key={z}
          position={[x, 0.8 + index * 0.42, z]}
          scale={[0.9, 0.28, 0.52]}
          color={color}
        />
      ))}
    </group>
  )
}

function InteriorBox({
  position,
  scale,
  color,
  emissive,
}: {
  position: Vec3
  scale: Vec3
  color: string
  emissive?: string
}) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={scale} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissive ? 0.16 : 0}
        roughness={0.76}
      />
    </mesh>
  )
}

function interiorTheme(kind: InteriorKind) {
  if (kind === 'shop')
    return {
      floor: '#fef3c7',
      wall: '#bfdbfe',
      rug: '#f97316',
      buddyShirt: '#22c55e',
    }
  if (kind === 'school')
    return {
      floor: '#e0f2fe',
      wall: '#dbeafe',
      rug: '#a78bfa',
      buddyShirt: '#3b82f6',
    }
  if (kind === 'building')
    return {
      floor: '#e2e8f0',
      wall: '#cbd5e1',
      rug: '#64748b',
      buddyShirt: '#0f172a',
    }
  return {
    floor: '#fef9c3',
    wall: '#fde68a',
    rug: '#22c55e',
    buddyShirt: '#f472b6',
  }
}

function proceduralPiecesToCollisionBoxes(pieces: ProceduralPiece[]) {
  return pieces.flatMap((piece): CollisionBox[] => {
    if (
      piece.kind === 'ground' ||
      piece.kind === 'water' ||
      piece.kind === 'road' ||
      piece.kind === 'pavement' ||
      piece.kind === 'line' ||
      piece.kind === 'park' ||
      piece.kind === 'door' ||
      piece.kind === 'window'
    )
      return []
    if (piece.id === 'landmark:london-eye-ring') return []
    const padding =
      piece.kind === 'building' ? 0.18 : piece.kind === 'landmark' ? 0.22 : 0
    return [visibleBox(piece, padding)]
  })
}

function buildBlocksToCollisionBoxes(blocks: BuildBlock[]) {
  return blocks
    .map((block): CollisionBox | undefined => {
      if (block.kind === 'road') {
        return undefined
      }
      const half = buildCollisionHalf(block.kind ?? 'block')
      const rotatedHalf = rotatedCollisionHalf(half, block.rotation ?? 0)
      const centerY =
        !block.kind || block.kind === 'block'
          ? block.position[1]
          : block.position[1] + half[1]
      return {
        id: `build:${block.kind ?? 'block'}:${block.id}`,
        center: [block.position[0], centerY, block.position[2]],
        half: rotatedHalf,
      }
    })
    .filter((box): box is CollisionBox => Boolean(box))
}

function buildCollisionHalf(kind: BuildBlock['kind']): Vec3 {
  switch (kind) {
    case 'house':
      return [
        buildPieceDimensions.house.width / 2,
        (buildPieceDimensions.house.bodyHeight +
          buildPieceDimensions.house.roofHeight) /
          2,
        buildPieceDimensions.house.depth / 2,
      ]
    case 'building':
      return [
        buildPieceDimensions.building.width / 2,
        (buildPieceDimensions.building.bodyHeight +
          buildPieceDimensions.building.roofHeight) /
          2,
        buildPieceDimensions.building.depth / 2,
      ]
    case 'shop':
      return [
        buildPieceDimensions.shop.width / 2,
        (buildPieceDimensions.shop.bodyHeight +
          buildPieceDimensions.shop.awningHeight) /
          2,
        buildPieceDimensions.shop.depth / 2,
      ]
    case 'car':
      return [
        buildPieceDimensions.car.length / 2,
        (realScale.wheelRadius +
          realScale.carBodyHeight +
          realScale.carCabinHeight) /
          2,
        buildPieceDimensions.car.width / 2,
      ]
    case 'tree':
      return [
        buildPieceDimensions.tree.footprint / 2,
        (realScale.treeTrunkHeight + realScale.treeCanopySize * 0.92) / 2,
        buildPieceDimensions.tree.footprint / 2,
      ]
    case 'lamp':
      return [
        buildPieceDimensions.lamp.footprint / 2,
        (realScale.lampHeight + 0.56) / 2,
        buildPieceDimensions.lamp.footprint / 2,
      ]
    default:
      return [0.5, 0.5, 0.5]
  }
}

function rotatedCollisionHalf(half: Vec3, yaw: number): Vec3 {
  const cosine = Math.abs(Math.cos(yaw))
  const sine = Math.abs(Math.sin(yaw))
  return [
    half[0] * cosine + half[2] * sine,
    half[1],
    half[0] * sine + half[2] * cosine,
  ]
}

function visibleBox(piece: ProceduralPiece, padding: number): CollisionBox {
  return {
    id: `procedural:${piece.id}`,
    center: piece.position,
    half: [
      piece.scale[0] / 2 + padding,
      piece.scale[1] / 2,
      piece.scale[2] / 2 + padding,
    ],
  }
}

function Town() {
  const groundTexture = useTexture(
    '/assets/kenney/prototype-textures/grid-green.png',
  )
  const plazaTexture = useTexture(
    '/assets/kenney/prototype-textures/grid-light.png',
  )

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
          <meshStandardMaterial
            color="#7ee36f"
            map={groundTexture}
            roughness={0.9}
          />
        </mesh>
        <CuboidCollider args={[27, 0.08, 27]} position={[0, -0.08, 0]} />
      </RigidBody>

      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[6, 6, 0.08, 48]} />
        <meshStandardMaterial
          color="#d9d9d9"
          map={plazaTexture}
          roughness={0.82}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 48]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <SpawnPad />
      <Roads />

      {worldLocations.map((location) => (
        <group key={location.id} position={location.position}>
          <Html
            center
            position={[0, 3.2, 0]}
            zIndexRange={worldHtmlZIndexRange}
          >
            <span className="whitespace-nowrap rounded-lg bg-white/90 px-3 py-1 text-sm font-black text-slate-900 shadow">
              {location.label}
            </span>
          </Html>
        </group>
      ))}

      {staticTownBuildings.map((building) => (
        <Building
          key={building.position.join(',')}
          position={building.position}
          color={building.color}
          scale={building.scale}
        />
      ))}
      <Storefront position={[12, 0, -7]} label="SHOP" color="#f97316" />
      <Storefront position={[-21, 0, 22]} label="SCHOOL" color="#a78bfa" />
      <Storefront position={[18, 0, 21]} label="OBBY" color="#ef4444" />
      <Billboard position={[-11, 0, 2]} />
      <Benches />
      <StreetLamps />

      {staticTreePositions
        .filter((position) => !staticTreeBlocksParking(position))
        .map((position) => (
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
      <mesh
        receiveShadow
        position={[0, 0.025, -9.75]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[realScale.roadTile, 37.5]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh
        receiveShadow
        position={[0, 0.03, 9]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      >
        <planeGeometry args={[realScale.roadTile, 54]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      {coreTerrainZones
        .filter((zone) => zone.terrain === 'sidewalk')
        .map((zone) => (
          <mesh
            key={zone.id}
            receiveShadow
            position={[zone.center[0], 0.065, zone.center[2]]}
          >
            <boxGeometry args={[zone.size[0], 0.08, zone.size[2]]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.92} />
          </mesh>
        ))}
    </group>
  )
}

function Building({
  position,
  color,
  scale,
}: {
  position: Vec3
  color: string
  scale: Vec3
}) {
  const floors = floorCountFromHeight(scale[1])
  const roofHeight = realScale.roofHeight
  const doorY = -scale[1] / 2 + realScale.doorHeight / 2
  const windowRows = Array.from({ length: Math.min(floors, 6) }, (_, row) => {
    const y =
      -scale[1] / 2 + row * realScale.floorHeight + realScale.floorHeight * 0.62
    return y > scale[1] / 2 - realScale.windowHeight / 2 ? null : y
  }).filter((value): value is number => value !== null)

  return (
    <group position={position}>
      <mesh castShadow receiveShadow scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh
        castShadow
        position={[0, scale[1] / 2 + roofHeight / 2, 0]}
        scale={[scale[0] * 1.08, roofHeight, scale[2] * 1.08]}
      >
        <coneGeometry args={[0.8, 1, 4]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh
        position={[0, doorY, scale[2] / 2 + 0.02]}
        scale={[realScale.doorWidth, realScale.doorHeight, realScale.doorDepth]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7c2d12" />
      </mesh>
      {windowRows.map((y, row) => (
        <group key={row}>
          <mesh
            position={[-scale[0] * 0.22, y, scale[2] / 2 + 0.03]}
            scale={[
              realScale.windowWidth,
              realScale.windowHeight,
              realScale.windowDepth,
            ]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#bae6fd"
              emissive="#38bdf8"
              emissiveIntensity={0.15}
            />
          </mesh>
          <mesh
            position={[scale[0] * 0.22, y, scale[2] / 2 + 0.03]}
            scale={[
              realScale.windowWidth,
              realScale.windowHeight,
              realScale.windowDepth,
            ]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#bae6fd"
              emissive="#38bdf8"
              emissiveIntensity={0.15}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Storefront({
  position,
  label,
  color,
}: {
  position: Vec3
  label: string
  color: string
}) {
  return (
    <group
      position={[position[0], realScale.doorHeight + 0.42, position[2] + 1.45]}
    >
      <mesh castShadow>
        <boxGeometry args={[2.8, 0.55, 0.18]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Html
        center
        position={[0, 0.01, 0.12]}
        zIndexRange={worldHtmlZIndexRange}
      >
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
      <Html
        center
        position={[0, 2.12, 0.16]}
        zIndexRange={worldHtmlZIndexRange}
      >
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
      {outdoorBenchFixtures.map(({ position, rotation }) => (
        <group
          key={position.join(',')}
          position={position}
          rotation={[0, rotation, 0]}
        >
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
      {staticLampPositions
        .filter((position) => !staticLampBlocksParking(position))
        .map((position) => (
          <group key={position.join(',')} position={position}>
            <mesh castShadow position={[0, realScale.lampHeight / 2, 0]}>
              <cylinderGeometry args={[0.08, 0.1, realScale.lampHeight, 10]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh castShadow position={[0, realScale.lampHeight + 0.34, 0]}>
              <sphereGeometry args={[0.34, 14, 10]} />
              <meshStandardMaterial
                color="#fde68a"
                emissive="#facc15"
                emissiveIntensity={0.55}
              />
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
      <mesh
        castShadow
        position={[
          0,
          realScale.treeTrunkHeight + realScale.treeCanopySize * 0.42,
          0,
        ]}
      >
        <dodecahedronGeometry args={[realScale.treeCanopySize / 2, 0]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
    </group>
  )
}

function PlayerController({
  trafficLanes = [],
  trafficRuntime,
  drivableRuntime,
}: {
  trafficLanes?: TrafficLane[]
  trafficRuntime?: MutableRefObject<TrafficVehicle[]>
  drivableRuntime?: MutableRefObject<DrivableVehicle[]>
}) {
  const initialPlayerState = useGameStore.getState()
  const initialPlayerPosition =
    initialPlayerState.teleportTarget?.position ??
    initialPlayerState.playerPosition
  const initialPlayerYaw =
    initialPlayerState.teleportTarget?.yaw ?? initialPlayerState.playerYaw
  const controllerTeleportSequence = initialPlayerState.teleportSequence
  const group = useRef<THREE.Group>(null)
  const [, getKeys] = useKeyboardControls()
  const velocityY = useRef(0)
  const yaw = useRef(initialPlayerYaw)
  const cameraOrbitYaw = useRef(0)
  const cameraPitch = useRef(0)
  const snapCameraOnNextFrame = useRef(
    Boolean(initialPlayerState.teleportTarget?.resetView),
  )
  const sleepCameraPose = useRef<
    { yaw: number; orbitYaw: number; pitch: number } | undefined
  >(undefined)
  const lastBuildAt = useRef(0)
  const lastPartyBroadcastAt = useRef(0)
  const lastInteriorTransitionAt = useRef(0)
  const interactionHeld = useRef(false)
  const lastWorldActionSequence = useRef(0)
  const movingRef = useRef(false)
  const runningRef = useRef(false)
  const airborneRef = useRef(false)
  const [moving, setMoving] = useState(false)
  const [running, setRunning] = useState(false)
  const [airborne, setAirborne] = useState(false)
  const position = useRef(
    new THREE.Vector3(
      initialPlayerPosition[0],
      initialPlayerPosition[1] + avatarGroundOffset,
      initialPlayerPosition[2],
    ),
  )
  const setPlayer = useGameStore((state) => state.setPlayer)
  const setTouch = useGameStore((state) => state.setTouch)
  const touch = useGameStore((state) => state.touch)
  const avatar = useGameStore((state) => state.avatar)
  const playerName = useGameStore((state) => state.playerName)
  const playerEmote = useGameStore((state) => state.playerEmote)
  const sleeping = useGameStore((state) => state.sleeping)
  const setSleeping = useGameStore((state) => state.setSleeping)
  const seatedSeatId = useGameStore((state) => state.seatedSeatId)
  const setSeatedSeat = useGameStore((state) => state.setSeatedSeat)
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const setActiveVehicle = useGameStore((state) => state.setActiveVehicle)
  const setInteractionPrompt = useGameStore(
    (state) => state.setInteractionPrompt,
  )
  const settings = useGameStore((state) => state.settings)
  const activeInterior = useGameStore((state) => state.activeInterior)
  const placedBlocks = useGameStore((state) => state.placedBlocks)
  const remotePlayerRecord = useLocalPartyStore((state) => state.remotePlayers)
  const remotePlacedBlocks = useMemo(
    () =>
      Object.values(remotePlayerRecord).flatMap(
        (player) => player.placedBlocks ?? [],
      ),
    [remotePlayerRecord],
  )
  const buildMode = useGameStore((state) => state.buildMode)
  const placeBlock = useGameStore((state) => state.placeBlock)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const beginObby = useGameStore((state) => state.beginObby)
  const completeObby = useGameStore((state) => state.completeObby)
  const updateObby = useGameStore((state) => state.updateObby)
  const tickMiniGame = useGameStore((state) => state.tickMiniGame)
  const obby = useGameStore((state) => state.obby)
  const setNearbyLocation = useGameStore((state) => state.setNearbyLocation)
  const enterInterior = useGameStore((state) => state.enterInterior)
  const leaveInterior = useGameStore((state) => state.leaveInterior)
  const advanceQuest = useGameStore((state) => state.advanceQuest)
  const botReact = useGameStore((state) => state.botReact)
  const recordBotMeet = useGameStore((state) => state.recordBotMeet)
  const bots = useGameStore((state) => state.bots)
  const visitedBots = useGameStore((state) => state.visitedBots)
  const partyPlayerId = useLocalPartyStore((state) => state.playerId)
  const partyPlayerName = useLocalPartyStore((state) => state.playerName)
  const broadcastSnapshot = useLocalPartyStore(
    (state) => state.broadcastSnapshot,
  )
  const [collisionChunk, setCollisionChunk] = useState(() => ({
    x: Math.floor(position.current.x / 36),
    z: Math.floor(position.current.z / 36),
  }))
  const proceduralPieces = useMemo(
    () =>
      settings.proceduralWorld
        ? generateProceduralWorld({
            seed: settings.worldSeed || 'LONDON-2026',
            center: [collisionChunk.x * 36 + 18, 0, collisionChunk.z * 36 + 18],
            viewDistance: settings.worldViewDistance,
            night: settings.nightMode,
          }).pieces
        : [],
    [
      collisionChunk.x,
      collisionChunk.z,
      settings.nightMode,
      settings.proceduralWorld,
      settings.worldSeed,
      settings.worldViewDistance,
    ],
  )
  const interiorEntrances = useMemo(() => {
    if (activeInterior) return []
    const proceduralEntrances = proceduralPieces.flatMap((piece) => {
      const entrance = proceduralDoorEntrance(piece)
      return entrance ? [entrance] : []
    })
    const buildEntrances = [...placedBlocks, ...remotePlacedBlocks].flatMap(
      (block) => {
        const entrance = buildBlockInteriorEntrance(block)
        return entrance ? [entrance] : []
      },
    )
    return [
      ...staticInteriorEntrances,
      ...proceduralEntrances,
      ...buildEntrances,
    ]
  }, [activeInterior, placedBlocks, proceduralPieces, remotePlacedBlocks])
  const seatTargets = useMemo(
    () => seatsForContext(activeInterior?.kind),
    [activeInterior?.kind],
  )
  const collisionObstacles = useMemo(() => {
    if (activeInterior) return interiorCollisionBoxes(activeInterior.kind)
    const proceduralObstacles = proceduralPiecesToCollisionBoxes(
      proceduralPieces,
    ).filter((box) => !collisionBoxOverlapsParkingClearance(box))
    const outsideObstacles = [
      ...staticCollisionObstacles,
      ...activeObbyCollisionBoxes(obby.active),
      ...parkingLotCollisionBoxes(),
      ...proceduralObstacles,
      ...buildBlocksToCollisionBoxes(placedBlocks),
      ...buildBlocksToCollisionBoxes(remotePlacedBlocks),
    ]
    return filterEntranceSafeZoneCollisions(outsideObstacles, interiorEntrances)
  }, [
    activeInterior,
    interiorEntrances,
    obby.active,
    placedBlocks,
    proceduralPieces,
    remotePlacedBlocks,
  ])

  useFrame((state, delta) => {
    const nextCollisionChunk = {
      x: Math.floor(position.current.x / 36),
      z: Math.floor(position.current.z / 36),
    }
    if (
      nextCollisionChunk.x !== collisionChunk.x ||
      nextCollisionChunk.z !== collisionChunk.z
    )
      setCollisionChunk(nextCollisionChunk)

    const keys = getKeys()
    const forward = Number(keys.forward) - Number(keys.back) + -touch.y
    const strafe = Number(keys.right) - Number(keys.left) + touch.x
    const inputMoving = Math.abs(forward) > 0.05 || Math.abs(strafe) > 0.05
    const inputRunning = inputMoving && (Boolean(keys.run) || touch.run)
    const interacting = Boolean(keys.interact) || touch.interact
    const justInteracted = interacting && !interactionHeld.current
    interactionHeld.current = interacting
    const standY = activeInterior ? interiorStandingY : avatarGroundOffset
    let sleepingThisFrame = sleeping && activeInterior?.kind === 'house'
    let seatedThisFrame = seatedSeatId
    let activeVehicleThisFrame = activeVehicleId
    let currentSeat = seatedThisFrame
      ? seatTargets.find((seat) => seat.id === seatedThisFrame)
      : undefined
    let currentVehicle = activeVehicleThisFrame
      ? drivableRuntime?.current.find(
          (vehicle) => vehicle.id === activeVehicleThisFrame,
        )
      : undefined
    const nearBed =
      activeInterior?.kind === 'house' &&
      isNearHouseBed([position.current.x, 0, position.current.z])
    const trafficObstacles =
      activeInterior || !trafficRuntime
        ? []
        : trafficCollisionBoxes(trafficLanes, trafficRuntime.current)
    const parkedVehicleObstacles =
      activeInterior || !drivableRuntime
        ? []
        : drivableVehicleCollisionBoxes(
            drivableRuntime.current,
            activeVehicleThisFrame,
          )
    const solidObstacles = [
      ...collisionObstacles,
      ...trafficObstacles,
      ...parkedVehicleObstacles,
    ]
    const request = useGameStore.getState().worldActionRequest
    const hasWorldRequest = Boolean(
      request && request.sequence !== lastWorldActionSequence.current,
    )
    if (hasWorldRequest && request)
      lastWorldActionSequence.current = request.sequence
    const requestedSeat =
      hasWorldRequest && request?.type === 'seat'
        ? seatTargets.find(
            (seat) =>
              seat.id === request.id &&
              seatDistance([position.current.x, 0, position.current.z], seat) <=
                seatMarkerRadius,
          )
        : undefined
    const requestedVehicle =
      hasWorldRequest && request?.type === 'vehicle' && drivableRuntime
        ? drivableRuntime.current.find(
            (vehicle) =>
              vehicle.id === request.id &&
              distanceToVehicle(
                [position.current.x, 0, position.current.z],
                vehicle,
              ) <= 2.3,
          )
        : undefined
    const nearestSeat = nearestSeatTarget(
      [position.current.x, 0, position.current.z],
      seatTargets,
    )
    const nearestVehicle =
      !activeInterior && drivableRuntime
        ? nearestDrivableVehicle(
            [position.current.x, 0, position.current.z],
            drivableRuntime.current,
          )
        : undefined
    const wantsWorldAction = justInteracted || hasWorldRequest
    const worldActionsEnabled =
      !buildMode &&
      !obby.active &&
      useGameStore.getState().miniGame.status !== 'running'
    let exitedWorldPose = false

    if (sleeping && activeInterior?.kind !== 'house') {
      sleepingThisFrame = false
      setSleeping(false)
      sleepCameraPose.current = undefined
    }
    if (seatedThisFrame && !currentSeat) {
      seatedThisFrame = undefined
      setSeatedSeat(undefined)
    }
    if (activeVehicleThisFrame && !currentVehicle) {
      activeVehicleThisFrame = undefined
      setActiveVehicle(undefined)
    }

    if (activeVehicleThisFrame && currentVehicle && wantsWorldAction) {
      const partyPlayers = Object.values(
        useLocalPartyStore.getState().remotePlayers,
      )
        .filter((player) => !player.interiorId)
        .map((player) => player.position)
      const exitObstacles = collisionBoxesBlockingPlayer(
        [
          ...collisionObstacles,
          ...trafficObstacles,
          ...drivableVehicleCollisionBoxes(
            drivableRuntime?.current ?? [],
            activeVehicleThisFrame,
          ),
          ...pedestrianCollisionBoxes([
            ...bots.map((bot) => bot.position),
            ...partyPlayers,
          ]),
        ],
        avatarGroundOffset,
      )
      const exitPosition = safeVehicleExitPosition(
        currentVehicle,
        exitObstacles,
      )
      if (exitPosition) {
        position.current.set(
          exitPosition[0],
          avatarGroundOffset,
          exitPosition[2],
        )
        yaw.current = currentVehicle.yaw
        cameraOrbitYaw.current = 0
        currentVehicle.speed = 0
        setActiveVehicle(undefined)
        activeVehicleThisFrame = undefined
        currentVehicle = undefined
        exitedWorldPose = true
      }
    }

    if (
      seatedThisFrame &&
      currentSeat &&
      (wantsWorldAction || inputMoving || keys.jump || touch.jump)
    ) {
      position.current.set(
        currentSeat.exitPosition[0],
        standY,
        currentSeat.exitPosition[2],
      )
      yaw.current = currentSeat.yaw
      cameraOrbitYaw.current = 0
      velocityY.current = 0
      setSeatedSeat(undefined)
      seatedThisFrame = undefined
      currentSeat = undefined
      exitedWorldPose = true
    }

    if (sleepingThisFrame && wantsWorldAction) {
      sleepingThisFrame = false
      setSleeping(false)
      position.current.set(
        houseBedWakePosition[0],
        houseBedWakePosition[1],
        houseBedWakePosition[2],
      )
      if (sleepCameraPose.current) {
        yaw.current = sleepCameraPose.current.yaw
        cameraOrbitYaw.current = sleepCameraPose.current.orbitYaw
        cameraPitch.current = sleepCameraPose.current.pitch
        sleepCameraPose.current = undefined
      }
      velocityY.current = 0
      exitedWorldPose = true
    } else if (sleepingThisFrame && (inputMoving || keys.jump || touch.jump)) {
      sleepingThisFrame = false
      setSleeping(false)
      position.current.set(
        houseBedWakePosition[0],
        houseBedWakePosition[1],
        houseBedWakePosition[2],
      )
      if (sleepCameraPose.current) {
        yaw.current = sleepCameraPose.current.yaw
        cameraOrbitYaw.current = sleepCameraPose.current.orbitYaw
        cameraPitch.current = sleepCameraPose.current.pitch
        sleepCameraPose.current = undefined
      }
      velocityY.current = 0
    }

    if (
      !activeVehicleThisFrame &&
      !seatedThisFrame &&
      !sleepingThisFrame &&
      !exitedWorldPose &&
      wantsWorldAction &&
      worldActionsEnabled
    ) {
      const seatToUse =
        requestedSeat ?? (!hasWorldRequest ? nearestSeat : undefined)
      const vehicleToUse =
        requestedVehicle ?? (!hasWorldRequest ? nearestVehicle : undefined)
      if (requestedSeat || (!hasWorldRequest && seatToUse && !nearBed)) {
        currentSeat = seatToUse
        if (currentSeat) {
          seatedThisFrame = currentSeat.id
          position.current.set(
            currentSeat.position[0],
            currentSeat.position[1],
            currentSeat.position[2],
          )
          yaw.current = currentSeat.yaw
          cameraOrbitYaw.current = 0
          velocityY.current = 0
          setSeatedSeat(currentSeat.id)
        }
      } else if (
        requestedVehicle ||
        (!hasWorldRequest && vehicleToUse && !nearBed)
      ) {
        currentVehicle = vehicleToUse
        if (currentVehicle) {
          activeVehicleThisFrame = currentVehicle.id
          position.current.set(
            currentVehicle.position[0],
            avatarGroundOffset,
            currentVehicle.position[2],
          )
          yaw.current = currentVehicle.yaw
          cameraOrbitYaw.current = 0
          velocityY.current = 0
          setActiveVehicle(currentVehicle.id)
        }
      } else if (activeInterior?.kind === 'house' && nearBed) {
        sleepCameraPose.current = {
          yaw: yaw.current,
          orbitYaw: cameraOrbitYaw.current,
          pitch: cameraPitch.current,
        }
        sleepingThisFrame = true
        setSleeping(true)
        position.current.set(
          houseBedSleepPosition[0],
          houseBedSleepPosition[1],
          houseBedSleepPosition[2],
        )
        velocityY.current = 0
      }
    }

    if (Math.abs(touch.lookX) > 0.01 || Math.abs(touch.lookY) > 0.01) {
      cameraOrbitYaw.current = yawFromLookDrag(
        cameraOrbitYaw.current,
        touch.lookX,
      )
      cameraPitch.current = pitchFromLookDrag(cameraPitch.current, touch.lookY)
      setTouch({ lookX: 0, lookY: 0 })
    }

    let isAirborne = false
    let effectiveMoving = false
    let effectiveRunning = false

    if (activeVehicleThisFrame && currentVehicle && drivableRuntime) {
      const remotePedestrians = Object.values(
        useLocalPartyStore.getState().remotePlayers,
      )
        .filter((player) => !player.interiorId)
        .map((player) => player.position)
      const vehicleObstacles = [
        ...collisionObstacles,
        ...trafficObstacles,
        ...drivableVehicleCollisionBoxes(
          drivableRuntime.current,
          activeVehicleThisFrame,
        ),
        ...pedestrianCollisionBoxes([
          ...bots.map((bot) => bot.position),
          ...remotePedestrians,
        ]),
      ]
      const nextVehicle = advanceDrivableVehicleWithCollisions(
        currentVehicle,
        drivingInputFromControls(
          forward,
          strafe,
          Boolean(keys.jump) || touch.jump,
        ),
        delta,
        vehicleObstacles,
      )
      const vehicleIndex = drivableRuntime.current.findIndex(
        (vehicle) => vehicle.id === nextVehicle.id,
      )
      if (vehicleIndex >= 0) drivableRuntime.current[vehicleIndex] = nextVehicle
      yaw.current = nextVehicle.yaw
      position.current.set(
        nextVehicle.position[0],
        avatarGroundOffset,
        nextVehicle.position[2],
      )
      velocityY.current = 0
    } else if (seatedThisFrame && currentSeat) {
      position.current.set(
        currentSeat.position[0],
        currentSeat.position[1],
        currentSeat.position[2],
      )
      yaw.current = currentSeat.yaw
      velocityY.current = 0
    } else if (sleepingThisFrame) {
      position.current.set(
        houseBedSleepPosition[0],
        houseBedSleepPosition[1],
        houseBedSleepPosition[2],
      )
      velocityY.current = 0
    } else {
      const fallbackCameraHeading = yaw.current + cameraOrbitYaw.current
      const cameraHeading = cameraViewHeading(
        { x: position.current.x, z: position.current.z },
        { x: state.camera.position.x, z: state.camera.position.z },
        fallbackCameraHeading,
      )
      const movement = cameraRelativeMovement(
        forward,
        playerStrafeFromInput(strafe),
        cameraHeading,
      )
      if (movement.magnitude > 0) {
        yaw.current = movement.yaw
        cameraOrbitYaw.current = orbitYawForCameraHeading(
          cameraHeading,
          yaw.current,
        )
      }
      const speed = playerMovementSpeed(inputRunning)
      const blockingObstacles = collisionBoxesBlockingPlayer(
        solidObstacles,
        position.current.y,
      )
      const blockingVehicles = collisionBoxesBlockingPlayer(
        [...trafficObstacles, ...parkedVehicleObstacles],
        position.current.y,
      )
      const clearPosition = separateCircleFromBoxes(
        [position.current.x, position.current.y, position.current.z],
        blockingObstacles,
        playerCollisionRadius + collisionSkin,
      )
      position.current.x = clearPosition[0]
      position.current.z = clearPosition[2]
      const desiredPosition = position.current.clone()
      desiredPosition.x += movement.x * speed * delta
      desiredPosition.z += movement.z * speed * delta
      const resolvedPosition = resolveHorizontalCollision(
        [position.current.x, position.current.y, position.current.z],
        [desiredPosition.x, desiredPosition.y, desiredPosition.z],
        blockingObstacles,
        playerCollisionRadius,
      )
      const separatedPosition = separateCircleFromBoxes(
        resolvedPosition,
        blockingVehicles,
        playerCollisionRadius + 0.05,
      )
      position.current.x = separatedPosition[0]
      position.current.z = separatedPosition[2]
      const groundY = standY - avatarGroundOffset
      const groundedBeforeMove = playerIsGrounded(
        [position.current.x, position.current.y, position.current.z],
        solidObstacles,
        groundY,
      )
      if ((keys.jump || touch.jump) && groundedBeforeMove) velocityY.current = 9
      else velocityY.current -= 25 * delta
      const vertical = resolvePlayerVerticalCollision({
        point: [position.current.x, position.current.y, position.current.z],
        desiredY: position.current.y + velocityY.current * delta,
        boxes: solidObstacles,
        groundY,
      })
      position.current.y = vertical.y
      if (vertical.surfaceId) velocityY.current = 0
      isAirborne = !playerIsGrounded(
        [position.current.x, position.current.y, position.current.z],
        solidObstacles,
        groundY,
      )
      effectiveMoving = inputMoving
      effectiveRunning = inputRunning
    }

    const promptSeat = nearestSeatTarget(
      [position.current.x, 0, position.current.z],
      seatTargets,
    )
    const promptVehicle =
      !activeInterior && drivableRuntime
        ? nearestDrivableVehicle(
            [position.current.x, 0, position.current.z],
            drivableRuntime.current,
          )
        : undefined
    setInteractionPrompt(
      activeVehicleThisFrame
        ? 'exit-vehicle'
        : seatedThisFrame
          ? 'stand'
          : sleepingThisFrame
            ? 'wake'
            : worldActionsEnabled &&
                activeInterior?.kind === 'house' &&
                isNearHouseBed([position.current.x, 0, position.current.z])
              ? 'sleep'
              : worldActionsEnabled && promptSeat
                ? 'sit'
                : worldActionsEnabled && promptVehicle
                  ? 'enter-vehicle'
                  : undefined,
    )

    if (effectiveMoving !== movingRef.current) {
      movingRef.current = effectiveMoving
      setMoving(effectiveMoving)
    }
    if (effectiveRunning !== runningRef.current) {
      runningRef.current = effectiveRunning
      setRunning(effectiveRunning)
    }
    if (isAirborne !== airborneRef.current) {
      airborneRef.current = isAirborne
      setAirborne(isAirborne)
    }
    if (position.current.y < -2 && obby.active) {
      position.current.set(
        obby.checkpoint[0],
        obby.checkpoint[1],
        obby.checkpoint[2],
      )
      velocityY.current = 0
    }

    group.current?.position.copy(position.current)
    if (group.current) {
      group.current.visible = !activeVehicleThisFrame
      group.current.rotation.y = sleepingThisFrame ? 0 : yaw.current
    }
    const mobile = state.size.width < 640
    const interiorZoom = THREE.MathUtils.clamp(
      settings.interiorCameraZoom ?? 1.3,
      0.85,
      1.85,
    )
    const cameraDistance = activeVehicleThisFrame
      ? mobile
        ? -15
        : -10.5
      : activeInterior
        ? mobile
          ? -5.6 * interiorZoom
          : -6.2 * interiorZoom
        : mobile
          ? -13
          : -8
    const baseCameraHeight = activeVehicleThisFrame
      ? mobile
        ? 8.4
        : 6.2
      : activeInterior
        ? mobile
          ? 7 + (interiorZoom - 1) * 2.2
          : 5.5 + (interiorZoom - 1) * 1.6
        : mobile
          ? 7.4
          : 5
    const cameraHeight = baseCameraHeight + cameraPitch.current * 3.2
    const lookHeight =
      (activeVehicleThisFrame ? 1.8 : 1.4) + cameraPitch.current * 1.1
    const cameraYaw = yaw.current + cameraOrbitYaw.current
    const cameraTarget = position.current
      .clone()
      .add(
        new THREE.Vector3(
          Math.sin(cameraYaw) * cameraDistance,
          cameraHeight,
          Math.cos(cameraYaw) * cameraDistance,
        ),
      )
    if (activeInterior) {
      const room = interiorRoomHalfSize()
      cameraTarget.x = THREE.MathUtils.clamp(
        cameraTarget.x,
        -room.width + 0.55,
        room.width - 0.55,
      )
      cameraTarget.z = THREE.MathUtils.clamp(
        cameraTarget.z,
        -room.depth + 0.55,
        room.depth - 0.55,
      )
    }
    if (snapCameraOnNextFrame.current) {
      state.camera.position.copy(cameraTarget)
      snapCameraOnNextFrame.current = false
    } else {
      state.camera.position.lerp(cameraTarget, 0.12)
    }
    const targetFov = activeInterior
      ? THREE.MathUtils.lerp(42, 64, (interiorZoom - 0.85) / 1)
      : 48
    if ('fov' in state.camera && Math.abs(state.camera.fov - targetFov) > 0.1) {
      state.camera.fov = targetFov
      state.camera.updateProjectionMatrix()
    }
    state.camera.lookAt(
      position.current.x,
      position.current.y + lookHeight,
      position.current.z,
    )
    setPlayer(
      [position.current.x, position.current.y - standY, position.current.z],
      yaw.current,
      controllerTeleportSequence,
    )
    if (performance.now() - lastPartyBroadcastAt.current > 120) {
      broadcastSnapshot(
        makePartySnapshot({
          id: partyPlayerId,
          name: partyPlayerName,
          position: [
            position.current.x,
            position.current.y - standY,
            position.current.z,
          ],
          yaw: yaw.current,
          avatar,
          action: isAirborne
            ? 'jump'
            : effectiveMoving
              ? effectiveRunning
                ? 'run'
                : 'walk'
              : 'idle',
          interiorId: activeInterior?.id,
          placedBlocks,
        }),
      )
      lastPartyBroadcastAt.current = performance.now()
    }

    const groundPosition: Vec3 = [position.current.x, 0, position.current.z]
    const transitionReady =
      performance.now() - lastInteriorTransitionAt.current > 850
    if (activeVehicleThisFrame || seatedThisFrame || sleepingThisFrame) {
      setNearbyLocation(undefined)
      return
    }
    if (activeInterior) {
      setNearbyLocation(undefined)
      if (
        transitionReady &&
        (effectiveMoving || keys.interact || touch.interact) &&
        distance2d(groundPosition, interiorExitPosition) < interiorExitRadius
      ) {
        const previousInterior = leaveInterior()
        if (previousInterior) {
          lastInteriorTransitionAt.current = performance.now()
          return
        }
      }
      return
    }

    const doorway =
      transitionReady && (effectiveMoving || keys.interact || touch.interact)
        ? nearestInteriorEntrance(groundPosition, interiorEntrances)
        : undefined
    if (doorway) {
      enterInterior(
        makeInteriorVisit(doorway),
        interiorSpawnPosition,
        interiorEntryYaw,
      )
      lastInteriorTransitionAt.current = performance.now()
      return
    }

    const nearby = nearestLocation([position.current.x, 0, position.current.z])
    setNearbyLocation(nearby)
    if (nearby === 'park') advanceQuest('visit-park', 1)
    if (nearby === 'school') advanceQuest('visit-school', 1)
    if (nearby === 'shop') advanceQuest('visit-shop', 1)
    if (nearby === 'obby' && (keys.interact || touch.interact) && !obby.active)
      beginObby(performance.now())
    if (nearby === 'shop' && (keys.interact || touch.interact))
      useGameStore.getState().setOpenPanel('shop')
    if (
      buildMode &&
      (keys.interact || touch.interact) &&
      performance.now() - lastBuildAt.current > 350
    ) {
      placeBlock()
      lastBuildAt.current = performance.now()
    }

    updateObby(performance.now(), obbyCheckpoints)
    tickMiniGame(performance.now(), [
      position.current.x,
      position.current.y - standY,
      position.current.z,
    ])
    if (
      distance2d([position.current.x, 0, position.current.z], [22, 0, 18]) <
        1.8 &&
      obby.active
    ) {
      completeObby(performance.now())
      bots.slice(0, 2).forEach((bot) => botReact(bot.id, 'questComplete'))
    }

    bots.forEach((bot) => {
      if (
        distance2d(bot.position, [position.current.x, 0, position.current.z]) <
        2.4
      ) {
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
          <meshStandardMaterial
            color="#f0abfc"
            emissive="#f0abfc"
            emissiveIntensity={0.8}
          />
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
        emote={sleeping ? 'sleep' : seatedSeatId ? 'sit' : playerEmote}
        action={
          seatedSeatId || activeVehicleId
            ? 'idle'
            : airborne
              ? 'jump'
              : moving
                ? running
                  ? 'run'
                  : 'walk'
                : 'idle'
        }
      />
    </group>
  )
}

function LocalPartyPlayers() {
  const lastPruneAt = useRef(0)
  const remotePlayerRecord = useLocalPartyStore((state) => state.remotePlayers)
  const pruneRemotePlayers = useLocalPartyStore(
    (state) => state.pruneRemotePlayers,
  )
  const activeInterior = useGameStore((state) => state.activeInterior)
  const activeInteriorId = activeInterior?.id
  const remotePlayers = useMemo(
    () =>
      Object.values(remotePlayerRecord).filter(
        (player) => player.interiorId === activeInteriorId,
      ),
    [activeInteriorId, remotePlayerRecord],
  )

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
  const group = useRef<THREE.Group>(null)
  const openMessageThread = useGameStore((state) => state.openMessageThread)
  const openPlayerMessages = () => openMessageThread(player.id, player.name)
  const targetPosition = useMemo(
    () =>
      new THREE.Vector3(
        player.position[0],
        player.position[1] + avatarGroundOffset,
        player.position[2],
      ),
    [player.position],
  )

  useFrame((_, delta) => {
    if (!group.current) return
    const smoothing = 1 - Math.exp(-delta * 12)
    group.current.position.lerp(targetPosition, smoothing)
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      player.yaw,
      smoothing,
    )
  })

  return (
    <group
      ref={group}
      position={[
        player.position[0],
        player.position[1] + avatarGroundOffset,
        player.position[2],
      ]}
      rotation={[0, player.yaw, 0]}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        openPlayerMessages()
      }}
    >
      <mesh
        position={[0, realScale.avatarHeight * 0.5, 0]}
        onPointerDown={(event) => {
          event.stopPropagation()
          openPlayerMessages()
        }}
      >
        <boxGeometry
          args={[
            playerCollisionRadius * 3,
            realScale.avatarHeight * 1.25,
            playerCollisionRadius * 3,
          ]}
        />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
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
      <FloatingMessageButton label={player.name} onOpen={openPlayerMessages} />
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
        const profile =
          botProfiles.find((entry) => entry.id === bot.id) ?? botProfiles[0]
        return (
          <BotAvatar
            key={bot.id}
            bot={bot}
            username={profile.username}
            color={profile.color}
            shirtColor={profile.shirtColor}
          />
        )
      })}
    </>
  )
}

function BotAvatar({
  bot,
  username,
  color,
  shirtColor,
}: {
  bot: BotRuntime
  username: string
  color: string
  shirtColor: string
}) {
  const openMessageThread = useGameStore((state) => state.openMessageThread)
  const jumpLift =
    bot.action === 'jump'
      ? Math.max(0, Math.sin(performance.now() / 170)) * 0.18
      : 0
  const dx = bot.target[0] - bot.position[0]
  const dz = bot.target[2] - bot.position[2]
  const yaw =
    bot.action === 'walk' || bot.action === 'run' ? Math.atan2(dx, dz) : 0
  return (
    <group
      position={[
        bot.position[0],
        avatarGroundOffset + jumpLift,
        bot.position[2],
      ]}
      rotation={[0, yaw, 0]}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        openMessageThread(bot.id)
      }}
    >
      <BlockAvatar
        bodyColor={color}
        shirtColor={shirtColor}
        hairStyle={
          username.length % 3 === 0
            ? 'bob'
            : username.length % 2 === 0
              ? 'short'
              : 'spiky'
        }
        hairColor={username.length % 2 === 0 ? '#3b1f12' : '#111827'}
        pantsColor="#1f2937"
        outfitStyle={username.length % 2 === 0 ? 'tee' : 'hoodie'}
        bottomStyle="jeans"
        shoeStyle="sneakers"
        username={username}
        hat={bot.action === 'cheer'}
        emote={
          bot.action === 'cheer'
            ? 'cheer'
            : bot.action === 'wave'
              ? 'wave'
              : 'none'
        }
        action={bot.action}
      />
      {bot.speech && bot.speechUntil > Date.now() ? (
        <Html center position={[0, 3.2, 0]} zIndexRange={worldHtmlZIndexRange}>
          <div className="max-w-40 rounded-lg bg-white px-3 py-2 text-center text-xs font-black text-slate-900 shadow">
            {bot.speech}
          </div>
        </Html>
      ) : null}
      <FloatingMessageButton label={username} onOpen={() => openMessageThread(bot.id)} />
    </group>
  )
}

function SavedFriendPlayers() {
  const friends = useGameStore((state) => state.savedFriends)
  return (
    <>
      {friends
        .filter((friend) => friend.inWorld)
        .map((friend, index) => (
          <SavedFriendAvatar key={friend.id} friend={friend} index={index} />
        ))}
    </>
  )
}

function SavedFriendAvatar({
  friend,
  index,
}: {
  friend: { id: string; name: string; avatar: AvatarSettings; route: string[] }
  index: number
}) {
  const group = useRef<THREE.Group>(null)
  const openMessageThread = useGameStore((state) => state.openMessageThread)
  const target = useRef(new THREE.Vector3())
  const position = useRef(new THREE.Vector3())
  const route = friend.route.length ? friend.route : ['spawn']

  useFrame((_, delta) => {
    const routeIndex =
      Math.floor(performance.now() / 10000 + index) % route.length
    const location =
      worldLocations.find((entry) => entry.id === route[routeIndex]) ??
      worldLocations[0]
    const offset = (index % 4) * 0.9
    target.current.set(
      location.position[0] + offset,
      avatarGroundOffset,
      location.position[2] - offset,
    )
    if (position.current.lengthSq() === 0) position.current.copy(target.current)
    const previous = position.current.clone()
    position.current.lerp(target.current, 1 - Math.exp(-delta * 0.45))
    if (!group.current) return
    group.current.position.copy(position.current)
    const dx = position.current.x - previous.x
    const dz = position.current.z - previous.z
    if (Math.hypot(dx, dz) > 0.002)
      group.current.rotation.y = Math.atan2(dx, dz)
  })

  const openThread = () => openMessageThread(friend.id, friend.name)

  return (
    <group
      ref={group}
      position={[
        worldLocations[index % worldLocations.length].position[0],
        avatarGroundOffset,
        worldLocations[index % worldLocations.length].position[2],
      ]}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        openThread()
      }}
    >
      <mesh
        position={[0, realScale.avatarHeight * 0.5, 0]}
        onPointerDown={(event) => {
          event.stopPropagation()
          openThread()
        }}
      >
        <boxGeometry
          args={[
            playerCollisionRadius * 3,
            realScale.avatarHeight * 1.25,
            playerCollisionRadius * 3,
          ]}
        />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <BlockAvatar
        bodyColor={friend.avatar.bodyColor}
        shirtColor={friend.avatar.shirtColor}
        hairColor={friend.avatar.hairColor}
        hairStyle={friend.avatar.hairStyle}
        pantsColor={friend.avatar.pantsColor}
        eyeColor={friend.avatar.eyeColor}
        accentColor={friend.avatar.accentColor}
        secondaryColor={friend.avatar.secondaryColor}
        outfitStyle={friend.avatar.outfitStyle}
        bottomStyle={friend.avatar.bottomStyle}
        shoeStyle={friend.avatar.shoeStyle}
        shoeColor={friend.avatar.shoeColor}
        accessory={friend.avatar.accessory}
        face={friend.avatar.face}
        username={friend.name}
        hat={friend.avatar.hat !== 'none'}
        action="walk"
      />
      <FloatingMessageButton label={friend.name} onOpen={openThread} />
    </group>
  )
}

function FloatingMessageButton({
  label,
  onOpen,
}: {
  label: string
  onOpen: () => void
}) {
  return (
    <Html center position={[0, 3.85, 0]} zIndexRange={worldActionZIndexRange}>
      <button
        type="button"
        className="bb-world-message-button"
        aria-label={`Message ${label}`}
        title={`Message ${label}`}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onOpen()
        }}
        onClick={(event) => {
          event.stopPropagation()
          onOpen()
        }}
      >
        <MessageCircle size={15} aria-hidden />
        <span>Message</span>
      </button>
    </Html>
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
  emote?: 'none' | 'wave' | 'cheer' | 'dance' | 'sit' | 'sleep'
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
    const sleeping = currentEmote === 'sleep'
    const sitting = currentEmote === 'sit'
    const walking = currentAction === 'walk' || currentAction === 'run'
    const strideSpeed = currentAction === 'run' ? 11 : 7.5
    const stride = walking
      ? Math.sin(clock.elapsedTime * strideSpeed) * 0.72
      : 0
    const sideStride = walking
      ? Math.sin(clock.elapsedTime * strideSpeed) * 0.16
      : 0
    const idle = walking ? 0 : Math.sin(clock.elapsedTime * 2.2) * 0.035
    const wave =
      currentEmote === 'wave' || currentEmote === 'cheer'
        ? -1.05 + Math.sin(clock.elapsedTime * 7) * 0.18
        : 0
    const cheer =
      currentEmote === 'cheer'
        ? -1.0 + Math.cos(clock.elapsedTime * 8) * 0.14
        : 0
    const danceTilt =
      currentEmote === 'dance' ? Math.sin(clock.elapsedTime * 5.2) * 0.22 : 0

    if (body.current) {
      body.current.rotation.x = sleeping ? avatarSleepRotation[0] : 0
      body.current.rotation.y = sleeping ? avatarSleepRotation[1] : 0
      body.current.rotation.z = sleeping ? 0 : danceTilt
      body.current.position.y =
        avatarBodyBaseY +
        (sleeping
          ? 0.08
          : currentAction === 'jump'
            ? 0.1
            : Math.abs(stride) * 0.025 + idle)
    }
    if (leftLeg.current) {
      leftLeg.current.rotation.x = sleeping ? 0 : sitting ? -1.35 : stride
      leftLeg.current.rotation.z = sleeping || sitting ? 0 : sideStride
    }
    if (rightLeg.current) {
      rightLeg.current.rotation.x = sleeping ? 0 : sitting ? -1.35 : -stride
      rightLeg.current.rotation.z = sleeping || sitting ? 0 : -sideStride
    }
    if (leftArm.current) {
      leftArm.current.rotation.x = sleeping
        ? -0.12
        : sitting
          ? -0.18
          : wave || -stride * 0.72
      leftArm.current.rotation.z = sleeping
        ? -0.08
        : walking
          ? -sideStride * 0.7
          : 0
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = sleeping
        ? 0.12
        : sitting
          ? -0.18
          : cheer || stride * 0.72
      rightArm.current.rotation.z = sleeping
        ? 0.08
        : walking
          ? sideStride * 0.7
          : 0
    }
  })

  const sitDrop = emote === 'sit' ? -avatarSitDrop : 0
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
      <group ref={body} position={[0, avatarBodyBaseY, 0]}>
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
          <AvatarArm
            bodyColor={bodyColor}
            shirtColor={shirtColor}
            outfitStyle={outfitStyle}
          />
        </group>
        <group ref={rightArm} position={[0.58, 1.45, 0]}>
          <AvatarArm
            bodyColor={bodyColor}
            shirtColor={shirtColor}
            outfitStyle={outfitStyle}
          />
        </group>

        <mesh castShadow position={[0, 1.92, 0]}>
          <boxGeometry args={[0.62, 0.62, 0.58]} />
          <meshStandardMaterial color={bodyColor} roughness={0.66} />
        </mesh>
        <AvatarHair
          hairStyle={hairStyle}
          hairColor={hairColor}
          accentColor={accentColor}
        />
        <AvatarFace
          face={faceStyle}
          eyeColor={eyeColor}
          accentColor={accentColor}
        />
        {hat ? (
          <mesh castShadow position={[0, 2.45, 0]}>
            <cylinderGeometry args={[0.38, 0.5, 0.18, 5]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        ) : null}
        <AvatarAccessory
          accessory={accessory}
          accentColor={accentColor}
          secondaryColor={secondaryColor}
        />
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
  const bareLeg =
    bottomStyle === 'shorts' ||
    bottomStyle === 'skirt' ||
    bottomStyle === 'none'
  const legColor = bottomStyle === 'none' ? bodyColor : pantsColor
  const shoeHeight =
    shoeStyle === 'boots' || shoeStyle === 'highTops' ? 0.2 : 0.12

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
          <boxGeometry
            args={[0.32, shoeHeight, shoeStyle === 'sandals' ? 0.34 : 0.44]}
          />
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
          <meshStandardMaterial
            color={accentColor}
            metalness={0.15}
            roughness={0.55}
          />
        </mesh>
      ) : null}
      {outfitStyle === 'hero-suit' || outfitStyle === 'hero-cape' ? (
        <>
          <mesh castShadow position={[0, 1.12, 0.238]}>
            <boxGeometry args={[0.62, 0.08, 0.055]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.58} />
          </mesh>
          <mesh castShadow position={[0, 0.76, 0.24]}>
            <boxGeometry args={[0.66, 0.12, 0.055]} />
            <meshStandardMaterial color={accentColor} roughness={0.54} />
          </mesh>
          <mesh
            castShadow
            position={[0, 1.12, 0.27]}
            rotation={[0, 0, Math.PI / 4]}
          >
            <boxGeometry args={[0.26, 0.26, 0.055]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.12}
              roughness={0.46}
            />
          </mesh>
        </>
      ) : null}
      {outfitStyle === 'hero-armour' ? (
        <>
          <mesh castShadow position={[0, 1.08, 0.242]}>
            <boxGeometry args={[0.68, 0.58, 0.07]} />
            <meshStandardMaterial
              color={accentColor}
              metalness={0.22}
              roughness={0.42}
            />
          </mesh>
          <mesh
            castShadow
            position={[0, 1.16, 0.285]}
            rotation={[0, 0, Math.PI / 4]}
          >
            <boxGeometry args={[0.25, 0.25, 0.055]} />
            <meshStandardMaterial
              color={secondaryColor}
              emissive={secondaryColor}
              emissiveIntensity={0.2}
              roughness={0.35}
            />
          </mesh>
          <mesh castShadow position={[-0.38, 1.38, 0]}>
            <boxGeometry args={[0.18, 0.18, 0.44]} />
            <meshStandardMaterial
              color={accentColor}
              metalness={0.16}
              roughness={0.48}
            />
          </mesh>
          <mesh castShadow position={[0.38, 1.38, 0]}>
            <boxGeometry args={[0.18, 0.18, 0.44]} />
            <meshStandardMaterial
              color={accentColor}
              metalness={0.16}
              roughness={0.48}
            />
          </mesh>
        </>
      ) : null}
      {outfitStyle === 'pajamas'
        ? [0, 1, 2].map((index) => (
            <mesh
              key={index}
              castShadow
              position={[-0.22 + index * 0.22, 1.06, 0.22]}
            >
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
  const sleeveColor =
    outfitStyle === 'tank' || outfitStyle === 'none' ? bodyColor : shirtColor
  const sleeveHeight =
    outfitStyle === 'tee' || outfitStyle === 'sport' ? 0.36 : 0.48
  const hasHeroGlove =
    outfitStyle === 'hero-suit' ||
    outfitStyle === 'hero-cape' ||
    outfitStyle === 'hero-armour'

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
      {hasHeroGlove ? (
        <mesh castShadow position={[0, -0.67, 0.01]}>
          <boxGeometry args={[0.25, 0.14, 0.25]} />
          <meshStandardMaterial color={shirtColor} roughness={0.6} />
        </mesh>
      ) : null}
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
  const normalized =
    hairStyle === 'curly'
      ? 'curls'
      : hairStyle === 'side' || hairStyle === 'flat'
        ? 'short'
        : hairStyle
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
            <mesh
              key={index}
              castShadow
              position={[x, 2.42, 0.04]}
              rotation={[0, 0, (index - 1.5) * 0.3]}
            >
              <boxGeometry args={[0.14, 0.28, 0.18]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          ))
        : null}
      {normalized === 'bob' || normalized === 'long' ? (
        <>
          <mesh castShadow position={[-0.36, 2.08, 0]}>
            <boxGeometry
              args={[0.13, normalized === 'long' ? 0.56 : 0.36, 0.56]}
            />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0.36, 2.08, 0]}>
            <boxGeometry
              args={[0.13, normalized === 'long' ? 0.56 : 0.36, 0.56]}
            />
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
            <boxGeometry
              args={[
                sleepy ? 0.12 : 0.07,
                sleepy ? 0.025 : robot ? 0.11 : 0.07,
                0.03,
              ]}
            />
            <meshStandardMaterial
              color={robot ? accentColor : eyeColor}
              emissive={robot ? accentColor : undefined}
              emissiveIntensity={robot ? 0.32 : 0}
            />
          </mesh>
          <mesh castShadow position={[0.22, 1.96, 0.31]}>
            <boxGeometry
              args={[
                sleepy ? 0.12 : 0.07,
                sleepy ? 0.025 : robot ? 0.11 : 0.07,
                0.03,
              ]}
            />
            <meshStandardMaterial
              color={robot ? accentColor : eyeColor}
              emissive={robot ? accentColor : undefined}
              emissiveIntensity={robot ? 0.32 : 0}
            />
          </mesh>
        </>
      )}
      {face !== 'plain' ? (
        <mesh castShadow position={[0, 1.78, 0.32]}>
          <boxGeometry
            args={[
              surprised ? 0.12 : face === 'happy' ? 0.32 : 0.24,
              surprised ? 0.14 : 0.05,
              0.03,
            ]}
          />
          <meshStandardMaterial
            color={robot ? accentColor : '#7c2d12'}
            emissive={robot ? accentColor : undefined}
            emissiveIntensity={robot ? 0.2 : 0}
          />
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

  if (value.includes('hero-cape')) {
    const capeColor = value.includes('solar')
      ? '#dc2626'
      : value.includes('forest')
        ? '#15803d'
        : value.includes('moon')
          ? '#6d28d9'
          : value.includes('neon')
            ? '#111827'
            : accentColor
    return (
      <group>
        <mesh castShadow position={[0, 1.04, -0.31]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.86, 1.05, 0.08]} />
          <meshStandardMaterial color={capeColor} roughness={0.74} />
        </mesh>
        <mesh castShadow position={[0, 1.58, -0.28]}>
          <boxGeometry args={[0.74, 0.16, 0.09]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.55} />
        </mesh>
      </group>
    )
  }

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
        <meshStandardMaterial
          color="#facc15"
          emissive="#facc15"
          emissiveIntensity={0.35}
        />
      </mesh>
    )
  }

  if (value.includes('wings')) {
    return (
      <group>
        <mesh
          castShadow
          position={[-0.52, 1.18, -0.28]}
          rotation={[0, 0, -0.45]}
        >
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
  const active = useGameStore((state) => state.obby.active)
  if (!active) return null

  return (
    <group>
      {obbyPlatforms.map(({ position, scale }, index) => (
        <mesh
          key={position.join(',')}
          castShadow
          receiveShadow
          position={position}
          scale={scale}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={index === obbyPlatforms.length - 1 ? '#22c55e' : '#ef4444'}
          />
        </mesh>
      ))}
    </group>
  )
}

function CoinField() {
  const addCoins = useGameStore((state) => state.addCoins)
  return (
    <>
      {coreCoinPositions.map((position, index) => (
        <mesh key={index} position={position} onClick={() => addCoins(1)}>
          <cylinderGeometry args={[0.28, 0.28, 0.08, 18]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#f59e0b"
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
    </>
  )
}

function MiniGameWorld() {
  const miniGame = useGameStore((state) => state.miniGame)
  if (miniGame.status !== 'running' || !miniGame.activeId)
    return <MiniGamePortals />

  const definition = miniGameDefinition(miniGame.activeId)
  const targets = miniGameTargets(miniGame.activeId)
  const activeTargets =
    miniGame.activeId === 'delivery-dash'
      ? targets.slice(miniGame.score, miniGame.score + 1)
      : targets.filter((target) => !miniGame.collected.includes(target.id))

  return (
    <group>
      <MiniGamePortals />
      {activeTargets.map((target, index) => (
        <group key={target.id} position={target.position}>
          {miniGame.activeId === 'coin-rush' ? (
            <CoinRushPickup
              points={target.points ?? definition.pointsPerTarget}
              index={index}
            />
          ) : null}
          {miniGame.activeId === 'delivery-dash' ? (
            <DeliveryDashTarget
              label={target.mapLabel ?? target.label}
              kind={target.kind}
              coins={target.coinReward ?? 0}
              timeBonusMs={target.timeBonusMs ?? 0}
            />
          ) : null}
          {miniGame.activeId === 'hide-and-seek' ? (
            <group
              position={[0, avatarGroundOffset, 0]}
              rotation={[0, index * 0.7, 0]}
            >
              <BlockAvatar
                bodyColor="#f2b07e"
                shirtColor={index % 2 === 0 ? '#f472b6' : '#60a5fa'}
                hairColor={index === 1 ? '#4c1d95' : '#5a2f16'}
                hairStyle={index === 2 ? 'bob' : 'spiky'}
                pantsColor="#111827"
                outfitStyle="tee"
                bottomStyle="jeans"
                shoeStyle="sneakers"
                username={target.label}
                emote="wave"
                action="idle"
              />
            </group>
          ) : null}
          <Html
            center
            position={[0, 2.85, 0]}
            zIndexRange={worldHtmlZIndexRange}
          >
            <span className="whitespace-nowrap rounded-lg bg-slate-950/85 px-3 py-1 text-xs font-black text-white shadow">
              {definition.title}: {target.mapLabel ?? target.label}
            </span>
          </Html>
        </group>
      ))}
    </group>
  )
}

function staticTreeBlocksParking(position: Vec3) {
  return collisionBoxOverlapsParkingClearance({
    id: 'static-tree-visual',
    center: [position[0], buildPieceDimensions.tree.height / 2, position[2]],
    half: [
      buildPieceDimensions.tree.footprint / 2,
      buildPieceDimensions.tree.height / 2,
      buildPieceDimensions.tree.footprint / 2,
    ],
  })
}

function staticLampBlocksParking(position: Vec3) {
  return collisionBoxOverlapsParkingClearance({
    id: 'static-lamp-visual',
    center: [position[0], buildPieceDimensions.lamp.height / 2, position[2]],
    half: [
      buildPieceDimensions.lamp.footprint / 2,
      buildPieceDimensions.lamp.height / 2,
      buildPieceDimensions.lamp.footprint / 2,
    ],
  })
}

function DeliveryDashTarget({
  label,
  kind,
  coins,
  timeBonusMs,
}: {
  label: string
  kind?: string
  coins: number
  timeBonusMs: number
}) {
  const isPickup = kind === 'pickup'
  return (
    <group>
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[1.18, 1.18, 0.16, 24]} />
        <meshStandardMaterial
          color={isPickup ? '#fb923c' : '#22c55e'}
          emissive={isPickup ? '#f97316' : '#16a34a'}
          emissiveIntensity={0.28}
        />
      </mesh>
      <mesh castShadow position={[0, 0.72, 0]}>
        <boxGeometry args={isPickup ? [0.8, 0.58, 0.65] : [0.82, 0.46, 0.82]} />
        <meshStandardMaterial
          color={isPickup ? '#a16207' : '#0f766e'}
          roughness={0.75}
        />
      </mesh>
      {isPickup ? (
        <mesh castShadow position={[0, 1.03, 0]}>
          <boxGeometry args={[0.9, 0.08, 0.12]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.65} />
        </mesh>
      ) : (
        <mesh castShadow position={[0, 1.08, 0]}>
          <coneGeometry args={[0.42, 0.72, 4]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#facc15"
            emissiveIntensity={0.18}
            roughness={0.55}
          />
        </mesh>
      )}
      <Html center position={[0, 1.8, 0]} zIndexRange={worldHtmlZIndexRange}>
        <span className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950 shadow">
          {label}
          {coins ? ` +${coins} coins` : ''}
          {timeBonusMs ? ` +${Math.round(timeBonusMs / 1000)}s` : ''}
        </span>
      </Html>
    </group>
  )
}

function CoinRushPickup({ index }: { points: number; index: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = state.clock.elapsedTime * 2.4 + index * 0.32
    group.current.position.y =
      0.96 + Math.sin(state.clock.elapsedTime * 3 + index) * 0.08
  })

  return (
    <group ref={group}>
      <mesh position={[0, 0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.43, 0.11, 8, 18]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#f59e0b"
          emissiveIntensity={0.75}
          metalness={0.2}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.1, 18]} />
        <meshStandardMaterial
          color="#fef3c7"
          emissive="#facc15"
          emissiveIntensity={0.55}
        />
      </mesh>
    </group>
  )
}

function MiniGamePortals() {
  const startMiniGame = useGameStore((state) => state.startMiniGame)
  const portals = [
    {
      id: 'coin-rush' as const,
      label: 'Coin Rush',
      position: coreActivityPositions['coin-rush'],
      color: '#facc15',
    },
    {
      id: 'delivery-dash' as const,
      label: 'Delivery Dash',
      position: coreActivityPositions['delivery-dash'],
      color: '#22c55e',
    },
    {
      id: 'hide-and-seek' as const,
      label: 'Hide & Seek',
      position: coreActivityPositions['hide-and-seek'],
      color: '#a78bfa',
    },
  ]
  return (
    <group>
      {portals.map((portal) => (
        <group key={portal.id} position={portal.position}>
          <mesh
            receiveShadow
            position={[0, 0.07, 0]}
            onClick={() => startMiniGame(portal.id, performance.now())}
          >
            <cylinderGeometry args={[1.25, 1.25, 0.14, 28]} />
            <meshStandardMaterial
              color={portal.color}
              emissive={portal.color}
              emissiveIntensity={0.16}
            />
          </mesh>
          <Html
            center
            position={[0, 1.15, 0]}
            zIndexRange={worldHtmlZIndexRange}
          >
            <button
              type="button"
              className="whitespace-nowrap rounded-lg bg-white/95 px-3 py-1 text-xs font-black text-slate-950 shadow"
              onClick={() => startMiniGame(portal.id, performance.now())}
            >
              {portal.label}
            </button>
          </Html>
        </group>
      ))}
    </group>
  )
}

function ToyPickup() {
  const advanceQuest = useGameStore((state) => state.advanceQuest)
  return (
    <mesh position={[5, 0.55, 20]} onClick={() => advanceQuest('find-toy', 1)}>
      <dodecahedronGeometry args={[0.45, 0]} />
      <meshStandardMaterial
        color="#f0abfc"
        emissive="#f0abfc"
        emissiveIntensity={0.35}
      />
    </mesh>
  )
}

function PlacedBlocks() {
  const blocks = useGameStore((state) => state.placedBlocks)
  const buildMode = useGameStore((state) => state.buildMode)
  const selectedBuildBlockId = useGameStore(
    (state) => state.selectedBuildBlockId,
  )
  const setSelectedBuildBlock = useGameStore(
    (state) => state.setSelectedBuildBlock,
  )
  return (
    <>
      {blocks.map((block) => (
        <BuildPiece
          key={block.id}
          block={block}
          selectable={buildMode}
          selected={selectedBuildBlockId === block.id}
          onSelect={setSelectedBuildBlock}
        />
      ))}
    </>
  )
}

function RemotePlacedBlocks() {
  const remotePlayerRecord = useLocalPartyStore((state) => state.remotePlayers)
  const localBlocks = useGameStore((state) => state.placedBlocks)
  const blocks = useMemo(() => {
    const localIds = new Set(localBlocks.map((block) => block.id))
    const synced = new Map<string, { key: string; block: BuildBlock }>()
    Object.values(remotePlayerRecord).forEach((player) => {
      player.placedBlocks?.forEach((block) => {
        if (localIds.has(block.id)) return
        const key = `${player.id}:${block.id}`
        synced.set(key, { key, block })
      })
    })
    return [...synced.values()]
  }, [localBlocks, remotePlayerRecord])

  return (
    <>
      {blocks.map(({ key, block }) => (
        <BuildPiece key={`remote:${key}`} block={block} />
      ))}
    </>
  )
}

function BuildModeOverlay() {
  const buildMode = useGameStore((state) => state.buildMode)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const playerYaw = useGameStore((state) => state.playerYaw)
  const placedBlocks = useGameStore((state) => state.placedBlocks)
  const selectedBuildPiece = useGameStore((state) => state.selectedBuildPiece)
  const selectedBuildBlockId = useGameStore(
    (state) => state.selectedBuildBlockId,
  )
  const selectedBuildColor = useGameStore((state) => state.selectedBuildColor)
  const buildRotation = useGameStore((state) => state.buildRotation)
  const settings = useGameStore((state) => state.settings)
  const setSelectedBuildBlock = useGameStore(
    (state) => state.setSelectedBuildBlock,
  )
  const placement = useMemo(
    () =>
      buildMode
        ? findBuildPlacementPosition({
            blocks: placedBlocks,
            playerPosition,
            yaw: playerYaw,
            pieceId: selectedBuildPiece,
            worldSeed: settings.worldSeed,
          })
        : undefined,
    [
      buildMode,
      placedBlocks,
      playerPosition,
      playerYaw,
      selectedBuildPiece,
      settings.worldSeed,
    ],
  )
  const gridOverlay = useMemo(
    () => buildGridOverlayForPlayer(playerPosition),
    [playerPosition],
  )

  if (!buildMode) return null
  const previewPosition = placement?.position
  const piece = getBuildPiece(selectedBuildPiece)
  const previewHeight = buildPreviewHeight(selectedBuildPiece)

  return (
    <group>
      <gridHelper
        args={[
          gridOverlay.size,
          gridOverlay.divisions,
          '#0ea5e9',
          '#93c5fd',
        ]}
        position={gridOverlay.center}
      />
      <mesh
        position={[gridOverlay.center[0], 0.001, gridOverlay.center[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => setSelectedBuildBlock(undefined)}
      >
        <planeGeometry args={[gridOverlay.size, gridOverlay.size]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {!selectedBuildBlockId && previewPosition ? (
        <group position={previewPosition} rotation={[0, buildRotation, 0]}>
          <mesh position={[0, 0.09, 0]}>
            <boxGeometry args={[piece.footprint, 0.08, piece.footprint]} />
            <meshStandardMaterial color="#22c55e" transparent opacity={0.38} />
          </mesh>
          {selectedBuildPiece === 'house' ? (
            <>
              <HousePiece color={selectedBuildColor} preview />
              <BuildFrontIndicator label="Front" />
            </>
          ) : (
            <mesh position={[0, previewHeight / 2 + 0.08, 0]}>
              <boxGeometry
                args={[
                  Math.max(0.55, piece.footprint * 0.7),
                  Math.max(0.32, previewHeight),
                  Math.max(0.55, piece.footprint * 0.7),
                ]}
              />
              <meshStandardMaterial
                color={selectedBuildColor}
                transparent
                opacity={0.32}
              />
            </mesh>
          )}
        </group>
      ) : !selectedBuildBlockId ? (
        <Html
          center
          position={[playerPosition[0], 2.75, playerPosition[2]]}
          zIndexRange={worldActionZIndexRange}
        >
          <span className="whitespace-nowrap rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white shadow">
            {placement?.issue ?? 'No build cell'}
          </span>
        </Html>
      ) : null}
    </group>
  )
}

function buildPreviewHeight(pieceId: BuildPieceId) {
  switch (pieceId) {
    case 'house':
      return buildPieceDimensions.house.bodyHeight
    case 'building':
      return buildPieceDimensions.building.bodyHeight
    case 'shop':
      return buildPieceDimensions.shop.bodyHeight
    case 'car':
      return buildPieceDimensions.car.height
    case 'tree':
      return buildPieceDimensions.tree.height
    case 'lamp':
      return buildPieceDimensions.lamp.height
    case 'road':
      return 0.1
    case 'block':
    default:
      return 1
  }
}

function BuildPiece({
  block,
  selectable = false,
  selected = false,
  onSelect,
}: {
  block: BuildBlock
  selectable?: boolean
  selected?: boolean
  onSelect?: (id?: string) => void
}) {
  const rotation = block.rotation ?? 0
  return (
    <group
      position={block.position}
      rotation={[0, rotation, 0]}
      onClick={
        selectable
          ? (event) => {
              event.stopPropagation()
              onSelect?.(block.id)
            }
          : undefined
      }
    >
      {block.kind === 'road' ? <RoadPiece color={block.color} /> : null}
      {block.kind === 'house' ? <HousePiece color={block.color} /> : null}
      {block.kind === 'building' ? <BuildingPiece color={block.color} /> : null}
      {block.kind === 'shop' ? <ShopPiece color={block.color} /> : null}
      {block.kind === 'car' ? <CarPiece color={block.color} /> : null}
      {block.kind === 'tree' ? <TreePiece color={block.color} /> : null}
      {block.kind === 'lamp' ? <LampPiece color={block.color} /> : null}
      {!block.kind || block.kind === 'block' ? (
        <BlockPiece color={block.color} />
      ) : null}
      {selected ? (
        <>
          <BuildSelectionHighlight kind={block.kind ?? 'block'} />
          {block.kind === 'house' ? (
            <BuildFrontIndicator label={block.name ?? 'My House'} />
          ) : null}
        </>
      ) : null}
    </group>
  )
}

function BuildSelectionHighlight({ kind }: { kind: BuildPieceId }) {
  if (kind === 'road') {
    return (
      <mesh position={[0, 0.08, 0]} raycast={() => null} renderOrder={4}>
        <boxGeometry
          args={[realScale.roadTile + 0.14, 0.14, realScale.roadTile + 0.14]}
        />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color="#fde047" lineWidth={3} />
      </mesh>
    )
  }
  const half = buildCollisionHalf(kind)
  const centerY = kind === 'block' ? 0 : half[1]
  return (
    <mesh position={[0, centerY, 0]} raycast={() => null} renderOrder={4}>
      <boxGeometry
        args={[half[0] * 2 + 0.16, half[1] * 2 + 0.16, half[2] * 2 + 0.16]}
      />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      <Edges color="#fde047" lineWidth={3} />
    </mesh>
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
        <meshStandardMaterial
          color="#fde047"
          emissive="#facc15"
          emissiveIntensity={0.12}
        />
      </mesh>
    </group>
  )
}

function BuildFrontIndicator({ label }: { label: string }) {
  const { depth } = buildPieceDimensions.house
  return (
    <group position={[0, 0.14, depth / 2 + 0.14]} raycast={() => null}>
      <mesh position={[0, 0, 0.72]}>
        <boxGeometry args={[0.18, 0.08, 1.15]} />
        <meshBasicMaterial color="#facc15" depthTest={false} />
      </mesh>
      <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.46, 0.72, 3]} />
        <meshBasicMaterial color="#facc15" depthTest={false} />
      </mesh>
      <Html
        center
        position={[0, 1.12, 0.68]}
        zIndexRange={worldActionZIndexRange}
      >
        <span className="bb-build-door-label">{label} - door</span>
      </Html>
    </group>
  )
}

function HousePiece({
  color,
  preview = false,
}: {
  color: string
  preview?: boolean
}) {
  const { width, depth, bodyHeight, roofHeight } = buildPieceDimensions.house
  const windowY = realScale.floorHeight * 1.43
  const previewMaterial = preview
    ? { transparent: true, opacity: 0.58, depthWrite: false }
    : {}

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, bodyHeight / 2, 0]}>
        <boxGeometry args={[width, bodyHeight, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.76}
          {...previewMaterial}
        />
      </mesh>
      <mesh
        castShadow
        position={[0, bodyHeight + roofHeight / 2, 0]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <coneGeometry args={[Math.max(width, depth) * 0.74, roofHeight, 4]} />
        <meshStandardMaterial
          color="#ef4444"
          roughness={0.78}
          {...previewMaterial}
        />
      </mesh>
      <mesh position={[0, realScale.doorHeight / 2, depth / 2 + 0.03]}>
        <boxGeometry
          args={[
            realScale.doorWidth,
            realScale.doorHeight,
            realScale.doorDepth,
          ]}
        />
        <meshStandardMaterial
          color="#7c2d12"
          roughness={0.82}
          transparent={preview}
          opacity={preview ? 0.9 : 1}
          depthWrite={!preview}
        />
      </mesh>
      <mesh
        position={[
          -realScale.doorWidth * 0.28,
          realScale.doorHeight * 0.52,
          depth / 2 + 0.12,
        ]}
      >
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#f59e0b"
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh position={[0, realScale.doorHeight + 0.09, depth / 2 + 0.055]}>
        <boxGeometry args={[realScale.doorWidth + 0.24, 0.18, 0.15]} />
        <meshStandardMaterial color="#451a03" {...previewMaterial} />
      </mesh>
      <mesh
        position={[
          -realScale.doorWidth / 2 - 0.08,
          realScale.doorHeight / 2,
          depth / 2 + 0.055,
        ]}
      >
        <boxGeometry args={[0.16, realScale.doorHeight + 0.18, 0.15]} />
        <meshStandardMaterial color="#451a03" {...previewMaterial} />
      </mesh>
      <mesh
        position={[
          realScale.doorWidth / 2 + 0.08,
          realScale.doorHeight / 2,
          depth / 2 + 0.055,
        ]}
      >
        <boxGeometry args={[0.16, realScale.doorHeight + 0.18, 0.15]} />
        <meshStandardMaterial color="#451a03" {...previewMaterial} />
      </mesh>
      <mesh position={[-width * 0.26, windowY, depth / 2 + 0.04]}>
        <boxGeometry
          args={[
            realScale.windowWidth,
            realScale.windowHeight,
            realScale.windowDepth,
          ]}
        />
        <meshStandardMaterial
          color="#bae6fd"
          emissive="#38bdf8"
          emissiveIntensity={0.12}
        />
      </mesh>
      <mesh position={[width * 0.26, windowY, depth / 2 + 0.04]}>
        <boxGeometry
          args={[
            realScale.windowWidth,
            realScale.windowHeight,
            realScale.windowDepth,
          ]}
        />
        <meshStandardMaterial
          color="#bae6fd"
          emissive="#38bdf8"
          emissiveIntensity={0.12}
        />
      </mesh>
    </group>
  )
}

function BuildingPiece({ color }: { color: string }) {
  const { width, depth, bodyHeight, roofHeight, floors } =
    buildPieceDimensions.building
  const windowRows = Array.from(
    { length: floors },
    (_, row) => realScale.floorHeight * row + realScale.floorHeight * 0.62,
  )

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, bodyHeight / 2, 0]}>
        <boxGeometry args={[width, bodyHeight, depth]} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>
      {windowRows.map((height) => (
        <group key={height}>
          <mesh position={[-width * 0.24, height, depth / 2 + 0.04]}>
            <boxGeometry
              args={[
                realScale.windowWidth,
                realScale.windowHeight,
                realScale.windowDepth,
              ]}
            />
            <meshStandardMaterial
              color="#dbeafe"
              emissive="#93c5fd"
              emissiveIntensity={0.14}
            />
          </mesh>
          <mesh position={[width * 0.24, height, depth / 2 + 0.04]}>
            <boxGeometry
              args={[
                realScale.windowWidth,
                realScale.windowHeight,
                realScale.windowDepth,
              ]}
            />
            <meshStandardMaterial
              color="#dbeafe"
              emissive="#93c5fd"
              emissiveIntensity={0.14}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, realScale.doorHeight / 2, depth / 2 + 0.05]}>
        <boxGeometry
          args={[
            realScale.doorWidth,
            realScale.doorHeight,
            realScale.doorDepth,
          ]}
        />
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
      <mesh
        castShadow
        position={[0, realScale.doorHeight + 0.45, depth / 2 + 0.08]}
      >
        <boxGeometry args={[width * 0.9, 0.38, 0.34]} />
        <meshStandardMaterial color="#ffffff" roughness={0.72} />
      </mesh>
      <mesh position={[0, realScale.doorHeight / 2, depth / 2 + 0.05]}>
        <boxGeometry
          args={[
            realScale.doorWidth,
            realScale.doorHeight,
            realScale.doorDepth,
          ]}
        />
        <meshStandardMaterial color="#7c2d12" roughness={0.82} />
      </mesh>
    </group>
  )
}

function CarPiece({
  color,
  occupied = false,
}: {
  color: string
  occupied?: boolean
}) {
  const bodyY = realScale.wheelRadius + realScale.carBodyHeight / 2
  const cabinY =
    realScale.wheelRadius +
    realScale.carBodyHeight +
    realScale.carCabinHeight / 2

  return (
    <group>
      <mesh castShadow position={[0, bodyY, 0]}>
        <boxGeometry
          args={[
            realScale.carLength,
            realScale.carBodyHeight,
            realScale.carWidth,
          ]}
        />
        <meshStandardMaterial color={color} roughness={0.68} />
      </mesh>
      <mesh castShadow position={[0.08, cabinY, -0.02]}>
        <boxGeometry
          args={[
            realScale.carLength * 0.46,
            realScale.carCabinHeight,
            realScale.carWidth * 0.78,
          ]}
        />
        <meshStandardMaterial
          color="#bfdbfe"
          roughness={0.58}
          transparent={occupied}
          opacity={occupied ? 0.56 : 1}
        />
      </mesh>
      <mesh
        castShadow
        position={[realScale.carLength / 2 + 0.025, bodyY + 0.08, 0]}
      >
        <boxGeometry
          args={[
            0.05,
            realScale.carBodyHeight * 0.45,
            realScale.carWidth * 0.72,
          ]}
        />
        <meshStandardMaterial
          color="#f8fafc"
          emissive="#fde68a"
          emissiveIntensity={0.2}
          roughness={0.5}
        />
      </mesh>
      {[-realScale.carWidth * 0.27, realScale.carWidth * 0.27].map((z) => (
        <mesh
          key={`headlight-${z}`}
          castShadow
          position={[realScale.carLength / 2 + 0.055, bodyY + 0.16, z]}
        >
          <boxGeometry args={[0.07, 0.14, 0.26]} />
          <meshStandardMaterial
            color="#fef9c3"
            emissive="#fde047"
            emissiveIntensity={0.55}
            roughness={0.42}
          />
        </mesh>
      ))}
      {[-realScale.carWidth * 0.32, realScale.carWidth * 0.32].map((z) => (
        <mesh
          key={`taillight-${z}`}
          castShadow
          position={[-realScale.carLength / 2 - 0.055, bodyY + 0.12, z]}
        >
          <boxGeometry args={[0.07, 0.16, 0.22]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#dc2626"
            emissiveIntensity={0.25}
            roughness={0.48}
          />
        </mesh>
      ))}
      {[-realScale.carLength * 0.32, realScale.carLength * 0.32].map((x) =>
        [-realScale.carWidth * 0.48, realScale.carWidth * 0.48].map((z) => (
          <mesh
            key={`${x}-${z}`}
            castShadow
            position={[x, realScale.wheelRadius, z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[
                realScale.wheelRadius,
                realScale.wheelRadius,
                realScale.carWidth * 0.12,
                12,
              ]}
            />
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
      <mesh
        castShadow
        position={[
          0,
          realScale.treeTrunkHeight + realScale.treeCanopySize * 0.42,
          0,
        ]}
      >
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
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.45}
        />
      </mesh>
    </group>
  )
}
