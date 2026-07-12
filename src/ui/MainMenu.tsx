import { Play, Settings } from 'lucide-react'

type MainMenuProps = {
  onPlay: () => void
}

export function MainMenu({ onPlay }: MainMenuProps) {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[linear-gradient(#7dd3fc_0%,#bae6fd_48%,#bbf7d0_49%,#86efac_100%)] p-4">
      <div className="w-full max-w-4xl rounded-lg border-4 border-white/80 bg-white/85 p-5 shadow-2xl backdrop-blur md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="text-left">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-emerald-700">
              Offline sandbox town
            </p>
            <h1 className="text-4xl font-black leading-tight text-slate-950 md:text-6xl">
              BlockBuddies Offline
            </h1>
            <p className="mt-4 max-w-2xl text-lg font-semibold text-slate-700">
              A bright blocky town full of local simulated buddies, quests, chat,
              coins, and mobile-friendly play.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onPlay}
                className="inline-flex min-h-14 items-center gap-2 rounded-lg bg-emerald-500 px-6 text-lg font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-600"
              >
                <Play aria-hidden size={24} />
                Play
              </button>
              <button
                type="button"
                className="inline-flex min-h-14 items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-5 text-lg font-black text-slate-800"
              >
                <Settings aria-hidden size={22} />
                Settings
              </button>
            </div>
          </div>

          <div className="relative min-h-72 overflow-hidden rounded-lg bg-sky-200">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-emerald-400" />
            <div className="absolute bottom-20 left-8 h-28 w-24 rounded bg-orange-300 shadow-lg" />
            <div className="absolute bottom-20 right-10 h-36 w-28 rounded bg-fuchsia-300 shadow-lg" />
            <div className="absolute bottom-16 left-1/2 h-20 w-14 -translate-x-1/2 rounded bg-blue-500 shadow-lg" />
            <div className="absolute bottom-36 left-1/2 h-12 w-12 -translate-x-1/2 rounded bg-amber-300 shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  )
}
