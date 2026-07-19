import {
  Flag,
  Building2,
  CarFront,
  CircleDot,
  GraduationCap,
  Hammer,
  House,
  Map as MapIcon,
  Navigation,
  ShoppingBag,
  Sparkles,
  Trees,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { activeMiniGameTarget } from '../ai/miniGameProgress'
import {
  getProceduralChunk,
  type ProceduralPiece,
} from '../data/proceduralWorld'
import { boundsToChunks, type WorldBounds } from '../data/worldCoordinates'
import {
  footballStadiumFootprint,
  worldFeaturesInBounds,
} from '../data/worldFeatures'
import { distance2d, worldLocations, type WorldLocation } from '../data/world'
import { footballPitch } from '../game/football'
import { realScale, unitsPerMeter } from '../game/scale'
import {
  centralAvenue,
  horizontalRoadCentersBetween,
  verticalRoadCentersBetween,
} from '../data/proceduralTownPlan'
import {
  authoredCoreBounds,
  coreTerrainZones,
  staticTownBuildings,
} from '../game/townPlacement'
import { parkingLot } from '../game/vehicles'
import type { LocationId, Vec3 } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { useLocalPartyStore } from '../state/localPartyStore'
import { miniMapPlayerRotation } from './miniMapMath'
import {
  fitWorldMapPoints,
  panWorldMap,
  pointIsInsideMap,
  visibleWorldBounds,
  worldMapPoint,
  zoomWorldMapAt,
  type WorldMapCamera,
  type WorldMapViewport,
} from './worldMapMath'

const locationIcons: Record<LocationId, LucideIcon> = {
  spawn: Sparkles,
  park: Trees,
  shop: ShoppingBag,
  school: GraduationCap,
  obby: Flag,
  houses: House,
  parking: CarFront,
  football: CircleDot,
  builder: Hammer,
  hall: Building2,
}

const shortLabels: Record<LocationId, string> = {
  spawn: 'Plaza',
  park: 'Park',
  shop: 'Shop',
  school: 'School',
  obby: 'Obby',
  houses: 'Homes',
  parking: 'Parking',
  football: 'Pitch',
  builder: 'Build',
  hall: 'Hall',
}

export function MapPanel() {
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const travelToLocation = useGameStore((state) => state.travelToLocation)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const playerYaw = useGameStore((state) => state.playerYaw)
  const activeInterior = useGameStore((state) => state.activeInterior)
  const nearbyLocation = useGameStore((state) => state.nearbyLocation)
  const obbyActive = useGameStore((state) => state.obby.active)
  const miniGameRunning = useGameStore(
    (state) => state.miniGame.status === 'running',
  )
  const miniGame = useGameStore((state) => state.miniGame)
  const savedFriends = useGameStore((state) => state.savedFriends)
  const remotePlayers = useLocalPartyStore((state) => state.remotePlayers)
  const [selectedId, setSelectedId] = useState<LocationId>(
    nearbyLocation ?? 'spawn',
  )
  const selected = useMemo(
    () =>
      worldLocations.find((location) => location.id === selectedId) ??
      worldLocations[0],
    [selectedId],
  )
  const mapPlayerPosition = activeInterior?.returnPosition ?? playerPosition
  const travelBlocked = obbyActive || miniGameRunning
  const activeTarget = activeMiniGameTarget(miniGame)
  const distanceMeters = Math.max(
    1,
    Math.round(
      distance2d(mapPlayerPosition, selected.travelPosition) / unitsPerMeter,
    ),
  )

  return (
    <div
      className="bb-map-overlay"
      role="presentation"
      onPointerDown={() => setOpenPanel(undefined)}
    >
      <section
        className="bb-map-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-map-title"
        data-testid="world-map-panel"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="bb-map-header">
          <div>
            <span className="bb-map-eyebrow">Fast Travel</span>
            <h2 id="world-map-title">
              <MapIcon size={24} aria-hidden />
              Town Map
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpenPanel(undefined)}
            aria-label="Close map"
            title="Close map"
          >
            <X size={22} aria-hidden />
          </button>
        </header>

        <div className="bb-map-content">
          <TownMap
            selectedId={selectedId}
            playerPosition={mapPlayerPosition}
            playerYaw={playerYaw}
            activeTarget={activeTarget}
            savedFriends={savedFriends}
            localPlayers={Object.values(remotePlayers).filter(
              (player) => !player.interiorId,
            )}
            onSelect={setSelectedId}
          />

          <nav className="bb-map-destinations" aria-label="Travel destinations">
            <div className="bb-map-destinations-heading">
              <strong>Choose a place</strong>
              <span>{worldLocations.length} destinations</span>
            </div>
            <div className="bb-map-destination-list">
              {worldLocations.map((location) => (
                <DestinationButton
                  key={location.id}
                  location={location}
                  selected={location.id === selectedId}
                  onSelect={setSelectedId}
                />
              ))}
            </div>
          </nav>
        </div>

        <footer className="bb-map-travel-bar">
          <div className="bb-map-travel-summary">
            <span
              className="bb-map-selected-icon"
              style={{ backgroundColor: selected.color }}
            >
              <SelectedIcon location={selected} size={21} />
            </span>
            <span>
              <strong>{selected.label}</strong>
              <small>
                {activeInterior
                  ? `Leave ${activeInterior.title} and travel`
                  : `${distanceMeters} m away`}{' '}
                - {selected.description}
              </small>
            </span>
          </div>
          <button
            type="button"
            className="bb-map-travel-button"
            disabled={travelBlocked}
            onClick={() => travelToLocation(selected.id)}
            aria-label={`Travel to ${selected.label}`}
          >
            <Navigation size={21} aria-hidden />
            <span>
              {travelBlocked
                ? 'Activity in progress'
                : `Travel to ${shortLabels[selected.id]}`}
            </span>
          </button>
          {travelBlocked ? (
            <p className="bb-map-travel-notice" role="status">
              {activeTarget
                ? `Active target: ${activeTarget.mapLabel ?? activeTarget.label}. Finish or cancel the active game before fast travel.`
                : 'Finish or cancel the active game before using fast travel.'}
            </p>
          ) : null}
        </footer>
      </section>
    </div>
  )
}

