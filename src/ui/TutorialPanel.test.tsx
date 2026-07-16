import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TutorialPanel } from './TutorialPanel'

describe('TutorialPanel', () => {
  it('teaches local party, build mode, messaging, and travel basics', () => {
    render(<TutorialPanel />)

    expect(screen.getByRole('heading', { name: 'Tutorial' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Local Party' })).toBeInTheDocument()
    expect(screen.getByText('One player taps Host Room. Other players tap Find Rooms and choose the room.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Build Mode' })).toBeInTheDocument()
    expect(screen.getByText('Turn Build mode on, pick a piece, choose a colour, and tap Place.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Messages' })).toBeInTheDocument()
    expect(screen.getByText('Tap a buddy or a local player to open their message thread.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Map Travel' })).toBeInTheDocument()
  })
})
