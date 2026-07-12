import { useFrame } from '@react-three/fiber'
import { useKeyboardControls, Html } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { botProfiles } from '../data/botProfiles'
import { worldLocations, distance2d } from '../data/world'
import { nearestLocation, useGameStore } from '../state/gameStore'
import type { BotRuntime, Vec3 } from './types'

const obbyCheckpoints: Vec3[] = [
  [16, 0.8, 12],
  [18.5, 1.8, 13.5],
  [20.5, 3.1, 16],
  [22, 4.6, 18],
]

export function GameScene() {
  return (
    <>
      <Town />
      <PlayerController />
      <Bots />
      <ObbyCourse />
      <CoinField />
      <ToyPickup />
    </>
  )
}

function Town() {
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <mesh receiveShadow position={[0, -0.08, 0]}>
          <boxGeometry args={[54, 0.16, 54]} />
          <meshStandardMaterial color="#5ee46f" />
        </mesh>
        <CuboidCollider args={[27, 0.08, 27]} position={[0, -0.08, 0]} />
      </RigidBody>

      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 48]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {worldLocations.map((location) => (
        <group key={location.id} position={location.position}>
          <Html center position={[0, 3.2, 0]}>
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

      {[-18, -8, 8, 18].map((x) => (
        <Tree key={x} position={[x, 0, -17]} />
      ))}
      {[-16, -5, 6, 17].map((z) => (
        <Tree key={z} position={[-20, 0, z]} />
      ))}
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
  const position = useRef(new THREE.Vector3(0, 0.9, 4))
  const setPlayer = useGameStore((state) => state.setPlayer)
  const touch = useGameStore((state) => state.touch)
  const avatar = useGameStore((state) => state.avatar)
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

  useFrame((state, delta) => {
    const keys = getKeys()
    const forward = Number(keys.forward) - Number(keys.back) + -touch.y
    const strafe = Number(keys.right) - Number(keys.left) + touch.x
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
    position.current.x = THREE.MathUtils.clamp(position.current.x, -25, 25)
    position.current.z = THREE.MathUtils.clamp(position.current.z, -25, 25)

    if (position.current.y < -2 && obby.active) {
      position.current.set(obby.checkpoint[0], obby.checkpoint[1] + 0.8, obby.checkpoint[2])
      velocityY.current = 0
    }

    group.current?.position.copy(position.current)
    if (group.current) group.current.rotation.y = yaw.current
    const cameraTarget = position.current.clone().add(new THREE.Vector3(Math.sin(yaw.current) * -8, 5, Math.cos(yaw.current) * -8))
    state.camera.position.lerp(cameraTarget, 0.12)
    state.camera.lookAt(position.current.x, position.current.y + 1.4, position.current.z)
    setPlayer([position.current.x, position.current.y - 0.9, position.current.z], yaw.current)

    const nearby = nearestLocation([position.current.x, 0, position.current.z])
    setNearbyLocation(nearby)
    if (nearby === 'park') advanceQuest('visit-park', 1)
    if (nearby === 'obby' && (keys.interact || touch.interact) && !obby.active) beginObby(performance.now())
    if (nearby === 'shop' && (keys.interact || touch.interact)) useGameStore.getState().setOpenPanel('shop')

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
      <BlockAvatar bodyColor={avatar.bodyColor} shirtColor={avatar.shirtColor} username="You" hat={avatar.hat !== 'none'} />
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
  const bounce = bot.action === 'jump' ? Math.sin(performance.now() / 110) * 0.25 : 0
  return (
    <group position={[bot.position[0], 0.9 + Math.max(0, bounce), bot.position[2]]}>
      <BlockAvatar bodyColor={color} shirtColor={shirtColor} username={username} hat={bot.action === 'cheer'} />
      {bot.speech && bot.speechUntil > Date.now() ? (
        <Html center position={[0, 3.2, 0]}>
          <div className="max-w-40 rounded-lg bg-white px-3 py-2 text-center text-xs font-black text-slate-900 shadow">
            {bot.speech}
          </div>
        </Html>
      ) : null}
    </group>
  )
}

function BlockAvatar({ bodyColor, shirtColor, username, hat }: { bodyColor: string; shirtColor: string; username: string; hat?: boolean }) {
  return (
    <group>
      <Html center position={[0, 2.7, 0]}>
        <span className="whitespace-nowrap rounded bg-slate-950/80 px-2 py-1 text-xs font-black text-white shadow">
          {username}
        </span>
      </Html>
      <mesh castShadow position={[0, 1.8, 0]}>
        <boxGeometry args={[0.72, 0.72, 0.72]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {hat ? (
        <mesh castShadow position={[0, 2.28, 0]}>
          <cylinderGeometry args={[0.38, 0.5, 0.18, 5]} />
          <meshStandardMaterial color="#fde047" />
        </mesh>
      ) : null}
      <mesh castShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.9, 0.9, 0.5]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      <mesh castShadow position={[-0.62, 1.05, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh castShadow position={[0.62, 1.05, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh castShadow position={[-0.25, 0.35, 0]}>
        <boxGeometry args={[0.28, 0.7, 0.28]} />
        <meshStandardMaterial color="#1d4ed8" />
      </mesh>
      <mesh castShadow position={[0.25, 0.35, 0]}>
        <boxGeometry args={[0.28, 0.7, 0.28]} />
        <meshStandardMaterial color="#1d4ed8" />
      </mesh>
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
