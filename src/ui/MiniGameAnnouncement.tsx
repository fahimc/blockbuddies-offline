import { Clock3, Coins, Gamepad2, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { miniGameDefinition } from '../ai/miniGames'
import { useGameStore } from '../state/gameStore'

const announcementDurationMs = 9000

export function MiniGameAnnouncement() {
  const miniGame = useGameStore((state) => state.miniGame)
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(performance.now()), 250)
    return () => window.clearInterval(interval)
  }, [])

  if (miniGame.status !== 'running' || !miniGame.activeId || !miniGame.announcement) return null
  if (now - miniGame.announcement.startedAt > announcementDurationMs) return null

  const definition = miniGameDefinition(miniGame.activeId)
  const seconds = Math.max(0, Math.ceil((miniGame.endsAt - now) / 1000))

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-4 max-md:top-16">
      <section
        data-testid="mini-game-announcement"
        className="pointer-events-auto w-[26rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[1.35rem] border-4 border-white bg-slate-950 text-white shadow-2xl"
      >
        <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide">
              <Gamepad2 size={18} aria-hidden />
              Server Mini Game
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700">
              All players
            </span>
          </div>
        </div>

        <div className="space-y-3 p-4 text-center">
          <div>
            <p className="text-xs font-black uppercase text-amber-300">Started now</p>
            <h2 className="text-3xl font-black leading-none drop-shadow">{definition.title}</h2>
          </div>
          <p className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-sky-50">
            {miniGame.announcement.message}
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs font-black">
            <span className="rounded-2xl bg-amber-300 px-2 py-2 text-slate-950">
              <Coins className="mx-auto mb-1" size={18} aria-hidden />
              +{definition.reward}
            </span>
            <span className="rounded-2xl bg-white px-2 py-2 text-slate-950">
              <Trophy className="mx-auto mb-1" size={18} aria-hidden />
              {definition.target} goals
            </span>
            <span className="rounded-2xl bg-rose-500 px-2 py-2 text-white">
              <Clock3 className="mx-auto mb-1" size={18} aria-hidden />
              <strong className="text-lg leading-none">{seconds}s</strong>
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
