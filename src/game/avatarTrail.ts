import type { ShopItemId, Vec3 } from './types'

export type AvatarTrailPieceKind = 'ribbon' | 'spark'

export type AvatarTrailPiece = {
  id: string
  kind: AvatarTrailPieceKind
  color: string
  emissive: string
  opacity: number
  position: Vec3
  rotation: Vec3
  size: Vec3
}

const trailPalettes: Record<
  string,
  { colors: string[]; sparkColors: string[]; length: number }
> = {
  'trail-rainbow': {
    colors: ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#8b5cf6'],
    sparkColors: ['#ffffff', '#fde047', '#38bdf8'],
    length: 1.35,
  },
  'trail-neon': {
    colors: ['#22d3ee', '#38bdf8', '#d946ef', '#f0abfc'],
    sparkColors: ['#67e8f9', '#f0abfc', '#ffffff'],
    length: 1.25,
  },
  'trail-galaxy': {
    colors: ['#312e81', '#7c3aed', '#d946ef', '#facc15'],
    sparkColors: ['#facc15', '#ffffff', '#a78bfa'],
    length: 1.42,
  },
  'trail-stars': {
    colors: ['#facc15', '#fde047', '#ffffff', '#f59e0b'],
    sparkColors: ['#ffffff', '#facc15', '#fde68a'],
    length: 1.18,
  },
  'trail-spark': {
    colors: ['#f0abfc', '#fb7185', '#fde047', '#38bdf8'],
    sparkColors: ['#fde047', '#ffffff', '#f0abfc'],
    length: 1.08,
  },
}

const fallbackTrail = trailPalettes['trail-spark']

export function avatarTrailPieces(
  trail: ShopItemId | 'none',
): AvatarTrailPiece[] {
  if (trail === 'none') return []
  const palette = trailPalettes[trail] ?? fallbackTrail
  const centerOffset = (palette.colors.length - 1) / 2

  const ribbons: AvatarTrailPiece[] = palette.colors.map((color, index) => ({
    id: `${trail}-ribbon-${index}`,
    kind: 'ribbon',
    color,
    emissive: color,
    opacity: Math.max(0.42, 0.82 - index * 0.06),
    position: [
      (index - centerOffset) * 0.11,
      0.24 + (index % 2) * 0.08,
      -0.58 - index * 0.13,
    ],
    rotation: [0.02 + index * 0.015, 0, (index - centerOffset) * 0.07],
    size: [0.12, 0.055, palette.length - index * 0.08],
  }))

  const sparks: AvatarTrailPiece[] = palette.sparkColors.map(
    (color, index) => ({
      id: `${trail}-spark-${index}`,
      kind: 'spark',
      color,
      emissive: color,
      opacity: 0.88,
      position: [
        index === 1 ? 0.18 : -0.2 + index * 0.1,
        0.38 + index * 0.12,
        -0.78 - index * 0.34,
      ],
      rotation: [0.4 + index * 0.2, 0.2, 0.75 + index * 0.45],
      size: [0.075 + index * 0.015, 0.075 + index * 0.015, 0.075],
    }),
  )

  return [...ribbons, ...sparks]
}
