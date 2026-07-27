import { useFrame, useThree } from '@react-three/fiber'
import { Edges, useKeyboardControls, Html, useTexture } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import {
  Armchair,
  BedDouble,
  BriefcaseBusiness,
  CarFront,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import { botProfiles } from '../data/botProfiles'
import {
  activeJobChallenge,
  activeJobTask,
  challengeForJobTask,
  jobDefinitions,
  jobTaskPosition,
  workplaceBuildings,
  workDistrictCenter,
  workDistrictSize,
} from '../data/jobs'
import { miniGameDefinition, miniGameTargets } from '../ai/miniGames'
import {
  obbyCheckpoints,
  obbyFinish,
  obbyFinishRadius,
  obbyPlatforms,
  shouldResetObbyFall,
  type ObbyPlatform,
} from '../ai/obby'
import {
  buildGridOverlayForPlayer,
  findBuildPlacementPosition,
} from '../ai/buildMode'
import {
  getProceduralWorld,
  prefetchProceduralWorld,
  type ProceduralPiece,
} from '../data/proceduralWorld'
import {
  footballStadiumFootprint,
  worldFeatureVisible,
} from '../data/worldFeatures'
import { predictChunkRequests } from '../data/worldStreaming'
import { getBuildPiece } from '../data/buildPieces'
import { worldLocations, distance2d } from '../data/world'
import {
  nearestLocation,
  useGameStore,
  type NpcDragTarget,
} from '../state/gameStore'
import {
  makePartySnapshot,
  useLocalPartyStore,
  type LocalPartySnapshot,
} from '../state/localPartyStore'
import { pitchFromLookDrag, yawFromLookDrag } from './cameraControl'
import { shadowOracleRearPanels } from './avatarOutfits'
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
import { actorCollisionBoxes } from './modularCollision'
import { authoredWorldCollisionBoxes as staticCollisionObstacles } from './worldCollision'
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
import { avatarTrailPieces } from './avatarTrail'
import { petAccessoryModel, type PetAccessoryPart } from './pets'
import { EquippedLightSaber } from './WorldEquipment'
import { lightSaberHandSocket } from './lightSaber'
import {
  avatarSelectionHitboxPosition,
  avatarSelectionHitboxSize,
} from './avatarInteraction'
import {
  advanceFootballBall,
  beginFootballSkill,
  createFootballBalls,
  footballBallPatchFaces,
  footballBallInteractionRadius,
  footballBallRadius,
  footballGoalForBall,
  footballGoalReward,
  footballGoals,
  footballKickVelocity,
  footballPitch,
  nearestFootballBall,
  pointInFootballPitchClearance,
  resetFootballBall,
  type FootballBallRuntime,
} from './football'
import {
  activeLocalGoKarts,
  createGoKarts,
  getGoKart,
  goKartBoostPads,
  goKartStartLine,
  goKartTrack,
  isGoKartId,
} from './goKart'
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
  trafficDoubleDeckerHeight,
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
  AvatarFaceStyle,
  AvatarHairStyle,
  AvatarOutfitStyle,
  AvatarShoeStyle,
  BotRuntime,
  BuildBlock,
  BuildPieceId,
  InteriorKind,
  InteriorVisit,
  SavedFriend,
  ShopItemId,
  Vec3,
} from './types'
import { savedFriendPositionAt } from './savedFriendMovement'
import {
  npcDragLift,
  npcPointerHasDragged,
  safeNpcDropPosition,
} from './npcDrag'

const worldHtmlZIndexRange: [number, number] = [4, 0]
const worldActionZIndexRange: [number, number] = [26, 25]

type MessageTargetSelection = {
  selectedMessageTargetId?: string
  selectMessageTarget: (targetId: string) => void
}

const MessageTargetSelectionContext =
  createContext<MessageTargetSelection | null>(null)

function useMessageTargetSelection() {
  return (
    useContext(MessageTargetSelectionContext) ?? {
      selectedMessageTargetId: undefined,
      selectMessageTarget: () => undefined,
    }
  )
}

type NpcDragStart = NpcDragTarget & {
  clientX: number
  clientY: number
  position: Vec3
}

type NpcDragControls = {
  begin: (start: NpcDragStart) => void
  previewFor: (kind: NpcDragTarget['kind'], id: string) => Vec3 | undefined
  setHovering: (hovering: boolean) => void
}

const NpcDragContext = createContext<NpcDragControls | null>(null)

function useNpcDrag() {
  return useContext(NpcDragContext)
}

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

type ActiveNpcDrag = NpcDragStart & {
  groundOffset: Vec3
  startScreen: { x: number; y: number }
  moved: boolean
}

function NpcDragProvider({ children }: { children: ReactNode }) {
  const { camera, gl } = useThree()
  const setNpcDrag = useGameStore((state) => state.setNpcDrag)
  const placeBot = useGameStore((state) => state.placeBot)
  const placeSavedFriend = useGameStore((state) => state.placeSavedFriend)
  const dragRef = useRef<ActiveNpcDrag | undefined>(undefined)
  const previewRef = useRef<Vec3 | undefined>(undefined)
  const [active, setActive] = useState<NpcDragTarget>()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const groundPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    [],
  )
  const projectedPoint = useMemo(() => new THREE.Vector3(), [])

  const groundAtScreenPoint = useCallback(
    (clientX: number, clientY: number): Vec3 | undefined => {
      const bounds = gl.domElement.getBoundingClientRect()
      if (bounds.width <= 0 || bounds.height <= 0) return undefined
      const pointer = new THREE.Vector2(
        ((clientX - bounds.left) / bounds.width) * 2 - 1,
        -((clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      const point = raycaster.ray.intersectPlane(groundPlane, projectedPoint)
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.z))
        return undefined
      return [point.x, 0, point.z]
    },
    [camera, gl.domElement, groundPlane, projectedPoint, raycaster],
  )

  const clearDrag = useCallback(() => {
    dragRef.current = undefined
    previewRef.current = undefined
    setActive(undefined)
    setNpcDrag(undefined)
    gl.domElement.style.cursor = 'grab'
  }, [gl.domElement, setNpcDrag])

  const begin = useCallback(
    (start: NpcDragStart) => {
      if (
        !Number.isFinite(start.clientX) ||
        !Number.isFinite(start.clientY) ||
        !Number.isFinite(start.pointerId)
      )
        return
      const ground = groundAtScreenPoint(start.clientX, start.clientY)
      const groundOffset: Vec3 = ground
        ? [start.position[0] - ground[0], 0, start.position[2] - ground[2]]
        : [0, 0, 0]
      const target: NpcDragTarget = {
        kind: start.kind,
        id: start.id,
        pointerId: start.pointerId,
      }
      dragRef.current = {
        ...start,
        position: [start.position[0], 0, start.position[2]],
        groundOffset,
        startScreen: { x: start.clientX, y: start.clientY },
        moved: false,
      }
      previewRef.current = [start.position[0], 0, start.position[2]]
      setActive(target)
      setNpcDrag(target)
      gl.domElement.style.cursor = 'grabbing'
    },
    [gl.domElement, groundAtScreenPoint, setNpcDrag],
  )

  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      if (
        !drag.moved &&
        !npcPointerHasDragged(drag.startScreen, {
          x: event.clientX,
          y: event.clientY,
        })
      )
        return
      drag.moved = true
      const ground = groundAtScreenPoint(event.clientX, event.clientY)
      if (!ground) return
      if (event.cancelable) event.preventDefault()
      previewRef.current = [
        ground[0] + drag.groundOffset[0],
        0,
        ground[2] + drag.groundOffset[2],
      ]
    }
    const finish = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      const preview = previewRef.current
      if (drag.moved && preview) {
        const target = safeNpcDropPosition(preview, npcDropObstaclesAt(preview))
        if (drag.kind === 'bot') placeBot(drag.id, target)
        else placeSavedFriend(drag.id, target)
      }
      clearDrag()
    }
    const cancel = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      clearDrag()
    }
    const cancelAll = () => {
      if (dragRef.current) clearDrag()
    }

    window.addEventListener('pointermove', move, {
      capture: true,
      passive: false,
    })
    window.addEventListener('pointerup', finish, true)
    window.addEventListener('pointercancel', cancel, true)
    window.addEventListener('blur', cancelAll)
    return () => {
      window.removeEventListener('pointermove', move, true)
      window.removeEventListener('pointerup', finish, true)
      window.removeEventListener('pointercancel', cancel, true)
      window.removeEventListener('blur', cancelAll)
      clearDrag()
    }
  }, [clearDrag, groundAtScreenPoint, placeBot, placeSavedFriend])

  const previewFor = useCallback((kind: NpcDragTarget['kind'], id: string) => {
    const drag = dragRef.current
    return drag?.kind === kind && drag.id === id
      ? previewRef.current
      : undefined
  }, [])
  const setHovering = useCallback(
    (hovering: boolean) => {
      if (dragRef.current) return
      gl.domElement.style.cursor = hovering ? 'grab' : 'default'
    },
    [gl.domElement],
  )
  const controls = useMemo(
    () => ({ begin, previewFor, setHovering }),
    [begin, previewFor, setHovering],
  )
  const label = active
    ? active.kind === 'bot'
      ? (botProfiles.find((profile) => profile.id === active.id)?.username ??
        'NPC')
      : (useGameStore
          .getState()
          .savedFriends.find((friend) => friend.id === active.id)?.name ??
        'NPC')
    : undefined

  return (
    <NpcDragContext.Provider value={controls}>
      {children}
      {active && label ? (
        <NpcDragIndicator previewRef={previewRef} label={label} />
      ) : null}
    </NpcDragContext.Provider>
  )
}

function NpcDragIndicator({
  previewRef,
  label,
}: {
  previewRef: MutableRefObject<Vec3 | undefined>
  label: string
}) {
  const group = useRef<THREE.Group>(null)
  useFrame(() => {
    const preview = previewRef.current
    if (preview && group.current)
      group.current.position.set(preview[0], 0.035, preview[2])
  })
  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.82, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.86} />
      </mesh>
      <Html center position={[0, 3.45, 0]} zIndexRange={worldActionZIndexRange}>
        <div
          className="bb-npc-drag-indicator"
          data-testid="npc-drag-indicator"
          role="status"
        >
          Moving {label} - release to place
        </div>
      </Html>
    </group>
  )
}

function npcDropObstaclesAt(position: Vec3) {
  const game = useGameStore.getState()
  const party = useLocalPartyStore.getState()
  const remoteBlocks = Object.values(party.remotePlayers).flatMap(
    (player) => player.placedBlocks ?? [],
  )
  const proceduralPieces = game.settings.proceduralWorld
    ? getProceduralWorld({
        seed: game.settings.worldSeed || 'LONDON-2026',
        center: position,
        viewDistance: 1,
        night: game.settings.nightMode,
      }).pieces.filter(
        (piece) =>
          !proceduralPieceBlocksParking(piece) &&
          !proceduralObjectInsideCoreTown(piece),
      )
    : []
  return [
    ...staticCollisionObstacles,
    ...activeObbyCollisionBoxes(game.obby.active),
    ...parkingLotCollisionBoxes(),
    ...proceduralPiecesToCollisionBoxes(proceduralPieces).filter(
      (box) => !collisionBoxOverlapsParkingClearance(box),
    ),
    ...buildBlocksToCollisionBoxes(game.placedBlocks),
    ...buildBlocksToCollisionBoxes(remoteBlocks),
  ]
}

