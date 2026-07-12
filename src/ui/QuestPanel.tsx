import { CheckCircle2, Clock, Gift } from 'lucide-react'
import { questDefinitions } from '../data/quests'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

export function QuestPanel() {
  const progress = useGameStore((state) => state.questProgress)
  const startQuest = useGameStore((state) => state.startQuest)

  return (
    <Panel title="Quest Log">
      <div className="bb-tabs mb-3 grid grid-cols-3 gap-1 rounded-xl bg-sky-950/10 p-1">
        <span className="bb-tab-active">Active</span>
        <span>Daily</span>
        <span>Completed</span>
      </div>
      <div className="space-y-2">
        {questDefinitions.map((quest) => {
          const item = progress.find((entry) => entry.id === quest.id)
          const percent = item ? Math.round((item.progress / quest.target) * 100) : 0
          return (
            <article key={quest.id} className="bb-quest-row">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow">
                {item?.completed ? <CheckCircle2 size={22} aria-hidden /> : <Clock size={22} aria-hidden />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-black text-slate-950">{quest.title}</h3>
                    <p className="truncate text-xs font-bold text-slate-500">{quest.description}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-300 px-2 py-1 text-xs font-black text-slate-950">
                    <Gift size={14} /> {quest.reward}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-500" style={{ width: `${Math.min(100, percent)}%` }} />
                  </div>
                  <span className="text-xs font-black text-slate-600">
                    {item?.progress ?? 0}/{quest.target}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={item?.started || item?.completed}
                onClick={() => startQuest(quest.id)}
                className="bb-small-action"
              >
                {item?.completed ? 'Complete' : item?.started ? 'Started' : 'Start'}
              </button>
            </article>
          )
        })}
      </div>
      <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-500">
        New quests in: 12h 36m
      </p>
    </Panel>
  )
}
