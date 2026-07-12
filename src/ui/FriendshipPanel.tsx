import { botProfiles } from '../data/botProfiles'
import { friendshipLabel } from '../ai/relationship'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

export function FriendshipPanel() {
  const memories = useGameStore((state) => state.botMemory)
  return (
    <Panel title="Buddies">
      <div className="space-y-2">
        {botProfiles.map((bot) => {
          const memory = memories[bot.id]
          return (
            <article key={bot.id} className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded" style={{ background: bot.color }} />
                <div>
                  <h3 className="font-black">{bot.username}</h3>
                  <p className="text-sm font-bold text-slate-500">
                    {friendshipLabel(memory?.friendship ?? 0)} · met {memory?.timesMet ?? 0}
                  </p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </Panel>
  )
}
