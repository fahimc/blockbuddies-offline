import { Blocks, Trash2 } from 'lucide-react'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

const colors = ['#38bdf8', '#22c55e', '#f97316', '#facc15', '#f472b6', '#a78bfa']

export function BuildPanel() {
  const buildMode = useGameStore((state) => state.buildMode)
  const selectedBuildColor = useGameStore((state) => state.selectedBuildColor)
  const placedBlocks = useGameStore((state) => state.placedBlocks)
  const setBuildMode = useGameStore((state) => state.setBuildMode)
  const setSelectedBuildColor = useGameStore((state) => state.setSelectedBuildColor)
  const placeBlock = useGameStore((state) => state.placeBlock)
  const removeLastBlock = useGameStore((state) => state.removeLastBlock)

  return (
    <Panel title="Build">
      <label className="mb-3 flex min-h-11 items-center justify-between rounded-lg bg-slate-100 px-3 font-black">
        Build mode
        <input type="checkbox" checked={buildMode} onChange={(event) => setBuildMode(event.target.checked)} className="h-6 w-6" />
      </label>
      <h3 className="mb-2 font-black">Block colour</h3>
      <div className="mb-4 flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setSelectedBuildColor(color)}
            className={`h-10 w-10 rounded-lg border-4 shadow ${selectedBuildColor === color ? 'border-slate-900' : 'border-white'}`}
            style={{ background: color }}
            title={color}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={placeBlock} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 font-black text-white">
          <Blocks size={18} aria-hidden />
          Place
        </button>
        <button type="button" onClick={removeLastBlock} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 font-black text-white">
          <Trash2 size={18} aria-hidden />
          Undo
        </button>
      </div>
      <p className="mt-3 text-sm font-bold text-slate-500">Placed blocks: {placedBlocks.length}</p>
    </Panel>
  )
}
