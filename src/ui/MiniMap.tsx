import { Map as MapIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { activeMiniGameTarget } from '../ai/miniGameProgress'
import { worldLocations } from '../data/world'
import { useGameStore } from '../state/gameStore'
import { useLocalPartyStore } from '../state/localPartyStore'
import {
  createTrafficVehicles,
  makeTrafficLanes,
  trafficPositionAtTime,
  type TrafficLane,
} from '../game/traffic'
import { realScale } from '../game/scale'
import type { Vec3 } from '../game/types'
import { savedFriendPositionAt } from '../game/savedFriendMovement'
import {
  miniMapPlayerRotation,
  miniMapPointPercent,
  miniMapRoadPercent,
} from './miniMapMath'
import {
  centralAvenue,
  horizontalRoadCentersBetween,
  verticalRoadCentersBetween,
} from '../data/proceduralTownPlan'
import {
  buddyBusStopPosition,
  findBuddyRival,
  playerClubhousePosition,
} from '../data/buddyRush'

const mapRange = 82

export function MiniMap() {
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const activeInterior = useGameStore((state) => state.activeInterior)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const playerYaw = useGameStore((state) => state.playerYaw)
  const bots = useGameStore((state) => state.bots)
  const savedFriends = useGameStore((state) => state.savedFriends)
  const miniGame = useGameStore((state) => state.miniGame)
  const buddyRush = useGameStore((state) => state.buddyRush)
  const remotePlayers = useLocalPartyStore((state) => state.remotePlayers)
  const lanes = useMemo(() => makeTrafficLanes(), [])
  const laneById = useMemo(
    () => new Map<string, TrafficLane>(lanes.map((lane) => [lane.id, lane])),
    [lanes],
  )
  const vehicles = useMemo(() => createTrafficVehicles(lanes, 8), [lanes])
  const [trafficClock, setTrafficClock] = useState(
    () => performance.now() / 1000,
  )
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
    return [
      {
        id: vehicle.id,
        color: vehicle.color,
        position: trafficPositionAtTime(lane, vehicle, trafficClock).position,
      },
    ]
  })
  const activeTarget = activeMiniGameTarget(miniGame)
  const buddyRushTarget = buddyRushObjective(buddyRush)
  const localFriends = Object.values(remotePlayers).filter(
    (player) => !player.interiorId,
  )
  const savedFriendMarkers = savedFriends
    .filter((friend) => friend.inWorld)
    .map((friend, index) => ({
      id: friend.id,
      name: friend.name,
      position: savedFriendPositionAt(friend, Date.now(), index),
    }))

  if (activeInterior) {
    return (
      <aside
        className="bb-mini-map"
        aria-label="Mini map"
        data-testid="mini-map"
      >
        <button
          type="button"
          className="bb-mini-map-open"
          onClick={() => setOpenPanel('map')}
          aria-label="Open town map"
        >
          <span className="bb-mini-map-title">
            <MapIcon size={14} aria-hidden />
            <span>Inside - Open Map</span>
          </span>
          <span className="bb-mini-map-surface">
            <span
              className="bb-mini-map-road horizontal"
              style={{
                top: '83%',
                height: '11%',
                left: '39%',
                right: 'auto',
                width: '22%',
              }}
            />
            <span
              className="bb-mini-map-location"
              style={{ left: '50%', top: '83%', backgroundColor: '#38bdf8' }}
              title="Exit"
            />
            <span
              className="bb-mini-map-location"
              style={{ left: '50%', top: '34%', backgroundColor: '#facc15' }}
              title={activeInterior.title}
            />
            <span
              className="bb-mini-map-player"
              style={{
                transform: `translate(-50%, -50%) rotate(${miniMapPlayerRotation(playerYaw)}rad)`,
              }}
            />
          </span>
        </button>
      </aside>
    )
  }

  return (
    <aside className="bb-mini-map" aria-label="Mini map" data-testid="mini-map">
      <button
        type="button"
        className="bb-mini-map-open"
        onClick={() => setOpenPanel('map')}
        aria-label="Open town map"
      >
        <span className="bb-mini-map-title">
          <MapIcon size={14} aria-hidden />
          <span>Open Map</span>
        </span>
        <span className="bb-mini-map-surface">
          {roads.map((road) => (
            <span
              key={road.id}
              className={`bb-mini-map-road ${road.orientation}`}
              style={road.style}
            />
          ))}
          {worldLocations
            .filter((location) => isOnMap(location.position, playerPosition))
            .map((location) => (
              <span
                key={location.id}
                className="bb-mini-map-location"
                style={{
                  ...pointStyle(location.position, playerPosition),
                  backgroundColor: location.color,
                }}
                title={location.label}
              />
            ))}
          {traffic
            .filter((vehicle) => isOnMap(vehicle.position, playerPosition))
            .map((vehicle) => (
              <span
                key={vehicle.id}
                className="bb-mini-map-traffic"
                style={{
                  ...pointStyle(vehicle.position, playerPosition),
                  backgroundColor: vehicle.color,
                }}
              />
            ))}
          {bots
            .filter((bot) => isOnMap(bot.position, playerPosition))
            .slice(0, 8)
            .map((bot) => (
              <span
                key={bot.id}
                className="bb-mini-map-bot"
                style={pointStyle(bot.position, playerPosition)}
                title={bot.id}
              />
            ))}
          {savedFriendMarkers
            .filter((friend) => isOnMap(friend.position, playerPosition))
            .map((friend) => (
              <span
                key={friend.id}
                className="bb-mini-map-friend saved"
                style={pointStyle(friend.position, playerPosition)}
                title={friend.name}
              />
            ))}
          {localFriends
            .filter((friend) => isOnMap(friend.position, playerPosition))
            .map((friend) => (
              <span
                key={friend.id}
                className="bb-mini-map-friend local"
                style={pointStyle(friend.position, playerPosition)}
                title={friend.name}
              />
            ))}
          {activeTarget ? (
            <span
              className={`bb-mini-map-objective ${activeTarget.kind ?? 'dropoff'}`}
              data-testid="mini-map-objective"
              style={pointStyle(activeTarget.position, playerPosition)}
              title={activeTarget.mapLabel ?? activeTarget.label}
            />
          ) : null}
          {buddyRushTarget &&
          isOnMap(buddyRushTarget.position, playerPosition) ? (
            <span
              className="bb-mini-map-objective buddy-rush"
              data-testid="mini-map-buddy-rush-objective"
              style={{
                ...pointStyle(buddyRushTarget.position, playerPosition),
                backgroundColor: '#f43f5e',
              }}
              title={buddyRushTarget.label}
            />
          ) : null}
          {!buddyRushTarget &&
          isOnMap(playerClubhousePosition, playerPosition) ? (
            <span
              className="bb-mini-map-location"
              style={{
                ...pointStyle(playerClubhousePosition, playerPosition),
                backgroundColor: '#8b5cf6',
              }}
              title="Your Buddy Clubhouse"
            />
          ) : null}
          {isOnMap(buddyBusStopPosition, playerPosition) ? (
            <span
              className="bb-mini-map-location"
              style={{
                ...pointStyle(buddyBusStopPosition, playerPosition),
                backgroundColor: '#facc15',
              }}
              title="Buddy Bus Stop"
            />
          ) : null}
          <span
            className="bb-mini-map-player"
            style={{
              transform: `translate(-50%, -50%) rotate(${miniMapPlayerRotation(playerYaw)}rad)`,
            }}
          />
        </span>
      </button>
    </aside>
  )
}

