import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameSave } from '../state/gameStore'

const forage = vi.hoisted(() => ({
  config: vi.fn(),
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}))

vi.mock('localforage', () => ({ default: forage }))

import { clearGameSave, loadGameSave, saveGame } from './storage'

const snapshot = {
  saveVersion: 2,
  playerName: 'Buddy',
  coins: 42,
} as GameSave

describe('durable game save storage', () => {
  beforeEach(() => {
    forage.getItem.mockReset()
    forage.setItem.mockReset()
    forage.removeItem.mockReset()
  })

  it('loads the primary save when it is healthy', async () => {
    forage.getItem.mockResolvedValueOnce(snapshot)
    await expect(loadGameSave()).resolves.toBe(snapshot)
    expect(forage.getItem).toHaveBeenCalledTimes(1)
  })

  it('falls back to the backup when the primary save is unavailable', async () => {
    forage.getItem
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(snapshot)
    await expect(loadGameSave()).resolves.toBe(snapshot)
    expect(forage.getItem).toHaveBeenCalledTimes(2)
  })

  it('backs up the previous snapshot before replacing it', async () => {
    const previous = { ...snapshot, coins: 12 }
    forage.getItem.mockResolvedValue(previous)
    forage.setItem.mockResolvedValue(undefined)

    await saveGame(snapshot)

    expect(forage.setItem).toHaveBeenNthCalledWith(
      1,
      'blockbuddies-offline-save-v1-backup',
      previous,
    )
    expect(forage.setItem).toHaveBeenNthCalledWith(
      2,
      'blockbuddies-offline-save-v1',
      snapshot,
    )
  })

  it('clears both primary and recovery snapshots', async () => {
    forage.removeItem.mockResolvedValue(undefined)
    await clearGameSave()
    expect(forage.removeItem).toHaveBeenCalledWith(
      'blockbuddies-offline-save-v1',
    )
    expect(forage.removeItem).toHaveBeenCalledWith(
      'blockbuddies-offline-save-v1-backup',
    )
  })
})
