import {
  BriefcaseBusiness,
  PackageCheck,
  ShoppingBasket,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import { jobDefinitions } from '../data/jobs'
import type { JobId } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

const jobIcons: Record<JobId, LucideIcon> = {
  shopkeeper: ShoppingBasket,
  restaurant: UtensilsCrossed,
  delivery: PackageCheck,
  farming: Wheat,
}

export function JobsPanel() {
  const runtime = useGameStore((state) => state.job)
  const travelToLocation = useGameStore((state) => state.travelToLocation)
  const cancelJobShift = useGameStore((state) => state.cancelJobShift)
  const activeJob = runtime.activeId
    ? jobDefinitions.find((job) => job.id === runtime.activeId)
    : undefined

  return (
    <Panel title="Jobs & Work">
      <div className="mb-3 rounded-2xl bg-amber-100 p-3 text-sm text-amber-950">
        <strong className="flex items-center gap-2 font-black">
          <BriefcaseBusiness size={19} aria-hidden />
          Earn coins by helping around town
        </strong>
        <p className="mt-1 text-xs font-semibold">
          Travel to a workplace, talk to its manager, and complete the three
          marked tasks in order.
        </p>
      </div>

      {runtime.status === 'running' && activeJob ? (
        <div
          className="mb-3 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-3"
          role="status"
        >
          <strong className="block text-sm font-black text-emerald-950">
            Working: {activeJob.title}
          </strong>
          <span className="text-xs font-bold text-emerald-800">
            {runtime.completedTaskIds.length}/{activeJob.tasks.length} tasks
            complete
          </span>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="bb-small-action"
              onClick={() => travelToLocation(activeJob.locationId)}
            >
              Return to work
            </button>
            <button
              type="button"
              className="bb-small-action"
              onClick={cancelJobShift}
            >
              Cancel shift
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {jobDefinitions.map((job) => {
          const Icon = jobIcons[job.id]
          const record = runtime.records[job.id]
          const otherShiftRunning =
            runtime.status === 'running' && runtime.activeId !== job.id
          return (
            <article
              key={job.id}
              className="rounded-2xl border-2 border-slate-200 bg-white p-3 shadow"
              data-testid={`job-card-${job.id}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: job.color }}
                >
                  <Icon size={23} aria-hidden />
                </span>
                <div className="min-w-0">
                  <strong className="block font-black text-slate-950">
                    {job.title}
                  </strong>
                  <span className="text-xs font-bold text-slate-500">
                    {job.employer} · {job.reward} coins
                  </span>
                </div>
              </div>
              <p className="my-2 text-xs font-semibold text-slate-700">
                {job.description}
              </p>
              <div className="mb-2 flex justify-between text-[11px] font-black text-slate-500">
                <span>{job.tasks.length} tasks</span>
                <span>{record?.shiftsCompleted ?? 0} shifts completed</span>
              </div>
              <button
                type="button"
                className="bb-small-action w-full"
                disabled={otherShiftRunning}
                onClick={() => travelToLocation(job.locationId)}
                aria-label={`Go to work at ${job.employer}`}
              >
                {runtime.activeId === job.id && runtime.status === 'running'
                  ? 'Continue shift'
                  : 'Go to work'}
              </button>
            </article>
          )
        })}
      </div>
    </Panel>
  )
}
