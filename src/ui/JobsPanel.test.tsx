import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialJobRuntime } from '../ai/jobs'
import { getJobDefinition, jobDefinitions } from '../data/jobs'
import { getLocation } from '../data/world'
import { useGameStore } from '../state/gameStore'
import { JobsPanel } from './JobsPanel'

describe('JobsPanel', () => {
  beforeEach(() => {
    useGameStore.setState((state) => ({
      openPanel: 'jobs',
      job: createInitialJobRuntime(),
      obby: { ...state.obby, active: false },
      miniGame: { ...state.miniGame, status: 'idle', activeId: undefined },
    }))
  })

  it('shows every paid workplace and travels the player to its manager', async () => {
    const user = userEvent.setup()
    render(<JobsPanel />)

    expect(screen.getAllByTestId(/^job-card-/)).toHaveLength(
      jobDefinitions.length,
    )
    const restaurant = getJobDefinition('restaurant')
    await user.click(
      screen.getByRole('button', {
        name: `Go to work at ${restaurant.employer}`,
      }),
    )

    expect(useGameStore.getState().playerPosition).toEqual(
      getLocation(restaurant.locationId).travelPosition,
    )
    expect(useGameStore.getState().openPanel).toBeUndefined()
  })

  it('shows career totals and lets players cancel a running shift', async () => {
    const user = userEvent.setup()
    const job = getJobDefinition('shopkeeper')
    useGameStore.setState({
      job: {
        ...createInitialJobRuntime({
          shopkeeper: { shiftsCompleted: 2, coinsEarned: 48 },
        }),
        activeId: job.id,
        status: 'running',
      },
    })
    render(<JobsPanel />)

    expect(screen.getByText('2 shifts completed')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Cancel shift' }))
    expect(useGameStore.getState().job.status).toBe('idle')
  })
})
