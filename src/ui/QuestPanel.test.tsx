import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createQuestProgress } from '../ai/quests'
import { questDefinitions } from '../data/quests'
import { useGameStore } from '../state/gameStore'
import { QuestPanel } from './QuestPanel'

describe('QuestPanel', () => {
  beforeEach(() => {
    useGameStore.setState({
      openPanel: 'quests',
      questProgress: createQuestProgress(questDefinitions),
      chat: [],
      coins: 0,
    })
  })

  it('reveals full quest instructions when a quest is tapped', async () => {
    const user = userEvent.setup()
    render(<QuestPanel />)

    await user.click(screen.getByRole('button', { name: /Visit Skill School/i }))

    expect(
      screen.getByText('Walk to Skill School or use the Town Map to travel there.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('The school has desks, a teacher, and a whiteboard.'),
    ).toBeInTheDocument()
  })

  it('shows daily quests separately and completed quests in their tab', async () => {
    const user = userEvent.setup()
    useGameStore.setState({
      questProgress: createQuestProgress(questDefinitions).map((quest) =>
        quest.id === 'visit-park'
          ? { ...quest, started: true, completed: true, progress: 1 }
          : quest,
      ),
    })
    render(<QuestPanel />)

    await user.click(screen.getByRole('button', { name: 'Daily' }))
    expect(screen.getByText('Send a buddy message')).toBeInTheDocument()
    expect(screen.queryByText('Visit the park')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Completed' }))
    expect(screen.getByText('Visit the park')).toBeInTheDocument()
  })
})
