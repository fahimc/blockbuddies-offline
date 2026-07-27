import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  completeJobRuntimeTask,
  createInitialJobRuntime,
  startJobRuntime,
} from '../ai/jobs'
import { activeJobChallenge, activeJobTask } from '../data/jobs'
import type { JobRuntime } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { WorkShiftHUD } from './WorkShiftHUD'

function finishPerfectly(runtime: JobRuntime, now: number) {
  let current = runtime
  while (current.status === 'running') {
    const task = activeJobTask(current)!
    const challenge = activeJobChallenge(current)!
    current = completeJobRuntimeTask(
      current,
      task.id,
      challenge.correctOptionId,
      now,
    ).runtime
  }
  return current
}

describe('WorkShiftHUD', () => {
  beforeEach(() => {
    useGameStore.setState({
      job: createInitialJobRuntime(),
    })
  })

  it('shows live score, combo, timer, and rush-order status', () => {
    const runtime = startJobRuntime(
      createInitialJobRuntime({
        delivery: {
          shiftsCompleted: 2,
          coinsEarned: 80,
          xp: 90,
          level: 1,
          bestScore: 350,
          bestStars: 3,
          perfectShifts: 2,
        },
      }),
      'delivery',
      Date.now(),
    )
    useGameStore.setState({ job: runtime })
    render(<WorkShiftHUD />)

    expect(screen.getByText(/Delivery Shift · RUSH/)).toBeVisible()
    expect(screen.getByText('0 pts')).toBeVisible()
    expect(screen.getByText('0 combo')).toBeVisible()
    expect(screen.getByText(/\d+s/)).toBeVisible()
  })

  it('shows the star result, total reward, tip, and mastery XP', () => {
    const startedAt = Date.now()
    const completed = finishPerfectly(
      startJobRuntime(
        createInitialJobRuntime(),
        'restaurant',
        startedAt,
      ),
      startedAt + 5_000,
    )
    useGameStore.setState({ job: completed })
    render(<WorkShiftHUD />)

    expect(screen.getByText('3-star shift complete!')).toBeVisible()
    expect(
      screen.getByText(
        `${completed.summary!.totalReward} coins earned · +${completed.summary!.xpGained} mastery XP`,
      ),
    ).toBeVisible()
    expect(screen.getByText(`Tip +${completed.summary!.tip}`)).toBeVisible()
    expect(screen.getByText('Perfect accuracy')).toBeVisible()
  })
})
