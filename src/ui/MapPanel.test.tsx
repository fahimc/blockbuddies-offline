import { fireEvent, render, screen } from '@testing-library/react'
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

  it('puts the player straight into a kart from the map destination', async () => {
    const user = userEvent.setup()
    render(<MapPanel />)

    await user.click(screen.getByTestId('map-marker-kart'))
    await user.click(screen.getByRole('button', { name: 'Play Go Karts' }))

    const state = useGameStore.getState()
    expect(state.playerPosition).toEqual(getLocation('kart').travelPosition)
    expect(state.activeVehicleId).toBe('go-kart:red')
    expect(state.kartRace).toMatchObject({
      vehicleId: 'go-kart:red',
      status: 'lobby',
    })
    expect(state.openPanel).toBeUndefined()
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

  it('recovers from an interrupted pinch and clears gameplay input on close', async () => {
    const user = userEvent.setup()
    render(<MapPanel />)
    const map = screen.getByTestId('town-map')
    Object.defineProperty(map, 'setPointerCapture', {
      configurable: true,
      value: () => {
        throw new DOMException('Pointer capture was interrupted')
      },
    })
    Object.defineProperty(map, 'hasPointerCapture', {
      configurable: true,
      value: () => false,
    })

    fireEvent.pointerDown(map, {
      pointerId: 11,
      pointerType: 'touch',
      clientX: 120,
      clientY: 180,
    })
    fireEvent.pointerDown(map, {
      pointerId: 12,
      pointerType: 'touch',
      clientX: 220,
      clientY: 180,
    })
    fireEvent.pointerMove(map, {
      pointerId: 12,
      pointerType: 'touch',
      clientX: 300,
      clientY: 180,
    })
    fireEvent.pointerCancel(map, {
      pointerId: 12,
      pointerType: 'touch',
    })
    fireEvent.lostPointerCapture(map, {
      pointerId: 11,
      pointerType: 'touch',
    })

    expect(document.body).not.toHaveTextContent('NaN')
    expect(screen.getByRole('button', { name: 'Close map' })).toBeEnabled()

    useGameStore.setState((state) => ({
      touch: {
        ...state.touch,
        x: 1,
        y: -1,
        lookX: 50,
        lookY: -50,
        jump: true,
        interact: true,
        run: true,
      },
    }))
    await user.click(screen.getByRole('button', { name: 'Close map' }))

    expect(useGameStore.getState().openPanel).toBeUndefined()
    expect(useGameStore.getState().touch).toMatchObject({
      x: 0,
      y: 0,
      lookX: 0,
      lookY: 0,
      jump: false,
      interact: false,
      run: false,
    })
  })
})
