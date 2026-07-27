import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import {
  buddyActivityStationDefinitions,
  buddyBusStopPosition,
  buddyRushRivals,
  buddyRushRoutes,
  findBuddyRival,
  findBuddyStation,
  findCollectableBuddy,
  playerClubhousePosition,
} from '../data/buddyRush'
import type {
  BuddyRushRaid,
  CollectableBuddyDefinition,
  CollectableBuddyInstance,
  Vec3,
} from './types'
import { useGameStore } from '../state/gameStore'
import {
  buddyWhistleFollowerOffset,
  isRivalBuddyVisitingPlayer,
  pointAlongBuddyRoute,
} from '../ai/buddyRush'

const actionZIndex: [number, number] = [38, 20]

export function BuddyRushWorld() {
  const runtime = useGameStore((state) => state.buddyRush)
  const settings = useGameStore((state) => state.settings)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const travel = useGameStore((state) => state.travelToBuddyRushTarget)
  const capturedBuddyId =
    runtime.activeRaid?.direction === 'defend' &&
    runtime.activeRaid.phase === 'chase'
      ? runtime.activeRaid.buddyInstanceId
      : undefined

  return (
    <group>
      <PlayerClubhouse
        onOpen={() => setOpenPanel('buddy-rush')}
        onTravel={() => travel('clubhouse')}
      />
      {buddyActivityStationDefinitions.map((station) => (
        <ActivityStation key={station.id} stationId={station.id} />
      ))}
      {runtime.ownedBuddies.map((buddy, index) =>
        buddy.visitState || buddy.id === capturedBuddyId ? null : (
          <ClubhouseBuddy
            key={buddy.id}
            buddy={buddy}
            index={index}
            reducedMotion={settings.reducedMotion}
          />
        ),
      )}
      {runtime.visitors.map((visitor, index) => {
        const definition = findCollectableBuddy(visitor.definitionId)
        return definition ? (
          <BuddyModel
            key={visitor.id}
            definition={definition}
            position={[
              playerClubhousePosition[0] + 2.5 + index * 1.1,
              0.35,
              playerClubhousePosition[2] + 2.4,
            ]}
            reducedMotion={settings.reducedMotion}
            visitor
          />
        ) : null
      })}
      <BuddyBusStop
        offerIds={runtime.bus.offerDefinitionIds}
        onOpen={() => setOpenPanel('buddy-rush')}
        reducedMotion={settings.reducedMotion}
      />
      {buddyRushRivals
        .filter((rival) => rival.clubhousePosition)
        .map((rival) => (
          <RivalClubhouse
            key={rival.id}
            rivalId={rival.id}
            reducedMotion={settings.reducedMotion}
          />
        ))}
      {runtime.activeRaid ? (
        <ActiveRaidWorld
          raid={runtime.activeRaid}
          reducedMotion={settings.reducedMotion}
        />
      ) : null}
      {runtime.ownedBuddies
        .filter((buddy) => buddy.visitState)
        .map((buddy) => (
          <VisitingOwnedBuddy
            key={`visiting-${buddy.id}`}
            buddy={buddy}
            reducedMotion={settings.reducedMotion}
          />
        ))}
    </group>
  )
}

function PlayerClubhouse({
  onOpen,
  onTravel,
}: {
  onOpen: () => void
  onTravel: () => void
}) {
  return (
    <group position={playerClubhousePosition}>
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[6, 6, 0.16, 24]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[5.5, 2.2, 4.5]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      <mesh castShadow position={[0, 2.55, 0]}>
        <coneGeometry args={[4.2, 1.8, 4]} />
        <meshStandardMaterial color="#7c3aed" />
      </mesh>
      <mesh position={[0, 1, 2.28]}>
        <boxGeometry args={[1.25, 2, 0.12]} />
        <meshStandardMaterial color="#4c1d95" />
      </mesh>
      <Html center position={[0, 4.05, 0]} zIndexRange={actionZIndex}>
        <div className="whitespace-nowrap rounded-2xl bg-indigo-950/95 px-3 py-2 text-center text-xs font-black text-white shadow-xl">
          <span className="block text-sm">YOUR BUDDY CLUBHOUSE</span>
          <span className="text-indigo-200">
            Collection · Activities · Shield
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-lg bg-fuchsia-500 px-3 py-2"
              onClick={onOpen}
            >
              Open
            </button>
            <button
              type="button"
              className="rounded-lg bg-white/15 px-3 py-2"
              onClick={onTravel}
            >
              Visit
            </button>
          </div>
        </div>
      </Html>
    </group>
  )
}

