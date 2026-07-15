import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defaultAvatar,
  defaultPlayerName,
  useGameStore,
} from '../state/gameStore'
import { NameSetupScreen } from './NameSetupScreen'

vi.mock('./GameAvatarPreview', () => ({
  GameAvatarPreview: () => <div data-testid="avatar-preview">Avatar</div>,
}))

describe('NameSetupScreen', () => {
  beforeEach(() => {
    useGameStore.setState({
      profileComplete: false,
      playerName: defaultPlayerName,
      avatar: defaultAvatar,
    })
  })

  it('waits for the player to tap the name field before opening the keyboard', () => {
    render(<NameSetupScreen onBack={vi.fn()} onStart={vi.fn()} />)

    const nameInput = screen.getByLabelText('Character name')
    expect(nameInput).not.toHaveFocus()
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeVisible()
  })

  it('marks the created character profile complete when starting the game', async () => {
    const onStart = vi.fn()
    render(<NameSetupScreen onBack={vi.fn()} onStart={onStart} />)

    const nameInput = screen.getByLabelText('Character name')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Pixel Builder')
    await userEvent.click(screen.getByRole('button', { name: 'Start Game' }))

    expect(useGameStore.getState().playerName).toBe('Pixel Builder')
    expect(useGameStore.getState().profileComplete).toBe(true)
    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
