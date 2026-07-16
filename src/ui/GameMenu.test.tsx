import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createInitialMiniGame } from '../ai/miniGames'
import { getLocation } from '../data/world'
import { useGameStore } from '../state/gameStore'
import { GameMenu } from './GameMenu'

describe('GameMenu', () => {
  it('opens the tutorial section from the hamburger menu', () => {
    useGameStore.setState({ openPanel: undefined })

    render(<GameMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tutorial' }))

    expect(useGameStore.getState().openPanel).toBe('tutorial')
  })

  it('resets the player to Spawn Plaza from the hamburger menu', () => {
    const plaza = getLocation('spawn')
    useGameStore.setState((state) => ({
      playerPosition: [42, 3, -28],
      playerYaw: 1.4,
      teleportSequence: 6,
      teleportTarget: undefined,
      activeInterior: {
        id: 'test-house',
        title: 'Test House',
        kind: 'house',
        returnPosition: [8, 0, 8],
        returnYaw: 0.5,
      },
      openPanel: 'settings',
      sleeping: true,
      seatedSeatId: 'bench',
      activeVehicleId: 'car',
      playerEmote: 'dance',
      buildMode: true,
      obby: { ...state.obby, active: true },
      miniGame: { ...createInitialMiniGame(), activeId: 'coin-rush', status: 'running' },
      touch: { ...state.touch, x: 1, y: -1, lookX: 20, lookY: -10, jump: true, interact: true, run: true },
      chat: [],
    }))

    render(<GameMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset to Square' }))

    const state = useGameStore.getState()
    expect(state.playerPosition).toEqual(plaza.travelPosition)
    expect(state.playerYaw).toBe(plaza.travelYaw)
    expect(state.teleportSequence).toBe(7)
    expect(state.teleportTarget).toMatchObject({
      sequence: 7,
      position: plaza.travelPosition,
      yaw: plaza.travelYaw,
      resetView: true,
    })
    expect(state.activeInterior).toBeUndefined()
    expect(state.openPanel).toBeUndefined()
    expect(state.sleeping).toBe(false)
    expect(state.seatedSeatId).toBeUndefined()
    expect(state.activeVehicleId).toBeUndefined()
    expect(state.playerEmote).toBe('none')
    expect(state.buildMode).toBe(false)
    expect(state.obby.active).toBe(false)
    expect(state.miniGame.status).toBe('idle')
    expect(state.touch).toMatchObject({ x: 0, y: 0, lookX: 0, lookY: 0, jump: false, interact: false, run: false })
    expect(state.chat.at(-1)?.text).toBe('Reset to Spawn Plaza')
  })
})
