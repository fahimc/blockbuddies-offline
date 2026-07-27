import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Flame,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  challengeForJobTask,
  getJobDefinition,
} from '../data/jobs'
import { useGameStore } from '../state/gameStore'

export function JobTaskChallenge() {
  const runtime = useGameStore((state) => state.job)
  const answerJobTask = useGameStore((state) => state.answerJobTask)
  const closeJobTask = useGameStore((state) => state.closeJobTask)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!runtime.selectedTaskId) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [runtime.selectedTaskId])

  if (
    !runtime.activeId ||
    runtime.status !== 'running' ||
    !runtime.selectedTaskId
  ) {
    return null
  }

  const definition = getJobDefinition(runtime.activeId)
  const task = definition.tasks.find(
    (entry) => entry.id === runtime.selectedTaskId,
  )
  if (!task) return null
  const challenge = challengeForJobTask(runtime, task)
  const secondsLeft = Math.max(0, Math.ceil((runtime.endsAt - now) / 1_000))

  return (
    <section
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${task.label} challenge`}
      data-testid="job-task-challenge"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border-4 bg-white shadow-2xl"
        style={{ borderColor: definition.color }}
      >
        <header
          className="flex items-center gap-3 px-4 py-3 text-white"
          style={{ backgroundColor: definition.color }}
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
            <ClipboardList size={22} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-base font-black">
              {task.label}
            </strong>
            <span className="block truncate text-xs font-bold text-white/85">
              {task.mechanic} · {challenge.orderLabel}
            </span>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/20"
            onClick={closeJobTask}
            aria-label="Close task"
          >
            <X size={19} aria-hidden />
          </button>
        </header>

        <div className="p-4">
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-black">
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              <Clock3 size={14} aria-hidden />
              {secondsLeft > 0 ? `${secondsLeft}s left` : 'Overtime'}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-orange-800">
              <Flame size={14} aria-hidden />
              {runtime.combo} combo
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
              {runtime.score} points
            </span>
          </div>

          <p className="rounded-2xl bg-slate-100 p-4 text-center text-base font-black text-slate-950">
            {challenge.prompt}
          </p>

          {runtime.feedback?.kind === 'wrong' ? (
            <p
              className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-center text-xs font-black text-rose-800"
              role="alert"
            >
              {runtime.feedback.message}
            </p>
          ) : null}

          <div className="mt-4 grid gap-2">
            {challenge.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="flex min-h-12 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-900 shadow-sm transition hover:border-sky-400 hover:bg-sky-50 active:scale-[0.99]"
                onClick={() =>
                  answerJobTask(task.id, option.id, Date.now())
                }
              >
                <CheckCircle2
                  className="shrink-0 text-slate-400"
                  size={20}
                  aria-hidden
                />
                {option.label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-center text-[11px] font-bold text-slate-500">
            Correct answers build a combo. Mistakes reset it, but you can always
            try again and still earn the base wage.
          </p>
        </div>
      </div>
    </section>
  )
}
