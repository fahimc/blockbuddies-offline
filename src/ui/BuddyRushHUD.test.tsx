import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  answerBuddyRecruitment,
  createInitialBuddyRush,
  startBuddyRecruitment,
  startPlayerBuddyRaid,
} from '../ai/buddyRush'
import { collectableBuddyDefinitions } from '../data/buddyRush'
import { defaultSettings, useGameStore } from '../state/gameStore'
import { BuddyRushHUD } from './BuddyRushHUD'

describe('BuddyRushHUD', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    useGameStore.setState({
      buddyRush: createInitialBuddyRush(10_000),
      settings: {
        ...defaultSettings,
        buddyRushEnabled: true,
        buddyRushMode: 'standard',
      },
      openPanel: undefined,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a readable shield warning with favourite protection', () => {
    useGameStore.setState((state) => ({
      buddyRush: {
        ...state.buddyRush,
        shield: {
          ...state.buddyRush.shield,
          phase: 'warning',
          phaseEndsAtGameTime: 40_000,
        },
      },
    }))

    render(<BuddyRushHUD />)
    expect(screen.getByRole('status')).toHaveTextContent(
      /Clubhouse Shield warning/i,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      /Favourite Buddies remain protected/i,
    )
  })

  it('requires the full two-second hold before a player captures a badge', () => {
    const initial = createInitialBuddyRush(10_000)
    const definition = collectableBuddyDefinitions[0]
    const selected = startBuddyRecruitment(initial, definition.id)
    const recruited = answerBuddyRecruitment(
      selected,
      definition.recruitmentAnswer,
      10_000,
    ).state
    const raid = startPlayerBuddyRaid(recruited, 'luna-club', 10_000)
    useGameStore.setState({ buddyRush: raid })

    render(<BuddyRushHUD />)
    const capture = screen.getByRole('button', {
      name: /Hold for 2 seconds to capture Friendship Badge/i,
    })
    fireEvent.keyDown(capture, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(1_999))
    expect(useGameStore.getState().buddyRush.activeRaid?.phase).toBe('capture')

    act(() => vi.advanceTimersByTime(1))
    expect(useGameStore.getState().buddyRush.activeRaid?.phase).toBe('chase')
    expect(
      screen.getByRole('button', { name: /Bubble Blaster/i }),
    ).toBeEnabled()
  })

  it('uses the shorter Reduced Tension capture hold', () => {
    const initial = createInitialBuddyRush(10_000)
    const definition = collectableBuddyDefinitions[0]
    const recruited = answerBuddyRecruitment(
      startBuddyRecruitment(initial, definition.id),
      definition.recruitmentAnswer,
      10_000,
    ).state
    useGameStore.setState({
      buddyRush: startPlayerBuddyRaid(recruited, 'luna-club', 10_000),
      settings: {
        ...defaultSettings,
        buddyRushEnabled: true,
        buddyRushMode: 'reduced-tension',
      },
    })

    render(<BuddyRushHUD />)
    const capture = screen.getByRole('button', {
      name: /Hold for 1.3 seconds to capture Friendship Badge/i,
    })
    fireEvent.keyDown(capture, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(1_299))
    expect(useGameStore.getState().buddyRush.activeRaid?.phase).toBe('capture')
    act(() => vi.advanceTimersByTime(1))
    expect(useGameStore.getState().buddyRush.activeRaid?.phase).toBe('chase')
  })
})
