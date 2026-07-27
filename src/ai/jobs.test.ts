import { describe, expect, it } from 'vitest'
import {
  activeJobChallenge,
  activeJobTask,
  jobDefinitions,
} from '../data/jobs'
import type { JobRuntime } from '../game/types'
import {
  cancelJobRuntime,
  completeJobRuntimeTask,
  createInitialJobRuntime,
  openJobRuntimeTask,
  startJobRuntime,
} from './jobs'

function answerCurrentCorrectly(runtime: JobRuntime, now: number) {
  const task = activeJobTask(runtime)!
  const challenge = activeJobChallenge(runtime)!
  return completeJobRuntimeTask(
    runtime,
    task.id,
    challenge.correctOptionId,
    now,
  )
}

function finishShift(runtime: JobRuntime, now: number) {
  let current = runtime
  while (current.status === 'running') {
    current = answerCurrentCorrectly(current, now).runtime
  }
  return current
}

describe('replayable job mini games', () => {
  it('generates a deterministic order and requires tasks in sequence', () => {
    const definition = jobDefinitions[0]
    let runtime = startJobRuntime(
      createInitialJobRuntime(),
      definition.id,
      1_000,
    )
    const repeated = startJobRuntime(
      createInitialJobRuntime(),
      definition.id,
      1_000,
    )

    expect(runtime.challengeIds).toEqual(repeated.challengeIds)
    expect(runtime.challengeIds).toHaveLength(definition.tasks.length)

    const skippedTask = definition.tasks[1]
    const skippedChallenge = skippedTask.variants[0]
    const skipped = completeJobRuntimeTask(
      runtime,
      skippedTask.id,
      skippedChallenge.correctOptionId,
      2_000,
    )
    expect(skipped).toMatchObject({
      changed: false,
      correct: false,
      completedNow: false,
      reward: 0,
    })

    runtime = answerCurrentCorrectly(runtime, 3_000).runtime
    expect(runtime.completedTaskIds).toEqual([definition.tasks[0].id])
    expect(runtime.combo).toBe(1)
    expect(runtime.score).toBe(100)
  })

  it('keeps the challenge open after a mistake and rewards a perfect combo', () => {
    const definition = jobDefinitions[1]
    let runtime = startJobRuntime(
      createInitialJobRuntime(),
      definition.id,
      10_000,
    )
    const task = activeJobTask(runtime)!
    const challenge = activeJobChallenge(runtime)!
    const wrongOption = challenge.options.find(
      (option) => option.id !== challenge.correctOptionId,
    )!

    runtime = openJobRuntimeTask(runtime, task.id)
    const mistake = completeJobRuntimeTask(
      runtime,
      task.id,
      wrongOption.id,
      12_000,
    )
    expect(mistake).toMatchObject({ changed: true, correct: false })
    expect(mistake.runtime).toMatchObject({
      taskIndex: 0,
      mistakes: 1,
      combo: 0,
      selectedTaskId: task.id,
    })

    runtime = answerCurrentCorrectly(mistake.runtime, 13_000).runtime
    runtime = answerCurrentCorrectly(runtime, 14_000).runtime
    const finish = answerCurrentCorrectly(runtime, 15_000)

    expect(finish.runtime.status).toBe('completed')
    expect(finish.runtime.summary).toMatchObject({
      stars: 2,
      perfect: false,
      overtime: false,
    })
    expect(finish.reward).toBeGreaterThan(definition.reward)
  })

  it('tracks stars, tips, XP, best scores, and every-third-shift rush mode', () => {
    const definition = jobDefinitions[2]
    let runtime = createInitialJobRuntime()

    for (let shift = 1; shift <= 2; shift += 1) {
      runtime = startJobRuntime(runtime, definition.id, shift * 10_000)
      expect(runtime.mode).toBe('standard')
      runtime = finishShift(runtime, shift * 10_000 + 5_000)
    }

    runtime = startJobRuntime(runtime, definition.id, 30_000)
    expect(runtime).toMatchObject({ shiftNumber: 3, mode: 'rush' })
    runtime = finishShift(runtime, 35_000)

    expect(runtime.records[definition.id]).toMatchObject({
      shiftsCompleted: 3,
      bestStars: 3,
      perfectShifts: 3,
    })
    expect(runtime.records[definition.id]!.coinsEarned).toBeGreaterThan(
      definition.reward * 3,
    )
    expect(runtime.records[definition.id]!.xp).toBeGreaterThan(100)
    expect(runtime.records[definition.id]!.level).toBeGreaterThan(1)
  })

  it('finishes overtime for base pay instead of failing the player', () => {
    const definition = jobDefinitions[3]
    let runtime = startJobRuntime(
      createInitialJobRuntime(),
      definition.id,
      1_000,
    )
    runtime = finishShift(runtime, runtime.endsAt + 10_000)

    expect(runtime.summary).toMatchObject({
      stars: 1,
      overtime: true,
    })
    expect(runtime.summary!.totalReward).toBeGreaterThanOrEqual(
      definition.reward,
    )
  })

  it('cancels progress without deleting completed mastery records', () => {
    const running = startJobRuntime(
      createInitialJobRuntime({
        farming: {
          shiftsCompleted: 3,
          coinsEarned: 102,
          xp: 120,
          bestScore: 390,
          bestStars: 3,
          perfectShifts: 2,
        },
      }),
      'farming',
      1_000,
    )
    const progressed = answerCurrentCorrectly(running, 2_000).runtime
    const cancelled = cancelJobRuntime(progressed)

    expect(cancelled).toMatchObject({
      activeId: undefined,
      status: 'idle',
      taskIndex: 0,
      completedTaskIds: [],
      records: {
        farming: {
          shiftsCompleted: 3,
          coinsEarned: 102,
          xp: 120,
          level: 2,
          bestScore: 390,
          bestStars: 3,
          perfectShifts: 2,
        },
      },
    })
  })
})
