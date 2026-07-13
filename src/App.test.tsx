import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./game/GameScreen', () => ({
  GameScreen: () => <div data-testid="game-canvas">Mock game</div>,
}))

vi.mock('./ui/GameAvatarPreview', () => ({
  GameAvatarPreview: () => <div data-testid="avatar-preview">Mock avatar preview</div>,
}))

describe('App shell', () => {
  it('starts with avatar setup before the game placeholder', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'BlockBuddies Offline' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByRole('heading', { name: 'Customization Hub' })).toBeInTheDocument()
  })
})
