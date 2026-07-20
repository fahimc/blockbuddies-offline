import type { CollisionBox } from './collision'
import type { Vec3 } from './types'

export const goKartTrack = {
  center: [116, 0, -42] as Vec3,
  width: 24,
  depth: 16,
  laneWidth: 3.2,
  barrierThickness: 0.35,
  barrierHeight: 0.48,
  borderClearance: 1.8,
}

export const goKartTrackTravelPosition: Vec3 = [
  goKartTrack.center[0],
  0,
  goKartTrack.center[2] + goKartTrack.depth / 2 + 4.2,
]

export function goKartTrackCollisionBoxes(): CollisionBox[] {
  const { center, width, depth, barrierThickness, barrierHeight } = goKartTrack
  const [cx, , cz] = center
  const y = barrierHeight / 2
  const horizontalHalf: Vec3 = [
    width / 2 + barrierThickness,
    y,
    barrierThickness / 2,
  ]
  const verticalHalf: Vec3 = [
    barrierThickness / 2,
    y,
    depth / 2 + barrierThickness,
  ]

  return [
    {
      id: 'go-kart-track:north-barrier',
      center: [cx, y, cz - depth / 2 - barrierThickness / 2],
      half: horizontalHalf,
    },
    {
      id: 'go-kart-track:south-barrier',
      center: [cx, y, cz + depth / 2 + barrierThickness / 2],
      half: horizontalHalf,
    },
    {
      id: 'go-kart-track:west-barrier',
      center: [cx - width / 2 - barrierThickness / 2, y, cz],
      half: verticalHalf,
    },
    {
      id: 'go-kart-track:east-barrier',
      center: [cx + width / 2 + barrierThickness / 2, y, cz],
      half: verticalHalf,
    },
  ]
}

export function pointInGoKartTrackClearance(position: Vec3, padding = 0) {
  return footprintIntersectsGoKartTrack(position, [0, 0, 0], padding)
}

export function footprintIntersectsGoKartTrack(
  center: Vec3,
  size: Vec3,
  padding = 0,
) {
  const halfWidth =
    goKartTrack.width / 2 + goKartTrack.borderClearance + padding + size[0] / 2
  const halfDepth =
    goKartTrack.depth / 2 + goKartTrack.borderClearance + padding + size[2] / 2
  return (
    Math.abs(center[0] - goKartTrack.center[0]) <= halfWidth &&
    Math.abs(center[2] - goKartTrack.center[2]) <= halfDepth
  )
}