function TownMap({
  selectedId,
  playerPosition,
  playerYaw,
  activeTarget,
  savedFriends,
  localPlayers,
  onSelect,
}: {
  selectedId: LocationId
  playerPosition: Vec3
  playerYaw: number
  activeTarget?: {
    label: string
    mapLabel?: string
    position: Vec3
    kind?: string
  }
  savedFriends: {
    id: string
    name: string
    inWorld: boolean
    route: LocationId[]
  }[]
  localPlayers: { id: string; name: string; position: Vec3 }[]
  onSelect: (id: LocationId) => void
}) {
  const settings = useGameStore((state) => state.settings)
  const mapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const previousGesture = useRef<MapGesture | undefined>(undefined)
  const initialViewport = useMemo(() => ({ width: 640, height: 400 }), [])
  const [viewport, setViewport] = useState<WorldMapViewport>(initialViewport)
  const [camera, setCamera] = useState<WorldMapCamera>(() =>
    fitWorldMapPoints(
      worldLocations.map((location) => location.position),
      initialViewport,
    ),
  )
  const fittedToElement = useRef(false)

  useEffect(() => {
    const element = mapRef.current
    if (!element) return
    const measure = () => {
      const bounds = element.getBoundingClientRect()
      if (bounds.width < 1 || bounds.height < 1) return
      const nextViewport = { width: bounds.width, height: bounds.height }
      setViewport(nextViewport)
      if (!fittedToElement.current) {
        setCamera(
          fitWorldMapPoints(
            worldLocations.map((location) => location.position),
            nextViewport,
          ),
        )
        fittedToElement.current = true
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawInfiniteWorldMap(
      canvas,
      camera,
      viewport,
      settings.worldSeed || 'LONDON-2026',
    )
  }, [camera, settings.worldSeed, viewport])

  const markerStyle = useCallback(
    (position: Vec3) => {
      const point = worldMapPoint(position, camera, viewport)
      return {
        left: `${point.left}px`,
        top: `${point.top}px`,
        visibility: pointIsInsideMap(point, viewport, 34)
          ? ('visible' as const)
          : ('hidden' as const),
      }
    },
    [camera, viewport],
  )

  const updateGesture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const point = { x: event.clientX, y: event.clientY }
      pointers.current.set(event.pointerId, point)
      const nextGesture = mapGesture(pointers.current)
      const previous = previousGesture.current
      if (previous && nextGesture) {
        setCamera((current) => {
          let next = panWorldMap(current, {
            x: nextGesture.center.x - previous.center.x,
            y: nextGesture.center.y - previous.center.y,
          })
          if (previous.distance > 0 && nextGesture.distance > 0) {
            const bounds = event.currentTarget.getBoundingClientRect()
            next = zoomWorldMapAt(
              next,
              viewport,
              {
                x: nextGesture.center.x - bounds.left,
                y: nextGesture.center.y - bounds.top,
              },
              nextGesture.distance / previous.distance,
            )
          }
          return next
        })
      }
      previousGesture.current = nextGesture
    },
    [viewport],
  )

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    previousGesture.current = mapGesture(pointers.current)
  }

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    event.preventDefault()
    updateGesture(event)
  }

  const pointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    previousGesture.current = mapGesture(pointers.current)
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const wheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    setCamera((current) =>
      zoomWorldMapAt(
        current,
        viewport,
        { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
        Math.exp(-event.deltaY * 0.0014),
      ),
    )
  }

  const zoomAtCenter = (scale: number) =>
    setCamera((current) =>
      zoomWorldMapAt(
        current,
        viewport,
        { x: viewport.width / 2, y: viewport.height / 2 },
        scale,
      ),
    )

  return (
    <div
      ref={mapRef}
      className="bb-town-map"
      aria-label="Draggable BlockBuddies world map"
      data-testid="town-map"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      onWheel={wheel}
    >
      <canvas ref={canvasRef} className="bb-world-map-canvas" aria-hidden />
      <div
        className="bb-world-map-controls"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => zoomAtCenter(1.35)}
          aria-label="Zoom map in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomAtCenter(1 / 1.35)}
          aria-label="Zoom map out"
        >
          -
        </button>
        <button
          type="button"
          onClick={() =>
            setCamera((current) => ({
              ...current,
              centerX: playerPosition[0],
              centerZ: playerPosition[2],
              pixelsPerUnit: Math.max(4, current.pixelsPerUnit),
            }))
          }
          aria-label="Centre map on player"
        >
          <Navigation size={15} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() =>
            setCamera(
              fitWorldMapPoints(
                worldLocations.map((location) => location.position),
                viewport,
              ),
            )
          }
          aria-label="Show all destinations"
        >
          <MapIcon size={15} aria-hidden />
        </button>
      </div>
      <span className="bb-world-map-coordinate">
        X {Math.round(camera.centerX)} / Z {Math.round(camera.centerZ)}
      </span>
      {worldLocations.map((location) => {
        const Icon = locationIcons[location.id]
        return (
          <button
            key={location.id}
            type="button"
            className={`bb-town-map-marker ${selectedId === location.id ? 'selected' : ''}`}
            style={{
              ...markerStyle(location.position),
              backgroundColor: location.color,
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onSelect(location.id)}
            aria-label={`Select ${location.label}`}
            aria-pressed={selectedId === location.id}
            data-testid={`map-marker-${location.id}`}
          >
            <Icon size={16} aria-hidden />
            <span>{shortLabels[location.id]}</span>
          </button>
        )
      })}
      <span
        className="bb-town-map-player"
        style={{
          ...markerStyle(playerPosition),
          transform: `translate(-50%, -50%) rotate(${miniMapPlayerRotation(playerYaw)}rad)`,
        }}
        title="You are here"
        aria-label="Your current position"
      />
      {savedFriends
        .filter((friend) => friend.inWorld)
        .map((friend, index) => (
          <span
            key={friend.id}
            className="bb-town-map-friend saved"
            style={markerStyle(friendMapPosition(friend.route, index))}
            title={friend.name}
          />
        ))}
      {localPlayers.map((player) => (
        <span
          key={player.id}
          className="bb-town-map-friend local"
          style={markerStyle(player.position)}
          title={player.name}
        />
      ))}
      {activeTarget ? (
        <span
          className={`bb-town-map-objective ${activeTarget.kind ?? 'dropoff'}`}
          style={markerStyle(activeTarget.position)}
          data-testid="town-map-objective"
          title={activeTarget.mapLabel ?? activeTarget.label}
        >
          {activeTarget.mapLabel ?? activeTarget.label}
        </span>
      ) : null}
      <span className="bb-town-map-key">
        <span /> Drag to explore / pinch or wheel to zoom
      </span>
    </div>
  )
}

