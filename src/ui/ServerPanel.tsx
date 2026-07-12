import { botProfiles } from '../data/botProfiles'
import type { BotState } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

const stateLabels: Record<BotState, string> = {
  idle: 'hanging out',
  wander: 'exploring',
  go_to_location: 'heading over',
  greet_player: 'saying hi',
  do_activity: 'playing',
  leave_area: 'moving on',
}

export function ServerPanel() {
  const bots = useGameStore((state) => state.bots)
  const botReact = useGameStore((state) => state.botReact)

  return (
    <Panel title="Local Server">
      <article className="mb-3 rounded-lg bg-amber-100 p-3">
        <h3 className="font-black">You</h3>
        <p className="text-sm font-bold text-slate-600">online · host player</p>
      </article>
      <div className="space-y-2">
        {bots.map((bot) => {
          const profile = botProfiles.find((entry) => entry.id === bot.id) ?? botProfiles[0]
          return (
            <article key={bot.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
              <div className="min-w-0">
                <h3 className="truncate font-black">{profile.username}</h3>
                <p className="text-xs font-bold text-slate-500">
                  {stateLabels[bot.state]} · {bot.goal}
                </p>
              </div>
              <button type="button" onClick={() => botReact(bot.id, 'quick-play')} className="min-h-10 rounded-lg bg-sky-500 px-3 text-sm font-black text-white">
                Invite
              </button>
            </article>
          )
        })}
      </div>
    </Panel>
  )
}
