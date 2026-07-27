import {
  activeJobChallenge,
  challengeForJobTask,
  getJobDefinition,
} from '../data/jobs'
import type {
  JobId,
  JobRecord,
  JobRuntime,
  JobShiftSummary,
} from '../game/types'

export const jobXpPerLevel = 100
export const maxJobLevel = 10

export type JobTaskResult = {
  runtime: JobRuntime
  changed: boolean
  correct: boolean
  completedNow: boolean
  reward: number
  message?: string
}

const emptyRecord: JobRecord = {
  shiftsCompleted: 0,
  coinsEarned: 0,
  xp: 0,
  level: 1,
  bestScore: 0,
  bestStars: 0,
  perfectShifts: 0,
}

export function createInitialJobRuntime(
  records: Partial<Record<JobId, Partial<JobRecord>>> = {},
): JobRuntime {
  return {
    activeId: undefined,
    status: 'idle',
    taskIndex: 0,
    completedTaskIds: [],
    challengeIds: [],
    selectedTaskId: undefined,
    startedAt: 0,
    endsAt: 0,
    shiftNumber: 0,
    mode: 'standard',
    score: 0,
    combo: 0,
    bestCombo: 0,
    mistakes: 0,
    feedback: undefined,
    summary: undefined,
    eventSequence: 0,
    records: sanitizeJobRecords(records),
  }
}

export function jobLevelFromXp(xp: number) {
  return Math.min(maxJobLevel, Math.floor(Math.max(0, xp) / jobXpPerLevel) + 1)
}

export function jobRankName(level: number) {
  if (level >= 10) return 'Town Legend'
  if (level >= 7) return 'Master'
  if (level >= 4) return 'Specialist'
  if (level >= 2) return 'Skilled'
  return 'Trainee'
}

export function xpIntoJobLevel(xp: number) {
  if (jobLevelFromXp(xp) >= maxJobLevel) return jobXpPerLevel
  return Math.max(0, Math.floor(xp)) % jobXpPerLevel
}

export function startJobRuntime(
  runtime: JobRuntime,
  id: JobId,
  now = Date.now(),
): JobRuntime {
  const definition = getJobDefinition(id)
  const record = runtime.records[id] ?? emptyRecord
  const shiftNumber = record.shiftsCompleted + 1
  const mode = shiftNumber % 3 === 0 ? 'rush' : 'standard'
  const durationSeconds =
    mode === 'rush'
      ? Math.max(90, definition.shiftDurationSeconds - 45)
      : definition.shiftDurationSeconds
  const unlockedVariantCount = Math.min(
    3,
    Math.max(1, 1 + Math.floor(record.level / 2)),
  )
  const challengeIds = definition.tasks.map((task) => {
    const count = Math.min(task.variants.length, unlockedVariantCount)
    const jobOffset = id.length * 7
    const variantIndex = (jobOffset + shiftNumber - 1) % count
    return task.variants[variantIndex].id
  })

  return {
    ...runtime,
    activeId: id,
    status: 'running',
    taskIndex: 0,
    completedTaskIds: [],
    challengeIds,
    selectedTaskId: undefined,
    startedAt: now,
    endsAt: now + durationSeconds * 1_000,
    shiftNumber,
    mode,
    score: 0,
    combo: 0,
    bestCombo: 0,
    mistakes: 0,
    feedback: undefined,
    summary: undefined,
    eventSequence: runtime.eventSequence + 1,
  }
}

export function openJobRuntimeTask(
  runtime: JobRuntime,
  taskId: string,
): JobRuntime {
  const definition = runtime.activeId
    ? getJobDefinition(runtime.activeId)
    : undefined
  const currentTask = definition?.tasks[runtime.taskIndex]
  if (
    runtime.status !== 'running' ||
    !currentTask ||
    currentTask.id !== taskId
  ) {
    return runtime
  }
  return {
    ...runtime,
    selectedTaskId: taskId,
    feedback: undefined,
    eventSequence: runtime.eventSequence + 1,
  }
}

export function closeJobRuntimeTask(runtime: JobRuntime): JobRuntime {
  if (!runtime.selectedTaskId) return runtime
  return {
    ...runtime,
    selectedTaskId: undefined,
    feedback: undefined,
    eventSequence: runtime.eventSequence + 1,
  }
}