type MapGesture = {
  center: { x: number; y: number }
  distance: number
}

function mapGesture(
  points: Map<number, { x: number; y: number }>,
): MapGesture | undefined {
  const items = [...points.values()]
  if (items.length === 0) return undefined
  if (items.length === 1) return { center: items[0]!, distance: 0 }
  const first = items[0]!
  const second = items[1]!
  return {
    center: {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    },
    distance: Math.hypot(second.x - first.x, second.y - first.y),
  }
}

function drawInfiniteWorldMap(
  canvas: HTMLCanvasElement,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
  seed: string,
) {
  if (canvas.ownerDocument.defaultView?.navigator.userAgent.includes('jsdom'))
    return
  let context: CanvasRenderingContext2D | null = null
  try {
    context = canvas.getContext('2d')
  } catch {
    return
  }
  if (!context) return
  const pixelRatio = Math.min(2, window.devicePixelRatio || 1)
  const width = Math.max(1, Math.round(viewport.width * pixelRatio))
  const height = Math.max(1, Math.round(viewport.height * pixelRatio))
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, viewport.width, viewport.height)
  context.fillStyle = '#55c96d'
  context.fillRect(0, 0, viewport.width, viewport.height)

  const bounds = visibleWorldBounds(camera, viewport)
  drawMapChunkGrounds(context, camera, viewport, bounds)
  drawMapFeatureAreas(context, camera, viewport, bounds)
  drawMapRoadBackbone(context, camera, viewport, bounds)

  const chunks = boundsToChunks(bounds, 1).sort((a, b) => {
    const aDistance = Math.hypot(
      a.cx * 36 + 18 - camera.centerX,
      a.cz * 36 + 18 - camera.centerZ,
    )
    const bDistance = Math.hypot(
      b.cx * 36 + 18 - camera.centerX,
      b.cz * 36 + 18 - camera.centerZ,
    )
    return aDistance - bDistance
  })
  if (camera.pixelsPerUnit >= 1.55 && chunks.length <= 100) {
    chunks.slice(0, 81).forEach(({ cx, cz }) => {
      const chunk = getProceduralChunk(seed, cx, cz, false)
      chunk.pieces.forEach((piece) =>
        drawProceduralMapPiece(context!, camera, viewport, piece),
      )
    })
  }

  drawAuthoredMapLayers(context, camera, viewport)
  drawMapChunkGrid(context, camera, viewport, bounds)
}

