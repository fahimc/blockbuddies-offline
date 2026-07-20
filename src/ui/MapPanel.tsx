import {
  Flag,
  Building2,
  CarFront,
  CircleDot,
  Gauge,
  GraduationCap,
  Hammer,
  House,
  Map as MapIcon,
  MapPin,
  Move,
  Navigation,
  ShoppingBag,
  Sparkles,
  Trees,
  UserRound,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
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
import { goKartVehicleDefinitions } from '../game/goKart'
import type { LocationId, SavedFriend, Vec3 } from '../game/types'
import {
  savedFriendIsMoving,
  savedFriendPositionAt,
  snapSavedFriendDestination,
} from '../game/savedFriendMovement'
import { useGameStore } from '../state/gameStore'
import { useLocalPartyStore } from '../state/localPartyStore'
import { miniMapPlayerRotation } from './miniMapMath'
import {
  fitWorldMapPoints,
  normalizeWorldMapCamera,
  panWorldMap,
  pointIsInsideMap,
  visibleWorldBounds,
  worldPointAtMapPixel,
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
  kart: Gauge,
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
  kart: 'Karts',
  builder: 'Build',
  hall: 'Hall',
}

export function MapPanel() {
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const setTouch = useGameStore((state) => state.setTouch)
  const travelToLocation = useGameStore((state) => state.travelToLocation)
  const setActiveVehicle = useGameStore((state) => state.setActiveVehicle)
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
  const moveSavedFriend = useGameStore((state) => state.moveSavedFriend)
  const teleportSavedFriend = useGameStore((state) => state.teleportSavedFriend)
  const remotePlayers = useLocalPartyStore((state) => state.remotePlayers)
  const quickPlayKart = goKartVehicleDefinitions.find(
    (kart) =>
      !Object.values(remotePlayers).some(
        (player) => player.kart?.id === kart.id,
      ),
  )
  const [selectedId, setSelectedId] = useState<LocationId>(
    nearbyLocation ?? 'spawn',
  )
  const [selectedFriendId, setSelectedFriendId] = useState<string>()
  const [friendTarget, setFriendTarget] = useState<Vec3>()
  const selected = useMemo(
    () =>
      worldLocations.find((location) => location.id === selectedId) ??
      worldLocations[0],
    [selectedId],
  )
  const mapPlayerPosition = activeInterior?.returnPosition ?? playerPosition
  const selectedFriend = savedFriends.find(
    (friend) => friend.id === selectedFriendId,
  )
  const travelBlocked = obbyActive || miniGameRunning
  const activeTarget = activeMiniGameTarget(miniGame)
  const distanceMeters = Math.max(
    1,
    Math.round(
      distance2d(mapPlayerPosition, selected.travelPosition) / unitsPerMeter,
    ),
  )
  const friendTargetName = friendTarget
    ? worldLocations.find(
        (location) => distance2d(location.travelPosition, friendTarget) < 0.75,
      )?.label
    : undefined

  useEffect(() => {
    if (selectedFriendId && !selectedFriend) {
      setSelectedFriendId(undefined)
      setFriendTarget(undefined)
    }
  }, [selectedFriend, selectedFriendId])

  const selectLocation = (id: LocationId) => {
    setSelectedId(id)
    if (!selectedFriendId) return
    const location = worldLocations.find((entry) => entry.id === id)
    if (location)
      setFriendTarget(snapSavedFriendDestination(location.travelPosition))
  }

  const selectFriend = (friend: SavedFriend) => {
    setSelectedFriendId(friend.id)
    setFriendTarget(snapSavedFriendDestination(selected.travelPosition))
  }

  const resetGameplayInput = useCallback(
    () =>
      setTouch({
        x: 0,
        y: 0,
        lookX: 0,
        lookY: 0,
        jump: false,
        interact: false,
        run: false,
      }),
    [setTouch],
  )

  const closeMap = () => {
    resetGameplayInput()
    setOpenPanel(undefined)
  }

  const travelOrPlay = () => {
    if (selected.id !== 'kart') {
      travelToLocation(selected.id)
      return
    }
    if (!quickPlayKart || !travelToLocation('kart')) return
    setActiveVehicle(quickPlayKart.id)
  }

  useEffect(() => {
    resetGameplayInput()
    return resetGameplayInput
  }, [resetGameplayInput])

  return (
    <div
      className="bb-map-overlay"
      role="presentation"
      onPointerDown={closeMap}
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
            <span className="bb-map-eyebrow">Travel & character commands</span>
            <h2 id="world-map-title">
              <MapIcon size={24} aria-hidden />
              Town Map
            </h2>
          </div>
          <button
            type="button"
            onClick={closeMap}
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
            selectedFriendId={selectedFriendId}
            friendTarget={friendTarget}
            onSelect={selectLocation}
            onSelectFriend={(id) => {
              const friend = savedFriends.find((entry) => entry.id === id)
              if (friend) selectFriend(friend)
            }}
            onSetFriendTarget={setFriendTarget}
          />

          <nav className="bb-map-destinations" aria-label="Travel destinations">
            <div className="bb-map-characters">
              <div className="bb-map-destinations-heading">
                <strong>Your characters</strong>
                <span>{savedFriends.length || 'None yet'}</span>
              </div>
              {savedFriends.length ? (
                <div className="bb-map-character-list">
                  {savedFriends.map((friend) => (
                    <button
                      key={friend.id}
                      type="button"
                      className={
                        selectedFriendId === friend.id ? 'selected' : undefined
                      }
                      onClick={() => selectFriend(friend)}
                      aria-pressed={selectedFriendId === friend.id}
                      aria-label={`Select ${friend.name} on map`}
                    >
                      <span
                        style={{ backgroundColor: friend.avatar.shirtColor }}
                      >
                        <UserRound size={15} aria-hidden />
                      </span>
                      <strong>{friend.name}</strong>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="bb-map-character-empty">
                  Make a character in Friends to command them here.
                </p>
              )}
            </div>
            <div className="bb-map-destinations-heading">
              <strong>
                {selectedFriend ? 'Choose their target' : 'Choose a place'}
              </strong>
              <span>{worldLocations.length} destinations</span>
            </div>
            <div className="bb-map-destination-list">
              {worldLocations.map((location) => (
                <DestinationButton
                  key={location.id}
                  location={location}
                  selected={location.id === selectedId}
                  onSelect={selectLocation}
                />
              ))}
            </div>
          </nav>
        </div>

        <footer
          className={`bb-map-travel-bar ${selectedFriend ? 'character-mode' : ''}`}
        >
          {selectedFriend ? (
            <>
              <div className="bb-map-travel-summary">
                <span
                  className="bb-map-selected-icon"
                  style={{ backgroundColor: selectedFriend.avatar.shirtColor }}
                >
                  <UserRound size={21} aria-hidden />
                </span>
                <span>
                  <strong>{selectedFriend.name}</strong>
                  <small>
                    {friendTarget
                      ? `Target: ${friendTargetName ?? `X ${friendTarget[0]}, Z ${friendTarget[2]}`}`
                      : 'Tap anywhere on the map or choose a place'}
                  </small>
                </span>
              </div>
              <div className="bb-map-character-actions">
                <button
                  type="button"
                  className="bb-map-walk-button"
                  disabled={!friendTarget}
                  onClick={() =>
                    friendTarget &&
                    moveSavedFriend(selectedFriend.id, friendTarget)
                  }
                  aria-label={`Send ${selectedFriend.name} walking to target`}
                >
                  <Move size={18} aria-hidden /> Walk there
                </button>
                <button
                  type="button"
                  className="bb-map-teleport-button"
                  disabled={!friendTarget}
                  onClick={() =>
                    friendTarget &&
                    teleportSavedFriend(selectedFriend.id, friendTarget)
                  }
                  aria-label={`Teleport ${selectedFriend.name} to target`}
                >
                  <Zap size={18} aria-hidden /> Teleport
                </button>
                <button
                  type="button"
                  className="bb-map-character-done"
                  onClick={() => {
                    setSelectedFriendId(undefined)
                    setFriendTarget(undefined)
                  }}
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
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
                disabled={
                  travelBlocked || (selected.id === 'kart' && !quickPlayKart)
                }
                onClick={travelOrPlay}
                aria-label={
                  selected.id === 'kart'
                    ? 'Play Go Karts'
                    : `Travel to ${selected.label}`
                }
              >
                <Navigation size={21} aria-hidden />
                <span>
                  {travelBlocked
                    ? 'Activity in progress'
                    : selected.id === 'kart' && !quickPlayKart
                      ? 'All karts in use'
                      : selected.id === 'kart'
                        ? 'Play Go Karts'
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
            </>
          )}
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
  selectedFriendId,
  friendTarget,
  onSelect,
  onSelectFriend,
  onSetFriendTarget,
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
  savedFriends: SavedFriend[]
  localPlayers: { id: string; name: string; position: Vec3 }[]
  selectedFriendId?: string
  friendTarget?: Vec3
  onSelect: (id: LocationId) => void
  onSelectFriend: (id: string) => void
  onSetFriendTarget: (target: Vec3) => void
}) {
  const settings = useGameStore((state) => state.settings)
  const mapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const previousGesture = useRef<MapGesture | undefined>(undefined)
  const pointerStarts = useRef(new Map<number, { x: number; y: number }>())
  const draggedPointers = useRef(new Set<number>())
  const initialViewport = useMemo(() => ({ width: 640, height: 400 }), [])
  const [viewport, setViewport] = useState<WorldMapViewport>(initialViewport)
  const [camera, setCamera] = useState<WorldMapCamera>(() =>
    fitWorldMapPoints(
      worldLocations.map((location) => location.position),
      initialViewport,
    ),
  )
  const fittedToElement = useRef(false)
  const [friendClock, setFriendClock] = useState(() => Date.now())
  const friendPositions = useMemo(
    () =>
      savedFriends
        .filter((friend) => friend.inWorld)
        .map((friend, index) => ({
          friend,
          position: savedFriendPositionAt(friend, friendClock, index),
        })),
    // The small clock update is intentionally the shared animation cadence for
    // the DOM map; the 3D scene interpolates the same command every frame.
    [savedFriends, friendClock],
  )

  useEffect(() => {
    const isWalking = (now: number) =>
      savedFriends.some(
        (friend, index) =>
          friend.inWorld && savedFriendIsMoving(friend, now, index),
      )
    if (!isWalking(Date.now())) return
    const interval = window.setInterval(() => {
      const now = Date.now()
      setFriendClock(now)
      if (!isWalking(now)) window.clearInterval(interval)
    }, 180)
    return () => window.clearInterval(interval)
  }, [savedFriends])

  useEffect(() => {
    if (!selectedFriendId) return
    const selectedIndex = savedFriends.findIndex(
      (friend) => friend.id === selectedFriendId,
    )
    const friend = savedFriends[selectedIndex]
    if (!friend) return
    const position = savedFriendPositionAt(friend, Date.now(), selectedIndex)
    setCamera((current) => ({
      ...current,
      centerX: position[0],
      centerZ: position[2],
      pixelsPerUnit: Math.max(4, current.pixelsPerUnit),
    }))
  }, [savedFriends, selectedFriendId])

  const resetMapPointers = useCallback(() => {
    const element = mapRef.current
    if (element)
      pointers.current.forEach((_, pointerId) =>
        safeReleasePointerCapture(element, pointerId),
      )
    pointers.current.clear()
    pointerStarts.current.clear()
    draggedPointers.current.clear()
    previousGesture.current = undefined
  }, [])

  useEffect(() => {
    const element = mapRef.current
    if (!element) return
    const preventNativeGesture = (event: Event) => event.preventDefault()
    const resetWhenHidden = () => {
      if (document.visibilityState !== 'visible') resetMapPointers()
    }
    element.addEventListener('gesturestart', preventNativeGesture, {
      passive: false,
    })
    element.addEventListener('gesturechange', preventNativeGesture, {
      passive: false,
    })
    element.addEventListener('gestureend', preventNativeGesture, {
      passive: false,
    })
    window.addEventListener('blur', resetMapPointers)
    document.addEventListener('visibilitychange', resetWhenHidden)
    return () => {
      element.removeEventListener('gesturestart', preventNativeGesture)
      element.removeEventListener('gesturechange', preventNativeGesture)
      element.removeEventListener('gestureend', preventNativeGesture)
      window.removeEventListener('blur', resetMapPointers)
      document.removeEventListener('visibilitychange', resetWhenHidden)
      resetMapPointers()
    }
  }, [resetMapPointers])

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
      if (!pointerPointIsFinite(point)) {
        removeMapPointer(
          event.pointerId,
          event.currentTarget,
          pointers,
          pointerStarts,
          draggedPointers,
          previousGesture,
        )
        return
      }
      pointers.current.set(event.pointerId, point)
      const nextGesture = mapGesture(pointers.current)
      const previous = previousGesture.current
      if (previous && nextGesture) {
        const zoom =
          previous.distance > 0 && nextGesture.distance > 0
            ? (() => {
                const bounds = event.currentTarget.getBoundingClientRect()
                return {
                  pixel: {
                    x: nextGesture.center.x - bounds.left,
                    y: nextGesture.center.y - bounds.top,
                  },
                  scale: nextGesture.distance / previous.distance,
                }
              })()
            : undefined
        setCamera((current) => {
          let next = panWorldMap(current, {
            x: nextGesture.center.x - previous.center.x,
            y: nextGesture.center.y - previous.center.y,
          })
          if (zoom)
            next = zoomWorldMapAt(next, viewport, zoom.pixel, zoom.scale)
          return normalizeWorldMapCamera(next, current)
        })
      }
      previousGesture.current = nextGesture
    },
    [viewport],
  )

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = { x: event.clientX, y: event.clientY }
    if (!pointerPointIsFinite(point)) return
    event.preventDefault()
    safeSetPointerCapture(event.currentTarget, event.pointerId)
    pointers.current.set(event.pointerId, point)
    pointerStarts.current.set(event.pointerId, point)
    draggedPointers.current.delete(event.pointerId)
    if (pointers.current.size > 1)
      pointers.current.forEach((_, pointerId) =>
        draggedPointers.current.add(pointerId),
      )
    previousGesture.current = mapGesture(pointers.current)
  }

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    event.preventDefault()
    const start = pointerStarts.current.get(event.pointerId)
    if (
      start &&
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
    )
      draggedPointers.current.add(event.pointerId)
    updateGesture(event)
  }

  const pointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointerStart = pointerStarts.current.get(event.pointerId)
    const wasDragged = draggedPointers.current.has(event.pointerId)
    const wasSinglePointer = pointers.current.size === 1
    removeMapPointer(
      event.pointerId,
      event.currentTarget,
      pointers,
      pointerStarts,
      draggedPointers,
      previousGesture,
    )
    if (
      selectedFriendId &&
      pointerStart &&
      !wasDragged &&
      wasSinglePointer &&
      Math.hypot(
        event.clientX - pointerStart.x,
        event.clientY - pointerStart.y,
      ) <= 6
    ) {
      const bounds = event.currentTarget.getBoundingClientRect()
      const worldPoint = worldPointAtMapPixel(
        {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        },
        camera,
        viewport,
      )
      onSetFriendTarget(
        snapSavedFriendDestination([worldPoint.x, 0, worldPoint.z]),
      )
    }
  }

  const pointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    removeMapPointer(
      event.pointerId,
      event.currentTarget,
      pointers,
      pointerStarts,
      draggedPointers,
      previousGesture,
    )
  }

  const pointerCaptureLost = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.delete(event.pointerId)
    pointerStarts.current.delete(event.pointerId)
    draggedPointers.current.delete(event.pointerId)
    previousGesture.current = mapGesture(pointers.current)
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
      className={`bb-town-map ${selectedFriendId ? 'placing-character' : ''}`}
      aria-label="Draggable BlockBuddies world map"
      data-testid="town-map"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerCancel}
      onLostPointerCapture={pointerCaptureLost}
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
                [
                  ...worldLocations.map((location) => location.position),
                  ...friendPositions.map((entry) => entry.position),
                  ...(friendTarget ? [friendTarget] : []),
                ],
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
      {friendPositions.map(({ friend, position }) => (
        <button
          key={friend.id}
          type="button"
          className={`bb-town-map-friend saved ${selectedFriendId === friend.id ? 'selected' : ''}`}
          style={{
            ...markerStyle(position),
            backgroundColor: friend.avatar.shirtColor,
          }}
          title={`${friend.name}${savedFriendIsMoving(friend) ? ' (walking)' : ''}`}
          aria-label={`Select ${friend.name} on map`}
          aria-pressed={selectedFriendId === friend.id}
          data-testid={`map-friend-${friend.id}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onSelectFriend(friend.id)}
        >
          <UserRound size={11} aria-hidden />
          <span>{friend.name}</span>
        </button>
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
      {friendTarget && selectedFriendId ? (
        <span
          className="bb-town-map-character-target"
          style={markerStyle(friendTarget)}
          data-testid="map-character-target"
          title={`Character target: X ${friendTarget[0]}, Z ${friendTarget[2]}`}
        >
          <MapPin size={18} aria-hidden />
        </span>
      ) : null}
      <span className="bb-town-map-key">
        <span />{' '}
        {selectedFriendId
          ? 'Tap to set target / drag to explore'
          : 'Drag to explore / pinch or wheel to zoom'}
      </span>
    </div>
  )
}

type MapGesture = {
  center: PointerPoint
  distance: number
}

type PointerPoint = { x: number; y: number }

function pointerPointIsFinite(point: PointerPoint) {
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}

function safeSetPointerCapture(element: HTMLDivElement, pointerId: number) {
  try {
    element.setPointerCapture?.(pointerId)
  } catch {
    // Android WebView can reject capture during an interrupted multi-touch handoff.
  }
}

function safeReleasePointerCapture(element: HTMLDivElement, pointerId: number) {
  try {
    if (element.hasPointerCapture?.(pointerId))
      element.releasePointerCapture?.(pointerId)
  } catch {
    // Capture may already belong to the browser after a pinch cancellation.
  }
}

function removeMapPointer(
  pointerId: number,
  element: HTMLDivElement,
  pointers: MutableRefObject<Map<number, PointerPoint>>,
  pointerStarts: MutableRefObject<Map<number, PointerPoint>>,
  draggedPointers: MutableRefObject<Set<number>>,
  previousGesture: MutableRefObject<MapGesture | undefined>,
) {
  pointers.current.delete(pointerId)
  pointerStarts.current.delete(pointerId)
  draggedPointers.current.delete(pointerId)
  previousGesture.current = mapGesture(pointers.current)
  safeReleasePointerCapture(element, pointerId)
}

function mapGesture(points: Map<number, PointerPoint>): MapGesture | undefined {
  const items = [...points.values()].filter(pointerPointIsFinite)
  if (items.length === 0) return undefined
  if (items.length === 1) return { center: items[0]!, distance: 0 }
  const first = items[0]!
  const second = items[1]!
  const center = {
    x: first.x + (second.x - first.x) / 2,
    y: first.y + (second.y - first.y) / 2,
  }
  const distance = Math.hypot(second.x - first.x, second.y - first.y)
  return pointerPointIsFinite(center) && Number.isFinite(distance)
    ? { center, distance }
    : undefined
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
