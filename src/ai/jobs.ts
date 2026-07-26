import { getJobDefinition } from '../data/jobs'
import type { JobId, JobRecord, JobRuntime } from '../game/types'

export type JobTaskResult = {
  runtime: JobRuntime
  changed: boolean
  completedNow: boolean
  reward: number
}

export function createInitialJobRuntime(
  records: Partial<Record<JobId, JobRecord>> = {},
): JobRuntime {
  return {
    activeId: undefined,
    status: 'idle',
    taskIndex: 0,
    completedTaskIds: [],
    eventSequence: 0,
    records: sanitizeJobRecords(records),
  }
}

export function startJobRuntime(runtime: JobRuntime, id: JobId): JobRuntime {
  return {
    ...runtime,
    activeId: id,
    status: 'running',
    taskIndex: 0,
    completedTaskIds: [],
    eventSequence: runtime.eventSequence + 1,
  }
}

export function completeJobRuntimeTask(
  runtime: JobRuntime,
  taskId: string,
): JobTaskResult {
  if (!runtime.activeId || runtime.status !== 'running') {
    return { runtime, changed: false, completedNow: false, reward: 0 }
  }

  const definition = getJobDefinition(runtime.activeId)
  const currentTask = definition.tasks[runtime.taskIndex]
  if (!currentTask || currentTask.id !== taskId) {
    return { runtime, changed: false, completedNow: false, reward: 0 }
  }

  const completedTaskIds = [...runtime.completedTaskIds, taskId]
  const completedNow = completedTaskIds.length === definition.tasks.length
  const previousRecord = runtime.records[runtime.activeId] ?? {
    shiftsCompleted: 0,
    coinsEarned: 0,
  }
  const records = completedNow
    ? {
        ...runtime.records,
        [runtime.activeId]: {
          shiftsCompleted: previousRecord.shiftsCompleted + 1,
          coinsEarned: previousRecord.coinsEarned + definition.reward,
        },
      }
    : runtime.records

  return {
    runtime: {
      ...runtime,
      status: completedNow ? 'completed' : 'running',
      taskIndex: completedTaskIds.length,
      completedTaskIds,
      eventSequence: runtime.eventSequence + 1,
      records,
    },
    changed: true,
    completedNow,
    reward: completedNow ? definition.reward : 0,
  }
}

export function cancelJobRuntime(runtime: JobRuntime): JobRuntime {
  return {
    ...createInitialJobRuntime(runtime.records),
    eventSequence: runtime.eventSequence + 1,
  }
}

export function sanitizeJobRecords(
  records: Partial<Record<JobId, JobRecord>> | undefined,
) {
  if (!records) return {}
  return Object.fromEntries(
    Object.entries(records).flatMap(([id, record]) => {
      if (!record || !Number.isFinite(record.shiftsCompleted)) return []
      return [
        [
          id,
          {
            shiftsCompleted: Math.max(0, Math.floor(record.shiftsCompleted)),
            coinsEarned: Math.max(0, Math.floor(record.coinsEarned ?? 0)),
          },
        ],
      ]
    }),
  ) as Partial<Record<JobId, JobRecord>>
}