function drawMapChunkGrounds(
  context: CanvasRenderingContext2D,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
  bounds: WorldBounds,
) {
  if (camera.pixelsPerUnit < 1.15) return
  boundsToChunks(bounds).forEach(({ cx, cz }) => {
    if ((Math.abs(cx + cz) & 1) === 0) return
    fillWorldRect(
      context,
      camera,
      viewport,
      cx * 36 + 18,
      cz * 36 + 18,
      36,
      36,
      'rgba(255,255,255,0.035)',
    )
  })
}

function drawMapFeatureAreas(
  context: CanvasRenderingContext2D,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
  bounds: WorldBounds,
) {
  worldFeaturesInBounds(bounds).forEach((feature) => {
    const width = feature.bounds.maxX - feature.bounds.minX
    const depth = feature.bounds.maxZ - feature.bounds.minZ
    fillWorldRect(
      context,
      camera,
      viewport,
      (feature.bounds.minX + feature.bounds.maxX) / 2,
      (feature.bounds.minZ + feature.bounds.maxZ) / 2,
      width,
      depth,
      feature.id === 'football-stadium'
        ? 'rgba(21,128,61,0.66)'
        : feature.id === 'central-buddy-town'
          ? 'rgba(134,239,172,0.23)'
          : 'rgba(255,255,255,0.08)',
    )
  })
}

