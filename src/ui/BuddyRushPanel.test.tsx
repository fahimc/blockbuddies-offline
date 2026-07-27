import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialBuddyRush } from '../ai/buddyRush'
import { createQuestProgress } from '../ai/quests'
import { collectableBuddyDefinitions } from '../data/buddyRush'
import { questDefinitions } from '../data/quests'
import { defaultSettings, useGameStore } from '../state/gameStore'
import { BuddyRushPanel } from './BuddyRushPanel'

describe('BuddyRushPanel', () => {
  beforeEach(() => {
    useGameStore.setState({
      openPanel: 'buddy-rush',
      coins: 0,
      chat: [],
      earnedBadges: [],
      questProgress: createQuestProgress(questDefinitions),
      buddyRush: createInitialBuddyRush(Date.now()),
      settings: {
        ...defaultSettings,
        buddyRushEnabled: true,
        buddyRushMode: 'standard',
      },
    })
  })

  it('makes the first Buddy recruitment discoverable and retry-safe', () => {
    render(<BuddyRushPanel />)
    const definition = collectableBuddyDefinitions[0]

    expect(
      screen.getByRole('heading', { name: 'Buddy Rush' }),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(definition.name, 'i'),
      }),
    )
    expect(screen.getByText(definition.recruitmentPrompt)).toBeInTheDocument()

    const wrong = definition.recruitmentOptions.find(
      (option) => option !== definition.recruitmentAnswer,
    )!
    fireEvent.click(screen.getByRole('button', { name: wrong }))
    expect(screen.getByRole('status')).toHaveTextContent(/try another answer/i)
    expect(useGameStore.getState().coins).toBe(3)

    fireEvent.click(
      screen.getByRole('button', { name: definition.recruitmentAnswer }),
    )
    expect(useGameStore.getState().buddyRush.ownedBuddies).toHaveLength(1)
    expect(useGameStore.getState().earnedBadges).toContain('buddy-recruiter')
  })

  it('shows all twelve BuddyBook slots without relying on colour alone', () => {
    render(<BuddyRushPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'BuddyBook' }))

    expect(screen.getByText('0/12 discovered')).toBeInTheDocument()
    expect(screen.getAllByText('Undiscovered')).toHaveLength(12)
    expect(
      screen.getAllByText(/Find this silhouette through buses/i),
    ).toHaveLength(12)
  })

  it('explains protection and displays every AI rival clubhouse', () => {
    render(<BuddyRushPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Rush' }))

    expect(screen.getByText(/Clubhouse Shield:/i)).toBeInTheDocument()
    expect(screen.getByText('Moonlight Club')).toBeInTheDocument()
    expect(screen.getByText('Builder Base')).toBeInTheDocument()
    expect(screen.getByText('Pop Party House')).toBeInTheDocument()
    expect(
      screen.getByText(
        /ownership, styles, and friendship progress never transfer/i,
      ),
    ).toBeInTheDocument()
  })
})
