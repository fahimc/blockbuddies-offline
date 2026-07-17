import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultAvatar, useGameStore } from '../state/gameStore'
import { FriendshipPanel } from './FriendshipPanel'

describe('FriendshipPanel NPC creator', () => {
  beforeEach(() => {
    useGameStore.setState({
      avatar: { ...defaultAvatar, shirtColor: '#22c55e' },
      savedAvatars: [
        {
          id: 'saved-hero-style',
          name: 'Hero Style',
          avatar: {
            ...defaultAvatar,
            shirtColor: '#ef4444',
            accentColor: '#8b5cf6',
          },
          createdAt: 1,
        },
      ],
      savedFriends: [],
      messageThreads: [],
      chat: [],
      openPanel: 'friends',
    })
  })

  it('creates an in-world NPC from a saved character style', () => {
    render(<FriendshipPanel />)

    fireEvent.change(screen.getByLabelText('NPC name'), {
      target: { value: 'Coach Mia' },
    })
    fireEvent.click(screen.getByRole('option', { name: /Hero Style/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Create NPC' }))

    const friend = useGameStore.getState().savedFriends[0]
    expect(friend).toMatchObject({
      name: 'Coach Mia',
      inWorld: true,
      avatar: expect.objectContaining({
        shirtColor: '#ef4444',
        accentColor: '#8b5cf6',
      }),
    })
    expect(
      useGameStore
        .getState()
        .messageThreads.some((thread) => thread.botId === friend.id),
    ).toBe(true)
    expect(screen.getByText('Coach Mia')).toBeInTheDocument()
  })
})