function drawMapRoadBackbone(
  context: CanvasRenderingContext2D,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
  bounds: WorldBounds,
) {
  const roadColor = '#718096'
  verticalRoadCentersBetween(bounds.minX, bounds.maxX).forEach((roadX) =>
    fillWorldRect(
      context,
      camera,
      viewport,
      roadX,
      (bounds.minZ + bounds.maxZ) / 2,
      realScale.roadTile,
      bounds.maxZ - bounds.minZ,
      roadColor,
    ),
  )
  horizontalRoadCentersBetween(bounds.minZ, bounds.maxZ).forEach((roadZ) =>
    fillWorldRect(
      context,
      camera,
      viewport,
      (bounds.minX + bounds.maxX) / 2,
      roadZ,
      bounds.maxX - bounds.minX,
      realScale.roadTile,
      roadColor,
    ),
  )
  if (
    bounds.maxX >= centralAvenue.centerX - realScale.roadTile / 2 &&
    bounds.minX <= centralAvenue.centerX + realScale.roadTile / 2
  ) {
    const minZ = Math.max(bounds.minZ, centralAvenue.minZ)
    const maxZ = Math.min(bounds.maxZ, centralAvenue.maxZ)
    if (maxZ > minZ)
      fillWorldRect(
        context,
        camera,
        viewport,
        centralAvenue.centerX,
        (minZ + maxZ) / 2,
        realScale.roadTile,
        maxZ - minZ,
        roadColor,
      )
  }
}

function drawProceduralMapPiece(
  context: CanvasRenderingContext2D,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
  piece: ProceduralPiece,
) {
  if (
    piece.kind === 'ground' ||
    piece.kind === 'window' ||
    piece.kind === 'door' ||
    piece.kind === 'roof' ||
    piece.kind === 'line' ||
    piece.kind === 'lamp-light'
  )
    return
  const color = mapPieceColor(piece)
  if (!color) return
  if (piece.kind === 'tree-top' || piece.kind === 'lamp-post') {
    const point = worldMapPoint(piece.position, camera, viewport)
    const radius = Math.max(
      piece.kind === 'lamp-post' ? 1.5 : 2,
      (Math.max(piece.scale[0], piece.scale[2]) * camera.pixelsPerUnit) / 2,
    )
    context.beginPath()
    context.arc(point.left, point.top, radius, 0, Math.PI * 2)
    context.fillStyle = color
    context.fill()
    return
  }
  const rotated = Math.abs(Math.sin(piece.rotation?.[1] ?? 0)) > 0.7
  fillWorldRect(
    context,
    camera,
    viewport,
    piece.position[0],
    piece.position[2],
    rotated ? piece.scale[2] : piece.scale[0],
    rotated ? piece.scale[0] : piece.scale[2],
    color,
  )
}

function mapPieceColor(piece: ProceduralPiece) {
  if (piece.kind === 'road') return '#718096'
  if (piece.kind === 'pavement') return '#dbe2ea'
  if (piece.kind === 'park') return '#27ae60'
  if (piece.kind === 'building' || piece.kind === 'landmark') return piece.color
  if (piece.kind === 'tree-top') return '#08783d'
  if (piece.kind === 'tree-trunk') return '#7c4a21'
  if (piece.kind === 'lamp-post') return '#facc15'
  if (piece.kind === 'phone-box') return '#dc2626'
  if (piece.kind === 'water') return '#38bdf8'
  return undefined
}

