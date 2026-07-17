import {
  Blocks,
  Box,
  Building2,
  CarFront,
  House,
  LampDesk,
  Route,
  Store,
  Trash2,
  TreePine,
  X,
  type LucideIcon,
} from 'lucide-react'
import { buildPieceDefinitions } from '../data/buildPieces'
import type { BuildPieceId } from '../game/types'
import { useGameStore } from '../state/gameStore'

const pieceIcons: Record<BuildPieceId, LucideIcon> = {
  block: Box,
  road: Route,
  house: House,
  building: Building2,
  shop: Store,
  car: CarFront,
  tree: TreePine,
  lamp: LampDesk,
}

export function BuildHudPalette() {
  const buildMode = useGameStore((state) => state.buildMode)
  const selectedBuildPiece = useGameStore((state) => state.selectedBuildPiece)
  const selectedBuildBlockId = useGameStore(
    (state) => state.selectedBuildBlockId,
  )
  const setBuildMode = useGameStore((state) => state.setBuildMode)
  const setSelectedBuildPiece = useGameStore(
    (state) => state.setSelectedBuildPiece,
  )
  const setSelectedBuildColor = useGameStore(
    (state) => state.setSelectedBuildColor,
  )
  const removeSelectedBlock = useGameStore((state) => state.removeSelectedBlock)

  if (!buildMode) return null

  return (
    <aside className="bb-build-hud-palette" aria-label="Build pieces">
      <header>
        <Blocks size={19} aria-hidden />
        <strong>Build</strong>
        <button
          type="button"
          onClick={() => setBuildMode(false)}
          aria-label="Exit build mode"
          title="Exit build mode"
        >
          <X size={18} aria-hidden />
        </button>
      </header>

      <nav aria-label="Select build piece">
        {buildPieceDefinitions.map((piece) => {
          const Icon = pieceIcons[piece.id]
          const selected = selectedBuildPiece === piece.id
          return (
            <button
              key={piece.id}
              type="button"
              className={selected ? 'selected' : ''}
              aria-label={`Build ${piece.label}`}
              aria-pressed={selected}
              title={piece.label}
              onClick={() => {
                setSelectedBuildPiece(piece.id)
                setSelectedBuildColor(piece.defaultColor)
              }}
            >
              <Icon size={21} aria-hidden />
              <span>{piece.label}</span>
            </button>
          )
        })}
      </nav>

      <button
        type="button"
        className="bb-build-hud-remove"
        disabled={!selectedBuildBlockId}
        onClick={removeSelectedBlock}
        aria-label="Remove selected build item"
        title={
          selectedBuildBlockId
            ? 'Remove selected item'
            : 'Tap a built item first'
        }
      >
        <Trash2 size={19} aria-hidden />
        <span>{selectedBuildBlockId ? 'Remove' : 'Select item'}</span>
      </button>
    </aside>
  )
}
