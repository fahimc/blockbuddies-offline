import { act, fireEvent, render, screen } from '@testing-library/react'
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

  it('runs only while the mobile run control is held', () => {
    render(<TouchControls />)
    const runButton = screen.getByRole('button', { name: 'Run' })

    expect(runButton).toHaveAttribute('aria-pressed', 'false')
    fireEvent.pointerDown(runButton, { pointerId: 1 })

    expect(runButton).toHaveAttribute('aria-pressed', 'true')
    expect(useGameStore.getState().touch.run).toBe(true)

    fireEvent.pointerUp(runButton, { pointerId: 1 })

    expect(runButton).toHaveAttribute('aria-pressed', 'false')
    expect(useGameStore.getState().touch.run).toBe(false)
  })

  it('turns the interaction control into a bed action when nearby', () => {
    render(<TouchControls />)

    act(() => useGameStore.getState().setInteractionPrompt('sleep'))
    expect(screen.getByRole('button', { name: 'Sleep' })).toBeInTheDocument()

    act(() => useGameStore.getState().setInteractionPrompt('wake'))
    expect(screen.getByRole('button', { name: 'Wake up' })).toBeInTheDocument()
  })
})
