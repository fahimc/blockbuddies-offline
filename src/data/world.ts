import type { LocationId, Vec3 } from '../game/types'
import { footballPitch } from '../game/football'
import { goKartTrack, goKartTrackTravelPosition } from '../game/goKart'
import { footballStadiumTravelPosition } from './worldFeatures'

export type WorldLocation = {
  id: LocationId
  label: string
  description: string
  position: Vec3
  travelPosition: Vec3
  travelYaw: number
  color: string
}

export const worldLocations: WorldLocation[] = [
  {
    id: 'spawn',
    label: 'Spawn Plaza',
    description: 'Meet buddies in the centre of town.',
    position: [0, 0, 0],
    travelPosition: [0, 0, 4],
    travelYaw: Math.PI,
    color: '#38bdf8',
  },
  {
    id: 'park',
    label: 'Buddy Park',
    description: 'Relax, collect coins, and visit the clubhouse.',
    position: [-12, 0, -8],
    travelPosition: [-12, 0, -3.6],
    travelYaw: Math.PI,
    color: '#22c55e',
  },
  {
    id: 'shop',
    label: 'Coin Shop',
    description: 'Spend coins on new styles and accessories.',
    position: [12, 0, -7],
    travelPosition: [12, 0, -2.4],
    travelYaw: Math.PI,
    color: '#f97316',
  },
  {
    id: 'school',
    label: 'Skill School',
    description: 'Explore the school and meet learning buddies.',
    position: [-21, 0, 22],
    travelPosition: [-21, 0, 17.5],
    travelYaw: Math.PI,
    color: '#a78bfa',
  },
  {
    id: 'obby',
    label: 'Beginner Obby',
    description: 'Start the obstacle course and race for rewards.',
    position: [18, 0, 21],
    travelPosition: [15, 0, 20],
    travelYaw: Math.PI / 2,
    color: '#ef4444',
  },
  {
    id: 'houses',
    label: 'Buddy Houses',
    description: 'Visit homes, rest, and hang out with buddies.',
    position: [0, 0, 22],
    travelPosition: [0, 0, 17.3],
    travelYaw: Math.PI,
    color: '#facc15',
  },
  {
    id: 'parking',
    label: 'Buddy Parking',
    description: 'Pick a parked car and drive around town.',
    position: [14, 0, -17],
    travelPosition: [17.5, 0, -17.1],
    travelYaw: -Math.PI / 2,
    color: '#2563eb',
  },
  {
    id: 'football',
    label: 'Football Pitch',
    description: 'Kick footballs, practise skills, and score goals for coins.',
    position: footballPitch.center,
    travelPosition: footballStadiumTravelPosition,
    travelYaw: Math.PI,
    color: '#16a34a',
  },
  {
    id: 'kart',
    label: 'Go Kart Track',
    description: 'Choose a kart and start a three-lap driving race.',
    position: goKartTrack.center,
    travelPosition: goKartTrackTravelPosition,
    travelYaw: Math.PI,
    color: '#f97316',
  },
  {
    id: 'builder',
    label: 'Builder Meadows',
    description:
      'An open parcel district for roads, homes, and custom creations.',
    position: [67, 0, 54],
    travelPosition: [67, 0, 54],
    travelYaw: Math.PI,
    color: '#14b8a6',
  },
  {
    id: 'hall',
    label: 'Clocktower Hall',
    description: 'Visit the civic square and the town clocktower.',
    position: [0, 0, -34],
    travelPosition: [0, 0, -28.5],
    travelYaw: Math.PI,
    color: '#c08457',
  },
  {
    id: 'market',
    label: 'Buddy Market',
    description: 'Work a shopkeeper shift stocking and serving customers.',
    position: [82, 0, 88],
    travelPosition: [82, 0, 96],
    travelYaw: Math.PI,
    color: '#0ea5e9',
  },
  {
    id: 'restaurant',
    label: 'Sunny Bites',
    description: 'Prepare, cook, and serve meals for coins.',
    position: [98, 0, 88],
    travelPosition: [98, 0, 96],
    travelYaw: Math.PI,
    color: '#f97316',
  },
  {
    id: 'delivery',
    label: 'Buddy Delivery',
    description: 'Collect parcels and deliver them around the district.',
    position: [82, 0, 112],
    travelPosition: [82, 0, 120],
    travelYaw: Math.PI,
    color: '#8b5cf6',
  },
  {
    id: 'farm',
    label: 'Sunshine Farm',
    description: 'Plant, water, and harvest crops for coins.',
    position: [98, 0, 112],
    travelPosition: [98, 0, 120],
    travelYaw: Math.PI,
    color: '#16a34a',
  },
]

export function getLocation(id: LocationId) {
  return (
    worldLocations.find((location) => location.id === id) ?? worldLocations[0]
  )
}

export function distance2d(a: Vec3, b: Vec3) {
  const dx = a[0] - b[0]
  const dz = a[2] - b[2]
  return Math.hypot(dx, dz)
}
