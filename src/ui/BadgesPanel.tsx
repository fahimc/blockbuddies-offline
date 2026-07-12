import { badgeDefinitions } from '../data/badges'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

export function BadgesPanel() {
  const earnedBadges = useGameStore((state) => state.earnedBadges)

  return (
    <Panel title="Badges">
      <div className="grid grid-cols-2 gap-3">
        {badgeDefinitions.map((badge) => {
          const earned = earnedBadges.includes(badge.id)
          return (
            <article
              key={badge.id}
              className={`rounded-lg border p-3 ${earned ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50 opacity-70'}`}
            >
              <span className="mb-2 grid h-11 w-11 place-items-center rounded-lg bg-slate-900 text-lg font-black text-white">
                {badge.icon}
              </span>
              <h3 className="font-black">{badge.title}</h3>
              <p className="text-xs font-bold text-slate-500">{badge.description}</p>
              <p className="mt-2 text-xs font-black text-emerald-700">{earned ? 'Earned' : 'Locked'}</p>
            </article>
          )
        })}
      </div>
    </Panel>
  )
}
