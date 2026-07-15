import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import {
  defaultAvatar,
  defaultPlayerName,
  useGameStore,
} from './state/gameStore'

vi.mock('./game/GameScreen', () => ({
  GameScreen: () => <div data-testid="game-canvas">Mock game</div>,
}))

vi.mock('./ui/GameAvatarPreview', () => ({
  GameAvatarPreview: () => (
    <div data-testid="avatar-preview">Mock avatar preview</div>
  ),
}))

describe('App shell', () => {
  beforeEach(() => {
    useGameStore.setState({
      screen: 'menu',
      saveLoaded: true,
      profileComplete: false,
      playerName: defaultPlayerName,
      avatar: defaultAvatar,
    })
  })

  it('starts with avatar setup before the game placeholder', async () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'BlockBuddies Offline' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Start' }))

    expect(
      screen.getByRole('heading', { name: 'Customization Hub' }),
    ).toBeInTheDocument()
  })

  it('starts returning players directly in the game with their saved profile', async () => {
    useGameStore.setState({
      profileComplete: true,
      playerName: 'SavedBuddy',
      avatar: { ...defaultAvatar, shirtColor: '#dc2626' },
    })

    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByTestId('game-canvas')).toBeInTheDocument()
  })
})
