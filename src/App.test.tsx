import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App shell', () => {
  it('navigates from menu to the game placeholder', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'BlockBuddies Offline' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Play' }))

    expect(screen.getByRole('heading', { name: 'Game Scene Placeholder' })).toBeInTheDocument()
  })
})
