import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../state/gameStore'
import { BuildHudPalette } from './BuildHudPalette'

describe('BuildHudPalette', () => {
  beforeEach(() => {
    useGameStore.setState({
      buildMode: true,
      selectedBuildPiece: 'block',
      selectedBuildBlockId: undefined,
      selectedBuildColor: '#38bdf8',
      placedBlocks: [],
      chat: [],
    })
  })

  it('keeps every build piece selectable from the in-game HUD', () => {
    render(<BuildHudPalette />)

    expect(
      screen.getByRole('navigation', { name: 'Select build piece' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Build / })).toHaveLength(8)

    fireEvent.click(screen.getByRole('button', { name: 'Build House' }))
    expect(useGameStore.getState().selectedBuildPiece).toBe('house')
    expect(useGameStore.getState().selectedBuildColor).toBe('#60a5fa')
    expect(screen.getByRole('button', { name: 'Build House' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('removes the highlighted build item and exits build mode', () => {
    render(<BuildHudPalette />)
    const remove = screen.getByRole('button', {
      name: 'Remove selected build item',
    })
    expect(remove).toBeDisabled()

    act(() => {
      useGameStore.setState({
        selectedBuildBlockId: 'selected-house',
        placedBlocks: [
          {
            id: 'selected-house',
            kind: 'house',
            position: [8, 0.02, 8],
            color: '#60a5fa',
          },
        ],
      })
    })
    expect(remove).toBeEnabled()
    fireEvent.click(remove)
    expect(useGameStore.getState().placedBlocks).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: 'Exit build mode' }))
    expect(useGameStore.getState().buildMode).toBe(false)
  })

  it('renames and rotates a selected house from the HUD editor', () => {
    useGameStore.setState({
      selectedBuildBlockId: 'selected-house',
      buildRotation: 0,
      placedBlocks: [
        {
          id: 'selected-house',
          kind: 'house',
          name: 'My House',
          position: [8, 0.02, 8],
          color: '#60a5fa',
          rotation: 0,
        },
      ],
    })
    render(<BuildHudPalette />)

    const name = screen.getByLabelText('House name')
    expect(name).toHaveValue('My House')
    fireEvent.change(name, { target: { value: 'Blue Base' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save house name' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Rotate selected house' }),
    )

    expect(useGameStore.getState().placedBlocks[0]).toMatchObject({
      name: 'Blue Base',
      rotation: Math.PI / 2,
    })
  })
})
