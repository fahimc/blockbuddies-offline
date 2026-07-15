import {
  Clock3,
  Coins,
  Gamepad2,
  MapPin,
  Play,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { miniGameDefinitions, miniGameDefinition } from '../ai/miniGames'
import type { MiniGameId } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

const gameTones: Record<MiniGameId, string> = {
  'coin-rush': 'from-amber-300 to-orange-500',
  'delivery-dash': 'from-emerald-300 to-teal-500',
  'hide-and-seek': 'from-fuchsia-300 to-indigo-500',
}

export function MiniGamesPanel() {
  const miniGame = useGameStore((state) => state.miniGame)
  const startMiniGame = useGameStore((state) => state.startMiniGame)
  const cancelMiniGame = useGameStore((state) => state.cancelMiniGame)
  const beginObby = useGameStore((state) => state.beginObby)
  const obby = useGameStore((state) => state.obby)
  const activeDefinition = miniGame.activeId
    ? miniGameDefinition(miniGame.activeId)
    : undefined

  return (
    <div data-testid="mini-games-panel">
      <Panel title="Mini Games">
        <div className="mb-3 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-50 p-3 shadow-inner">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <Gamepad2 size={24} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-black text-slate-950">
                Original blocky activities
              </h3>
              <p className="text-sm font-bold text-slate-600">
                Pick a fast offline activity, earn coins, and let the buddies
                cheer you on.
              </p>
            </div>
          </div>
          {activeDefinition ? (
            <div className="mt-3 rounded-xl bg-white/90 p-3 text-sm font-black text-slate-800 shadow">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <Trophy size={17} aria-hidden />
                  {activeDefinition.title}
                </span>
                <span>
                  {miniGame.score}/{miniGame.target} · {miniGame.points} pts
                </span>
              </div>
              {miniGame.status === 'running' ? (
                <button
                  type="button"
                  onClick={cancelMiniGame}
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-white"
                >
                  <RotateCcw size={18} aria-hidden />
                  Cancel Mini Game
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {miniGameDefinitions.map((game) => {
            const record = miniGame.records[game.id]
            const isActive =
              miniGame.activeId === game.id && miniGame.status === 'running'
            const isCoinRush = game.id === 'coin-rush'
            return (
              <article
                key={game.id}
                className={`overflow-hidden rounded-2xl bg-white shadow ${isCoinRush ? 'ring-4 ring-amber-300' : ''}`}
              >
                <div className={`h-2 bg-gradient-to-r ${gameTones[game.id]}`} />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-slate-950">
                        {game.title}
                      </h3>
                      <p className="text-sm font-bold text-slate-600">
                        {game.description}
                      </p>
                      {isCoinRush ? (
                        <p className="mt-1 text-xs font-black uppercase text-amber-600">
                          Featured: collect coins, stack points, beat the clock.
                        </p>
                      ) : null}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-300 px-2.5 py-1 text-sm font-black text-slate-950 shadow">
                      <Coins size={15} aria-hidden />
                      {game.reward}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1">
                      <MapPin size={14} aria-hidden />
                      {game.objective}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1">
                      <Clock3 size={14} aria-hidden />
                      <strong className="text-slate-950">{Math.round(game.durationMs / 1000)}s</strong>
                    </span>
                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-800">
                      Points {game.pointsPerTarget} each + {game.completionBonus}
                    </span>
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-800">
                      Plays {record?.plays ?? 0}
                    </span>
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-800">
                      Best {record?.bestScore ?? 0}/{game.target}
                      {record?.bestTime ? ` in ${record.bestTime}s` : ''}
                    </span>
                    <span className="rounded-lg bg-fuchsia-50 px-2 py-1 text-fuchsia-800">
                      Best points {record?.bestPoints ?? 0}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => startMiniGame(game.id, performance.now())}
                    className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-lime-400 to-emerald-600 px-4 text-base font-black text-white shadow-lg"
                  >
                    <Play size={19} fill="currentColor" aria-hidden />
                    {isActive ? 'Restart' : 'Play'} {game.title}
                  </button>
                </div>
              </article>
            )
          })}

          <article className="rounded-2xl bg-slate-950 p-3 text-white shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">Beginner Obby</h3>
                <p className="text-sm font-bold text-slate-300">
                  Classic platform course with checkpoints and a finish reward.
                </p>
              </div>
              <Trophy
                size={24}
                className="shrink-0 text-amber-300"
                aria-hidden
              />
            </div>
            <button
              type="button"
              onClick={() => beginObby(performance.now())}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-base font-black text-white shadow"
            >
              <Play size={19} fill="currentColor" aria-hidden />
              {obby.active ? 'Restart Obby' : 'Play Beginner Obby'}
            </button>
          </article>
        </div>
      </Panel>
    </div>
  )
}
