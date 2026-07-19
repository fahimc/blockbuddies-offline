import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../state/gameStore'
import { TouchControls } from './TouchControls'

describe('TouchControls', () => {
  beforeEach(() => {
    useGameStore.setState((state) => ({
      touch: {
        ...state.touch,
        run: false,
        interact: false,
        lookX: 0,
        lookY: 0,
      },
      interactionPrompt: undefined,
      buildMode: false,
      selectedBuildBlockId: undefined,
      activeVehicleId: undefined,
      nearbyFootballBallId: undefined,
      worldActionRequest: undefined,
      playerEmote: 'none',
      miniGame: { ...state.miniGame, status: 'idle', activeId: undefined },
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

  it('queues horizontal and vertical orbit input from a screen drag', () => {
    render(<TouchControls />)
    const dragLayer = screen.getByTestId('world-drag-control')

    fireEvent.pointerDown(dragLayer, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 100,
      clientY: 100,
    })
    fireEvent.pointerMove(dragLayer, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 135,
      clientY: 80,
    })
    fireEvent.pointerUp(dragLayer, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 135,
      clientY: 80,
    })

    expect(useGameStore.getState().touch.lookX).toBe(35)
    expect(useGameStore.getState().touch.lookY).toBe(-20)
  })

  it('uses the old reset slot as a compact emote toggle in normal play', () => {
    render(<TouchControls />)
    const emoteButton = screen.getByRole('button', { name: 'Toggle emotes' })

    expect(emoteButton).toHaveTextContent('Emote')
    expect(emoteButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(emoteButton)
    expect(useGameStore.getState().playerEmote).toBe('wave')
    expect(emoteButton).toHaveTextContent('Wave')
    expect(emoteButton).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(emoteButton)
    expect(useGameStore.getState().playerEmote).toBe('dance')
    expect(emoteButton).toHaveTextContent('Dance')

    fireEvent.click(emoteButton)
    expect(useGameStore.getState().playerEmote).toBe('cheer')
    expect(emoteButton).toHaveTextContent('Cheer')

    fireEvent.click(emoteButton)
    expect(useGameStore.getState().playerEmote).toBe('none')
    expect(emoteButton).toHaveTextContent('Emote')
  })

  it('keeps the center control as cancel during active mini games', () => {
    useGameStore.setState((state) => ({
      miniGame: { ...state.miniGame, activeId: 'coin-rush', status: 'running' },
    }))
    render(<TouchControls />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Toggle emotes' }),
    ).not.toBeInTheDocument()
  })

  it('does not duplicate the build drawer remove button in the touch controls', () => {
    useGameStore.setState({
      buildMode: true,
      selectedBuildBlockId: 'selected-tree',
      placedBlocks: [
        {
          id: 'keep-house',
          kind: 'house',
          position: [8, 0.02, 8],
          color: '#60a5fa',
        },
        {
          id: 'selected-tree',
          kind: 'tree',
          position: [14, 0.02, 8],
          color: '#16a34a',
        },
      ],
    })
    render(<TouchControls />)

    expect(screen.getByTestId('world-drag-control')).toHaveClass(
      'pointer-events-none',
    )
    expect(
      screen.queryByRole('button', { name: 'Remove selected build item' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rotate' })).toBeInTheDocument()
  })

  it('switches to driving controls with a dedicated exit button in a car', () => {
    useGameStore.setState({
      activeVehicleId: 'sunny-car',
      interactionPrompt: 'exit-vehicle',
    })
    render(<TouchControls />)

    expect(screen.getByLabelText('Driving joystick')).toBeInTheDocument()
    expect(screen.getByText('Drive')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Brake' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exit car' })).toHaveTextContent(
      'Exit',
    )
    expect(
      screen.queryByRole('button', { name: 'Run' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Toggle emotes' }),
    ).not.toBeInTheDocument()
  })

  it('shows football actions near a ball and sends kick power plus skill requests', () => {
    useGameStore.setState({ nearbyFootballBallId: 'football-main' })
    render(<TouchControls />)

    const kick = screen.getByRole('button', { name: 'Hold to kick ball' })
    const skills = screen.getByRole('button', { name: 'Do football skills' })

    fireEvent.pointerDown(kick, { pointerId: 7 })
    fireEvent.pointerUp(kick, { pointerId: 7 })
    expect(useGameStore.getState().worldActionRequest).toMatchObject({
      type: 'football-kick',
      id: 'football-main',
    })
    expect(useGameStore.getState().worldActionRequest?.power).toBeGreaterThan(0)

    fireEvent.click(skills)
    expect(useGameStore.getState().worldActionRequest).toMatchObject({
      type: 'football-skill',
      id: 'football-main',
    })
  })
})
