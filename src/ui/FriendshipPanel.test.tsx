import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultAvatar, useGameStore } from '../state/gameStore'
import { FriendshipPanel } from './FriendshipPanel'

vi.mock('./GameAvatarPreview', () => ({
  GameAvatarPreview: ({ avatar }: { avatar: { shirtColor: string } }) => (
    <div data-testid="npc-avatar-preview" data-shirt={avatar.shirtColor} />
  ),
}))

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

  it('lets players fully customise a new NPC before creating them', () => {
    render(<FriendshipPanel />)

    fireEvent.change(screen.getByLabelText('NPC name'), {
      target: { value: 'Nova Hero' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Neon Knight/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Bob' }))
    fireEvent.click(screen.getByRole('button', { name: 'Robot' }))
    fireEvent.click(screen.getByLabelText('Shirt #7c3aed'))
    fireEvent.click(screen.getByRole('button', { name: 'Create NPC' }))

    expect(useGameStore.getState().savedFriends[0]).toMatchObject({
      name: 'Nova Hero',
      avatar: expect.objectContaining({
        shirtColor: '#7c3aed',
        hairStyle: 'bob',
        face: 'robot',
        topStyle: 'hero-skin-neon-knight',
        outfitStyle: 'hero-armour',
      }),
    })
  })
})
