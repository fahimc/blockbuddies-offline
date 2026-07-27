import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialJobRuntime, startJobRuntime } from '../ai/jobs'
import {
  activeJobChallenge,
  activeJobTask,
  getJobDefinition,
} from '../data/jobs'
import { useGameStore } from '../state/gameStore'
import { JobTaskChallenge } from './JobTaskChallenge'

describe('JobTaskChallenge', () => {
  beforeEach(() => {
    const runtime = startJobRuntime(
      createInitialJobRuntime(),
      'shopkeeper',
      Date.now(),
    )
    useGameStore.setState({
      job: runtime,
      chat: [],
    })
    useGameStore.getState().openJobTask(activeJobTask(runtime)!.id)
  })

  it('shows the generated order and keeps the task open after a mistake', async () => {
    const user = userEvent.setup()
    const runtime = useGameStore.getState().job
    const challenge = activeJobChallenge(runtime)!
    const wrong = challenge.options.find(
      (option) => option.id !== challenge.correctOptionId,
    )!
    render(<JobTaskChallenge />)

    expect(screen.getByText(challenge.orderLabel, { exact: false })).toBeVisible()
    expect(screen.getByText(challenge.prompt)).toBeVisible()
    await user.click(screen.getByRole('button', { name: wrong.label }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'does not match the order',
    )
    expect(useGameStore.getState().job).toMatchObject({
      taskIndex: 0,
      mistakes: 1,
      selectedTaskId: activeJobTask(runtime)!.id,
    })
  })

  it('advances only when the correct choice is made', async () => {
    const user = userEvent.setup()
    const runtime = useGameStore.getState().job
    const challenge = activeJobChallenge(runtime)!
    const correct = challenge.options.find(
      (option) => option.id === challenge.correctOptionId,
    )!
    render(<JobTaskChallenge />)

    await user.click(screen.getByRole('button', { name: correct.label }))

    expect(screen.queryByTestId('job-task-challenge')).not.toBeInTheDocument()
    expect(useGameStore.getState().job).toMatchObject({
      taskIndex: 1,
      combo: 1,
      score: 100,
      selectedTaskId: undefined,
    })
    expect(activeJobTask(useGameStore.getState().job)?.id).toBe(
      getJobDefinition('shopkeeper').tasks[1].id,
    )
  })
})
