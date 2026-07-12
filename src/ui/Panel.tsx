import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useGameStore } from '../state/gameStore'

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  return (
    <section className="absolute right-3 top-20 z-30 max-h-[calc(100vh-6rem)] w-96 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-lg bg-white p-4 shadow-2xl">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <button type="button" onClick={() => setOpenPanel(undefined)} className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-900" title="Close">
          <X size={20} aria-hidden />
        </button>
      </header>
      {children}
    </section>
  )
}
