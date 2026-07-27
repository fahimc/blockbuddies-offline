import { fireEvent, render, screen } from '@testing-library/react'
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

    await user.click(
      screen.getByRole('button', { name: /Visit Skill School/i }),
    )

    expect(
      screen.getByText(
        'Walk to the purple building marked SKILL SCHOOL or use the Town Map to travel there.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Skill School is enterable and has desks, a teacher, and a whiteboard.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('How to complete')).toBeInTheDocument()
  })

  it('reveals instructions and tips for every active and daily quest card', () => {
    render(<QuestPanel />)

    const activeQuestIds = questDefinitions
      .filter((quest) => quest.category !== 'daily')
      .map((quest) => quest.id)
    const dailyQuestIds = questDefinitions
      .filter((quest) => quest.category === 'daily')
      .map((quest) => quest.id)

    for (const id of activeQuestIds) {
      const quest = questDefinitions.find((item) => item.id === id)!
      fireEvent.click(
        screen.getByRole('button', {
          name: new RegExp(escapeRegExp(quest.title), 'i'),
        }),
      )
      expect(screen.getByText(quest.howTo)).toBeInTheDocument()
      expect(screen.getByText(quest.tip)).toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('button', { name: 'Daily' }))
    for (const id of dailyQuestIds) {
      const quest = questDefinitions.find((item) => item.id === id)!
      fireEvent.click(
        screen.getByRole('button', {
          name: new RegExp(escapeRegExp(quest.title), 'i'),
        }),
      )
      expect(screen.getByText(quest.howTo)).toBeInTheDocument()
      expect(screen.getByText(quest.tip)).toBeInTheDocument()
    }
  }, 10_000)

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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
