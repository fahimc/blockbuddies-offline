import { Trophy } from 'lucide-react'
import { createLocalLeaderboard } from '../ai/leaderboard'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

export function LeaderboardPanel() {
  const coins = useGameStore((state) => state.coins)
  const bestTime = useGameStore((state) => state.obby.bestTime)
  const memories = useGameStore((state) => state.botMemory)
  const playerName = useGameStore((state) => state.playerName)
  const rows = createLocalLeaderboard(coins, bestTime, memories, playerName)

  return (
    <Panel title="Leaderboard">
      <div className="space-y-2">
        {rows.map((row, index) => (
          <article
            key={row.username}
            className={`flex items-center justify-between rounded-lg p-3 ${
              row.isPlayer ? 'bg-amber-100' : 'bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-sm font-black text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="font-black">{row.username}</h3>
                <p className="text-xs font-bold text-slate-500">{row.label}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 font-black shadow-sm">
              <Trophy size={16} aria-hidden />
              {row.score}
            </span>
          </article>
        ))}
      </div>
    </Panel>
  )
}