function ActivityStation({
  stationId,
}: {
  stationId: (typeof buddyActivityStationDefinitions)[number]['id']
}) {
  const station = findBuddyStation(stationId)!
  return (
    <group position={station.position}>
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.16, 20]} />
        <meshStandardMaterial color={station.color} />
      </mesh>
      {station.id === 'clubhouse-bakery' ? (
        <>
          <mesh castShadow position={[0, 0.7, 0]}>
            <boxGeometry args={[1.7, 1.2, 1.2]} />
            <meshStandardMaterial color="#fef3c7" />
          </mesh>
          <mesh position={[0, 0.75, 0.61]}>
            <boxGeometry args={[1, 0.6, 0.08]} />
            <meshStandardMaterial color="#fb7185" />
          </mesh>
        </>
      ) : station.id === 'clubhouse-garden' ? (
        <>
          {[-0.6, 0, 0.6].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 0.38, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 0.7, 8]} />
                <meshStandardMaterial color="#166534" />
              </mesh>
              <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.28, 10, 8]} />
                <meshStandardMaterial color="#facc15" />
              </mesh>
            </group>
          ))}
        </>
      ) : (
        <>
          <mesh castShadow position={[0, 0.9, 0]}>
            <boxGeometry args={[1.5, 1.8, 1]} />
            <meshStandardMaterial color="#312e81" />
          </mesh>
          <mesh position={[0, 1.15, 0.51]}>
            <boxGeometry args={[1, 0.65, 0.08]} />
            <meshStandardMaterial
              color="#22d3ee"
              emissive="#22d3ee"
              emissiveIntensity={0.6}
            />
          </mesh>
        </>
      )}
      <Html center position={[0, 2.25, 0]} zIndexRange={[18, 8]}>
        <span className="whitespace-nowrap rounded-full bg-white/95 px-2 py-1 text-[10px] font-black text-slate-900 shadow">
          {station.name}
        </span>
      </Html>
    </group>
  )
}

function ClubhouseBuddy({
  buddy,
  index,
  reducedMotion,
}: {
  buddy: CollectableBuddyInstance
  index: number
  reducedMotion: boolean
}) {
  const definition = findCollectableBuddy(buddy.definitionId)
  if (!definition) return null
  const station = buddy.activityStationId
    ? findBuddyStation(buddy.activityStationId)
    : undefined
  const row = Math.floor(index / 4)
  const column = index % 4
  const position: Vec3 = station
    ? [
        station.position[0] + ((index % 3) - 1) * 0.8,
        0.35,
        station.position[2] + 1.4,
      ]
    : [
        playerClubhousePosition[0] - 2.2 + column * 1.5,
        0.35,
        playerClubhousePosition[2] + 2 + row * 1.2,
      ]
  return (
    <BuddyModel
      definition={definition}
      position={position}
      reducedMotion={reducedMotion}
      galaxy={buddy.styleId === 'galaxy'}
      favourite={buddy.isFavourite}
    />
  )
}