export function GameScene() {
  const activeInterior = useGameStore((state) => state.activeInterior)
  const [selectedMessageTargetId, setSelectedMessageTargetId] =
    useState<string>()
  const selectMessageTarget = useCallback(
    (targetId: string) => setSelectedMessageTargetId(targetId),
    [],
  )
  const messageTargetSelection = useMemo(
    () => ({ selectedMessageTargetId, selectMessageTarget }),
    [selectedMessageTargetId, selectMessageTarget],
  )

  useEffect(() => {
    setSelectedMessageTargetId(undefined)
  }, [activeInterior?.id])

  return (
    <MessageTargetSelectionContext.Provider value={messageTargetSelection}>
      {activeInterior ? (
        <>
          <InteriorWorld interior={activeInterior} />
          <PlayerController key={`interior:${activeInterior.id}`} />
          <LocalPartyPlayers />
        </>
      ) : (
        <OutdoorWorld />
      )}
    </MessageTargetSelectionContext.Provider>
  )
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
  const goKarts = useMemo(() => createGoKarts(), [])
  const initialDrivableVehicles = useMemo(
    () => [...parkedVehicles, ...goKarts],
    [goKarts, parkedVehicles],
  )
  const drivableRuntime = useRef<DrivableVehicle[]>(initialDrivableVehicles)
  const footballs = useMemo(() => createFootballBalls(), [])
  const footballRuntime = useRef<FootballBallRuntime[]>(footballs)

  useEffect(() => {
    trafficRuntime.current = initialTrafficVehicles
  }, [initialTrafficVehicles])

  useEffect(() => {
    drivableRuntime.current = initialDrivableVehicles
  }, [initialDrivableVehicles])

  useEffect(() => {
    footballRuntime.current = footballs
  }, [footballs])

  return (
    <NpcDragProvider>
      <ProceduralBoroughWorld />
      <StreamedFeature featureId="central-buddy-town">
        <Town />
        <ParkingLot vehicles={parkedVehicles} runtime={drivableRuntime} />
      </StreamedFeature>
      <StreamedFeature featureId="football-stadium">
        <FootballPitch balls={footballs} runtime={footballRuntime} />
      </StreamedFeature>
      <StreamedFeature featureId="go-kart-track">
        <GoKartTrack vehicles={goKarts} runtime={drivableRuntime} />
      </StreamedFeature>
      <StreamedFeature featureId="work-district">
        <WorkDistrict />
      </StreamedFeature>
      <SeatActionMarkers />
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
        footballRuntime={footballRuntime}
      />
      <Bots />
      <SavedFriendPlayers />
      <RemoteSavedFriendPlayers />
      <LocalPartyPlayers />
      <ObbyCourse />
      <CoinField />
      <MiniGameWorld />
      <ToyPickup />
      <PlacedBlocks />
      <RemotePlacedBlocks />
      <BuildModeOverlay />
    </NpcDragProvider>
  )
}

function StreamedFeature({
  featureId,
  children,
}: {
  featureId: string
  children: ReactNode
}) {
  const settings = useGameStore((state) => state.settings)
  const [visible, setVisible] = useState(() =>
    worldFeatureVisible(
      featureId,
      useGameStore.getState().playerPosition,
      settings.worldViewDistance,
    ),
  )

  useFrame(() => {
    const next = worldFeatureVisible(
      featureId,
      useGameStore.getState().playerPosition,
      settings.worldViewDistance,
    )
    if (next !== visible) setVisible(next)
  })

  return visible ? children : null
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
      vehicle.kind !== 'double-decker-bus' &&
      Math.hypot(
        playerPosition[0] - pose.position[0],
        playerPosition[2] - pose.position[2],
      ) <= 3.2
    if (nextNearby !== nearby) setNearby(nextNearby)
  })

  const driveTrafficCar = () => {
    const current = runtime.current.find((item) => item.id === vehicle.id)
    if (!current || current.kind === 'double-decker-bus' || activeVehicleId)
      return
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
      {vehicle.kind === 'double-decker-bus' ? (
        <DoubleDeckerBusPiece color={vehicle.color} />
      ) : (
        <CarPiece color={vehicle.color} />
      )}
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

function GoKartTrack({
  vehicles,
  runtime,
}: {
  vehicles: DrivableVehicle[]
  runtime: MutableRefObject<DrivableVehicle[]>
}) {
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const { center, width, depth, laneWidth, barrierThickness, barrierHeight } =
    goKartTrack
  const asphaltColor = '#111827'
  const grassColor = '#22c55e'
  const startZ = goKartStartLine.center[2]
  const startX = goKartStartLine.center[0]
  const innerWidth = width - laneWidth * 2
  const innerDepth = depth - laneWidth * 2
  const horizontalKerbCount = Math.floor(innerWidth / 1.6)
  const verticalKerbCount = Math.floor(innerDepth / 1.6)
  const visibleVehicles = activeLocalGoKarts(vehicles, activeVehicleId)
  return (
    <group>
      <mesh receiveShadow position={[center[0], 0.025, center[2]]}>
        <boxGeometry args={[width + 6, 0.06, depth + 6]} />
        <meshStandardMaterial color="#15803d" roughness={0.92} />
      </mesh>
      <TrackAsphalt
        position={[center[0], 0.075, center[2] - depth / 2 + laneWidth / 2]}
        size={[width, laneWidth]}
      />
      <TrackAsphalt
        position={[center[0], 0.075, center[2] + depth / 2 - laneWidth / 2]}
        size={[width, laneWidth]}
      />
      <TrackAsphalt
        position={[center[0] - width / 2 + laneWidth / 2, 0.076, center[2]]}
        size={[laneWidth, depth]}
      />
      <TrackAsphalt
        position={[center[0] + width / 2 - laneWidth / 2, 0.076, center[2]]}
        size={[laneWidth, depth]}
      />
      <mesh receiveShadow position={[center[0], 0.086, center[2]]}>
        <boxGeometry args={[innerWidth, 0.055, innerDepth]} />
        <meshStandardMaterial color={grassColor} roughness={0.86} />
      </mesh>
      {Array.from({ length: horizontalKerbCount }, (_, index) => {
        const x =
          center[0] -
          innerWidth / 2 +
          ((index + 0.5) * innerWidth) / horizontalKerbCount
        return [-1, 1].map((side) => (
          <TrackKerb
            key={`horizontal-${side}-${index}`}
            position={[x, 0.14, center[2] + (innerDepth / 2 + 0.16) * side]}
            size={[innerWidth / horizontalKerbCount - 0.06, 0.14, 0.38]}
            red={index % 2 === 0}
          />
        ))
      })}
      {Array.from({ length: verticalKerbCount }, (_, index) => {
        const z =
          center[2] -
          innerDepth / 2 +
          ((index + 0.5) * innerDepth) / verticalKerbCount
        return [-1, 1].map((side) => (
          <TrackKerb
            key={`vertical-${side}-${index}`}
            position={[center[0] + (innerWidth / 2 + 0.16) * side, 0.14, z]}
            size={[0.38, 0.14, innerDepth / verticalKerbCount - 0.06]}
            red={index % 2 === 0}
          />
        ))
      })}
      <TrackBarrier
        position={[
          center[0],
          barrierHeight / 2,
          center[2] - depth / 2 - barrierThickness / 2,
        ]}
        size={[width + barrierThickness * 2, barrierHeight, barrierThickness]}
      />
      <TrackBarrier
        position={[
          center[0],
          barrierHeight / 2,
          center[2] + depth / 2 + barrierThickness / 2,
        ]}
        size={[width + barrierThickness * 2, barrierHeight, barrierThickness]}
      />
      <TrackBarrier
        position={[
          center[0] - width / 2 - barrierThickness / 2,
          barrierHeight / 2,
          center[2],
        ]}
        size={[barrierThickness, barrierHeight, depth + barrierThickness * 2]}
      />
      <TrackBarrier
        position={[
          center[0] + width / 2 + barrierThickness / 2,
          barrierHeight / 2,
          center[2],
        ]}
        size={[barrierThickness, barrierHeight, depth + barrierThickness * 2]}
      />
      <mesh receiveShadow position={[startX, 0.12, startZ]}>
        <boxGeometry args={[0.22, 0.04, laneWidth * 0.9]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.55} />
      </mesh>
      {[-0.55, 0.55].map((offset) => (
        <group key={offset} position={[startX + offset, 0.13, startZ]}>
          {Array.from({ length: 10 }, (_, square) => (
            <mesh
              key={square}
              position={[
                0,
                0.02,
                -laneWidth * 0.405 + square * laneWidth * 0.09,
              ]}
            >
              <boxGeometry args={[0.46, 0.03, laneWidth * 0.085]} />
              <meshStandardMaterial
                color={
                  square % 2 === (offset > 0 ? 0 : 1) ? '#f8fafc' : '#0f172a'
                }
                roughness={0.48}
              />
            </mesh>
          ))}
        </group>
      ))}
      {goKartBoostPads.map((pad) => (
        <group key={pad.id} position={pad.center}>
          <mesh receiveShadow>
            <boxGeometry args={[pad.half[0] * 2, 0.045, pad.half[2] * 2]} />
            <meshStandardMaterial
              color="#22d3ee"
              emissive="#0891b2"
              emissiveIntensity={0.9}
              roughness={0.34}
            />
          </mesh>
          {[-0.72, 0, 0.72].map((offset) => (
            <mesh
              key={offset}
              position={[offset, 0.035, 0]}
              rotation={[0, 0, -0.7]}
            >
              <boxGeometry args={[0.48, 0.035, 0.12]} />
              <meshStandardMaterial
                color="#ecfeff"
                emissive="#67e8f9"
                emissiveIntensity={1.2}
              />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[startX, 0, startZ - laneWidth / 2 - 0.42]}>
        {[-laneWidth * 0.43, laneWidth * 0.43].map((z) => (
          <mesh key={z} castShadow position={[0, 1.35, z]}>
            <boxGeometry args={[0.18, 2.7, 0.18]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
        ))}
        <mesh castShadow position={[0, 2.62, 0]}>
          <boxGeometry args={[0.2, 0.22, laneWidth * 0.9]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {[-0.55, 0, 0.55].map((z, index) => (
          <mesh key={z} position={[0.12, 2.62, z]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial
              color={index === 2 ? '#22c55e' : '#ef4444'}
              emissive={index === 2 ? '#16a34a' : '#dc2626'}
              emissiveIntensity={0.7}
            />
          </mesh>
        ))}
      </group>
      {[
        [-innerWidth * 0.3, -innerDepth * 0.25],
        [0, -innerDepth * 0.18],
        [innerWidth * 0.28, -innerDepth * 0.28],
        [-innerWidth * 0.2, innerDepth * 0.25],
        [innerWidth * 0.2, innerDepth * 0.22],
      ].map(([x, z], index) => (
        <CircuitTree
          key={`circuit-tree-${index}`}
          position={[center[0] + x, 0.12, center[2] + z]}
        />
      ))}
      <group position={[center[0], 0.12, center[2]]}>
        <mesh castShadow position={[0, 0.7, 0]}>
          <boxGeometry args={[8.5, 1.4, 1.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.55} />
        </mesh>
        <Html
          center
          position={[0, 0.72, 0.64]}
          zIndexRange={worldHtmlZIndexRange}
        >
          <span className="pointer-events-none select-none whitespace-nowrap text-lg font-black text-white">
            BUDDY GRAND PRIX
          </span>
        </Html>
      </group>
      {visibleVehicles.map((vehicle) => (
        <KartVehicleMesh key={vehicle.id} vehicle={vehicle} runtime={runtime} />
      ))}
      <Html
        center
        position={[center[0], 2.6, center[2] + depth / 2 + 2.3]}
        zIndexRange={worldHtmlZIndexRange}
      >
        <span className="pointer-events-none select-none whitespace-nowrap rounded-xl bg-white/95 px-3 py-1 text-xs font-black text-slate-950 shadow">
          Buddy Grand Prix - wide 3-lap circuit
        </span>
      </Html>
      <mesh
        receiveShadow
        position={[center[0], 0.035, center[2] + depth / 2 + 2.8]}
      >
        <boxGeometry args={[14, 0.07, 5.5]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.82} />
      </mesh>
      <mesh
        receiveShadow
        position={[center[0], 0.046, center[2] + depth / 2 + 5.2]}
      >
        <boxGeometry args={[7, 0.06, 3.2]} />
        <meshStandardMaterial color={asphaltColor} roughness={0.88} />
      </mesh>
    </group>
  )
}

function TrackAsphalt({
  position,
  size,
}: {
  position: Vec3
  size: [number, number]
}) {
  return (
    <mesh receiveShadow position={position}>
      <boxGeometry args={[size[0], 0.08, size[1]]} />
      <meshStandardMaterial color="#111827" roughness={0.82} />
    </mesh>
  )
}

function TrackBarrier({ position, size }: { position: Vec3; size: Vec3 }) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#f8fafc" roughness={0.5} />
    </mesh>
  )
}

function TrackKerb({
  position,
  size,
  red,
}: {
  position: Vec3
  size: Vec3
  red: boolean
}) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={red ? '#ef4444' : '#f8fafc'}
        roughness={0.6}
      />
    </mesh>
  )
}

function CircuitTree({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 1.7, 8]} />
        <meshStandardMaterial color="#854d0e" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 2.15, 0]}>
        <dodecahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial color="#16a34a" roughness={0.82} />
      </mesh>
    </group>
  )
}

function KartPiece({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.28, 0]}>
        <boxGeometry args={[1.75, 0.26, 1.14]} />
        <meshStandardMaterial color={color} roughness={0.68} />
      </mesh>
      <mesh castShadow position={[-0.18, 0.5, 0]}>
        <boxGeometry args={[0.58, 0.32, 0.66]} />
        <meshStandardMaterial color="#0f172a" roughness={0.62} />
      </mesh>
      <mesh castShadow position={[0.7, 0.42, 0]}>
        <boxGeometry args={[0.18, 0.3, 0.82]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.48} />
      </mesh>
      <mesh castShadow position={[-0.78, 0.58, 0]}>
        <boxGeometry args={[0.12, 0.54, 1.42]} />
        <meshStandardMaterial color={color} roughness={0.58} />
      </mesh>
      {[-0.62, 0.62].flatMap((x) =>
        [-0.62, 0.62].map((z) => (
          <mesh
            key={`${x}:${z}`}
            castShadow
            position={[x, 0.2, z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.2, 0.2, 0.18, 12]} />
            <meshStandardMaterial color="#020617" roughness={0.8} />
          </mesh>
        )),
      )}
    </group>
  )
}

