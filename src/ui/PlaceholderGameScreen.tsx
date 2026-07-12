import { ArrowLeft, Coins } from 'lucide-react'

type PlaceholderGameScreenProps = {
  onExit: () => void
}

export function PlaceholderGameScreen({ onExit }: PlaceholderGameScreenProps) {
  return (
    <section className="relative flex min-h-screen flex-col bg-sky-200">
      <header className="flex items-center justify-between gap-3 bg-white/90 p-3 shadow">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-slate-900 px-4 font-black text-white"
        >
          <ArrowLeft aria-hidden size={20} />
          Menu
        </button>
        <div className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 font-black">
          <Coins aria-hidden size={20} />
          0
        </div>
      </header>
      <div className="grid flex-1 place-items-center p-4 text-center">
        <div className="rounded-lg border-4 border-white bg-white/80 p-6 shadow-xl">
          <h2 className="text-3xl font-black">Game Scene Placeholder</h2>
          <p className="mt-2 max-w-xl font-semibold text-slate-700">
            Phase 1 replaces this with the playable 3D town, controller, HUD,
            and touch controls.
          </p>
        </div>
      </div>
    </section>
  )
}
