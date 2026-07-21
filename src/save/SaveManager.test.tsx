import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defaultAvatar,
  defaultPlayerName,
  useGameStore,
  type GameSave,
} from '../state/gameStore'
import { SaveManager } from './SaveManager'

const storageMock = vi.hoisted(() => ({
  loadGameSave: vi.fn(),
  saveGame: vi.fn(),
}))

vi.mock('./storage', () => ({
  loadGameSave: storageMock.loadGameSave,
  saveGame: storageMock.saveGame,
}))

describe('SaveManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    storageMock.loadGameSave.mockReset()
    storageMock.saveGame.mockReset()
    useGameStore.setState({
      screen: 'menu',
      saveLoaded: false,
      profileComplete: false,
      playerName: defaultPlayerName,
      avatar: defaultAvatar,
      savedAvatars: [],
      coins: 0,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for stored profile loading before autosaving the current avatar', async () => {
    let resolveLoad: (save: Partial<GameSave>) => void = () => {}
    const savedAvatar = {
      ...defaultAvatar,
      bodyColor: '#f1b27a',
      shirtColor: '#7c3aed',
      hairStyle: 'curly' as const,
      face: 'happy' as const,
    }
    storageMock.loadGameSave.mockReturnValue(
      new Promise<Partial<GameSave>>((resolve) => {
        resolveLoad = resolve
      }),
    )
    storageMock.saveGame.mockResolvedValue(undefined)

    render(<SaveManager />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })
    expect(storageMock.saveGame).not.toHaveBeenCalled()

    await act(async () => {
      resolveLoad({
        profileComplete: true,
        playerName: 'StoredBuddy',
        avatar: savedAvatar,
      })
      await Promise.resolve()
    })

    expect(useGameStore.getState().saveLoaded).toBe(true)
    expect(useGameStore.getState().avatar).toEqual(savedAvatar)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(701)
    })

    expect(storageMock.saveGame).toHaveBeenCalledTimes(1)
    expect(storageMock.saveGame).toHaveBeenCalledWith(
      expect.objectContaining({
        profileComplete: true,
        playerName: 'StoredBuddy',
        avatar: savedAvatar,
      }),
    )
  })

  it('serializes saves so a stale coin balance cannot overwrite a mini-game reward', async () => {
    let resolveFirstSave: () => void = () => {}
    storageMock.loadGameSave.mockResolvedValue({ coins: 10 })
    storageMock.saveGame
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirstSave = resolve
          }),
      )
      .mockResolvedValue(undefined)

    render(<SaveManager />)

    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      useGameStore.setState({ coins: 11 })
      await vi.advanceTimersByTimeAsync(701)
    })

    expect(storageMock.saveGame).toHaveBeenCalledTimes(1)
    expect(storageMock.saveGame.mock.calls[0][0].coins).toBe(11)

    await act(async () => {
      useGameStore.setState({ coins: 54 })
      await vi.advanceTimersByTimeAsync(701)
    })

    expect(storageMock.saveGame).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveFirstSave()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(storageMock.saveGame).toHaveBeenCalledTimes(2)
    expect(storageMock.saveGame.mock.calls[1][0].coins).toBe(54)
  })
})
