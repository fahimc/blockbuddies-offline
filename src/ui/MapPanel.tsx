import {
  Flag,
  Building2,
  CarFront,
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
import { useMemo, useState } from 'react'
import { activeMiniGameTarget } from '../ai/miniGameProgress'
import { distance2d, worldLocations, type WorldLocation } from '../data/world'
import { unitsPerMeter } from '../game/scale'
import type { LocationId, Vec3 } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { useLocalPartyStore } from '../state/localPartyStore'
import { miniMapPlayerRotation } from './miniMapMath'

const townExtent = 27

const locationIcons: Record<LocationId, LucideIcon> = {
  spawn: Sparkles,
  park: Trees,
  shop: ShoppingBag,
  school: GraduationCap,
  obby: Flag,
  houses: House,
  parking: CarFront,
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
  const miniGameRunning = useGameStore((state) => state.miniGame.status === 'running')
  const miniGame = useGameStore((state) => state.miniGame)
  const savedFriends = useGameStore((state) => state.savedFriends)
  const remotePlayers = useLocalPartyStore((state) => state.remotePlayers)
  const [selectedId, setSelectedId] = useState<LocationId>(nearbyLocation ?? 'spawn')
  const selected = useMemo(
    () => worldLocations.find((location) => location.id === selectedId) ?? worldLocations[0],
    [selectedId],
  )
  const mapPlayerPosition = activeInterior?.returnPosition ?? playerPosition
  const travelBlocked = obbyActive || miniGameRunning
  const activeTarget = activeMiniGameTarget(miniGame)
  const distanceMeters = Math.max(1, Math.round(distance2d(mapPlayerPosition, selected.travelPosition) / unitsPerMeter))

  return (
    <div className="bb-map-overlay" role="presentation" onPointerDown={() => setOpenPanel(undefined)}>
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
          <button type="button" onClick={() => setOpenPanel(undefined)} aria-label="Close map" title="Close map">
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
            localPlayers={Object.values(remotePlayers).filter((player) => !player.interiorId)}
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
            <span className="bb-map-selected-icon" style={{ backgroundColor: selected.color }}>
              <SelectedIcon location={selected} size={21} />
            </span>
            <span>
              <strong>{selected.label}</strong>
              <small>{activeInterior ? `Leave ${activeInterior.title} and travel` : `${distanceMeters} m away`} - {selected.description}</small>
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
            <span>{travelBlocked ? 'Activity in progress' : `Travel to ${shortLabels[selected.id]}`}</span>
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
  activeTarget?: { label: string; mapLabel?: string; position: Vec3; kind?: string }
  savedFriends: { id: string; name: string; inWorld: boolean; route: LocationId[] }[]
  localPlayers: { id: string; name: string; position: Vec3 }[]
  onSelect: (id: LocationId) => void
}) {
  return (
    <div className="bb-town-map" aria-label="BlockBuddies town map" data-testid="town-map">
      <span className="bb-town-map-district north">Homes</span>
      <span className="bb-town-map-district west">Park side</span>
      <span className="bb-town-map-district east">Activity side</span>
      <span className="bb-town-map-road vertical" />
      <span className="bb-town-map-road horizontal" />
      <span className="bb-town-map-plaza" />
      {worldLocations.map((location) => {
        const Icon = locationIcons[location.id]
        return (
          <button
            key={location.id}
            type="button"
            className={`bb-town-map-marker ${selectedId === location.id ? 'selected' : ''}`}
            style={{ ...townPointStyle(location.position), backgroundColor: location.color }}
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
          ...townPointStyle(playerPosition),
          transform: `translate(-50%, -50%) rotate(${miniMapPlayerRotation(playerYaw)}rad)`,
        }}
        title="You are here"
        aria-label="Your current position"
      />
      {savedFriends.filter((friend) => friend.inWorld).map((friend, index) => (
        <span
          key={friend.id}
          className="bb-town-map-friend saved"
          style={townPointStyle(friendMapPosition(friend.route, index))}
          title={friend.name}
        />
      ))}
      {localPlayers.map((player) => (
        <span
          key={player.id}
          className="bb-town-map-friend local"
          style={townPointStyle(player.position)}
          title={player.name}
        />
      ))}
      {activeTarget ? (
        <span
          className={`bb-town-map-objective ${activeTarget.kind ?? 'dropoff'}`}
          style={townPointStyle(activeTarget.position)}
          data-testid="town-map-objective"
          title={activeTarget.mapLabel ?? activeTarget.label}
        >
          {activeTarget.mapLabel ?? activeTarget.label}
        </span>
      ) : null}
      <span className="bb-town-map-key">
        <span /> You are here
      </span>
    </div>
  )
}

function friendMapPosition(route: LocationId[], index: number): Vec3 {
  const routeIds = route.length ? route : ['spawn']
  const location = worldLocations.find((entry) => entry.id === routeIds[index % routeIds.length]) ?? worldLocations[0]
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

function SelectedIcon({ location, size }: { location: WorldLocation; size: number }) {
  const Icon = locationIcons[location.id]
  return <Icon size={size} aria-hidden />
}

function townPointStyle(position: Vec3) {
  return {
    left: `${clamp(((position[0] + townExtent) / (townExtent * 2)) * 100, 3, 97)}%`,
    top: `${clamp(((townExtent - position[2]) / (townExtent * 2)) * 100, 3, 97)}%`,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
