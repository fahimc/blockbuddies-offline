import { Map as MapIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { worldLocations } from '../data/world'
import { useGameStore } from '../state/gameStore'
import { createTrafficVehicles, makeTrafficLanes, trafficPositionAtTime, type TrafficLane } from '../game/traffic'
import { realScale } from '../game/scale'
import type { Vec3 } from '../game/types'
import { miniMapPlayerRotation } from './miniMapMath'

const mapRange = 82
const roadRepeat = 72
const roadOrigin = 18

export function MiniMap() {
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const activeInterior = useGameStore((state) => state.activeInterior)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const playerYaw = useGameStore((state) => state.playerYaw)
  const bots = useGameStore((state) => state.bots)
  const lanes = useMemo(() => makeTrafficLanes(), [])
  const laneById = useMemo(() => new Map<string, TrafficLane>(lanes.map((lane) => [lane.id, lane])), [lanes])
  const vehicles = useMemo(() => createTrafficVehicles(lanes, 8), [lanes])
  const [trafficClock, setTrafficClock] = useState(() => performance.now() / 1000)
  const roads = useMemo(() => roadLinesFor(playerPosition), [playerPosition])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTrafficClock(performance.now() / 1000)
    }, 180)

    return () => window.clearInterval(interval)
  }, [])

  const traffic = vehicles.flatMap((vehicle) => {
    const lane = laneById.get(vehicle.laneId)
    if (!lane) return []
    return [{ id: vehicle.id, color: vehicle.color, position: trafficPositionAtTime(lane, vehicle, trafficClock).position }]
  })

  if (activeInterior) {
    return (
      <aside className="bb-mini-map" aria-label="Mini map" data-testid="mini-map">
        <button type="button" className="bb-mini-map-open" onClick={() => setOpenPanel('map')} aria-label="Open town map">
          <span className="bb-mini-map-title">
            <MapIcon size={14} aria-hidden />
            <span>Inside - Open Map</span>
          </span>
          <span className="bb-mini-map-surface">
            <span className="bb-mini-map-road horizontal" style={{ top: '83%', height: '11%', left: '39%', right: 'auto', width: '22%' }} />
            <span className="bb-mini-map-location" style={{ left: '50%', top: '83%', backgroundColor: '#38bdf8' }} title="Exit" />
            <span className="bb-mini-map-location" style={{ left: '50%', top: '34%', backgroundColor: '#facc15' }} title={activeInterior.title} />
            <span className="bb-mini-map-player" style={{ transform: `translate(-50%, -50%) rotate(${miniMapPlayerRotation(playerYaw)}rad)` }} />
          </span>
        </button>
      </aside>
    )
  }

  return (
    <aside className="bb-mini-map" aria-label="Mini map" data-testid="mini-map">
      <button type="button" className="bb-mini-map-open" onClick={() => setOpenPanel('map')} aria-label="Open town map">
        <span className="bb-mini-map-title">
          <MapIcon size={14} aria-hidden />
          <span>Open Map</span>
        </span>
        <span className="bb-mini-map-surface">
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
          <span className="bb-mini-map-player" style={{ transform: `translate(-50%, -50%) rotate(${miniMapPlayerRotation(playerYaw)}rad)` }} />
        </span>
      </button>
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
        top: `${topPercentForZ(roadZ, center[2])}%`,
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
    top: `${topPercentForZ(position[2], center[2])}%`,
  }
}

function percentFor(value: number, center: number) {
  return clamp(((value - center + mapRange / 2) / mapRange) * 100, 0, 100)
}

function topPercentForZ(value: number, center: number) {
  return clamp(((center - value + mapRange / 2) / mapRange) * 100, 0, 100)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
