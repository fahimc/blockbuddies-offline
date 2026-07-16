import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ChatPanel } from './ChatPanel'
import { useGameStore } from '../state/gameStore'

describe('ChatPanel inbox', () => {
  it('opens unread buddy messages and sends predefined replies', async () => {
    useGameStore.setState({
      openPanel: undefined,
      selectedMessageThreadId: undefined,
      playerName: 'BlockBuddy',
      chat: [],
      messageThreads: [
        {
          id: 'luna',
          botId: 'luna',
          botName: 'LunaBlocks',
          updatedAt: 10,
          messages: [
            {
              id: 'dm-ui',
              presetId: 'greeting-008',
              text: 'Welcome back!',
              from: 'bot',
              read: false,
              createdAt: 10,
            },
          ],
        },
      ],
    })

    render(<ChatPanel />)

    await userEvent.click(screen.getByRole('button', { name: /messages, 1 unread/i }))
    expect(screen.getByRole('heading', { name: 'Messages' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /LunaBlocks/i }))
    expect(screen.getByRole('heading', { name: 'LunaBlocks' })).toBeInTheDocument()
    expect(screen.getAllByText('Welcome back!').length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: /Hi!/i }))

    expect(screen.getAllByText('Hi!').length).toBeGreaterThan(0)
    expect(
      useGameStore
        .getState()
        .messageThreads.find((thread) => thread.botId === 'luna')?.messages,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'player', text: 'Hi!' }),
        expect.objectContaining({ from: 'bot', text: 'Hi!' }),
      ]),
    )
  })
})