function BuddyBusStop({
  offerIds,
  onOpen,
  reducedMotion,
}: {
  offerIds: string[]
  onOpen: () => void
  reducedMotion: boolean
}) {
  return (
    <group position={buddyBusStopPosition}>
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[2.8, 2.8, 0.16, 24]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
      <mesh castShadow position={[0, 1.2, -1]}>
        <boxGeometry args={[4.5, 2.2, 1.8]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <mesh position={[-1.35, 0.35, -1]}>
        <cylinderGeometry args={[0.48, 0.48, 0.32, 16]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[1.35, 0.35, -1]}>
        <cylinderGeometry args={[0.48, 0.48, 0.32, 16]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 1.45, -0.08]}>
        <boxGeometry args={[2.5, 0.7, 0.08]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
      {offerIds.map((id, index) => {
        const definition = findCollectableBuddy(id)
        return definition ? (
          <BuddyModel
            key={id}
            definition={definition}
            position={[(index - (offerIds.length - 1) / 2) * 1.25, 0.35, 1.25]}
            reducedMotion={reducedMotion}
          />
        ) : null
      })}
      <Html center position={[0, 3.15, 0]} zIndexRange={actionZIndex}>
        <button
          type="button"
          className="whitespace-nowrap rounded-xl bg-sky-600 px-4 py-2 text-xs font-black text-white shadow-xl"
          onClick={onOpen}
        >
          {offerIds.length > 0 ? 'Meet Buddy Bus visitors' : 'Buddy Bus Stop'}
        </button>
      </Html>
    </group>
  )
}

function RivalClubhouse({
  rivalId,
  reducedMotion,
}: {
  rivalId: string
  reducedMotion: boolean
}) {
  const rival = findBuddyRival(rivalId)!
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const activeRaid = useGameStore((state) => state.buddyRush.activeRaid)
  const visitors = useGameStore((state) => state.buddyRush.visitors)
  if (!rival.clubhousePosition) return null
  return (
    <group position={rival.clubhousePosition}>
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[5, 5, 0.16, 24]} />
        <meshStandardMaterial color={rival.color} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.3, 0]}>
        <boxGeometry args={[5.8, 2.6, 4.8]} />
        <meshStandardMaterial color={rival.color} />
      </mesh>
      <mesh castShadow position={[0, 3, 0]}>
        <coneGeometry args={[4.1, 1.6, 4]} />
        <meshStandardMaterial color="#1e1b4b" />
      </mesh>
      {rival.buddyDefinitionIds.map((id, index) => {
        const definition = findCollectableBuddy(id)
        const isEscorted =
          activeRaid?.direction === 'raid' &&
          activeRaid.phase === 'chase' &&
          activeRaid.rivalId === rival.id &&
          activeRaid.buddyDefinitionId === id
        const isVisitingPlayer = isRivalBuddyVisitingPlayer(
          { visitors },
          rival.id,
          id,
        )
        return definition ? (
          isEscorted || isVisitingPlayer ? null : (
            <BuddyModel
              key={id}
              definition={definition}
              position={[-1 + index * 2, 0.35, 3]}
              reducedMotion={reducedMotion}
            />
          )
        ) : null
      })}
      <Html center position={[0, 4.2, 0]} zIndexRange={actionZIndex}>
        <div className="whitespace-nowrap rounded-xl bg-slate-950/95 px-3 py-2 text-center text-xs font-black text-white shadow-xl">
          <span className="block">{rival.clubhouseName}</span>
          <span style={{ color: rival.color }}>{rival.name}</span>
          <button
            type="button"
            className="mt-2 block w-full rounded-lg bg-fuchsia-600 px-3 py-2"
            onClick={() => setOpenPanel('buddy-rush')}
          >
            {activeRaid?.rivalId === rival.id ? 'Rush active' : 'View club'}
          </button>
        </div>
      </Html>
    </group>
  )
}

