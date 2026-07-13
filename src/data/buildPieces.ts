import type { BuildPieceId } from '../game/types'

export type BuildPieceCategory = 'terrain' | 'structure' | 'prop'

export type BuildPieceDefinition = {
  id: BuildPieceId
  label: string
  category: BuildPieceCategory
  footprint: number
  y: number
  placeDistance: number
  defaultColor: string
  colors: string[]
}

export const buildPieceDefinitions: BuildPieceDefinition[] = [
  {
    id: 'block',
    label: 'Block',
    category: 'terrain',
    footprint: 1,
    y: 0.55,
    placeDistance: 2.2,
    defaultColor: '#38bdf8',
    colors: ['#38bdf8', '#22c55e', '#f97316', '#facc15', '#f472b6', '#a78bfa'],
  },
  {
    id: 'road',
    label: 'Road',
    category: 'terrain',
    footprint: 2,
    y: 0.05,
    placeDistance: 3,
    defaultColor: '#334155',
    colors: ['#334155', '#475569', '#64748b', '#f59e0b', '#0f172a', '#94a3b8'],
  },
  {
    id: 'house',
    label: 'House',
    category: 'structure',
    footprint: 3.1,
    y: 0.02,
    placeDistance: 4.2,
    defaultColor: '#60a5fa',
    colors: ['#60a5fa', '#f9a8d4', '#fbbf24', '#a78bfa', '#34d399', '#fb7185'],
  },
  {
    id: 'building',
    label: 'Tower',
    category: 'structure',
    footprint: 3.2,
    y: 0.02,
    placeDistance: 4.3,
    defaultColor: '#818cf8',
    colors: ['#818cf8', '#38bdf8', '#f97316', '#a3e635', '#fb7185', '#c084fc'],
  },
  {
    id: 'shop',
    label: 'Shop',
    category: 'structure',
    footprint: 3.4,
    y: 0.02,
    placeDistance: 4.4,
    defaultColor: '#f97316',
    colors: ['#f97316', '#ef4444', '#facc15', '#22c55e', '#38bdf8', '#f472b6'],
  },
  {
    id: 'car',
    label: 'Car',
    category: 'prop',
    footprint: 2.6,
    y: 0.18,
    placeDistance: 3.4,
    defaultColor: '#ef4444',
    colors: ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f97316', '#111827'],
  },
  {
    id: 'tree',
    label: 'Tree',
    category: 'prop',
    footprint: 1.4,
    y: 0.02,
    placeDistance: 2.6,
    defaultColor: '#16a34a',
    colors: ['#16a34a', '#22c55e', '#15803d', '#65a30d', '#0f766e', '#84cc16'],
  },
  {
    id: 'lamp',
    label: 'Lamp',
    category: 'prop',
    footprint: 0.9,
    y: 0.02,
    placeDistance: 2.3,
    defaultColor: '#facc15',
    colors: ['#facc15', '#fde68a', '#38bdf8', '#f472b6', '#a78bfa', '#fb923c'],
  },
]

export function getBuildPiece(id: BuildPieceId | undefined) {
  return buildPieceDefinitions.find((piece) => piece.id === id) ?? buildPieceDefinitions[0]
}
