import type { BuildPieceId } from '../game/types'
import { buildPieceDimensions, realScale } from '../game/scale'

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
    footprint: realScale.roadTile,
    y: 0.05,
    placeDistance: 4.8,
    defaultColor: '#334155',
    colors: ['#334155', '#475569', '#64748b', '#f59e0b', '#0f172a', '#94a3b8'],
  },
  {
    id: 'house',
    label: 'House',
    category: 'structure',
    footprint: Math.max(buildPieceDimensions.house.width, buildPieceDimensions.house.depth),
    y: 0.02,
    placeDistance: 5.8,
    defaultColor: '#60a5fa',
    colors: ['#60a5fa', '#f9a8d4', '#fbbf24', '#a78bfa', '#34d399', '#fb7185'],
  },
  {
    id: 'building',
    label: 'Tower',
    category: 'structure',
    footprint: Math.max(buildPieceDimensions.building.width, buildPieceDimensions.building.depth),
    y: 0.02,
    placeDistance: 6.4,
    defaultColor: '#818cf8',
    colors: ['#818cf8', '#38bdf8', '#f97316', '#a3e635', '#fb7185', '#c084fc'],
  },
  {
    id: 'shop',
    label: 'Shop',
    category: 'structure',
    footprint: Math.max(buildPieceDimensions.shop.width, buildPieceDimensions.shop.depth),
    y: 0.02,
    placeDistance: 6.8,
    defaultColor: '#f97316',
    colors: ['#f97316', '#ef4444', '#facc15', '#22c55e', '#38bdf8', '#f472b6'],
  },
  {
    id: 'car',
    label: 'Car',
    category: 'prop',
    footprint: buildPieceDimensions.car.length,
    y: 0,
    placeDistance: 5.6,
    defaultColor: '#ef4444',
    colors: ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f97316', '#111827'],
  },
  {
    id: 'tree',
    label: 'Tree',
    category: 'prop',
    footprint: buildPieceDimensions.tree.footprint,
    y: 0.02,
    placeDistance: 3.4,
    defaultColor: '#16a34a',
    colors: ['#16a34a', '#22c55e', '#15803d', '#65a30d', '#0f766e', '#84cc16'],
  },
  {
    id: 'lamp',
    label: 'Lamp',
    category: 'prop',
    footprint: buildPieceDimensions.lamp.footprint,
    y: 0.02,
    placeDistance: 2.3,
    defaultColor: '#facc15',
    colors: ['#facc15', '#fde68a', '#38bdf8', '#f472b6', '#a78bfa', '#fb923c'],
  },
]

export function getBuildPiece(id: BuildPieceId | undefined) {
  return buildPieceDefinitions.find((piece) => piece.id === id) ?? buildPieceDefinitions[0]
}