function buddyRushObjective(
  runtime: ReturnType<typeof useGameStore.getState>['buddyRush'],
): { position: Vec3; label: string } | undefined {
  if (runtime.rescueQuest) {
    const rival = findBuddyRival(runtime.rescueQuest.rivalId)
    return rival?.clubhousePosition
      ? {
          position: rival.clubhousePosition,
          label: `Rescue Buddy at ${rival.clubhouseName}`,
        }
      : undefined
  }
  const raid = runtime.activeRaid
  if (!raid) return undefined
  if (raid.direction === 'raid' && raid.phase === 'chase') {
    return {
      position: playerClubhousePosition,
      label: 'Escape to your Buddy Clubhouse',
    }
  }
  const rival = findBuddyRival(raid.rivalId)
  return rival?.clubhousePosition
    ? {
        position: rival.clubhousePosition,
        label:
          raid.direction === 'defend'
            ? 'Rival escape destination'
            : `Friendship Badge at ${rival.clubhouseName}`,
      }
    : undefined
}

function roadLinesFor(center: Vec3) {
  const roadWidthPercent = (realScale.roadTile / mapRange) * 100
  const minX = center[0] - mapRange / 2
  const maxX = center[0] + mapRange / 2
  const minZ = center[2] - mapRange / 2
  const maxZ = center[2] + mapRange / 2
  const lines: {
    id: string
    orientation: 'vertical' | 'horizontal'
    style: Record<string, string>
  }[] = []

  for (const roadX of verticalRoadCentersBetween(minX, maxX)) {
    lines.push({
      id: `x:${roadX}`,
      orientation: 'vertical',
      style: {
        left: `${miniMapRoadPercent(roadX, center[0], mapRange)}%`,
        width: `${roadWidthPercent}%`,
      },
    })
  }

  for (const roadZ of horizontalRoadCentersBetween(minZ, maxZ)) {
    lines.push({
      id: `z:${roadZ}`,
      orientation: 'horizontal',
      style: {
        top: `${miniMapRoadPercent(roadZ, center[2], mapRange)}%`,
        height: `${roadWidthPercent}%`,
      },
    })
  }

  const avenueMinZ = Math.max(minZ, centralAvenue.minZ)
  const avenueMaxZ = Math.min(maxZ, centralAvenue.maxZ)
  if (
    centralAvenue.centerX >= minX - realScale.roadTile / 2 &&
    centralAvenue.centerX <= maxX + realScale.roadTile / 2 &&
    avenueMaxZ > avenueMinZ
  ) {
    lines.push({
      id: 'central-avenue',
      orientation: 'vertical',
      style: {
        left: `${miniMapRoadPercent(centralAvenue.centerX, center[0], mapRange)}%`,
        top: `${miniMapRoadPercent(avenueMinZ, center[2], mapRange)}%`,
        width: `${roadWidthPercent}%`,
        height: `${((avenueMaxZ - avenueMinZ) / mapRange) * 100}%`,
      },
    })
  }

  return lines
}

function isOnMap(position: Vec3, center: Vec3) {
  return (
    Math.abs(position[0] - center[0]) <= mapRange / 2 &&
    Math.abs(position[2] - center[2]) <= mapRange / 2
  )
}

function pointStyle(position: Vec3, center: Vec3) {
  const percent = miniMapPointPercent(position, center, mapRange)
  return {
    left: `${percent.left}%`,
    top: `${percent.top}%`,
  }
}
