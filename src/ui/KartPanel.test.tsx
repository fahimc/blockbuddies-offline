import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialMiniGame } from '../ai/miniGames'
import { getLocation } from '../data/world'
import { useGameStore, defaultAvatar } from '../state/gameStore'
import { makePartySnapshot, useLocalPartyStore } from '../state/localPartyStore'
import { KartPanel } from './KartPanel'

describe('KartPanel', () => {
  beforeEach(() => {
    useLocalPartyStore.setState({
      status: 'idle',
      remotePlayers: {},
    })
    useGameStore.setState((state) => ({
      activeInterior: undefined,
      activeVehicleId: undefined,
      nearbyLocation: 'spawn',
      openPanel: 'karts',
      playerPosition: [0, 0, 4],
      playerYaw: 0,
      obby: { ...state.obby, active: false },
      miniGame: createInitialMiniGame(),
      chat: [],
    }))
  })

  it('lets the player choose a kart and joins the starting grid directly', async () => {
    const user = userEvent.setup()
    render(<KartPanel />)

    expect(
      screen.getByRole('heading', { name: 'Buddy Kart Circuit' }),
    ).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'Gold Comet' }))
    await user.click(screen.getByRole('button', { name: 'Play Go Karts' }))

    const state = useGameStore.getState()
    expect(state.playerPosition).toEqual(getLocation('kart').travelPosition)
    expect(state.activeVehicleId).toBe('go-kart:gold')
    expect(state.kartRace).toMatchObject({
      vehicleId: 'go-kart:gold',
      status: 'lobby',
    })
    expect(state.openPanel).toBeUndefined()
  })

  it('explains why play is unavailable during another activity', () => {
    useGameStore.setState((state) => ({
      obby: { ...state.obby, active: true },
    }))
    render(<KartPanel />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Finish or cancel the current activity',
    )
    expect(screen.getByRole('button', { name: 'Play Go Karts' })).toBeDisabled()
  })

  it('marks a remote racer kart as in use and selects a free kart', () => {
    useLocalPartyStore.setState({
      status: 'connected',
      remotePlayers: {
        guest: makePartySnapshot({
          id: 'guest',
          name: 'Guest Buddy',
          position: [116, 0, -42],
          yaw: 0,
          avatar: defaultAvatar,
          action: 'idle',
          kart: {
            id: 'go-kart:red',
            position: [116, 0, -42],
            yaw: 0,
            speed: 0,
          },
        }),
      },
    })

    render(<KartPanel />)

    expect(
      screen.getByRole('radio', { name: 'Red Rocket - in use' }),
    ).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Blue Bolt' })).toBeChecked()
    expect(screen.getByText('Local Party: 2 connected')).toBeVisible()
  })
})