export function completeJobRuntimeTask(
  runtime: JobRuntime,
  taskId: string,
  optionId: string,
  now = Date.now(),
): JobTaskResult {
  if (!runtime.activeId || runtime.status !== 'running') {
    return {
      runtime,
      changed: false,
      correct: false,
      completedNow: false,
      reward: 0,
    }
  }

  const definition = getJobDefinition(runtime.activeId)
  const currentTask = definition.tasks[runtime.taskIndex]
  if (!currentTask || currentTask.id !== taskId) {
    return {
      runtime,
      changed: false,
      correct: false,
      completedNow: false,
      reward: 0,
    }
  }

  const challenge = challengeForJobTask(runtime, currentTask)
  const chosen = challenge.options.find((option) => option.id === optionId)
  if (!chosen) {
    return {
      runtime,
      changed: false,
      correct: false,
      completedNow: false,
      reward: 0,
    }
  }

  if (optionId !== challenge.correctOptionId) {
    const message = `${chosen.label} does not match the order. Try again.`
    return {
      runtime: {
        ...runtime,
        score: Math.max(0, runtime.score - 15),
        combo: 0,
        mistakes: runtime.mistakes + 1,
        feedback: { kind: 'wrong', message, optionId },
        eventSequence: runtime.eventSequence + 1,
      },
      changed: true,
      correct: false,
      completedNow: false,
      reward: 0,
      message,
    }
  }

  const combo = runtime.combo + 1
  const taskScore = 100 + Math.min(60, (combo - 1) * 20)
  const completedTaskIds = [...runtime.completedTaskIds, taskId]
  const completedNow = completedTaskIds.length === definition.tasks.length
  const nextScore = runtime.score + taskScore

  if (!completedNow) {
    return {
      runtime: {
        ...runtime,
        taskIndex: completedTaskIds.length,
        completedTaskIds,
        selectedTaskId: undefined,
        score: nextScore,
        combo,
        bestCombo: Math.max(runtime.bestCombo, combo),
        feedback: {
          kind: 'correct',
          message: challenge.successLine,
          optionId,
        },
        eventSequence: runtime.eventSequence + 1,
      },
      changed: true,
      correct: true,
      completedNow: false,
      reward: 0,
      message: challenge.successLine,
    }
  }

  const previousRecord = runtime.records[runtime.activeId] ?? emptyRecord
  const remainingSeconds = Math.max(
    0,
    Math.floor((runtime.endsAt - now) / 1_000),
  )
  const overtime = now > runtime.endsAt
  const stars: 1 | 2 | 3 =
    runtime.mistakes === 0 && remainingSeconds >= 30
      ? 3
      : runtime.mistakes <= 1 && !overtime
        ? 2
        : 1
  const timeScore = Math.min(60, remainingSeconds)
  const finalScore = nextScore + timeScore
  const tip = stars === 3 ? 12 : stars === 2 ? 6 : 2
  const rushBonus = runtime.mode === 'rush' ? 6 : 0
  const masteryBonus = Math.max(0, previousRecord.level - 1) * 2
  const totalReward = definition.reward + tip + rushBonus + masteryBonus
  const xpGained = 25 + stars * 10 + (runtime.mode === 'rush' ? 5 : 0)
  const nextXp = previousRecord.xp + xpGained
  const nextLevel = jobLevelFromXp(nextXp)
  const perfect = runtime.mistakes === 0
  const summary: JobShiftSummary = {
    baseReward: definition.reward,
    tip: tip + rushBonus,
    masteryBonus,
    totalReward,
    score: finalScore,
    stars,
    xpGained,
    levelBefore: previousRecord.level,
    levelAfter: nextLevel,
    levelledUp: nextLevel > previousRecord.level,
    perfect,
    overtime,
  }
  const record: JobRecord = {
    shiftsCompleted: previousRecord.shiftsCompleted + 1,
    coinsEarned: previousRecord.coinsEarned + totalReward,
    xp: nextXp,
    level: nextLevel,
    bestScore: Math.max(previousRecord.bestScore, finalScore),
    bestStars: Math.max(previousRecord.bestStars, stars),
    perfectShifts: previousRecord.perfectShifts + (perfect ? 1 : 0),
  }

  return {
    runtime: {
      ...runtime,
      status: 'completed',
      taskIndex: completedTaskIds.length,
      completedTaskIds,
      selectedTaskId: undefined,
      score: finalScore,
      combo,
      bestCombo: Math.max(runtime.bestCombo, combo),
      feedback: {
        kind: 'correct',
        message: challenge.successLine,
        optionId,
      },
      summary,
      eventSequence: runtime.eventSequence + 1,
      records: {
        ...runtime.records,
        [runtime.activeId]: record,
      },
    },
    changed: true,
    correct: true,
    completedNow: true,
    reward: totalReward,
    message: challenge.successLine,
  }
}

export function cancelJobRuntime(runtime: JobRuntime): JobRuntime {
  return {
    ...createInitialJobRuntime(runtime.records),
    eventSequence: runtime.eventSequence + 1,
  }
}

export function sanitizeJobRecords(
  records: Partial<Record<JobId, Partial<JobRecord>>> | undefined,
) {
  if (!records) return {}
  return Object.fromEntries(
    Object.entries(records).flatMap(([id, record]) => {
      if (!record || !Number.isFinite(record.shiftsCompleted)) return []
      const xp = Math.max(0, Math.floor(record.xp ?? 0))
      const shiftsCompleted = Math.max(
        0,
        Math.floor(record.shiftsCompleted ?? 0),
      )
      return [
        [
          id,
          {
            shiftsCompleted,
            coinsEarned: Math.max(0, Math.floor(record.coinsEarned ?? 0)),
            xp,
            level: jobLevelFromXp(xp),
            bestScore: Math.max(0, Math.floor(record.bestScore ?? 0)),
            bestStars: Math.min(
              3,
              Math.max(0, Math.floor(record.bestStars ?? 0)),
            ),
            perfectShifts: Math.max(
              0,
              Math.floor(record.perfectShifts ?? 0),
            ),
          },
        ],
      ]
    }),
  ) as Partial<Record<JobId, JobRecord>>
}

export function activeJobOrderLabel(runtime: JobRuntime) {
  return activeJobChallenge(runtime)?.orderLabel
}
