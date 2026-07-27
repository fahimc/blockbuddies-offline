import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../state/gameStore'
import { TutorialPanel } from './TutorialPanel'

describe('TutorialPanel', () => {
  beforeEach(() => {
    useGameStore.getState().setOpenPanel('tutorial')
  })

  it('teaches local party, build mode, messaging, and travel basics', () => {
    render(<TutorialPanel />)

    expect(
      screen.getByRole('heading', { name: 'Tutorial' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Local Party' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'One player taps Host Room. Other players tap Find Rooms and choose the room.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Build Mode' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Turn Build mode on, pick a piece, choose a colour, and tap Place.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Messages' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Tap a buddy or a local player to show their Message button.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Tap Message to open the thread for that selected person.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Map Travel' }),
    ).toBeInTheDocument()
  })

  it('uses illustrated guides to teach clubs, the Buddy Bus, and every job', () => {
    render(<TutorialPanel />)

    expect(
      screen.getByRole('heading', { name: 'Your Club & Buddy Rush' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: /purple Buddy Rush clubhouse/i,
      }),
    ).toBeVisible()
    expect(
      screen.getByText(/complete their Challenge.*recruits that Buddy/i),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Buddy Bus & City Buses' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: /tall red and blue double-decker buses/i,
      }),
    ).toBeVisible()
    expect(
      screen.getByText(/moving city traffic and cannot be driven/i),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', {
        name: 'Work, Complete Tasks & Earn Coins',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: /four workplaces.*three-task route/i,
      }),
    ).toBeVisible()

    for (const workplace of [
      'Shopkeeper',
      'Restaurant',
      'Delivery',
      'Farming',
    ]) {
      expect(screen.getByText(workplace)).toBeVisible()
    }
    expect(
      screen.getByText(/Delivery Shift is a job.*Delivery Dash/i),
    ).toBeVisible()
  })

  it('opens the relevant game panels from the illustrated guide', () => {
    render(<TutorialPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Open Buddy Rush' }))
    expect(useGameStore.getState().openPanel).toBe('buddy-rush')

    useGameStore.getState().setOpenPanel('tutorial')
    fireEvent.click(screen.getByRole('button', { name: 'Find the bus stop' }))
    expect(useGameStore.getState().openPanel).toBe('map')

    useGameStore.getState().setOpenPanel('tutorial')
    fireEvent.click(screen.getByRole('button', { name: 'Open Jobs & Work' }))
    expect(useGameStore.getState().openPanel).toBe('jobs')
  })
})
