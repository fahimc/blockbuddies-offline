import { Gift } from 'lucide-react'
import { questDefinitions } from '../data/quests'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

export function QuestPanel() {
  const progress = useGameStore((state) => state.questProgress)
  const startQuest = useGameStore((state) => state.startQuest)

  return (
    <Panel title="Quests">
      <div className="space-y-3">
        {questDefinitions.map((quest) => {
          const item = progress.find((entry) => entry.id === quest.id)
          const percent = item ? Math.round((item.progress / quest.target) * 100) : 0
          return (
            <article key={quest.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-slate-950">{quest.title}</h3>
                  <p className="text-sm font-semibold text-slate-600">{quest.description}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded bg-amber-200 px-2 py-1 text-xs font-black">
                  <Gift size={14} /> {quest.reward}
                </span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded bg-white">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, percent)}%` }} />
              </div>
              <button
                type="button"
                disabled={item?.started || item?.completed}
                onClick={() => startQuest(quest.id)}
                className="mt-3 min-h-10 rounded-lg bg-emerald-500 px-4 text-sm font-black text-white disabled:bg-slate-300"
              >
                {item?.completed ? 'Complete' : item?.started ? 'Started' : 'Start'}
              </button>
            </article>
          )
        })}
      </div>
    </Panel>
  )
}
