import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../state/gameStore'
import {
  isLightSaberId,
  lightSaberColors,
  useEquipmentStore,
} from '../state/equipmentStore'
import { avatarGroundOffset } from './scale'
import { lightSaberPreviewFromSearch } from './lightSaber'

export function WorldEquipment() {
  return <HoveringVoidOrb />
}

export function EquippedLightSaber() {
  const selectedSaber = useEquipmentStore((state) => state.selectedSaber)
  const saberActive = useEquipmentStore((state) => state.saberActive)
  const unlockedItems = useGameStore((state) => state.unlockedItems)
  const sleeping = useGameStore((state) => state.sleeping)
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const previewSaber = import.meta.env.DEV
    ? lightSaberPreviewFromSearch(window.location.search)
    : undefined
  const equippedSaber = previewSaber ?? selectedSaber
  const color = equippedSaber && isLightSaberId(equippedSaber)
    ? lightSaberColors[equippedSaber]
    : '#60a5fa'
  const visible = Boolean(
    equippedSaber &&
      (previewSaber || (saberActive && unlockedItems.includes(equippedSaber))) &&
      !sleeping &&
      !activeVehicleId,
  )

  if (!visible) return null

  return (
    <group data-testid="equipped-light-saber">
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.09, 0.36, 12]} />
        <meshStandardMaterial color="#263244" metalness={0.72} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.08, 12]} />
        <meshStandardMaterial color="#111827" metalness={0.55} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 1.48, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 1.45, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={4.5}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 0.72, 0]} color={color} intensity={1.5} distance={4} />
    </group>
  )
}

function HoveringVoidOrb() {
  const group = useRef<THREE.Group>(null)
  const accessory = useGameStore((state) => state.avatar.accessory)
  const sleeping = useGameStore((state) => state.sleeping)
  const visible = accessory === 'pet-void-orb' && !sleeping

  useFrame(({ clock }) => {
    if (!group.current || !visible) return
    const { playerPosition, playerYaw } = useGameStore.getState()
    const rightX = Math.cos(playerYaw)
    const rightZ = -Math.sin(playerYaw)
    const forwardX = Math.sin(playerYaw)
    const forwardZ = Math.cos(playerYaw)
    const time = clock.getElapsedTime()
    const bob = Math.sin(time * 2.25) * 0.12
    const sway = Math.sin(time * 0.9) * 0.12

    group.current.position.set(
      playerPosition[0] - rightX * (0.9 + sway) - forwardX * 0.45,
      playerPosition[1] + avatarGroundOffset + 1.0 + bob,
      playerPosition[2] - rightZ * (0.9 + sway) - forwardZ * 0.45,
    )
    group.current.rotation.y = time * 0.7
  })

  if (!visible) return null

  return (
    <group ref={group} data-testid="hovering-void-orb">
      <mesh castShadow>
        <sphereGeometry args={[0.29, 20, 16]} />
        <meshStandardMaterial
          color="#080611"
          emissive="#4c1d95"
          emissiveIntensity={0.65}
          metalness={0.25}
          roughness={0.38}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.035, 8, 28]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#7c3aed"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
      {[-0.52, -0.26, 0, 0.26, 0.52].map((angle, index) => (
        <mesh
          key={angle}
          castShadow
          position={[Math.sin(angle) * 0.18, -0.34, Math.cos(angle) * 0.12]}
          rotation={[0.15 + index * 0.03, 0, angle]}
        >
          <cylinderGeometry args={[0.035, 0.055, 0.38 + index * 0.025, 8]} />
          <meshStandardMaterial
            color="#160d29"
            emissive="#5b21b6"
            emissiveIntensity={0.35}
            roughness={0.62}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0.27]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        <meshStandardMaterial
          color="#f5f3ff"
          emissive="#c4b5fd"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
      <pointLight color="#8b5cf6" intensity={0.9} distance={3.5} />
    </group>
  )
}
