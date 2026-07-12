import { botProfiles } from '../data/botProfiles'
import { friendshipLabel } from '../ai/relationship'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

export function FriendshipPanel() {
  const memories = useGameStore((state) => state.botMemory)
  return (
    <Panel title="Buddy Profiles">
      <div className="space-y-3">
        {botProfiles.map((bot) => {
          const memory = memories[bot.id]
          const friendship = memory?.friendship ?? 0
          return (
            <article key={bot.id} className="bb-buddy-card">
              <div className="flex items-center gap-3">
                <span className="bb-buddy-avatar" style={{ background: bot.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-black text-slate-950">{bot.username}</h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">
                      {friendshipLabel(friendship)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500">Mood: {bot.mood} · Favorite: {bot.favoriteActivity}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-500" style={{ width: `${Math.min(100, friendship * 20)}%` }} />
                    </div>
                    <span className="text-xs font-black text-slate-500">Lv. {Math.max(1, friendship)}</span>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </Panel>
  )
}
