import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialMiniGame } from '../ai/miniGames'
import { getLocation, worldLocations } from '../data/world'
import { useGameStore } from '../state/gameStore'
import { MapPanel } from './MapPanel'

describe('MapPanel', () => {
  beforeEach(() => {
    useGameStore.setState((state) => ({
      activeInterior: undefined,
      nearbyLocation: 'spawn',
      openPanel: 'map',
      playerPosition: [0, 0, 4],
      playerYaw: 0,
      obby: { ...state.obby, active: false },
      miniGame: createInitialMiniGame(),
      savedFriends: [],
      touch: {
        ...state.touch,
        x: 0,
        y: 0,
        jump: false,
        interact: false,
        run: false,
      },
      chat: [],
    }))
  })

  it('shows every key place and travels to the selected destination', async () => {
    const user = userEvent.setup()
    render(<MapPanel />)

    expect(screen.getAllByTestId(/^map-marker-/)).toHaveLength(
      worldLocations.length,
    )
    await user.click(screen.getByTestId('map-marker-park'))
    await user.click(
      screen.getByRole('button', { name: 'Travel to Buddy Park' }),
    )

    expect(useGameStore.getState().playerPosition).toEqual(
      getLocation('park').travelPosition,
    )
    expect(useGameStore.getState().openPanel).toBeUndefined()
  })

  it('keeps the map visible but disables travel during an active activity', () => {
    useGameStore.setState((state) => ({
      obby: { ...state.obby, active: true },
    }))
    render(<MapPanel />)

    expect(
      screen.getByRole('button', { name: 'Travel to Spawn Plaza' }),
    ).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Finish or cancel')
  })

  it('exposes pan and zoom navigation without clipping outlying destinations', async () => {
    const user = userEvent.setup()
    render(<MapPanel />)

    expect(
      screen.getByLabelText('Draggable BlockBuddies world map'),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Zoom map in' })).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Show all destinations' }),
    ).toBeVisible()
    expect(screen.getByTestId('map-marker-football')).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Centre map on player' }),
    )
    expect(screen.getByText('X 0 / Z 4')).toBeVisible()
  })

  it('selects a created character and sends them walking or teleports them', async () => {
    const user = userEvent.setup()
    useGameStore.getState().createSavedFriend('Map Walker')
    const friend = useGameStore.getState().savedFriends[0]
    render(<MapPanel />)

    await user.click(
      screen.getAllByRole('button', {
        name: 'Select Map Walker on map',
      })[0],
    )
    await user.click(screen.getByTestId('map-marker-football'))
    await user.click(
      screen.getByRole('button', {
        name: 'Send Map Walker walking to target',
      }),
    )

    expect(useGameStore.getState().savedFriends[0].movement).toMatchObject({
      mode: 'walk',
      destination: [90, 0, -33],
    })

    await user.click(
      screen.getByRole('button', {
        name: 'Teleport Map Walker to target',
      }),
    )
    expect(useGameStore.getState().savedFriends[0]).toMatchObject({
      position: [90, 0, -33],
      movement: undefined,
    })
    expect(screen.getByTestId(`map-friend-${friend.id}`)).toBeVisible()
  })
})
