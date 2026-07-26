import { describe, expect, it } from 'vitest'
import { jobDefinitions } from '../data/jobs'
import {
  cancelJobRuntime,
  completeJobRuntimeTask,
  createInitialJobRuntime,
  startJobRuntime,
} from './jobs'

describe('repeatable jobs', () => {
  it('requires each shift task in order and pays only on completion', () => {
    const definition = jobDefinitions[0]
    let runtime = startJobRuntime(createInitialJobRuntime(), definition.id)

    const skipped = completeJobRuntimeTask(
      runtime,
      definition.tasks[1].id,
    )
    expect(skipped).toMatchObject({
      changed: false,
      completedNow: false,
      reward: 0,
    })

    definition.tasks.forEach((task, index) => {
      const result = completeJobRuntimeTask(runtime, task.id)
      runtime = result.runtime
      expect(result.reward).toBe(
        index === definition.tasks.length - 1 ? definition.reward : 0,
      )
    })

    expect(runtime.status).toBe('completed')
    expect(runtime.records[definition.id]).toEqual({
      shiftsCompleted: 1,
      coinsEarned: definition.reward,
    })
  })

  it('keeps career totals when a player works another shift', () => {
    const definition = jobDefinitions[2]
    let runtime = createInitialJobRuntime()

    for (let shift = 0; shift < 2; shift += 1) {
      runtime = startJobRuntime(runtime, definition.id)
      definition.tasks.forEach((task) => {
        runtime = completeJobRuntimeTask(runtime, task.id).runtime
      })
    }

    expect(runtime.records[definition.id]).toEqual({
      shiftsCompleted: 2,
      coinsEarned: definition.reward * 2,
    })
  })

  it('cancels progress without deleting completed career records', () => {
    const definition = jobDefinitions[3]
    const running = startJobRuntime(
      createInitialJobRuntime({
        farming: { shiftsCompleted: 3, coinsEarned: 78 },
      }),
      definition.id,
    )
    const progressed = completeJobRuntimeTask(
      running,
      definition.tasks[0].id,
    ).runtime
    const cancelled = cancelJobRuntime(progressed)

    expect(cancelled).toMatchObject({
      activeId: undefined,
      status: 'idle',
      taskIndex: 0,
      completedTaskIds: [],
      records: {
        farming: { shiftsCompleted: 3, coinsEarned: 78 },
      },
    })
  })
})
