import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Coins,
  Flame,
  Star,
  Trophy,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  activeJobChallenge,
  activeJobTask,
  getJobDefinition,
} from '../data/jobs'
import { useGameStore } from '../state/gameStore'

export function WorkShiftHUD() {
  const runtime = useGameStore((state) => state.job)
  const cancelJobShift = useGameStore((state) => state.cancelJobShift)
  const startJobShift = useGameStore((state) => state.startJobShift)
  const travelToLocation = useGameStore((state) => state.travelToLocation)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (runtime.status !== 'running') return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [runtime.status, runtime.startedAt])

  if (!runtime.activeId || runtime.status === 'idle') return null

  const definition = getJobDefinition(runtime.activeId)
  const task = activeJobTask(runtime)
  const challenge = activeJobChallenge(runtime)
  const completed = runtime.status === 'completed'
  const secondsLeft = Math.max(0, Math.ceil((runtime.endsAt - now) / 1_000))
  const summary = runtime.summary

  const workAgain = () => {
    if (travelToLocation(definition.locationId)) {
      startJobShift(definition.id)
    }
  }

  return (
    <aside
      className="pointer-events-none absolute inset-x-0 top-56 z-30 flex justify-center px-3 sm:top-28"
      data-testid="work-shift-hud"
      aria-label="Active work shift"
    >
      <div
        className="pointer-events-auto w-full max-w-xl rounded-2xl border-2 bg-slate-950/95 px-3 py-3 text-white shadow-2xl backdrop-blur"
        style={{ borderColor: definition.color }}
      >
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: definition.color }}
          >
            {completed ? (
              <Trophy size={22} aria-hidden />
            ) : (
              <BriefcaseBusiness size={22} aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-sm font-black">
              {completed
                ? `${summary?.stars ?? 1}-star shift complete!`
                : `${definition.title}${runtime.mode === 'rush' ? ' · RUSH' : ''}`}
            </strong>
            <span className="block truncate text-xs font-semibold text-slate-200">
              {completed
                ? `${summary?.totalReward ?? definition.reward} coins earned · +${summary?.xpGained ?? 0} mastery XP`
                : `${task?.label}: ${challenge?.orderLabel ?? task?.instruction}`}
            </span>
          </div>
          {completed ? (
            <button
              type="button"
              className="shrink-0 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950"
              onClick={workAgain}
            >
              Work again
            </button>
          ) : (
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15"
              onClick={cancelJobShift}
              aria-label="Cancel work shift"
            >
              <X size={18} aria-hidden />
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-black">
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-amber-300">
            <Coins size={12} aria-hidden />
            {runtime.completedTaskIds.length}/{definition.tasks.length} tasks
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
            <Star size={12} aria-hidden />
            {runtime.score} pts
          </span>
          {!completed ? (
            <>
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-orange-300">
                <Flame size={12} aria-hidden />
                {runtime.combo} combo
              </span>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 ${
                  secondsLeft > 0
                    ? 'bg-white/10 text-sky-200'
                    : 'bg-rose-500 text-white'
                }`}
              >
                <Clock3 size={12} aria-hidden />
                {secondsLeft > 0 ? `${secondsLeft}s` : 'Overtime'}
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/25 px-2 py-1 text-emerald-200">
                <CheckCircle2 size={12} aria-hidden />
                Tip +{summary?.tip ?? 0}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1">
                {runtime.mistakes === 0
                  ? 'Perfect accuracy'
                  : `${runtime.mistakes} mistake${runtime.mistakes === 1 ? '' : 's'}`}
              </span>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