function ActiveRaidWorld({
  raid,
  reducedMotion,
}: {
  raid: BuddyRushRaid
  reducedMotion: boolean
}) {
  const definition = findCollectableBuddy(raid.buddyDefinitionId)
  const routeHintEndsAt = useGameStore(
    (state) => state.buddyRush.routeHintEndsAt,
  )
  if (!definition) return null
  return (
    <>
      {raid.direction === 'defend' ? (
        <>
          <RivalRunner raid={raid} reducedMotion={reducedMotion} />
          {raid.phase === 'chase' ? (
            <>
              <RouteMarkers routeIndex={raid.routeIndex} />
              {routeHintEndsAt > Date.now() ? (
                <RouteMarkers
                  routeIndex={raid.routeIndex ^ 1}
                  color="#22d3ee"
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : raid.phase === 'chase' ? (
        <>
          <EscortedBuddy
            definition={definition}
            reducedMotion={reducedMotion}
          />
          {routeHintEndsAt > Date.now() ? (
            <RouteMarkers routeIndex={raid.routeIndex} color="#22d3ee" />
          ) : null}
        </>
      ) : null}
    </>
  )
}

function RivalRunner({
  raid,
  reducedMotion,
}: {
  raid: BuddyRushRaid
  reducedMotion: boolean
}) {
  const group = useRef<Group>(null)
  const capturedBuddyGroup = useRef<Group>(null)
  const [nearby, setNearby] = useState(false)
  const tagRival = useGameStore((state) => state.tagBuddyRushRival)
  const route = buddyRushRoutes[raid.routeIndex] ?? buddyRushRoutes[0]
  const rival = findBuddyRival(raid.rivalId)
  const buddy = findCollectableBuddy(raid.buddyDefinitionId)
  const rivalPauseStartedAt = useGameStore(
    (state) => state.buddyRush.rivalPauseStartedAt,
  )
  const rivalPausedUntil = useGameStore(
    (state) => state.buddyRush.rivalPausedUntil,
  )
  const isPaused = rivalPausedUntil > Date.now()
  const whistlePullEndsAt = useGameStore(
    (state) => state.buddyRush.whistlePullEndsAt,
  )

  useFrame(() => {
    if (!group.current) return
    const displayNow = Date.now()
    const now = displayNow < rivalPausedUntil ? rivalPauseStartedAt : displayNow
    const phaseDuration = Math.max(1, raid.phaseEndsAt - raid.startedAt)
    const phaseProgress = Math.max(
      0,
      Math.min(1, 1 - (raid.phaseEndsAt - now) / phaseDuration),
    )
    const personalityProgress =
      raid.phase === 'chase'
        ? rival?.archetype === 'friendly'
          ? Math.max(
              0,
              phaseProgress - (Math.sin(now / 430) > 0.72 ? 0.035 : 0),
            )
          : phaseProgress
        : phaseProgress
    const position =
      raid.phase === 'approach'
        ? pointAlongBuddyRoute([...route].reverse(), personalityProgress)
        : raid.phase === 'capture'
          ? route[0]
          : pointAlongBuddyRoute(route, personalityProgress)
    const prankOffset =
      raid.phase === 'chase' && rival?.archetype === 'prankster'
        ? Math.sin(now / 240) * 0.85
        : 0
    group.current.position.set(position[0], 0.05, position[2] + prankOffset)
    if (!reducedMotion)
      group.current.rotation.y = Math.sin(displayNow / 180) * 0.12
    const player = useGameStore.getState().playerPosition
    if (capturedBuddyGroup.current) {
      const followerOffset = buddyWhistleFollowerOffset(
        [position[0], 0, position[2] + prankOffset],
        player,
        displayNow < whistlePullEndsAt,
      )
      capturedBuddyGroup.current.position.set(
        followerOffset[0],
        followerOffset[1],
        followerOffset[2],
      )
    }
    const nextNearby =
      raid.phase === 'chase' &&
      Math.hypot(player[0] - position[0], player[2] - position[2]) <= 4.5
    if (nextNearby !== nearby) setNearby(nextNearby)
  })

  return (
    <group ref={group}>
      <mesh castShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.9, 1.4, 0.65]} />
        <meshStandardMaterial color={rival?.color ?? '#f43f5e'} />
      </mesh>
      <mesh castShadow position={[0, 2.05, 0]}>
        <boxGeometry args={[0.75, 0.65, 0.68]} />
        <meshStandardMaterial color="#c9825a" />
      </mesh>
      <mesh position={[0, 2.65, 0]}>
        <sphereGeometry args={[0.45, 12, 10]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#facc15"
          emissiveIntensity={0.7}
        />
      </mesh>
      {raid.phase === 'chase' && buddy ? (
        <group ref={capturedBuddyGroup}>
          <BuddyModel
            definition={buddy}
            position={[0, 0.25, 0]}
            reducedMotion={reducedMotion}
            visitor
          />
          <Html center position={[0, 2.9, 0]} zIndexRange={[24, 12]}>
            <span
              data-testid="buddy-rush-following-buddy"
              className="whitespace-nowrap rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950 shadow"
            >
              {buddy.name} following
            </span>
          </Html>
        </group>
      ) : null}
      {isPaused ? (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[1.55, 16, 12]} />
          <meshStandardMaterial
            color="#7dd3fc"
            transparent
            opacity={0.35}
            emissive="#38bdf8"
            emissiveIntensity={0.5}
          />
        </mesh>
      ) : null}
      <Html center position={[0, 3.35, 0]} zIndexRange={actionZIndex}>
        <div className="whitespace-nowrap rounded-xl bg-rose-600 px-3 py-2 text-center text-xs font-black text-white shadow-xl">
          <span className="block">
            {rival?.name ?? 'Rival'} · {raid.phase}
          </span>
          {nearby ? (
            <button
              type="button"
              className="mt-2 min-h-10 rounded-lg bg-white px-3 text-rose-700"
              onClick={() => tagRival(Date.now())}
            >
              Tag & rescue
            </button>
          ) : null}
        </div>
      </Html>
    </group>
  )
}

function EscortedBuddy({
  definition,
  reducedMotion,
}: {
  definition: CollectableBuddyDefinition
  reducedMotion: boolean
}) {
  const group = useRef<Group>(null)
  useFrame(() => {
    if (!group.current) return
    const player = useGameStore.getState().playerPosition
    group.current.position.set(player[0] - 0.8, 0.35, player[2] + 0.7)
  })
  return (
    <group ref={group}>
      <BuddyModel
        definition={definition}
        position={[0, 0, 0]}
        reducedMotion={reducedMotion}
        visitor
      />
      <Html center position={[0, 2.7, 0]} zIndexRange={[24, 12]}>
        <span
          data-testid="buddy-rush-following-buddy"
          className="whitespace-nowrap rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950 shadow"
        >
          {definition.name} following
        </span>
      </Html>
    </group>
  )
}

function VisitingOwnedBuddy({
  buddy,
  reducedMotion,
}: {
  buddy: CollectableBuddyInstance
  reducedMotion: boolean
}) {
  const definition = findCollectableBuddy(buddy.definitionId)
  const rival = buddy.visitState
    ? findBuddyRival(buddy.visitState.hostPlayerId)
    : undefined
  const rescue = useGameStore((state) => state.rescueBuddyVisitor)
  const [nearby, setNearby] = useState(false)
  const position = rival?.clubhousePosition
  useFrame(() => {
    if (!position) return
    const player = useGameStore.getState().playerPosition
    const next =
      Math.hypot(player[0] - position[0], player[2] - position[2]) <= 6
    if (next !== nearby) setNearby(next)
  })
  if (!definition || !position) return null
  return (
    <group position={[position[0] + 2.3, 0.35, position[2] + 2.5]}>
      <BuddyModel
        definition={definition}
        position={[0, 0, 0]}
        reducedMotion={reducedMotion}
        galaxy={buddy.styleId === 'galaxy'}
        visitor
      />
      {nearby ? (
        <Html center position={[0, 2.3, 0]} zIndexRange={actionZIndex}>
          <button
            type="button"
            className="whitespace-nowrap rounded-xl bg-amber-500 px-4 py-3 text-xs font-black text-white shadow-xl"
            onClick={() => rescue(buddy.id, Date.now())}
          >
            Bring {definition.name} home
          </button>
        </Html>
      ) : null}
    </group>
  )
}

function RouteMarkers({
  routeIndex,
  color = '#f43f5e',
}: {
  routeIndex: number
  color?: string
}) {
  const route = buddyRushRoutes[routeIndex] ?? buddyRushRoutes[0]
  const points = useMemo(
    () =>
      route.flatMap((_, segmentIndex) => {
        if (segmentIndex === route.length - 1) return []
        return [0.25, 0.5, 0.75].map((progress) =>
          pointAlongBuddyRoute(
            [route[segmentIndex], route[segmentIndex + 1]],
            progress,
          ),
        )
      }),
    [route],
  )
  return (
    <group>
      {points.map((point, index) => (
        <mesh
          key={`${point[0]}-${point[2]}-${index}`}
          position={[point[0], 0.16, point[2]]}
        >
          <cylinderGeometry args={[0.22, 0.22, 0.12, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

function BuddyModel({
  definition,
  position,
  reducedMotion,
  galaxy = false,
  favourite = false,
  visitor = false,
}: {
  definition: CollectableBuddyDefinition
  position: Vec3
  reducedMotion: boolean
  galaxy?: boolean
  favourite?: boolean
  visitor?: boolean
}) {
  const group = useRef<Group>(null)
  const phase = useMemo(
    () =>
      definition.id
        .split('')
        .reduce((total, character) => total + character.charCodeAt(0), 0) % 100,
    [definition.id],
  )
  useFrame(() => {
    if (!group.current || reducedMotion) return
    group.current.position.y =
      position[1] + Math.sin(Date.now() / 350 + phase) * 0.08
    group.current.rotation.y += 0.006
  })
  const color = galaxy ? '#4c1d95' : definition.color
  return (
    <group ref={group} position={position}>
      <mesh castShadow position={[0, 0.45, 0]}>
        {definition.family === 'robot' || definition.family === 'mini' ? (
          <boxGeometry args={[0.75, 0.7, 0.65]} />
        ) : (
          <sphereGeometry args={[0.48, 12, 10]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={galaxy ? '#7c3aed' : color}
          emissiveIntensity={galaxy ? 0.5 : 0.08}
        />
      </mesh>
      <mesh castShadow position={[0, 1.05, 0]}>
        {definition.family === 'robot' ? (
          <boxGeometry args={[0.62, 0.55, 0.58]} />
        ) : (
          <sphereGeometry args={[0.4, 12, 10]} />
        )}
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.14, 1.1, 0.36]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0.14, 1.1, 0.36]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 0.62, 0.36]}>
        <boxGeometry args={[0.4, 0.16, 0.08]} />
        <meshStandardMaterial color={definition.accentColor} />
      </mesh>
      {galaxy || favourite || visitor ? (
        <mesh position={[0, 1.62, 0]}>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial
            color={favourite ? '#fb7185' : visitor ? '#facc15' : '#c4b5fd'}
            emissive={favourite ? '#fb7185' : '#facc15'}
            emissiveIntensity={0.8}
          />
        </mesh>
      ) : null}
      <Html center position={[0, 1.95, 0]} zIndexRange={[14, 5]}>
        <span className="whitespace-nowrap rounded-full bg-slate-950/85 px-2 py-1 text-[9px] font-black text-white shadow">
          {galaxy ? 'Galaxy ' : ''}
          {definition.name}
          {favourite ? ' ♥' : visitor ? ' · Visiting' : ''}
        </span>
      </Html>
    </group>
  )
}
