import { Map as MapIcon, Navigation } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { worldLocations } from '../data/world'
import { useGameStore } from '../state/gameStore'
import { advanceTraffic, createTrafficVehicles, makeTrafficLanes, trafficPositionAt, type TrafficLane } from '../game/traffic'
import { realScale } from '../game/scale'
import type { Vec3 } from '../game/types'

const mapRange = 82
const roadRepeat = 72
const roadOrigin = 18

export function MiniMap() {
  const playerPosition = useGameStore((state) => state.playerPosition)
  const playerYaw = useGameStore((state) => state.playerYaw)
  const bots = useGameStore((state) => state.bots)
  const lanes = useMemo(() => makeTrafficLanes(), [])
  const laneById = useMemo(() => new Map<string, TrafficLane>(lanes.map((lane) => [lane.id, lane])), [lanes])
  const [vehicles, setVehicles] = useState(() => createTrafficVehicles(lanes, 8))
  const roads = useMemo(() => roadLinesFor(playerPosition), [playerPosition])

  useEffect(() => {
    let last = performance.now()
    const interval = window.setInterval(() => {
      const now = performance.now()
      const delta = (now - last) / 1000
      last = now
      setVehicles((current) =>
        current.map((vehicle) => {
          const lane = laneById.get(vehicle.laneId)
          return lane ? advanceTraffic(vehicle, lane, delta) : vehicle
        }),
      )
    }, 180)

    return () => window.clearInterval(interval)
  }, [laneById])

  const traffic = vehicles.flatMap((vehicle) => {
    const lane = laneById.get(vehicle.laneId)
    if (!lane) return []
    return [{ id: vehicle.id, color: vehicle.color, position: trafficPositionAt(lane, vehicle.offset).position }]
  })

  return (
    <aside className="bb-mini-map" aria-label="Mini map" data-testid="mini-map">
      <div className="bb-mini-map-title">
        <MapIcon size={14} aria-hidden />
        <span>Map</span>
      </div>
      <div className="bb-mini-map-surface">
        {roads.map((road) => (
          <span key={road.id} className={`bb-mini-map-road ${road.orientation}`} style={road.style} />
        ))}
        {worldLocations.filter((location) => isOnMap(location.position, playerPosition)).map((location) => (
          <span
            key={location.id}
            className="bb-mini-map-location"
            style={{ ...pointStyle(location.position, playerPosition), backgroundColor: location.color }}
            title={location.label}
          />
        ))}
        {traffic.filter((vehicle) => isOnMap(vehicle.position, playerPosition)).map((vehicle) => (
          <span
            key={vehicle.id}
            className="bb-mini-map-traffic"
            style={{ ...pointStyle(vehicle.position, playerPosition), backgroundColor: vehicle.color }}
          />
        ))}
        {bots.filter((bot) => isOnMap(bot.position, playerPosition)).slice(0, 8).map((bot) => (
          <span key={bot.id} className="bb-mini-map-bot" style={pointStyle(bot.position, playerPosition)} title={bot.id} />
        ))}
        <span className="bb-mini-map-player" style={{ transform: `translate(-50%, -50%) rotate(${playerYaw}rad)` }}>
          <Navigation size={15} aria-hidden />
        </span>
      </div>
    </aside>
  )
}

function roadLinesFor(center: Vec3) {
  const roadWidthPercent = (realScale.roadTile / mapRange) * 100
  const minX = center[0] - mapRange / 2
  const maxX = center[0] + mapRange / 2
  const minZ = center[2] - mapRange / 2
  const maxZ = center[2] + mapRange / 2
  const lines: { id: string; orientation: 'vertical' | 'horizontal'; style: Record<string, string> }[] = []

  for (const roadX of roadCentersBetween(minX, maxX)) {
    lines.push({
      id: `x:${roadX}`,
      orientation: 'vertical',
      style: {
        left: `${percentFor(roadX, center[0])}%`,
        width: `${roadWidthPercent}%`,
      },
    })
  }

  for (const roadZ of roadCentersBetween(minZ, maxZ)) {
    lines.push({
      id: `z:${roadZ}`,
      orientation: 'horizontal',
      style: {
        top: `${percentFor(roadZ, center[2])}%`,
        height: `${roadWidthPercent}%`,
      },
    })
  }

  return lines
}

function roadCentersBetween(min: number, max: number) {
  const first = Math.floor((min - roadOrigin) / roadRepeat) - 1
  const last = Math.ceil((max - roadOrigin) / roadRepeat) + 1
  const centers: number[] = []
  for (let index = first; index <= last; index += 1) {
    const center = roadOrigin + roadRepeat * index
    if (center >= min - realScale.roadTile && center <= max + realScale.roadTile) centers.push(center)
  }
  return centers
}

function isOnMap(position: Vec3, center: Vec3) {
  return Math.abs(position[0] - center[0]) <= mapRange / 2 && Math.abs(position[2] - center[2]) <= mapRange / 2
}

function pointStyle(position: Vec3, center: Vec3) {
  return {
    left: `${percentFor(position[0], center[0])}%`,
    top: `${percentFor(position[2], center[2])}%`,
  }
}

function percentFor(value: number, center: number) {
  return clamp(((value - center + mapRange / 2) / mapRange) * 100, 0, 100)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
