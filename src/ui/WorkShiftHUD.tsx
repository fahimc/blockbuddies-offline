import { BriefcaseBusiness, CheckCircle2, Coins, X } from 'lucide-react'
import { activeJobTask, getJobDefinition } from '../data/jobs'
import { useGameStore } from '../state/gameStore'

export function WorkShiftHUD() {
  const runtime = useGameStore((state) => state.job)
  const cancelJobShift = useGameStore((state) => state.cancelJobShift)
  const startJobShift = useGameStore((state) => state.startJobShift)
  const travelToLocation = useGameStore((state) => state.travelToLocation)
  if (!runtime.activeId || runtime.status === 'idle') return null

  const definition = getJobDefinition(runtime.activeId)
  const task = activeJobTask(runtime)
  const completed = runtime.status === 'completed'

  const workAgain = () => {
    if (travelToLocation(definition.locationId)) {
      startJobShift(definition.id)
    }
  }

  return (
    <aside
      className="pointer-events-none absolute inset-x-0 top-28 z-30 flex justify-center px-3 max-md:top-28"
      data-testid="work-shift-hud"
      aria-label="Active work shift"
    >
      <div
        className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border-2 bg-slate-950/94 px-4 py-3 text-white shadow-2xl backdrop-blur"
        style={{ borderColor: definition.color }}
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: definition.color }}
        >
          {completed ? (
            <CheckCircle2 size={22} aria-hidden />
          ) : (
            <BriefcaseBusiness size={22} aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-black">
            {completed ? 'Shift complete!' : definition.title}
          </strong>
          <span className="block truncate text-xs font-semibold text-slate-200">
            {completed
              ? `${definition.reward} coins earned`
              : task?.instruction}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[11px] font-black text-amber-300">
            <Coins size={12} aria-hidden />
            {runtime.completedTaskIds.length}/{definition.tasks.length} tasks ·{' '}
            {definition.reward} coins
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
    </aside>
  )
}
