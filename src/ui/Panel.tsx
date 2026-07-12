import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useGameStore } from '../state/gameStore'

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  return (
    <section className="bb-panel absolute right-3 top-20 z-30 max-h-[calc(100vh-6rem)] w-[27rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="bb-panel-header flex items-center justify-between gap-2 px-4 py-3">
        <h2 className="text-xl font-black text-white drop-shadow">{title}</h2>
        <button type="button" onClick={() => setOpenPanel(undefined)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/95 text-sky-700 shadow" title="Close">
          <X size={20} aria-hidden />
        </button>
      </header>
      <div className="bb-panel-body max-h-[calc(100vh-10.5rem)] overflow-y-auto p-4">{children}</div>
    </section>
  )
}
