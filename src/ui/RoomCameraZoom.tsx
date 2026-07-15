import { ZoomIn, ZoomOut } from 'lucide-react'
import { useGameStore } from '../state/gameStore'

export function RoomCameraZoom() {
  const activeInterior = useGameStore((state) => state.activeInterior)
  const zoom = useGameStore((state) => state.settings.interiorCameraZoom)
  const updateSettings = useGameStore((state) => state.updateSettings)

  if (!activeInterior) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex justify-center px-4 max-sm:top-24">
      <label className="pointer-events-auto flex w-full max-w-[360px] items-center gap-2 rounded-2xl border-2 border-white/80 bg-slate-950/80 px-3 py-2 text-xs font-black text-white shadow-2xl backdrop-blur">
        <ZoomIn size={17} aria-hidden />
        <input
          type="range"
          min="0.85"
          max="1.85"
          step="0.05"
          value={zoom}
          aria-label="Room camera zoom"
          className="h-2 min-w-0 flex-1 accent-sky-300"
          onChange={(event) => updateSettings({ interiorCameraZoom: Number(event.target.value) })}
        />
        <ZoomOut size={17} aria-hidden />
        <span className="min-w-12 text-right">{Math.round(zoom * 100)}%</span>
      </label>
    </div>
  )
}
