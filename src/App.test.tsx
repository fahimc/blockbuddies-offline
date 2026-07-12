import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./game/GameScreen', () => ({
  GameScreen: () => <div data-testid="game-canvas">Mock game</div>,
}))

describe('App shell', () => {
  it('navigates from menu to the game placeholder', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'BlockBuddies Offline' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Play' }))

    expect(screen.getByTestId('game-canvas')).toBeInTheDocument()
  })
})