function KartVehicleMesh({
  vehicle,
  runtime,
}: {
  vehicle: DrivableVehicle
  runtime: MutableRefObject<DrivableVehicle[]>
}) {
  const group = useRef<THREE.Group>(null)
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const avatar = useGameStore((state) => state.avatar)
  const remotePlayers = useLocalPartyStore((state) => state.remotePlayers)
  const [nearby, setNearby] = useState(false)
  const occupied = activeVehicleId === vehicle.id
  const occupiedRemotely = Object.values(remotePlayers).some(
    (player) => player.kart?.id === vehicle.id,
  )

  useFrame(() => {
    const current =
      runtime.current.find((item) => item.id === vehicle.id) ?? vehicle
    group.current?.position.set(...current.position)
    if (group.current) group.current.rotation.y = vehicleRenderYaw(current.yaw)
    const state = useGameStore.getState()
    const nextNearby =
      (!state.activeVehicleId || occupied) &&
      !state.activeInterior &&
      distanceToVehicle(state.playerPosition, current) <= 2.3
    if (nextNearby !== nearby) setNearby(nextNearby)
  })

  if (occupiedRemotely && !occupied) return null

  return (
    <group
      ref={group}
      data-testid={`go-kart-${vehicle.id}`}
      position={vehicle.position}
      rotation={[0, vehicleRenderYaw(vehicle.yaw), 0]}
      onClick={(event) => {
        event.stopPropagation()
        pulseWorldAction('vehicle', vehicle.id)
      }}
    >
      <KartPiece color={vehicle.color} />
      {occupied ? (
        <group
          position={[-0.18, 0.68, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={0.46}
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
            topStyle={avatar.topStyle}
            outfitStyle={avatar.outfitStyle}
            bottomStyle={avatar.bottomStyle}
            shoeStyle={avatar.shoeStyle}
            shoeColor={avatar.shoeColor}
            accessory={avatar.accessory}
            face={avatar.face}
            username="Racer"
            hat={avatar.hat !== 'none'}
            showName={false}
            emote="sit"
            action="idle"
          />
        </group>
      ) : null}
      {nearby ? (
        <Html
          center
          position={[0, 2.2, 0]}
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
            {occupied ? 'Exit kart' : `Race ${vehicle.label}`}
          </button>
        </Html>
      ) : !occupied ? (
        <Html center position={[0, 1.9, 0]} zIndexRange={worldHtmlZIndexRange}>
          <span className="pointer-events-none select-none whitespace-nowrap rounded-full bg-cyan-950/90 px-3 py-1 text-xs font-black text-white shadow">
            Race
          </span>
        </Html>
      ) : null}
    </group>
  )
}

function FootballPitch({
  balls,
  runtime,
}: {
  balls: FootballBallRuntime[]
  runtime: MutableRefObject<FootballBallRuntime[]>
}) {
  const scoreFootballGoal = useGameStore((state) => state.scoreFootballGoal)

  useFrame((_, delta) => {
    const now = performance.now()
    runtime.current = runtime.current.map((ball, index) => {
      const next = advanceFootballBall(ball, Math.min(delta, 0.08), now)
      const goal = footballGoalForBall(next)
      if (!goal || now - (next.lastGoalAt ?? 0) < 1000) return next
      scoreFootballGoal(footballGoalReward)
      return { ...resetFootballBall(next, index), lastGoalAt: now }
    })
  })

  return (
    <group>
      <mesh
        receiveShadow
        position={[footballPitch.center[0], 0.018, footballPitch.center[2]]}
      >
        <boxGeometry
          args={[
            footballStadiumFootprint.width,
            0.08,
            footballStadiumFootprint.depth,
          ]}
        />
        <meshStandardMaterial color="#15803d" roughness={0.94} />
      </mesh>
      <mesh
        receiveShadow
        position={[footballPitch.center[0], 0.055, footballPitch.center[2]]}
      >
        <boxGeometry args={[footballPitch.width, 0.1, footballPitch.length]} />
        <meshStandardMaterial color="#22c55e" roughness={0.86} />
      </mesh>
      <PitchLine position={[0, 0]} size={[footballPitch.width, 0.1]} />
      <PitchLine position={[0, 0]} size={[0.1, footballPitch.length]} />
      <PitchLine
        position={[0, -footballPitch.length / 2]}
        size={[footballPitch.width, 0.12]}
      />
      <PitchLine
        position={[0, footballPitch.length / 2]}
        size={[footballPitch.width, 0.12]}
      />
      <PitchLine
        position={[-footballPitch.width / 2, 0]}
        size={[0.12, footballPitch.length]}
      />
      <PitchLine
        position={[footballPitch.width / 2, 0]}
        size={[0.12, footballPitch.length]}
      />
      <mesh
        position={[footballPitch.center[0], 0.12, footballPitch.center[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[1.5, 0.035, 8, 48]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.62} />
      </mesh>
      {footballGoals.map((goal) => (
        <FootballGoal key={goal.id} goal={goal} />
      ))}
      <StadiumStand side={-1} />
      <StadiumStand side={1} />
      <Html
        center
        position={[
          footballPitch.center[0],
          2.6,
          footballPitch.center[2] + footballPitch.length / 2 + 1.4,
        ]}
        zIndexRange={worldHtmlZIndexRange}
      >
        <span className="pointer-events-none select-none whitespace-nowrap rounded-xl bg-white/95 px-3 py-1 text-xs font-black text-slate-950 shadow">
          Hold Kick for power - score goals for coins
        </span>
      </Html>
      {balls.map((ball) => (
        <FootballBallMesh key={ball.id} ball={ball} runtime={runtime} />
      ))}
    </group>
  )
}

function StadiumStand({ side }: { side: -1 | 1 }) {
  const x = footballPitch.center[0] + side * (footballPitch.width / 2 + 2.25)
  return (
    <group position={[x, 0, footballPitch.center[2]]}>
      {[0, 1, 2].map((tier) => (
        <mesh
          key={tier}
          castShadow
          receiveShadow
          position={[side * tier * 0.38, 0.3 + tier * 0.28, 0]}
        >
          <boxGeometry
            args={[0.72, 0.46 + tier * 0.15, footballPitch.length + 3.8]}
          />
          <meshStandardMaterial
            color={tier % 2 === 0 ? '#2563eb' : '#f8fafc'}
            roughness={0.72}
          />
        </mesh>
      ))}
    </group>
  )
}

function PitchLine({
  position,
  size,
}: {
  position: [number, number]
  size: [number, number]
}) {
  return (
    <mesh
      receiveShadow
      position={[
        footballPitch.center[0] + position[0],
        0.12,
        footballPitch.center[2] + position[1],
      ]}
    >
      <boxGeometry args={[size[0], 0.04, size[1]]} />
      <meshStandardMaterial color="#f8fafc" roughness={0.7} />
    </mesh>
  )
}

function FootballGoal({ goal }: { goal: (typeof footballGoals)[number] }) {
  const direction = goal.id === 'north-goal' ? -1 : 1
  const postZ = goal.center[2] + direction * 0.45
  const postY = 0.9
  const halfGoal = footballPitch.goalWidth / 2
  return (
    <group>
      <mesh
        receiveShadow
        position={[goal.center[0], 0.08, goal.center[2] + direction * 0.45]}
      >
        <boxGeometry args={[footballPitch.goalWidth, 0.035, 0.78]} />
        <meshStandardMaterial
          color="#bbf7d0"
          emissive="#22c55e"
          emissiveIntensity={0.18}
          transparent
          opacity={0.46}
        />
      </mesh>
      {[-halfGoal, halfGoal].map((x) => (
        <mesh key={x} castShadow position={[goal.center[0] + x, postY, postZ]}>
          <boxGeometry args={[0.18, 1.8, 0.18]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.52} />
        </mesh>
      ))}
      <mesh castShadow position={[goal.center[0], postY * 2, postZ]}>
        <boxGeometry args={[footballPitch.goalWidth + 0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.52} />
      </mesh>
      <mesh
        position={[goal.center[0], 0.95, postZ + direction * 0.42]}
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[footballPitch.goalWidth, 1.65, 0.08]} />
        <meshStandardMaterial
          color="#dbeafe"
          roughness={0.48}
          transparent
          opacity={0.36}
        />
      </mesh>
      <Html
        center
        position={[goal.center[0], 2.35, postZ + direction * 0.15]}
        zIndexRange={worldHtmlZIndexRange}
      >
        <span className="pointer-events-none select-none whitespace-nowrap rounded-lg bg-slate-950/88 px-3 py-1 text-xs font-black text-white shadow">
          GOAL
        </span>
      </Html>
    </group>
  )
}

function FootballBallMesh({
  ball,
  runtime,
}: {
  ball: FootballBallRuntime
  runtime: MutableRefObject<FootballBallRuntime[]>
}) {
  const group = useRef<THREE.Group>(null)
  const [nearby, setNearby] = useState(false)

  useFrame((_, delta) => {
    const current = runtime.current.find((item) => item.id === ball.id) ?? ball
    group.current?.position.set(
      current.position[0],
      current.position[1],
      current.position[2],
    )
    if (group.current) {
      const speed = Math.hypot(current.velocity[0], current.velocity[2])
      group.current.rotation.x += speed * delta * 1.9
      group.current.rotation.z += current.velocity[0] * delta * 0.9
    }
    const state = useGameStore.getState()
    const nextNearby =
      !state.activeInterior &&
      !state.activeVehicleId &&
      !state.buildMode &&
      Math.hypot(
        state.playerPosition[0] - current.position[0],
        state.playerPosition[2] - current.position[2],
      ) <= footballBallInteractionRadius
    if (nextNearby !== nearby) setNearby(nextNearby)
  })

  return (
    <group ref={group} position={ball.position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[footballBallRadius, 24, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.52} />
      </mesh>
      {footballBallPatchFaces.map((patch, index) => (
        <mesh key={index} position={patch.position} rotation={patch.rotation}>
          <circleGeometry args={[patch.radius, 10]} />
          <meshStandardMaterial
            color="#111827"
            roughness={0.62}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {nearby ? (
        <Html
          center
          position={[0, footballBallRadius + 0.82, 0]}
          zIndexRange={worldHtmlZIndexRange}
        >
          <span className="pointer-events-none select-none whitespace-nowrap rounded-full bg-slate-950/90 px-3 py-1 text-xs font-black text-white shadow">
            Ball
          </span>
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
  const motionSample = useRef({
    position: useGameStore.getState().playerPosition,
    time: performance.now(),
    prefetchedAt: 0,
  })
  useFrame(() => {
    const playerPosition = useGameStore.getState().playerPosition
    const nextChunk = {
      x: Math.floor(playerPosition[0] / 36),
      z: Math.floor(playerPosition[2] / 36),
    }
    if (nextChunk.x !== chunk.x || nextChunk.z !== chunk.z) setChunk(nextChunk)

    const now = performance.now()
    if (now - motionSample.current.prefetchedAt < 280) return
    const elapsed = Math.max(0.001, (now - motionSample.current.time) / 1000)
    const velocity: Vec3 = [
      (playerPosition[0] - motionSample.current.position[0]) / elapsed,
      0,
      (playerPosition[2] - motionSample.current.position[2]) / elapsed,
    ]
    const predicted = predictChunkRequests({
      position: playerPosition,
      velocity,
      viewDistance: settings.worldViewDistance,
    }).find((request) => request.reason === 'predicted')
    motionSample.current = {
      position: playerPosition,
      time: now,
      prefetchedAt: now,
    }
    if (predicted) {
      prefetchProceduralWorld({
        seed: settings.worldSeed || 'LONDON-2026',
        center: [predicted.cx * 36 + 18, 0, predicted.cz * 36 + 18],
        viewDistance: settings.worldViewDistance,
        night: settings.nightMode,
      })
    }
  })
  const world = useMemo(
    () =>
      getProceduralWorld({
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
  const renderPieces = useMemo(
    () =>
      world.pieces.filter(
        (piece) =>
          !proceduralPieceBlocksParking(piece) &&
          !proceduralObjectInsideCoreTown(piece),
      ),
    [world.pieces],
  )

  if (!settings.proceduralWorld) return null

  return (
    <group>
      <ProceduralWorldMeshes pieces={renderPieces} />
      <Html
        position={[chunk.x * 36 + 18, 3.6, chunk.z * 36 + 18]}
        center
        zIndexRange={worldHtmlZIndexRange}
      >
        <span className="whitespace-nowrap rounded-lg bg-slate-950/80 px-3 py-1 text-xs font-black text-white shadow">
          {world.district} • {world.buildingCount} buildings
        </span>
      </Html>
    </group>
  )
}

type ProceduralGeometryKind =
  'box' | 'tree-top' | 'lamp-light' | 'wheel' | 'shard'

function proceduralGeometryKind(
  piece: ProceduralPiece,
): ProceduralGeometryKind {
  if (piece.kind === 'tree-top') return 'tree-top'
  if (piece.kind === 'lamp-light') return 'lamp-light'
  if (piece.id === 'landmark:london-eye-ring') return 'wheel'
  if (piece.id === 'landmark:shard') return 'shard'
  return 'box'
}

function proceduralBatchKey(piece: ProceduralPiece) {
  return [
    proceduralGeometryKind(piece),
    piece.kind,
    piece.color,
    piece.emissive ?? '',
    piece.emissiveIntensity ?? 0,
  ].join('|')
}

function ProceduralWorldMeshes({ pieces }: { pieces: ProceduralPiece[] }) {
  const batches = useMemo(() => {
    const grouped = new Map<string, ProceduralPiece[]>()
    pieces.forEach((piece) => {
      const key = proceduralBatchKey(piece)
      grouped.set(key, [...(grouped.get(key) ?? []), piece])
    })
    return [...grouped.entries()]
  }, [pieces])

  return batches.map(([key, batch]) => (
    <ProceduralInstanceBatch key={key} pieces={batch} />
  ))
}

function ProceduralInstanceBatch({ pieces }: { pieces: ProceduralPiece[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const piece = pieces[0]!
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
  const geometry = proceduralGeometryKind(piece)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const transform = new THREE.Object3D()
    pieces.forEach((instance, index) => {
      const rotation = instance.rotation ?? [0, 0, 0]
      transform.position.fromArray(instance.position)
      transform.rotation.set(rotation[0], rotation[1], rotation[2])
      transform.scale.fromArray(instance.scale)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
  }, [pieces])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, pieces.length]}
      castShadow={castsShadow}
      receiveShadow={receivesShadow}
    >
      {geometry === 'tree-top' ? (
        <dodecahedronGeometry args={[0.5, 0]} />
      ) : geometry === 'lamp-light' ? (
        <sphereGeometry args={[0.5, 14, 10]} />
      ) : geometry === 'wheel' ? (
        <torusGeometry args={[0.5, 0.035, 8, 36]} />
      ) : geometry === 'shard' ? (
        <coneGeometry args={[0.5, 1, 4]} />
      ) : (
        <boxGeometry args={[1, 1, 1]} />
      )}
      <meshStandardMaterial {...materialProps} />
    </instancedMesh>
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
  const visibleVehicles = (
    activeVehicleId || runtime.current.length > 0 ? runtime.current : vehicles
  ).filter((vehicle) => !isGoKartId(vehicle.id))

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
            topStyle={avatar.topStyle}
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

      {worldLocations
        .filter(
          (location) =>
            Math.abs(location.position[0]) <= 27 &&
            Math.abs(location.position[2]) <= 27,
        )
        .map((location) => (
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
      <Storefront
        position={[-21, 0, 22]}
        label="SKILL SCHOOL"
        color="#a78bfa"
      />
      <Storefront position={[18, 0, 21]} label="OBBY" color="#ef4444" />
      <Billboard position={[-11, 0, 2]} />
      <Benches />
      <StreetLamps />

      {staticTreePositions
        .filter(
          (position) =>
            !staticTreeBlocksParking(position) &&
            !staticTreeBlocksFootballPitch(position),
        )
        .map((position) => (
          <Tree key={position.join(',')} position={position} />
        ))}
    </group>
  )
}

function WorkDistrict() {
  return (
    <group data-testid="work-district">
      <RigidBody type="fixed" colliders={false}>
        <mesh
          receiveShadow
          position={[
            workDistrictCenter[0],
            -workDistrictSize[1] / 2,
            workDistrictCenter[2],
          ]}
        >
          <boxGeometry args={workDistrictSize} />
          <meshStandardMaterial color="#86efac" roughness={0.92} />
        </mesh>
        <CuboidCollider
          args={[
            workDistrictSize[0] / 2,
            workDistrictSize[1] / 2,
            workDistrictSize[2] / 2,
          ]}
          position={[
            workDistrictCenter[0],
            -workDistrictSize[1] / 2,
            workDistrictCenter[2],
          ]}
        />
      </RigidBody>

      <mesh
        receiveShadow
        position={[workDistrictCenter[0], 0.025, workDistrictCenter[2]]}
      >
        <boxGeometry args={[5.5, 0.08, workDistrictSize[2] - 2]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      <mesh
        receiveShadow
        position={[workDistrictCenter[0], 0.03, workDistrictCenter[2]]}
      >
        <boxGeometry args={[workDistrictSize[0] - 2, 0.08, 5.5]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      <Html
        center
        position={[workDistrictCenter[0], 5.1, workDistrictCenter[2] - 18]}
        zIndexRange={worldHtmlZIndexRange}
      >
        <span className="pointer-events-none whitespace-nowrap rounded-xl bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 shadow-xl">
          Buddy Work District · Complete tasks to earn coins
        </span>
      </Html>

      {workplaceBuildings.map((building) => (
        <group key={building.id}>
          <Building
            position={building.position}
            color={building.color}
            scale={building.size}
            roofStyle="flat"
          />
          <Storefront
            position={[building.position[0], 0, building.position[2]]}
            label={building.label.toUpperCase()}
            color={building.color}
          />
        </group>
      ))}

      <FarmFields />
      {jobDefinitions.map((job) => (
        <group key={job.id}>
          <JobManager jobId={job.id} />
          {job.tasks.map((task) => (
            <JobTaskStation key={task.id} jobId={job.id} taskId={task.id} />
          ))}
          <WorkCustomer jobId={job.id} />
        </group>
      ))}
    </group>
  )
}

function FarmFields() {
  return (
    <group>
      {[94, 98, 102].map((x, index) => (
        <group key={x}>
          <mesh receiveShadow position={[x, 0.08, 121]}>
            <boxGeometry args={[3.2, 0.14, 5]} />
            <meshStandardMaterial color="#854d0e" roughness={1} />
          </mesh>
          {[-1.5, -0.5, 0.5, 1.5].map((zOffset) => (
            <mesh
              key={zOffset}
              castShadow
              position={[x + (index - 1) * 0.08, 0.34, 121 + zOffset]}
            >
              <coneGeometry args={[0.2, 0.52, 6]} />
              <meshStandardMaterial
                color={index === 2 ? '#facc15' : '#22c55e'}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function JobManager({
  jobId,
}: {
  jobId: (typeof jobDefinitions)[number]['id']
}) {
  const job = jobDefinitions.find((entry) => entry.id === jobId)!
  const runtime = useGameStore((state) => state.job)
  const startJobShift = useGameStore((state) => state.startJobShift)
  const [nearby, setNearby] = useState(false)
  const activeHere = runtime.activeId === job.id
  const runningHere = activeHere && runtime.status === 'running'
  const completedHere = activeHere && runtime.status === 'completed'
  const currentTask = runningHere ? activeJobTask(runtime) : undefined
  const currentChallenge = runningHere ? activeJobChallenge(runtime) : undefined

  useFrame(() => {
    const next =
      distance2d(useGameStore.getState().playerPosition, job.managerPosition) <=
      3.4
    if (next !== nearby) setNearby(next)
  })

  const managerLine = runningHere
    ? `${currentTask?.instruction} Order: ${currentChallenge?.orderLabel}.`
    : completedHere
      ? `Great shift! You earned ${runtime.summary?.totalReward ?? job.reward} coins.`
      : runtime.status === 'running'
        ? 'Finish your current shift, then come and work with me.'
        : `I have a three-task shift with a ${job.reward}-coin base wage.`

  return (
    <group
      position={[
        job.managerPosition[0],
        avatarGroundOffset,
        job.managerPosition[2],
      ]}
      onClick={(event) => {
        event.stopPropagation()
        if (nearby && !runningHere) startJobShift(job.id)
      }}
    >
      <BlockAvatar
        bodyColor="#c9825a"
        shirtColor={job.color}
        hairColor="#3b1f12"
        hairStyle={job.id === 'farming' ? 'bob' : 'short'}
        pantsColor="#1f2937"
        outfitStyle="tee"
        bottomStyle="jeans"
        shoeStyle="boots"
        username={job.managerName}
        showName={nearby || activeHere}
        action={runningHere ? 'wave' : 'idle'}
        emote={runningHere ? 'wave' : 'none'}
      />
      {nearby ? (
        <Html
          center
          position={[0, 3.55, 0]}
          zIndexRange={worldActionZIndexRange}
        >
          <div className="w-52 rounded-xl bg-white p-2 text-center text-xs font-black text-slate-950 shadow-xl">
            <span className="block">{managerLine}</span>
            {!runningHere ? (
              <button
                type="button"
                className="bb-world-action-button mt-2"
                data-testid={`start-job-${job.id}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  startJobShift(job.id)
                }}
              >
                <BriefcaseBusiness size={17} aria-hidden />
                {completedHere ? 'Work another shift' : 'Start shift'}
              </button>
            ) : null}
          </div>
        </Html>
      ) : null}
    </group>
  )
}

function JobTaskStation({
  jobId,
  taskId,
}: {
  jobId: (typeof jobDefinitions)[number]['id']
  taskId: string
}) {
  const job = jobDefinitions.find((entry) => entry.id === jobId)!
  const task = job.tasks.find((entry) => entry.id === taskId)!
  const runtime = useGameStore((state) => state.job)
  const openJobTask = useGameStore((state) => state.openJobTask)
  const [nearby, setNearby] = useState(false)
  const current = activeJobTask(runtime)?.id === task.id
  const completed = runtime.completedTaskIds.includes(task.id)
  const position = current ? jobTaskPosition(runtime, task) : task.position

  useFrame(() => {
    const next =
      current &&
      distance2d(useGameStore.getState().playerPosition, position) <= 3.8
    if (next !== nearby) setNearby(next)
  })

  return (
    <group position={position}>
      <mesh
        receiveShadow
        position={[0, 0.08, 0]}
        onClick={(event) => {
          event.stopPropagation()
          if (current && nearby) openJobTask(task.id)
        }}
      >
        <cylinderGeometry args={[0.9, 0.9, 0.16, 28]} />
        <meshStandardMaterial
          color={completed ? '#22c55e' : current ? job.color : '#cbd5e1'}
          emissive={current ? job.color : '#000000'}
          emissiveIntensity={current ? 0.4 : 0}
          roughness={0.65}
        />
      </mesh>
      {current ? (
        <Html
          center
          position={[0, 1.5, 0]}
          zIndexRange={worldActionZIndexRange}
        >
          {nearby ? (
            <button
              type="button"
              className="bb-world-action-button"
              data-testid={`job-task-${task.id}`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                openJobTask(task.id)
              }}
            >
              <CheckCircle2 size={17} aria-hidden />
              Start {task.label}
            </button>
          ) : (
            <span className="pointer-events-none whitespace-nowrap rounded-lg bg-slate-950/90 px-3 py-1 text-xs font-black text-white shadow">
              Next: {task.label}
            </span>
          )}
        </Html>
      ) : null}
    </group>
  )
}

function WorkCustomer({
  jobId,
}: {
  jobId: (typeof jobDefinitions)[number]['id']
}) {
  const job = jobDefinitions.find((entry) => entry.id === jobId)!
  const finalTask = job.tasks.at(-1)!
  const runtime = useGameStore((state) => state.job)
  const finalChallenge =
    runtime.activeId === job.id
      ? challengeForJobTask(runtime, finalTask)
      : finalTask.variants[0]
  const finalPosition = finalChallenge.position ?? finalTask.position
  const waiting =
    runtime.activeId === job.id &&
    runtime.status === 'running' &&
    activeJobTask(runtime)?.id === finalTask.id
  const helped =
    runtime.activeId === job.id &&
    runtime.completedTaskIds.includes(finalTask.id)
  const label =
    finalChallenge.customerName ??
    (job.id === 'farming' ? 'Garden Helper' : 'Waiting Customer')

  return (
    <group
      position={[
        finalPosition[0] + 1.15,
        avatarGroundOffset,
        finalPosition[2] - 0.7,
      ]}
    >
      <BlockAvatar
        bodyColor="#d99b70"
        shirtColor={job.color}
        hairColor="#111827"
        hairStyle="bob"
        pantsColor="#334155"
        outfitStyle="tee"
        bottomStyle="jeans"
        shoeStyle="sneakers"
        username={label}
        showName={waiting || helped}
        action={helped ? 'cheer' : 'idle'}
        emote={helped ? 'cheer' : 'none'}
      />
      {waiting || helped ? (
        <Html center position={[0, 3.2, 0]} zIndexRange={worldHtmlZIndexRange}>
          <span className="pointer-events-none block max-w-40 rounded-lg bg-white px-3 py-2 text-center text-xs font-black text-slate-900 shadow">
            {helped
              ? finalChallenge.successLine
              : `Hi! I am waiting for ${finalChallenge.orderLabel}.`}
          </span>
        </Html>
      ) : null}
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
  roofStyle = 'pitched',
}: {
  position: Vec3
  color: string
  scale: Vec3
  roofStyle?: 'pitched' | 'flat'
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
      {roofStyle === 'flat' ? (
        <mesh
          castShadow
          position={[0, scale[1] / 2 + roofHeight / 2, 0]}
          scale={[scale[0] * 1.04, roofHeight, scale[2] * 1.04]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      ) : (
        <mesh
          castShadow
          position={[0, scale[1] / 2 + roofHeight / 2, 0]}
          scale={[scale[0] * 1.08, roofHeight, scale[2] * 1.08]}
        >
          <coneGeometry args={[0.8, 1, 4]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      )}
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
        .filter(
          (position) =>
            !staticLampBlocksParking(position) &&
            !staticLampBlocksFootballPitch(position),
        )
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
  footballRuntime,
}: {
  trafficLanes?: TrafficLane[]
  trafficRuntime?: MutableRefObject<TrafficVehicle[]>
  drivableRuntime?: MutableRefObject<DrivableVehicle[]>
  footballRuntime?: MutableRefObject<FootballBallRuntime[]>
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
  const lastPreparedKartRaceId = useRef<string | undefined>(undefined)
  const lastPreparedKartVehicleId = useRef<string | undefined>(undefined)
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
  const tickKartRace = useGameStore((state) => state.tickKartRace)
  const setInteractionPrompt = useGameStore(
    (state) => state.setInteractionPrompt,
  )
  const setNearbyFootballBall = useGameStore(
    (state) => state.setNearbyFootballBall,
  )
  const settings = useGameStore((state) => state.settings)
  const activeInterior = useGameStore((state) => state.activeInterior)
  const placedBlocks = useGameStore((state) => state.placedBlocks)
  const savedFriends = useGameStore((state) => state.savedFriends)
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
        ? getProceduralWorld({
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
    const localDrivableVehicles = drivableRuntime
      ? drivableVehiclesAvailableLocally(
          drivableRuntime.current,
          activeVehicleThisFrame,
        )
      : []
    const currentKartRace = useGameStore.getState().kartRace
    const kartToPrepare =
      currentVehicle && isGoKartId(currentVehicle.id)
        ? currentVehicle
        : undefined
    const shouldPrepareKartLobby =
      kartToPrepare &&
      currentKartRace.status === 'lobby' &&
      kartToPrepare.id !== lastPreparedKartVehicleId.current
    const shouldPrepareKartRace =
      kartToPrepare &&
      currentKartRace.raceId &&
      currentKartRace.raceId !== lastPreparedKartRaceId.current &&
      (currentKartRace.status === 'countdown' ||
        currentKartRace.status === 'racing')
    if (kartToPrepare && (shouldPrepareKartLobby || shouldPrepareKartRace)) {
      const startingKart = getGoKart(kartToPrepare.id)
      if (startingKart && drivableRuntime) {
        currentVehicle = {
          ...startingKart,
          position: [...startingKart.position],
          speed: 0,
        }
        const kartIndex = drivableRuntime.current.findIndex(
          (vehicle) => vehicle.id === currentVehicle?.id,
        )
        if (kartIndex >= 0) drivableRuntime.current[kartIndex] = currentVehicle
        position.current.set(
          currentVehicle.position[0],
          avatarGroundOffset,
          currentVehicle.position[2],
        )
        yaw.current = currentVehicle.yaw
        cameraOrbitYaw.current = 0
        lastPreparedKartVehicleId.current = currentVehicle.id
        lastPreparedKartRaceId.current = currentKartRace.raceId
      }
    }
    if (!currentVehicle || !isGoKartId(currentVehicle.id))
      lastPreparedKartVehicleId.current = undefined
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
            localDrivableVehicles,
            activeVehicleThisFrame,
          )
    const remotePeople = Object.values(
      useLocalPartyStore.getState().remotePlayers,
    ).filter((player) => !player.interiorId && !player.kart)
    const now = Date.now()
    const peopleObstacles = activeInterior
      ? []
      : actorCollisionBoxes([
          ...bots.map((bot) => ({
            id: `bot:${bot.id}`,
            position: bot.position,
          })),
          ...savedFriends
            .filter((friend) => friend.inWorld)
            .map((friend, index) => ({
              id: `friend:${friend.id}`,
              position: savedFriendPositionAt(friend, now, index),
            })),
          ...remotePeople.map((player) => ({
            id: `party:${player.id}`,
            position: player.position,
          })),
          ...remotePeople.flatMap((owner, ownerIndex) =>
            (owner.savedFriends ?? [])
              .filter((friend) => friend.inWorld)
              .map((friend, friendIndex) => ({
                id: `party-friend:${owner.id}:${friend.id}`,
                position: savedFriendPositionAt(
                  friend,
                  now,
                  ownerIndex * 12 + friendIndex + 4,
                ),
              })),
          ),
        ])
    const solidObstacles = [
      ...collisionObstacles,
      ...trafficObstacles,
      ...parkedVehicleObstacles,
      ...peopleObstacles,
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
        ? localDrivableVehicles.find(
            (vehicle) =>
              vehicle.id === request.id &&
              distanceToVehicle(
                [position.current.x, 0, position.current.z],
                vehicle,
              ) <= 2.3,
          )
        : undefined
    const requestedFootballBall =
      hasWorldRequest &&
      footballRuntime &&
      (request?.type === 'football-kick' || request?.type === 'football-skill')
        ? footballRuntime.current.find(
            (ball) =>
              ball.id === request.id &&
              distance2d(
                [position.current.x, 0, position.current.z],
                ball.position,
              ) <=
                footballBallInteractionRadius + 0.5,
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
            localDrivableVehicles,
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
        .filter((player) => !player.interiorId && !player.kart)
        .map((player) => player.position)
      const partyKarts = partyKartVehicles(
        useLocalPartyStore.getState().remotePlayers,
      )
      const exitObstacles = collisionBoxesBlockingPlayer(
        [
          ...collisionObstacles,
          ...trafficObstacles,
          ...drivableVehicleCollisionBoxes(partyKarts),
          ...drivableVehicleCollisionBoxes(
            localDrivableVehicles,
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
      if (
        requestedFootballBall &&
        request?.type === 'football-kick' &&
        footballRuntime
      ) {
        const index = footballRuntime.current.findIndex(
          (ball) => ball.id === requestedFootballBall.id,
        )
        if (index >= 0) {
          footballRuntime.current[index] = {
            ...requestedFootballBall,
            skillUntil: undefined,
            skillAnchor: undefined,
            velocity: footballKickVelocity(yaw.current, request.power ?? 0.35),
          }
          useGameStore.getState().recordFootballAction('kick')
        }
      } else if (
        requestedFootballBall &&
        request?.type === 'football-skill' &&
        footballRuntime
      ) {
        const index = footballRuntime.current.findIndex(
          (ball) => ball.id === requestedFootballBall.id,
        )
        if (index >= 0) {
          footballRuntime.current[index] = beginFootballSkill(
            requestedFootballBall,
            [position.current.x, 0, position.current.z],
            performance.now(),
          )
          useGameStore.getState().recordFootballAction('skill')
          useGameStore.getState().setPlayerEmote('kickups')
        }
      } else if (requestedSeat || (!hasWorldRequest && seatToUse && !nearBed)) {
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
      const isKart = isGoKartId(currentVehicle.id)
      if (isKart) {
        tickKartRace(Date.now(), currentVehicle.position)
      }
      const raceStatus = useGameStore.getState().kartRace.status
      const remotePedestrians = Object.values(
        useLocalPartyStore.getState().remotePlayers,
      )
        .filter((player) => !player.interiorId && !player.kart)
        .map((player) => player.position)
      const remoteKarts = partyKartVehicles(
        useLocalPartyStore.getState().remotePlayers,
      )
      const vehicleObstacles = [
        ...collisionObstacles,
        ...trafficObstacles,
        ...drivableVehicleCollisionBoxes(remoteKarts),
        ...drivableVehicleCollisionBoxes(
          localDrivableVehicles,
          activeVehicleThisFrame,
        ),
        ...pedestrianCollisionBoxes([
          ...bots.map((bot) => bot.position),
          ...remotePedestrians,
        ]),
      ]
      const nextVehicle =
        isKart && (raceStatus === 'lobby' || raceStatus === 'countdown')
          ? { ...currentVehicle, speed: 0 }
          : advanceDrivableVehicleWithCollisions(
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
      if (isKart) tickKartRace(Date.now(), nextVehicle.position)
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
      const buddyRush = useGameStore.getState().buddyRush
      const buddyRushBoost = buddyRush.boostEndsAt > Date.now() ? 1.35 : 1
      const escortPenalty =
        buddyRush.activeRaid?.direction === 'raid' &&
        buddyRush.activeRaid.phase === 'chase'
          ? 0.85
          : 1
      const speed =
        playerMovementSpeed(inputRunning) * buddyRushBoost * escortPenalty
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
            localDrivableVehicles,
          )
        : undefined
    const promptFootballBall =
      !activeInterior && footballRuntime
        ? nearestFootballBall(
            [position.current.x, 0, position.current.z],
            footballRuntime.current,
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
    setNearbyFootballBall(
      worldActionsEnabled &&
        !activeVehicleThisFrame &&
        !seatedThisFrame &&
        !sleepingThisFrame &&
        promptFootballBall
        ? promptFootballBall.id
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
    if (
      shouldResetObbyFall(obby, [
        position.current.x,
        position.current.y,
        position.current.z,
      ])
    ) {
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
    const activeKart = isGoKartId(activeVehicleThisFrame)
    const drivenVehicle = activeVehicleThisFrame
      ? drivableRuntime?.current.find(
          (vehicle) => vehicle.id === activeVehicleThisFrame,
        )
      : undefined
    if (activeKart)
      cameraOrbitYaw.current *= Math.exp(-Math.min(delta, 0.1) * 2.8)
    const interiorZoom = THREE.MathUtils.clamp(
      settings.interiorCameraZoom ?? 1.3,
      0.85,
      1.85,
    )
    const cameraDistance = activeVehicleThisFrame
      ? activeKart
        ? mobile
          ? -9.5
          : -7.2
        : mobile
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
      ? activeKart
        ? mobile
          ? 4.8
          : 3.65
        : mobile
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
      (activeKart ? 1.05 : activeVehicleThisFrame ? 1.8 : 1.4) +
      cameraPitch.current * 1.1
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
      : activeKart
        ? 52 + Math.min(1, Math.abs(drivenVehicle?.speed ?? 0) / 18) * 10
        : 48
    if ('fov' in state.camera && Math.abs(state.camera.fov - targetFov) > 0.1) {
      state.camera.fov = targetFov
      state.camera.updateProjectionMatrix()
    }
    const kartLookAhead = activeKart
      ? 1.8 + Math.min(2.4, Math.abs(drivenVehicle?.speed ?? 0) * 0.12)
      : 0
    state.camera.lookAt(
      position.current.x + Math.sin(yaw.current) * kartLookAhead,
      position.current.y + lookHeight,
      position.current.z + Math.cos(yaw.current) * kartLookAhead,
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
          emote: seatedSeatId || activeVehicleThisFrame ? 'sit' : playerEmote,
          interiorId: activeInterior?.id,
          placedBlocks,
          savedFriends,
          kart:
            activeKart && drivenVehicle
              ? {
                  id: drivenVehicle.id,
                  position: [...drivenVehicle.position],
                  yaw: drivenVehicle.yaw,
                  speed: drivenVehicle.speed,
                }
              : undefined,
          kartRace: activeKart ? useGameStore.getState().kartRace : undefined,
        }),
      )
      lastPartyBroadcastAt.current = performance.now()
    }

    const groundPosition: Vec3 = [position.current.x, 0, position.current.z]
    const transitionReady =
      performance.now() - lastInteriorTransitionAt.current > 850
    if (activeVehicleThisFrame || seatedThisFrame || sleepingThisFrame) {
      setNearbyLocation(undefined)
      setNearbyFootballBall(undefined)
      return
    }
    if (activeInterior) {
      setNearbyLocation(undefined)
      setNearbyFootballBall(undefined)
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
      obby.active &&
      distance2d(groundPosition, [obbyFinish[0], 0, obbyFinish[2]]) <
        obbyFinishRadius &&
      Math.abs(position.current.y - obbyFinish[1]) < 0.9
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
      <AvatarTrail trail={avatar.trail} />
      <BlockAvatar
        bodyColor={avatar.bodyColor}
        shirtColor={avatar.shirtColor}
        hairColor={avatar.hairColor}
        hairStyle={avatar.hairStyle}
        pantsColor={avatar.pantsColor}
        eyeColor={avatar.eyeColor}
        accentColor={avatar.accentColor}
        secondaryColor={avatar.secondaryColor}
        topStyle={avatar.topStyle}
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
        rightHandItem={<EquippedLightSaber />}
      />
    </group>
  )
}

function AvatarTrail({ trail }: { trail: ShopItemId | 'none' }) {
  const group = useRef<THREE.Group>(null)
  const pieces = useMemo(() => avatarTrailPieces(trail), [trail])

  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.position.y = Math.sin(clock.elapsedTime * 3.8) * 0.025
    group.current.children.forEach((child, index) => {
      child.rotation.z += (index % 2 === 0 ? 1 : -1) * 0.006
    })
  })

  if (pieces.length === 0) return null

  return (
    <group ref={group} position={[0, 0.08, -0.08]}>
      {pieces.map((piece) => (
        <mesh
          key={piece.id}
          position={piece.position}
          rotation={piece.rotation}
        >
          {piece.kind === 'ribbon' ? (
            <boxGeometry args={piece.size} />
          ) : (
            <octahedronGeometry args={[piece.size[0], 0]} />
          )}
          <meshStandardMaterial
            color={piece.color}
            emissive={piece.emissive}
            emissiveIntensity={piece.kind === 'ribbon' ? 0.75 : 1.35}
            transparent
            opacity={piece.opacity}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  )
}

function drivableVehiclesAvailableLocally(
  vehicles: DrivableVehicle[],
  activeVehicleId?: string,
) {
  return vehicles.filter(
    (vehicle) => !isGoKartId(vehicle.id) || vehicle.id === activeVehicleId,
  )
}

function partyKartVehicles(
  remotePlayers: Record<string, LocalPartySnapshot>,
): DrivableVehicle[] {
  return Object.values(remotePlayers).flatMap((player) => {
    if (player.interiorId || !player.kart) return []
    const definition = getGoKart(player.kart.id)
    if (!definition) return []
    return [
      {
        ...definition,
        position: [...player.kart.position] as Vec3,
        yaw: player.kart.yaw,
        speed: player.kart.speed,
      },
    ]
  })
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
      {remotePlayers.map((player) =>
        player.kart ? (
          <LocalPartyKartAvatar key={player.id} player={player} />
        ) : (
          <LocalPartyAvatar key={player.id} player={player} />
        ),
      )}
    </>
  )
}

function LocalPartyKartAvatar({ player }: { player: LocalPartySnapshot }) {
  const group = useRef<THREE.Group>(null)
  const { selectedMessageTargetId, selectMessageTarget } =
    useMessageTargetSelection()
  const openMessageThread = useGameStore((state) => state.openMessageThread)
  const messageTargetId = `local-party:${player.id}`
  const isSelected = selectedMessageTargetId === messageTargetId
  const kart = player.kart
  const definition = kart ? getGoKart(kart.id) : undefined
  const targetPosition = useMemo(
    () => new THREE.Vector3(...(kart?.position ?? player.position)),
    [kart?.position, player.position],
  )

  useFrame((_, delta) => {
    if (!group.current || !kart) return
    const smoothing = 1 - Math.exp(-delta * 12)
    group.current.position.lerp(targetPosition, smoothing)
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      vehicleRenderYaw(kart.yaw),
      smoothing,
    )
  })

  if (!kart || !definition) return null
  const selectPlayer = () => selectMessageTarget(messageTargetId)

  return (
    <group
      ref={group}
      data-testid={`remote-go-kart-${player.id}`}
      position={kart.position}
      rotation={[0, vehicleRenderYaw(kart.yaw), 0]}
      onPointerDown={(event) => {
        event.stopPropagation()
        selectPlayer()
      }}
      onClick={(event) => {
        event.stopPropagation()
        selectPlayer()
      }}
    >
      <KartPiece color={definition.color} />
      <group
        position={[-0.18, 0.68, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.46}
      >
        <BlockAvatar
          bodyColor={player.avatar.bodyColor}
          shirtColor={player.avatar.shirtColor}
          hairColor={player.avatar.hairColor}
          hairStyle={player.avatar.hairStyle}
          pantsColor={player.avatar.pantsColor}
          eyeColor={player.avatar.eyeColor}
          accentColor={player.avatar.accentColor}
          secondaryColor={player.avatar.secondaryColor}
          topStyle={player.avatar.topStyle}
          outfitStyle={player.avatar.outfitStyle}
          bottomStyle={player.avatar.bottomStyle}
          shoeStyle={player.avatar.shoeStyle}
          shoeColor={player.avatar.shoeColor}
          accessory={player.avatar.accessory}
          face={player.avatar.face}
          username={player.name}
          hat={player.avatar.hat !== 'none'}
          showName={false}
          action="idle"
          emote="sit"
          isSelected={isSelected}
          onSelect={selectPlayer}
        />
      </group>
      <Html center position={[0, 1.75, 0]} zIndexRange={worldHtmlZIndexRange}>
        <span className="pointer-events-none select-none whitespace-nowrap rounded-full bg-slate-950/90 px-2.5 py-1 text-xs font-black text-white shadow">
          {player.name}
        </span>
      </Html>
      {isSelected ? (
        <FloatingMessageButton
          label={player.name}
          onOpen={() => openMessageThread(player.id, player.name)}
        />
      ) : null}
    </group>
  )
}

function LocalPartyAvatar({ player }: { player: LocalPartySnapshot }) {
  const group = useRef<THREE.Group>(null)
  const { selectedMessageTargetId, selectMessageTarget } =
    useMessageTargetSelection()
  const openMessageThread = useGameStore((state) => state.openMessageThread)
  const messageTargetId = `local-party:${player.id}`
  const isSelected = selectedMessageTargetId === messageTargetId
  const selectPlayer = () => selectMessageTarget(messageTargetId)
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
      onPointerDown={(event) => {
        event.stopPropagation()
        selectPlayer()
      }}
      onClick={(event) => {
        event.stopPropagation()
        selectPlayer()
      }}
    >
      <mesh
        position={[0, realScale.avatarHeight * 0.5, 0]}
        onPointerDown={(event) => {
          event.stopPropagation()
          selectPlayer()
        }}
      >
        <boxGeometry args={avatarSelectionHitboxSize} />
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
        topStyle={player.avatar.topStyle}
        outfitStyle={player.avatar.outfitStyle}
        bottomStyle={player.avatar.bottomStyle}
        shoeStyle={player.avatar.shoeStyle}
        shoeColor={player.avatar.shoeColor}
        accessory={player.avatar.accessory}
        face={player.avatar.face}
        username={player.name}
        hat={player.avatar.hat !== 'none'}
        action={player.action}
        emote={player.emote}
        isSelected={isSelected}
        onSelect={selectPlayer}
      />
      {isSelected ? (
        <FloatingMessageButton
          label={player.name}
          onOpen={openPlayerMessages}
        />
      ) : null}
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
  const group = useRef<THREE.Group>(null)
  const npcDrag = useNpcDrag()
  const { selectedMessageTargetId, selectMessageTarget } =
    useMessageTargetSelection()
  const openMessageThread = useGameStore((state) => state.openMessageThread)
  const messageTargetId = `bot:${bot.id}`
  const isSelected = selectedMessageTargetId === messageTargetId
  const selectBot = () => selectMessageTarget(messageTargetId)
  const openBotMessages = () => openMessageThread(bot.id)
  const jumpLift =
    bot.action === 'jump'
      ? Math.max(0, Math.sin(performance.now() / 170)) * 0.18
      : 0
  const dx = bot.target[0] - bot.position[0]
  const dz = bot.target[2] - bot.position[2]
  const yaw =
    bot.action === 'walk' || bot.action === 'run' ? Math.atan2(dx, dz) : 0
  const startBotDrag = (pointer: {
    pointerId: number
    clientX: number
    clientY: number
  }) =>
    npcDrag?.begin({
      kind: 'bot',
      id: bot.id,
      position: bot.position,
      ...pointer,
    })

  useFrame(() => {
    const preview = npcDrag?.previewFor('bot', bot.id)
    if (!group.current) return
    group.current.position.set(
      preview?.[0] ?? bot.position[0],
      avatarGroundOffset + (preview ? npcDragLift : jumpLift),
      preview?.[2] ?? bot.position[2],
    )
  })

  return (
    <group
      ref={group}
      position={[
        bot.position[0],
        avatarGroundOffset + jumpLift,
        bot.position[2],
      ]}
      rotation={[0, yaw, 0]}
      onPointerDown={(event) => {
        event.stopPropagation()
        selectBot()
        startBotDrag(event)
      }}
      onClick={(event) => {
        event.stopPropagation()
        selectBot()
      }}
      onPointerOver={() => npcDrag?.setHovering(true)}
      onPointerOut={() => npcDrag?.setHovering(false)}
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
        isSelected={isSelected}
        onSelect={selectBot}
        onDragStart={startBotDrag}
      />
      {bot.speech && bot.speechUntil > Date.now() ? (
        <Html center position={[0, 3.2, 0]} zIndexRange={worldHtmlZIndexRange}>
          <div className="max-w-40 rounded-lg bg-white px-3 py-2 text-center text-xs font-black text-slate-900 shadow">
            {bot.speech}
          </div>
        </Html>
      ) : null}
      {isSelected ? (
        <FloatingMessageButton label={username} onOpen={openBotMessages} />
      ) : null}
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

function RemoteSavedFriendPlayers() {
  const remotePlayerRecord = useLocalPartyStore((state) => state.remotePlayers)
  const remoteFriends = useMemo(
    () =>
      Object.values(remotePlayerRecord).flatMap((owner, ownerIndex) =>
        (owner.savedFriends ?? [])
          .filter((friend) => friend.inWorld)
          .map((friend, friendIndex) => ({
            ownerId: owner.id,
            friend,
            index: ownerIndex * 12 + friendIndex + 4,
          })),
      ),
    [remotePlayerRecord],
  )

  return (
    <>
      {remoteFriends.map(({ ownerId, friend, index }) => (
        <SavedFriendAvatar
          key={`${ownerId}:${friend.id}`}
          friend={friend}
          index={index}
          messageTargetId={`remote-friend:${ownerId}:${friend.id}`}
          messageThreadId={`local-party-friend:${ownerId}:${friend.id}`}
        />
      ))}
    </>
  )
}

function SavedFriendAvatar({
  friend,
  index,
  messageTargetId,
  messageThreadId,
}: {
  friend: Pick<
    SavedFriend,
    'id' | 'name' | 'avatar' | 'route' | 'position' | 'movement'
  >
  index: number
  messageTargetId?: string
  messageThreadId?: string
}) {
  const group = useRef<THREE.Group>(null)
  const npcDrag = useNpcDrag()
  const { selectedMessageTargetId, selectMessageTarget } =
    useMessageTargetSelection()
  const openMessageThread = useGameStore((state) => state.openMessageThread)
  const targetId = messageTargetId ?? `friend:${friend.id}`
  const threadId = messageThreadId ?? friend.id
  const isSelected = selectedMessageTargetId === targetId
  const canDrag = !messageTargetId
  const selectFriend = () => selectMessageTarget(targetId)
  const initialPosition = savedFriendPositionAt(friend, Date.now(), index)
  const startFriendDrag = (pointer: {
    pointerId: number
    clientX: number
    clientY: number
  }) => {
    if (!canDrag) return
    npcDrag?.begin({
      kind: 'saved-friend',
      id: friend.id,
      position: savedFriendPositionAt(friend, Date.now(), index),
      ...pointer,
    })
  }

  useFrame(() => {
    const preview = canDrag
      ? npcDrag?.previewFor('saved-friend', friend.id)
      : undefined
    if (preview && group.current) {
      group.current.position.set(
        preview[0],
        avatarGroundOffset + npcDragLift,
        preview[2],
      )
      group.current.visible = true
      return
    }
    const now = Date.now()
    const next = savedFriendPositionAt(friend, now, index)
    const previous = savedFriendPositionAt(friend, now - 32, index)
    if (!group.current) return
    group.current.position.set(next[0], avatarGroundOffset, next[2])
    const dx = next[0] - previous[0]
    const dz = next[2] - previous[2]
    if (Math.hypot(dx, dz) > 0.002)
      group.current.rotation.y = Math.atan2(dx, dz)
    const game = useGameStore.getState()
    const streamRadius = (game.settings.worldViewDistance + 1.5) * 36
    group.current.visible =
      Math.hypot(
        next[0] - game.playerPosition[0],
        next[2] - game.playerPosition[2],
      ) <= streamRadius
  })

  const openThread = () => openMessageThread(threadId, friend.name)

  return (
    <group
      ref={group}
      position={[initialPosition[0], avatarGroundOffset, initialPosition[2]]}
      onPointerDown={(event) => {
        event.stopPropagation()
        selectFriend()
        startFriendDrag(event)
      }}
      onClick={(event) => {
        event.stopPropagation()
        selectFriend()
      }}
      onPointerOver={() => {
        if (canDrag) npcDrag?.setHovering(true)
      }}
      onPointerOut={() => {
        if (canDrag) npcDrag?.setHovering(false)
      }}
    >
      <mesh
        position={[0, realScale.avatarHeight * 0.5, 0]}
        onPointerDown={(event) => {
          event.stopPropagation()
          selectFriend()
          startFriendDrag(event)
        }}
      >
        <boxGeometry args={avatarSelectionHitboxSize} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {friend.avatar.trail !== 'none' ? (
        <AvatarTrail trail={friend.avatar.trail} />
      ) : null}
      <BlockAvatar
        bodyColor={friend.avatar.bodyColor}
        shirtColor={friend.avatar.shirtColor}
        hairColor={friend.avatar.hairColor}
        hairStyle={friend.avatar.hairStyle}
        pantsColor={friend.avatar.pantsColor}
        eyeColor={friend.avatar.eyeColor}
        accentColor={friend.avatar.accentColor}
        secondaryColor={friend.avatar.secondaryColor}
        topStyle={friend.avatar.topStyle}
        outfitStyle={friend.avatar.outfitStyle}
        bottomStyle={friend.avatar.bottomStyle}
        shoeStyle={friend.avatar.shoeStyle}
        shoeColor={friend.avatar.shoeColor}
        accessory={friend.avatar.accessory}
        face={friend.avatar.face}
        username={friend.name}
        hat={friend.avatar.hat !== 'none'}
        action="walk"
        isSelected={isSelected}
        onSelect={selectFriend}
        onDragStart={canDrag ? startFriendDrag : undefined}
      />
      {isSelected ? (
        <FloatingMessageButton label={friend.name} onOpen={openThread} />
      ) : null}
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
  topStyle?: ShopItemId | 'none'
  outfitStyle?: AvatarOutfitStyle
  bottomStyle?: AvatarBottomStyle
  shoeStyle?: AvatarShoeStyle
  shoeColor?: string
  accessory?: ShopItemId | 'none' | string
  face?: AvatarFaceStyle | string
  username: string
  showName?: boolean
  hat?: boolean
  emote?: 'none' | 'wave' | 'cheer' | 'dance' | 'sit' | 'kickups' | 'sleep'
  action?: BotRuntime['action']
  isSelected?: boolean
  onSelect?: () => void
  onDragStart?: (pointer: {
    pointerId: number
    clientX: number
    clientY: number
  }) => void
  rightHandItem?: ReactNode
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
  topStyle = 'none',
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
  isSelected,
  onSelect,
  onDragStart,
  rightHandItem,
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
    const kickups = currentEmote === 'kickups'
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
    const kickLeg = kickups
      ? -0.95 + Math.sin(clock.elapsedTime * 14) * 0.18
      : 0
    const supportLeg = kickups ? Math.sin(clock.elapsedTime * 7) * 0.08 : 0

    if (body.current) {
      body.current.rotation.x = sleeping ? avatarSleepRotation[0] : 0
      body.current.rotation.y = sleeping ? avatarSleepRotation[1] : 0
      body.current.rotation.z = sleeping || kickups ? 0 : danceTilt
      body.current.position.y =
        avatarBodyBaseY +
        (sleeping
          ? 0.08
          : kickups
            ? Math.abs(Math.sin(clock.elapsedTime * 8)) * 0.045
            : currentAction === 'jump'
              ? 0.1
              : Math.abs(stride) * 0.025 + idle)
    }
    if (leftLeg.current) {
      leftLeg.current.rotation.x = sleeping
        ? 0
        : sitting
          ? -1.35
          : kickups
            ? kickLeg
            : stride
      leftLeg.current.rotation.z = sleeping || sitting ? 0 : sideStride
    }
    if (rightLeg.current) {
      rightLeg.current.rotation.x = sleeping
        ? 0
        : sitting
          ? -1.35
          : kickups
            ? supportLeg
            : -stride
      rightLeg.current.rotation.z = sleeping || sitting ? 0 : -sideStride
    }
    if (leftArm.current) {
      leftArm.current.rotation.x = sleeping
        ? -0.12
        : sitting
          ? -0.18
          : kickups
            ? -0.35
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
          : kickups
            ? 0.3
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
  const nameClassName = `whitespace-nowrap rounded bg-slate-950/80 px-2 py-1 text-xs font-black text-white shadow transition ${isSelected ? 'ring-2 ring-sky-300 ring-offset-2 ring-offset-slate-950/20' : ''}`
  return (
    <group position={[0, sitDrop, 0]}>
      {onSelect ? (
        <mesh
          position={avatarSelectionHitboxPosition}
          onPointerDown={(event) => {
            event.stopPropagation()
            onSelect()
            onDragStart?.(event)
          }}
          onClick={(event) => {
            event.stopPropagation()
            onSelect()
          }}
        >
          <boxGeometry args={avatarSelectionHitboxSize} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
      {showName && onSelect ? (
        <Html
          center
          position={[0, 1.28, 0]}
          zIndexRange={worldActionZIndexRange}
        >
          <button
            type="button"
            className={`bb-avatar-select-target ${onDragStart ? 'draggable' : ''}`}
            aria-label={`Select ${username}`}
            title={
              onDragStart
                ? `Drag ${username} to move them`
                : `Select ${username}`
            }
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onSelect()
              onDragStart?.(event)
            }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onSelect()
            }}
          >
            <span className={`bb-avatar-name-pill ${nameClassName}`}>
              {username}
            </span>
          </button>
        </Html>
      ) : null}
      {showName && !onSelect ? (
        <Html center position={[0, 2.15, 0]} zIndexRange={worldHtmlZIndexRange}>
          <span className={nameClassName}>{username}</span>
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
          topStyle={topStyle}
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
            accentColor={accentColor}
            topStyle={topStyle}
            outfitStyle={outfitStyle}
          />
        </group>
        <group ref={rightArm} position={[0.58, 1.45, 0]}>
          <AvatarArm
            bodyColor={bodyColor}
            shirtColor={shirtColor}
            accentColor={accentColor}
            topStyle={topStyle}
            outfitStyle={outfitStyle}
          />
          {rightHandItem ? (
            <group
              data-testid="right-hand-item-socket"
              position={lightSaberHandSocket.position}
              rotation={lightSaberHandSocket.rotation}
            >
              {rightHandItem}
            </group>
          ) : null}
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
          topStyle={topStyle}
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
  topStyle,
  outfitStyle,
  bottomStyle,
}: {
  bodyColor: string
  shirtColor: string
  accentColor: string
  secondaryColor: string
  topStyle: ShopItemId | 'none'
  outfitStyle: AvatarOutfitStyle
  bottomStyle: AvatarBottomStyle
}) {
  const torsoColor = outfitStyle === 'none' ? bodyColor : shirtColor
  const shadowOracle = topStyle === 'outfit-shadow-oracle'
  const shadowOraclePanelColors = {
    shirt: shirtColor,
    accent: accentColor,
    secondary: secondaryColor,
  }

  return (
    <group>
      <mesh castShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.82, 0.94, 0.38]} />
        <meshStandardMaterial
          color={shadowOracle ? bodyColor : torsoColor}
          roughness={0.7}
        />
      </mesh>
      {shadowOracle ? (
        <>
          <mesh castShadow position={[0, 1.22, 0.215]}>
            <boxGeometry args={[0.52, 0.38, 0.05]} />
            <meshStandardMaterial color={shirtColor} roughness={0.58} />
          </mesh>
          <mesh castShadow position={[0, 1.02, 0.222]}>
            <boxGeometry args={[0.56, 0.055, 0.055]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.5} />
          </mesh>
          <mesh
            castShadow
            position={[-0.13, 1.34, 0.255]}
            rotation={[0, 0, -0.52]}
          >
            <boxGeometry args={[0.1, 0.34, 0.045]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.56} />
          </mesh>
          <mesh
            castShadow
            position={[0.13, 1.34, 0.255]}
            rotation={[0, 0, 0.52]}
          >
            <boxGeometry args={[0.1, 0.34, 0.045]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.56} />
          </mesh>
          {shadowOracleRearPanels.map((panel) => (
            <mesh key={panel.id} castShadow position={panel.position}>
              <boxGeometry args={panel.size} />
              <meshStandardMaterial
                color={shadowOraclePanelColors[panel.material]}
                roughness={0.58}
              />
            </mesh>
          ))}
        </>
      ) : null}
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
          {shadowOracle ? (
            <>
              <mesh castShadow position={[-0.065, 1.08, 0.246]}>
                <boxGeometry args={[0.04, 0.78, 0.035]} />
                <meshStandardMaterial color={secondaryColor} roughness={0.52} />
              </mesh>
              <mesh castShadow position={[0.065, 1.08, 0.246]}>
                <boxGeometry args={[0.04, 0.78, 0.035]} />
                <meshStandardMaterial color={secondaryColor} roughness={0.52} />
              </mesh>
            </>
          ) : null}
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
        shadowOracle ? (
          <group>
            <mesh castShadow position={[0, 0.48, 0]}>
              <cylinderGeometry args={[0.45, 0.55, 0.36, 8]} />
              <meshStandardMaterial color={accentColor} roughness={0.7} />
            </mesh>
            {[-0.32, -0.16, 0, 0.16, 0.32].map((x) => (
              <mesh key={x} castShadow position={[x, 0.47, 0.39]}>
                <boxGeometry args={[0.035, 0.28, 0.035]} />
                <meshStandardMaterial color={secondaryColor} roughness={0.6} />
              </mesh>
            ))}
          </group>
        ) : (
          <mesh castShadow position={[0, 0.52, 0]}>
            <boxGeometry args={[0.94, 0.22, 0.44]} />
            <meshStandardMaterial color={accentColor} roughness={0.72} />
          </mesh>
        )
      ) : null}
    </group>
  )
}

function AvatarArm({
  bodyColor,
  shirtColor,
  accentColor,
  topStyle,
  outfitStyle,
}: {
  bodyColor: string
  shirtColor: string
  accentColor: string
  topStyle: ShopItemId | 'none'
  outfitStyle: AvatarOutfitStyle
}) {
  const shadowOracle = topStyle === 'outfit-shadow-oracle'
  const sleeveColor =
    outfitStyle === 'tank' || outfitStyle === 'none'
      ? bodyColor
      : shadowOracle
        ? accentColor
        : shirtColor
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
      {shadowOracle ? (
        <mesh castShadow position={[0, -0.41, 0.01]}>
          <boxGeometry args={[0.255, 0.08, 0.255]} />
          <meshStandardMaterial color="#c4b5fd" roughness={0.55} />
        </mesh>
      ) : null}
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
  topStyle,
}: {
  face: string
  eyeColor: string
  accentColor: string
  topStyle: ShopItemId | 'none'
}) {
  const cool = face === 'cool'
  const shadowOracle = topStyle === 'outfit-shadow-oracle'
  const sleepy = face === 'sleepy'
  const robot = face === 'robot'
  const surprised = face === 'surprised' || face === 'wow'

  return (
    <>
      {cool || shadowOracle ? (
        <group>
          <mesh castShadow position={[0, 1.97, 0.36]}>
            <boxGeometry
              args={[
                shadowOracle ? 0.58 : 0.52,
                shadowOracle ? 0.17 : 0.12,
                0.04,
              ]}
            />
            <meshStandardMaterial
              color={shadowOracle ? '#5b21b6' : '#111827'}
              roughness={0.5}
            />
          </mesh>
          {shadowOracle ? (
            <>
              <mesh castShadow position={[-0.17, 1.97, 0.39]}>
                <boxGeometry args={[0.15, 0.055, 0.025]} />
                <meshStandardMaterial color="#160b2b" roughness={0.4} />
              </mesh>
              <mesh castShadow position={[0.17, 1.97, 0.39]}>
                <boxGeometry args={[0.15, 0.055, 0.025]} />
                <meshStandardMaterial color="#160b2b" roughness={0.4} />
              </mesh>
            </>
          ) : null}
        </group>
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
    const petModel = petAccessoryModel(value, accentColor, secondaryColor)
    if (!petModel) return null
    return (
      <group position={petModel.position}>
        {petModel.parts.map((part) => (
          <PetAccessoryPartMesh key={part.id} part={part} />
        ))}
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

function PetAccessoryPartMesh({ part }: { part: PetAccessoryPart }) {
  return (
    <mesh
      castShadow
      position={part.position}
      rotation={part.rotation}
      scale={part.scale}
    >
      {part.shape === 'sphere' ? (
        <sphereGeometry args={[0.5, 12, 8]} />
      ) : (
        <boxGeometry args={[1, 1, 1]} />
      )}
      <meshStandardMaterial
        color={part.color}
        emissive={part.emissive}
        emissiveIntensity={part.emissiveIntensity ?? 0}
        roughness={0.58}
      />
    </mesh>
  )
}

function ObbyCourse() {
  const active = useGameStore((state) => state.obby.active)
  if (!active) return null

  return (
    <group>
      {obbyPlatforms.map((platform, index) => (
        <mesh
          key={`${platform.kind}-${index}-${platform.position.join(',')}`}
          castShadow
          receiveShadow
          position={platform.position}
          scale={platform.scale}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={obbyPlatformColor(platform)} />
        </mesh>
      ))}
      {obbyPlatforms
        .filter(
          (platform) =>
            platform.kind === 'checkpoint' || platform.kind === 'finish',
        )
        .map((platform) => (
          <group
            key={`marker-${platform.position.join(',')}`}
            position={[
              platform.position[0],
              platform.position[1] + platform.scale[1] / 2 + 0.7,
              platform.position[2],
            ]}
          >
            <mesh castShadow position={[0, 0.55, 0]}>
              <boxGeometry args={[0.08, 1.1, 0.08]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh castShadow position={[0.38, 1, 0]}>
              <boxGeometry args={[0.72, 0.38, 0.08]} />
              <meshStandardMaterial
                color={platform.kind === 'finish' ? '#22c55e' : '#facc15'}
              />
            </mesh>
            <Html
              center
              position={[0.38, 1.45, 0]}
              zIndexRange={worldHtmlZIndexRange}
            >
              <span className="rounded bg-slate-950 px-2 py-1 text-xs font-black text-white shadow">
                {platform.kind === 'finish' ? 'FINISH' : 'CHECKPOINT'}
              </span>
            </Html>
          </group>
        ))}
    </group>
  )
}

function obbyPlatformColor(platform: ObbyPlatform) {
  if (platform.kind === 'start') return '#3b82f6'
  if (platform.kind === 'checkpoint') return '#facc15'
  if (platform.kind === 'finish') return '#22c55e'
  if (platform.kind === 'beam') return '#f97316'
  return '#ef4444'
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

function staticTreeBlocksFootballPitch(position: Vec3) {
  return pointInFootballPitchClearance(
    position,
    buildPieceDimensions.tree.footprint / 2 + 0.45,
  )
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

function staticLampBlocksFootballPitch(position: Vec3) {
  return pointInFootballPitchClearance(
    position,
    buildPieceDimensions.lamp.footprint / 2 + 0.35,
  )
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
        args={[gridOverlay.size, gridOverlay.divisions, '#0ea5e9', '#93c5fd']}
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

function DoubleDeckerBusPiece({ color }: { color: string }) {
  const length = realScale.busLength
  const width = realScale.busWidth
  const height = trafficDoubleDeckerHeight
  const bodyBottom = realScale.wheelRadius * 0.72
  const bodyHeight = height - bodyBottom
  const deckHeight = bodyHeight / 2
  const windowHeight = deckHeight * 0.48
  const windowXs = [-0.34, -0.11, 0.12, 0.35].map((ratio) => ratio * length)
  const windowYs = [
    bodyBottom + deckHeight * 0.58,
    bodyBottom + deckHeight * 1.55,
  ]

  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        position={[0, bodyBottom + bodyHeight / 2, 0]}
      >
        <boxGeometry args={[length, bodyHeight, width]} />
        <meshStandardMaterial color={color} roughness={0.68} />
      </mesh>
      <mesh castShadow position={[0, height + 0.08, 0]}>
        <boxGeometry args={[length * 0.98, 0.16, width * 0.98]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.72} />
      </mesh>
      {windowYs.flatMap((y, row) =>
        [-1, 1].flatMap((side) =>
          windowXs.map((x, column) => (
            <mesh
              key={`bus-window-${row}-${side}-${column}`}
              position={[x, y, side * (width / 2 + 0.035)]}
            >
              <boxGeometry args={[length * 0.18, windowHeight, 0.07]} />
              <meshStandardMaterial
                color="#bae6fd"
                emissive="#7dd3fc"
                emissiveIntensity={0.08}
                roughness={0.42}
              />
            </mesh>
          )),
        ),
      )}
      {windowYs.map((y, row) => (
        <mesh
          key={`bus-windscreen-${row}`}
          position={[length / 2 + 0.04, y, 0]}
        >
          <boxGeometry args={[0.08, windowHeight, width * 0.72]} />
          <meshStandardMaterial
            color="#bfdbfe"
            emissive="#7dd3fc"
            emissiveIntensity={0.1}
            roughness={0.4}
          />
        </mesh>
      ))}
      <mesh position={[length / 2 + 0.085, height * 0.47, 0]}>
        <boxGeometry args={[0.09, 0.38, width * 0.68]} />
        <meshStandardMaterial
          color="#111827"
          emissive="#facc15"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh
        castShadow
        position={[
          length * 0.31,
          bodyBottom + deckHeight * 0.52,
          -width / 2 - 0.045,
        ]}
      >
        <boxGeometry args={[length * 0.16, deckHeight * 0.82, 0.09]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.48} />
      </mesh>
      {[-length * 0.34, length * 0.32].flatMap((x) =>
        [-width * 0.48, width * 0.48].map((z) => (
          <mesh
            key={`bus-wheel-${x}-${z}`}
            castShadow
            position={[x, realScale.wheelRadius, z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[
                realScale.wheelRadius * 1.18,
                realScale.wheelRadius * 1.18,
                width * 0.11,
                14,
              ]}
            />
            <meshStandardMaterial color="#111827" roughness={0.82} />
          </mesh>
        )),
      )}
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
