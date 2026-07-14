import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../state/gameStore'
import { TouchControls } from './TouchControls'

describe('TouchControls', () => {
  beforeEach(() => {
    useGameStore.setState((state) => ({
      touch: { ...state.touch, run: false, interact: false },
      interactionPrompt: undefined,
      buildMode: false,
    }))
  })

  it('provides a persistent mobile run toggle', async () => {
    render(<TouchControls />)
    const runButton = screen.getByRole('button', { name: 'Run' })

    expect(runButton).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(runButton)

    expect(runButton).toHaveAttribute('aria-pressed', 'true')
    expect(useGameStore.getState().touch.run).toBe(true)
  })

  it('turns the interaction control into a bed action when nearby', () => {
    render(<TouchControls />)

    act(() => useGameStore.getState().setInteractionPrompt('sleep'))
    expect(screen.getByRole('button', { name: 'Sleep' })).toBeInTheDocument()

    act(() => useGameStore.getState().setInteractionPrompt('wake'))
    expect(screen.getByRole('button', { name: 'Wake up' })).toBeInTheDocument()
  })
})
