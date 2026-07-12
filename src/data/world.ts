import type { LocationId, Vec3 } from '../game/types'

export type WorldLocation = {
  id: LocationId
  label: string
  position: Vec3
  color: string
}

export const worldLocations: WorldLocation[] = [
  { id: 'spawn', label: 'Spawn Plaza', position: [0, 0, 0], color: '#38bdf8' },
  { id: 'park', label: 'Buddy Park', position: [-12, 0, -8], color: '#22c55e' },
  { id: 'shop', label: 'Coin Shop', position: [12, 0, -7], color: '#f97316' },
  { id: 'school', label: 'Skill School', position: [-14, 0, 10], color: '#a78bfa' },
  { id: 'obby', label: 'Beginner Obby', position: [16, 0, 12], color: '#ef4444' },
  { id: 'houses', label: 'Buddy Houses', position: [1, 0, 18], color: '#facc15' },
]

export function getLocation(id: LocationId) {
  return worldLocations.find((location) => location.id === id) ?? worldLocations[0]
}

export function distance2d(a: Vec3, b: Vec3) {
  const dx = a[0] - b[0]
  const dz = a[2] - b[2]
  return Math.hypot(dx, dz)
}

export function clampToTown(position: Vec3): Vec3 {
  return [
    Math.max(-24, Math.min(24, position[0])),
    Math.max(0, position[1]),
    Math.max(-24, Math.min(24, position[2])),
  ]
}
