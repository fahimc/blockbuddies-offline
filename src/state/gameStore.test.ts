import { describe, expect, it } from 'vitest'
import { coinRushTargets, createInitialMiniGame, miniGameDefinition } from '../ai/miniGames'
import { clothingItems } from '../data/avatarCustomization'
import { defaultAvatar, makeSaveSnapshot, normalizeSavedAvatar, useGameStore } from './gameStore'

describe('avatar save migration', () => {
  it('upgrades the legacy yellow and blue default avatar', () => {
    expect(
      normalizeSavedAvatar({
        bodyColor: '#facc15',
        shirtColor: '#2563eb',
        hat: 'none',
        trail: 'none',
      }),
    ).toEqual(defaultAvatar)
  })

  it('preserves intentional custom avatar choices', () => {
    const customAvatar = {
      bodyColor: '#facc15',
      shirtColor: '#2563eb',
      hat: 'hat-star' as const,
      trail: 'trail-spark' as const,
    }

    expect(normalizeSavedAvatar(customAvatar)).toMatchObject(customAvatar)
    expect(normalizeSavedAvatar(customAvatar)?.outfitStyle).toBe(defaultAvatar.outfitStyle)
  })
})

describe('avatar customization selection', () => {
  it('unlocks and applies paid customization items', () => {
    const item = clothingItems[2]
    useGameStore.setState({ coins: item.cost, unlockedItems: [], avatar: defaultAvatar, chat: [] })

    useGameStore.getState().selectCustomizationItem(item)

    expect(useGameStore.getState().coins).toBe(0)
    expect(useGameStore.getState().unlockedItems).toContain(item.shopItemId)
    expect(useGameStore.getState().avatar.shirtColor).toBe(item.patch.shirtColor)
  })

  it('does not unlock paid customization items without enough coins', () => {
    const item = clothingItems[3]
    useGameStore.setState({ coins: 1, unlockedItems: [], avatar: defaultAvatar, chat: [] })

    useGameStore.getState().selectCustomizationItem(item)

    expect(useGameStore.getState().coins).toBe(1)
    expect(useGameStore.getState().unlockedItems).not.toContain(item.shopItemId)
    expect(useGameStore.getState().avatar.shirtColor).toBe(defaultAvatar.shirtColor)
  })
})

describe('player setup flow', () => {
  it('sanitizes and stores the character name', () => {
    useGameStore.getState().setPlayerName('  Pixel@@ Buddy!!!  ')

    expect(useGameStore.getState().playerName).toBe('Pixel Buddy')
  })

  it('includes the character name in save snapshots', () => {
    useGameStore.setState({ playerName: 'SaveTester' })

    expect(makeSaveSnapshot(useGameStore.getState()).playerName).toBe('SaveTester')
  })

  it('saves and reapplies local avatar styles', () => {
    useGameStore.setState({
      avatar: { ...defaultAvatar, shirtColor: '#14b8a6', avatarSource: 'Test Fit' },
      savedAvatars: [],
      chat: [],
    })

    useGameStore.getState().saveCurrentAvatarStyle()
    const saved = useGameStore.getState().savedAvatars[0]
    useGameStore.getState().updateAvatar({ shirtColor: '#dc2626' })
    useGameStore.getState().applySavedAvatarStyle(saved.id)

    expect(useGameStore.getState().savedAvatars).toHaveLength(1)
    expect(useGameStore.getState().avatar.shirtColor).toBe('#14b8a6')
  })
})

describe('mini game store flow', () => {
  it('starts a mini game, completes it, and awards coins plus a badge', () => {
    useGameStore.setState({
      miniGame: createInitialMiniGame(),
      activeInterior: undefined,
      openPanel: 'minigames',
      buildMode: true,
      coins: 0,
      earnedBadges: [],
      chat: [],
      playerPosition: [0, 0, 0],
    })

    useGameStore.getState().startMiniGame('coin-rush', 1_000)

    expect(useGameStore.getState().miniGame.status).toBe('running')
    expect(useGameStore.getState().playerPosition).toEqual(miniGameDefinition('coin-rush').startPosition)
    expect(useGameStore.getState().openPanel).toBeUndefined()
    expect(useGameStore.getState().buildMode).toBe(false)

    coinRushTargets.forEach((target, index) => {
      useGameStore.getState().tickMiniGame(2_000 + index * 100, target.position)
    })

    expect(useGameStore.getState().miniGame.status).toBe('completed')
    expect(useGameStore.getState().coins).toBe(35)
    expect(useGameStore.getState().earnedBadges).toContain('mini-game-star')
    expect(useGameStore.getState().miniGame.records['coin-rush']?.bestScore).toBe(8)
  })
})
