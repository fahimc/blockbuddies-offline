import { useFrame } from '@react-three/fiber'
import { useKeyboardControls, Html, useTexture } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { botProfiles } from '../data/botProfiles'
import { worldLocations, distance2d } from '../data/world'
import { nearestLocation, useGameStore } from '../state/gameStore'
import { makePartySnapshot, useLocalPartyStore, type LocalPartySnapshot } from '../state/localPartyStore'
import type { BotRuntime, BuildBlock, Vec3 } from './types'

const obbyCheckpoints: Vec3[] = [
  [16, 0.8, 12],
  [18.5, 1.8, 13.5],
  [20.5, 3.1, 16],
  [22, 4.6, 18],
]

const worldHtmlZIndexRange: [number, number] = [4, 0]

export function GameScene() {
  return (
    <>
      <Town />
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

      <Building position={[-12, 1.2, -8]} color="#22c55e" scale={[3.5, 1.8, 2.5]} />
      <Building position={[12, 1.4, -7]} color="#fb923c" scale={[3, 2.4, 2.6]} />
      <Building position={[-14, 1.8, 10]} color="#a78bfa" scale={[4, 3.2, 2.5]} />
      <Building position={[2, 1.3, 18]} color="#facc15" scale={[3.5, 2.2, 2.5]} />
      <Building position={[-4, 1.0, 18]} color="#f9a8d4" scale={[2.5, 1.8, 2.4]} />
      <Building position={[8, 1.0, 18]} color="#93c5fd" scale={[2.5, 1.8, 2.4]} />
      <Storefront position={[12, 0, -7]} label="SHOP" color="#f97316" />
      <Storefront position={[-14, 0, 10]} label="SCHOOL" color="#a78bfa" />
      <Storefront position={[16, 0, 12]} label="OBBY" color="#ef4444" />
      <Billboard position={[-6, 0, 2]} />
      <Benches />
      <StreetLamps />

      {[-18, -8, 8, 18].map((x) => (
        <Tree key={x} position={[x, 0, -17]} />
      ))}
      {[-16, -5, 6, 17].map((z) => (
        <Tree key={z} position={[-20, 0, z]} />
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
        <planeGeometry args={[4, 22]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, 0.03, 9]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[4, 32]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Building({ position, color, scale }: { position: Vec3; color: string; scale: Vec3 }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, scale[1] / 2 + 0.45, 0]} scale={[scale[0] * 1.08, 0.8, scale[2] * 1.08]}>
        <coneGeometry args={[0.8, 1, 4]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, -scale[1] / 2 + 0.05, scale[2] / 2 + 0.02]} scale={[0.5, 0.7, 0.06]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7c2d12" />
      </mesh>
      <mesh position={[-scale[0] * 0.22, 0.18, scale[2] / 2 + 0.03]} scale={[0.42, 0.36, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[scale[0] * 0.22, 0.18, scale[2] / 2 + 0.03]} scale={[0.42, 0.36, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
}

function Storefront({ position, label, color }: { position: Vec3; label: string; color: string }) {
  return (
    <group position={[position[0], position[1] + 2.9, position[2] + 1.45]}>
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
      {[[-6, -4], [5.5, -4], [-6, 5.2], [5.5, 5.2]].map(([x, z], index) => (
        <group key={`${x},${z}`} position={[x, 0.35, z]} rotation={[0, index > 1 ? Math.PI : 0, 0]}>
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
      {[[-4, -7], [4, -7], [-4, 8], [4, 8], [11, -2], [-11, 2]].map(([x, z]) => (
        <group key={`${x},${z}`} position={[x, 0, z]}>
          <mesh castShadow position={[0, 1.35, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 2.7, 10]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh castShadow position={[0, 2.8, 0]}>
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
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.18, 0.25, 1.6, 8]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
      <mesh castShadow position={[0, 2, 0]}>
        <dodecahedronGeometry args={[0.9, 0]} />
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
  const lastBuildAt = useRef(0)
  const lastPartyBroadcastAt = useRef(0)
  const movingRef = useRef(false)
  const airborneRef = useRef(false)
  const [moving, setMoving] = useState(false)
  const [airborne, setAirborne] = useState(false)
  const position = useRef(new THREE.Vector3(0, 0.9, 4))
  const setPlayer = useGameStore((state) => state.setPlayer)
  const touch = useGameStore((state) => state.touch)
  const avatar = useGameStore((state) => state.avatar)
  const playerEmote = useGameStore((state) => state.playerEmote)
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

  useFrame((state, delta) => {
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

    const direction = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current))
    const side = new THREE.Vector3(direction.z, 0, -direction.x)
    const speed = keys.forward || keys.back || Math.abs(touch.y) > 0.1 ? 8 : 5
    position.current.addScaledVector(direction, forward * speed * delta)
    position.current.addScaledVector(side, strafe * speed * 0.7 * delta)
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
    position.current.x = THREE.MathUtils.clamp(position.current.x, -25, 25)
    position.current.z = THREE.MathUtils.clamp(position.current.z, -25, 25)

    if (position.current.y < -2 && obby.active) {
      position.current.set(obby.checkpoint[0], obby.checkpoint[1] + 0.8, obby.checkpoint[2])
      velocityY.current = 0
    }

    group.current?.position.copy(position.current)
    if (group.current) group.current.rotation.y = yaw.current
    const mobile = state.size.width < 640
    const cameraDistance = mobile ? -13 : -8
    const cameraHeight = mobile ? 7.4 : 5
    const cameraTarget = position.current
      .clone()
      .add(new THREE.Vector3(Math.sin(yaw.current) * cameraDistance, cameraHeight, Math.cos(yaw.current) * cameraDistance))
    state.camera.position.lerp(cameraTarget, 0.12)
    state.camera.lookAt(position.current.x, position.current.y + 1.4, position.current.z)
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
        pantsColor={avatar.pantsColor}
        accessory={avatar.accessory}
        face={avatar.face}
        username="You"
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
        pantsColor={player.avatar.pantsColor}
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

function BlockAvatar({
  bodyColor,
  shirtColor,
  hairColor = '#5a2f16',
  pantsColor = '#111827',
  accessory = 'none',
  face = 'smile',
  username,
  hat,
  emote = 'none',
  action = 'idle',
}: {
  bodyColor: string
  shirtColor: string
  hairColor?: string
  pantsColor?: string
  accessory?: string
  face?: string
  username: string
  hat?: boolean
  emote?: 'none' | 'wave' | 'cheer' | 'dance' | 'sit'
  action?: BotRuntime['action']
}) {
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
  return (
    <group position={[0, sitDrop, 0]}>
      <Html center position={[0, 2.15, 0]} zIndexRange={worldHtmlZIndexRange}>
        <span className="whitespace-nowrap rounded bg-slate-950/80 px-2 py-1 text-xs font-black text-white shadow">
          {username}
        </span>
      </Html>
      <group ref={body} position={[0, -0.9, 0]}>
        <group ref={leftLeg} position={[-0.22, 0.64, 0]}>
          <mesh castShadow position={[0, -0.32, 0]}>
            <boxGeometry args={[0.26, 0.64, 0.28]} />
            <meshStandardMaterial color={pantsColor} roughness={0.72} />
          </mesh>
          <mesh castShadow position={[0, -0.68, 0.08]}>
            <boxGeometry args={[0.3, 0.12, 0.42]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.22, 0.64, 0]}>
          <mesh castShadow position={[0, -0.32, 0]}>
            <boxGeometry args={[0.26, 0.64, 0.28]} />
            <meshStandardMaterial color={pantsColor} roughness={0.72} />
          </mesh>
          <mesh castShadow position={[0, -0.68, 0.08]}>
            <boxGeometry args={[0.3, 0.12, 0.42]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
        </group>

        <mesh castShadow position={[0, 1.05, 0]}>
          <boxGeometry args={[0.82, 0.94, 0.38]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 1.55, 0]}>
          <boxGeometry args={[0.7, 0.16, 0.4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.7} />
        </mesh>

        <group ref={leftArm} position={[-0.58, 1.45, 0]}>
          <mesh castShadow position={[0, -0.36, 0]}>
            <boxGeometry args={[0.24, 0.72, 0.24]} />
            <meshStandardMaterial color={bodyColor} roughness={0.7} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.58, 1.45, 0]}>
          <mesh castShadow position={[0, -0.36, 0]}>
            <boxGeometry args={[0.24, 0.72, 0.24]} />
            <meshStandardMaterial color={bodyColor} roughness={0.7} />
          </mesh>
        </group>

        <mesh castShadow position={[0, 1.92, 0]}>
          <boxGeometry args={[0.62, 0.62, 0.58]} />
          <meshStandardMaterial color={bodyColor} roughness={0.66} />
        </mesh>
        <mesh castShadow position={[0, 2.28, -0.02]}>
          <boxGeometry args={[0.66, 0.18, 0.62]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.22, 1.96, 0.31]}>
          <boxGeometry args={[0.07, 0.07, 0.03]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <mesh castShadow position={[0.22, 1.96, 0.31]}>
          <boxGeometry args={[0.07, 0.07, 0.03]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <mesh castShadow position={[0, 1.78, 0.32]}>
          <boxGeometry args={[face === 'wow' ? 0.12 : face === 'cool' ? 0.3 : 0.26, face === 'wow' ? 0.12 : 0.05, 0.03]} />
          <meshStandardMaterial color="#7c2d12" />
        </mesh>
        {hat ? (
          <mesh castShadow position={[0, 2.45, 0]}>
            <cylinderGeometry args={[0.38, 0.5, 0.18, 5]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        ) : null}
        {accessory && accessory !== 'none' ? (
          <mesh castShadow position={[0, 1.97, 0.36]}>
            <boxGeometry args={[0.62, 0.12, 0.04]} />
            <meshStandardMaterial color="#111827" roughness={0.5} />
          </mesh>
        ) : null}
      </group>
    </group>
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
        <boxGeometry args={[2.1, 0.08, 2.1]} />
        <meshStandardMaterial color={color} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[0.12, 0.02, 1.35]} />
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.12} />
      </mesh>
    </group>
  )
}

function HousePiece({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[1.65, 1.45, 1.45]} />
        <meshStandardMaterial color={color} roughness={0.76} />
      </mesh>
      <mesh castShadow position={[0, 1.65, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.25, 0.8, 4]} />
        <meshStandardMaterial color="#ef4444" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.62, 0.74]}>
        <boxGeometry args={[0.36, 0.68, 0.04]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.82} />
      </mesh>
      <mesh position={[-0.48, 1.02, 0.75]}>
        <boxGeometry args={[0.32, 0.28, 0.04]} />
        <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0.48, 1.02, 0.75]}>
        <boxGeometry args={[0.32, 0.28, 0.04]} />
        <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.12} />
      </mesh>
    </group>
  )
}

function BuildingPiece({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 1.15, 0]}>
        <boxGeometry args={[1.55, 2.3, 1.55]} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>
      {[0.55, 1.15, 1.75].map((height) => (
        <group key={height}>
          <mesh position={[-0.43, height, 0.79]}>
            <boxGeometry args={[0.28, 0.28, 0.04]} />
            <meshStandardMaterial color="#dbeafe" emissive="#93c5fd" emissiveIntensity={0.14} />
          </mesh>
          <mesh position={[0.43, height, 0.79]}>
            <boxGeometry args={[0.28, 0.28, 0.04]} />
            <meshStandardMaterial color="#dbeafe" emissive="#93c5fd" emissiveIntensity={0.14} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 2.45, 0]}>
        <boxGeometry args={[1.85, 0.26, 1.85]} />
        <meshStandardMaterial color="#1e293b" roughness={0.76} />
      </mesh>
    </group>
  )
}

function ShopPiece({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.85, 0]}>
        <boxGeometry args={[2, 1.55, 1.5]} />
        <meshStandardMaterial color={color} roughness={0.74} />
      </mesh>
      <mesh castShadow position={[0, 1.72, 0.18]}>
        <boxGeometry args={[2.25, 0.22, 1.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.78} />
      </mesh>
      <mesh castShadow position={[0, 1.48, 0.86]}>
        <boxGeometry args={[2.2, 0.24, 0.3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.74, 0.77]}>
        <boxGeometry args={[0.55, 0.85, 0.05]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.82} />
      </mesh>
    </group>
  )
}

function CarPiece({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.38, 0]}>
        <boxGeometry args={[1.5, 0.42, 0.82]} />
        <meshStandardMaterial color={color} roughness={0.68} />
      </mesh>
      <mesh castShadow position={[0.08, 0.7, -0.02]}>
        <boxGeometry args={[0.72, 0.38, 0.68]} />
        <meshStandardMaterial color="#bfdbfe" roughness={0.58} />
      </mesh>
      {[-0.55, 0.55].map((x) =>
        [-0.46, 0.46].map((z) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 0.18, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.14, 12]} />
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
      <mesh castShadow position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.13, 0.2, 1.15, 8]} />
        <meshStandardMaterial color="#92400e" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 1.35, 0]}>
        <dodecahedronGeometry args={[0.68, 0]} />
        <meshStandardMaterial color={color} roughness={0.74} />
      </mesh>
    </group>
  )
}

function LampPiece({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.6, 8]} />
        <meshStandardMaterial color="#111827" roughness={0.78} />
      </mesh>
      <mesh castShadow position={[0, 1.72, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
      </mesh>
    </group>
  )
}
