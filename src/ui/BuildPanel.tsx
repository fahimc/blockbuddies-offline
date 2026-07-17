import { Blocks, Map, RotateCw, Sparkles, Trash2 } from 'lucide-react'
import { buildPieceDefinitions } from '../data/buildPieces'
import type { BuildPieceId } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

const pieceIcons: Record<BuildPieceId, string> = {
  block: 'B',
  road: '=',
  house: 'H',
  building: 'T',
  shop: '$',
  car: 'C',
  tree: 'TR',
  lamp: 'L',
}

export function BuildPanel() {
  const buildMode = useGameStore((state) => state.buildMode)
  const selectedBuildPiece = useGameStore((state) => state.selectedBuildPiece)
  const selectedBuildColor = useGameStore((state) => state.selectedBuildColor)
  const buildRotation = useGameStore((state) => state.buildRotation)
  const placedBlocks = useGameStore((state) => state.placedBlocks)
  const setBuildMode = useGameStore((state) => state.setBuildMode)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const setSelectedBuildPiece = useGameStore(
    (state) => state.setSelectedBuildPiece,
  )
  const setSelectedBuildColor = useGameStore(
    (state) => state.setSelectedBuildColor,
  )
  const rotateBuildPiece = useGameStore((state) => state.rotateBuildPiece)
  const placeBlock = useGameStore((state) => state.placeBlock)
  const placeMapStamp = useGameStore((state) => state.placeMapStamp)
  const removeLastBlock = useGameStore((state) => state.removeLastBlock)
  const selectedPiece =
    buildPieceDefinitions.find((piece) => piece.id === selectedBuildPiece) ??
    buildPieceDefinitions[0]
  const colors = selectedPiece.colors

  return (
    <Panel title="Build">
      <label className="bb-setting-row mb-3">
        Build mode
        <span className={`bb-toggle ${buildMode ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={buildMode}
            onChange={(event) => {
              setBuildMode(event.target.checked)
              if (event.target.checked) setOpenPanel(undefined)
            }}
          />
          <span />
        </span>
      </label>

      <section className="bb-build-drawer" aria-label="Build drawer">
        <header>
          <strong>Select a piece</strong>
          <span>Drag or tap, then place on the green grid preview.</span>
        </header>
        <div>
          {buildPieceDefinitions.map((piece) => (
            <button
              key={piece.id}
              type="button"
              draggable
              onDragStart={() => {
                setSelectedBuildPiece(piece.id)
                setSelectedBuildColor(piece.defaultColor)
              }}
              onDragEnd={() => {
                setBuildMode(true)
                placeBlock()
                setOpenPanel(undefined)
              }}
              onClick={() => {
                setSelectedBuildPiece(piece.id)
                setSelectedBuildColor(piece.defaultColor)
                setBuildMode(true)
                setOpenPanel(undefined)
              }}
              className={`bb-build-piece ${selectedBuildPiece === piece.id ? 'selected' : ''}`}
              aria-label={piece.label}
              title={piece.label}
            >
              <span className="text-lg" aria-hidden>
                {pieceIcons[piece.id]}
              </span>
              <span>{piece.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-black">{selectedPiece.label}</h3>
            <p className="text-xs font-black uppercase text-slate-500">
              {selectedPiece.category}
            </p>
          </div>
          <span className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-black text-sky-800">
            {Math.round((buildRotation / (Math.PI * 2)) * 360)} deg
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedBuildColor(color)}
              className={`h-10 w-10 rounded-lg border-4 shadow ${selectedBuildColor === color ? 'border-slate-900' : 'border-white'}`}
              style={{ background: color }}
              title={color}
              aria-label={`Use colour ${color}`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={placeBlock}
          className="bb-build-action place"
        >
          <Blocks size={18} aria-hidden />
          Place
        </button>
        <button
          type="button"
          onClick={rotateBuildPiece}
          className="bb-build-action rotate"
        >
          <RotateCw size={18} aria-hidden />
          Rotate
        </button>
        <button
          type="button"
          onClick={placeMapStamp}
          className="bb-build-action map"
        >
          <Map size={18} aria-hidden />
          Auto Street
        </button>
        <button
          type="button"
          onClick={removeLastBlock}
          className="bb-build-action undo"
        >
          <Trash2 size={18} aria-hidden />
          Undo
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800">
        <span className="inline-flex items-center gap-2">
          <Sparkles size={16} aria-hidden />
          Custom world
        </span>
        <span>{placedBlocks.length}/240</span>
      </div>
    </Panel>
  )
}