function drawAuthoredMapLayers(
  context: CanvasRenderingContext2D,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
) {
  fillWorldBounds(
    context,
    camera,
    viewport,
    authoredCoreBounds,
    'rgba(126,227,111,0.32)',
  )
  const terrainPriority = { park: 0, sidewalk: 1, road: 2 }
  ;[...coreTerrainZones]
    .sort((a, b) => terrainPriority[a.terrain] - terrainPriority[b.terrain])
    .forEach((zone) =>
      fillWorldRect(
        context,
        camera,
        viewport,
        zone.center[0],
        zone.center[2],
        zone.size[0],
        zone.size[2],
        zone.terrain === 'road'
          ? '#718096'
          : zone.terrain === 'sidewalk'
            ? '#dbe2ea'
            : '#27ae60',
      ),
    )
  staticTownBuildings.forEach((building) =>
    fillWorldRect(
      context,
      camera,
      viewport,
      building.position[0],
      building.position[2],
      building.scale[0],
      building.scale[2],
      building.color,
    ),
  )
  fillWorldRect(
    context,
    camera,
    viewport,
    parkingLot.center[0],
    parkingLot.center[2],
    parkingLot.width,
    parkingLot.depth,
    '#94a3b8',
  )
  fillWorldRect(
    context,
    camera,
    viewport,
    footballPitch.center[0],
    footballPitch.center[2],
    footballStadiumFootprint.width,
    footballStadiumFootprint.depth,
    '#15803d',
  )
  fillWorldRect(
    context,
    camera,
    viewport,
    footballPitch.center[0],
    footballPitch.center[2],
    footballPitch.width,
    footballPitch.length,
    '#22c55e',
  )
}

function drawMapChunkGrid(
  context: CanvasRenderingContext2D,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
  bounds: WorldBounds,
) {
  if (camera.pixelsPerUnit < 1.2) return
  context.strokeStyle = 'rgba(15,23,42,0.16)'
  context.lineWidth = 1
  boundsToChunks(bounds).forEach(({ cx, cz }) => {
    const topLeft = worldMapPoint([cx * 36, 0, (cz + 1) * 36], camera, viewport)
    context.strokeRect(
      topLeft.left,
      topLeft.top,
      36 * camera.pixelsPerUnit,
      36 * camera.pixelsPerUnit,
    )
  })
}

function fillWorldBounds(
  context: CanvasRenderingContext2D,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
  bounds: WorldBounds,
  color: string,
) {
  fillWorldRect(
    context,
    camera,
    viewport,
    (bounds.minX + bounds.maxX) / 2,
    (bounds.minZ + bounds.maxZ) / 2,
    bounds.maxX - bounds.minX,
    bounds.maxZ - bounds.minZ,
    color,
  )
}

function fillWorldRect(
  context: CanvasRenderingContext2D,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
  centerX: number,
  centerZ: number,
  width: number,
  depth: number,
  color: string,
) {
  const center = worldMapPoint([centerX, 0, centerZ], camera, viewport)
  context.fillStyle = color
  context.fillRect(
    center.left - (width * camera.pixelsPerUnit) / 2,
    center.top - (depth * camera.pixelsPerUnit) / 2,
    width * camera.pixelsPerUnit,
    depth * camera.pixelsPerUnit,
  )
}

function friendMapPosition(route: LocationId[], index: number): Vec3 {
  const routeIds = route.length ? route : ['spawn']
  const location =
    worldLocations.find(
      (entry) => entry.id === routeIds[index % routeIds.length],
    ) ?? worldLocations[0]
  const offset = (index % 4) * 0.9
  return [location.position[0] + offset, 0, location.position[2] - offset]
}

function DestinationButton({
  location,
  selected,
  onSelect,
}: {
  location: WorldLocation
  selected: boolean
  onSelect: (id: LocationId) => void
}) {
  const Icon = locationIcons[location.id]
  return (
    <button
      type="button"
      className={`bb-map-destination ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(location.id)}
      aria-pressed={selected}
    >
      <span style={{ backgroundColor: location.color }}>
        <Icon size={18} aria-hidden />
      </span>
      <strong>{location.label}</strong>
    </button>
  )
}

function SelectedIcon({
  location,
  size,
}: {
  location: WorldLocation
  size: number
}) {
  const Icon = locationIcons[location.id]
  return <Icon size={size} aria-hidden />
}
