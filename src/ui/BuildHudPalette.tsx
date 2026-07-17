import {
  Blocks,
  Box,
  Building2,
  CarFront,
  House,
  LampDesk,
  RotateCw,
  Route,
  Save,
  Store,
  Trash2,
  TreePine,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const selectedBuildBlock = useGameStore((state) =>
    state.placedBlocks.find((block) => block.id === state.selectedBuildBlockId),
  )
  const renameSelectedBuildBlock = useGameStore(
    (state) => state.renameSelectedBuildBlock,
  )
  const rotateBuildPiece = useGameStore((state) => state.rotateBuildPiece)
  const removeSelectedBlock = useGameStore((state) => state.removeSelectedBlock)
  const [houseName, setHouseName] = useState('')

  useEffect(() => {
    setHouseName(selectedBuildBlock?.name ?? 'My House')
  }, [selectedBuildBlock?.id, selectedBuildBlock?.name])

  if (!buildMode) return null

  return (
    <>
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

      {selectedBuildBlock?.kind === 'house' ? (
        <form
          className="bb-build-house-editor"
          aria-label="Selected house"
          onSubmit={(event) => {
            event.preventDefault()
            renameSelectedBuildBlock(houseName)
          }}
        >
          <header>
            <House size={20} aria-hidden />
            <div>
              <strong>House selected</strong>
              <small>The arrow points to the door.</small>
            </div>
          </header>
          <label>
            <span>House name</span>
            <input
              value={houseName}
              onChange={(event) => setHouseName(event.target.value)}
              maxLength={24}
              aria-label="House name"
              autoComplete="off"
              enterKeyHint="done"
            />
          </label>
          <div className="bb-build-house-actions">
            <button type="submit" aria-label="Save house name">
              <Save size={17} aria-hidden />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={rotateBuildPiece}
              aria-label="Rotate selected house"
            >
              <RotateCw size={17} aria-hidden />
              <span>Rotate</span>
            </button>
          </div>
        </form>
      ) : null}
    </>
  )
}
