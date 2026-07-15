import { describe, expect, it } from 'vitest'
import {
  coinRushTargets,
  createInitialMiniGame,
  deliveryDashTargets,
  miniGameDefinition,
} from '../ai/miniGames'
import { clothingItems } from '../data/avatarCustomization'
import { getLocation } from '../data/world'
import {
  defaultAvatar,
  defaultPlayerName,
  makeSaveSnapshot,
  normalizeSavedAvatar,
  useGameStore,
} from './gameStore'

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
    expect(normalizeSavedAvatar(customAvatar)?.outfitStyle).toBe(
      defaultAvatar.outfitStyle,
    )
  })
})

describe('avatar customization selection', () => {
  it('unlocks and applies paid customization items', () => {
    const item = clothingItems[2]
    useGameStore.setState({
      coins: item.cost,
      unlockedItems: [],
      avatar: defaultAvatar,
      chat: [],
    })

    useGameStore.getState().selectCustomizationItem(item)

    expect(useGameStore.getState().coins).toBe(0)
    expect(useGameStore.getState().unlockedItems).toContain(item.shopItemId)
    expect(useGameStore.getState().avatar.shirtColor).toBe(
      item.patch.shirtColor,
    )
  })

  it('does not unlock paid customization items without enough coins', () => {
    const item = clothingItems[3]
    useGameStore.setState({
      coins: 1,
      unlockedItems: [],
      avatar: defaultAvatar,
      chat: [],
    })

    useGameStore.getState().selectCustomizationItem(item)

    expect(useGameStore.getState().coins).toBe(1)
    expect(useGameStore.getState().unlockedItems).not.toContain(item.shopItemId)
    expect(useGameStore.getState().avatar.shirtColor).toBe(
      defaultAvatar.shirtColor,
    )
  })
})

describe('player setup flow', () => {
  it('sanitizes and stores the character name', () => {
    useGameStore.getState().setPlayerName('  Pixel@@ Buddy!!!  ')

    expect(useGameStore.getState().playerName).toBe('Pixel Buddy')
  })

  it('includes the character name in save snapshots', () => {
    useGameStore.setState({ playerName: 'SaveTester', profileComplete: true })

    expect(makeSaveSnapshot(useGameStore.getState()).playerName).toBe(
      'SaveTester',
    )
    expect(makeSaveSnapshot(useGameStore.getState()).profileComplete).toBe(true)
  })

  it('persists the current created avatar in save snapshots', () => {
    const customAvatar = {
      ...defaultAvatar,
      bodyColor: '#f1b27a',
      shirtColor: '#7c3aed',
      hairStyle: 'curly' as const,
      hairColor: '#2f1b10',
      face: 'wink' as const,
      pantsColor: '#1d4ed8',
      shoeStyle: 'boots' as const,
    }
    useGameStore.setState({
      profileComplete: true,
      playerName: 'CustomBuddy',
      avatar: customAvatar,
    })

    const snapshot = makeSaveSnapshot(useGameStore.getState())

    expect(snapshot.avatar).toEqual(customAvatar)
    expect(snapshot.playerName).toBe('CustomBuddy')
    expect(snapshot.profileComplete).toBe(true)
  })

  it('restores completed saved profiles with the avatar for returning players', () => {
    const savedAvatar = {
      ...defaultAvatar,
      shirtColor: '#f97316',
      hairStyle: 'bob' as const,
      face: 'happy' as const,
    }

    useGameStore.setState({
      profileComplete: false,
      playerName: defaultPlayerName,
      avatar: defaultAvatar,
    })
    useGameStore.getState().loadFromSave({
      profileComplete: true,
      playerName: 'ReturnBuddy',
      avatar: savedAvatar,
    })

    expect(useGameStore.getState().profileComplete).toBe(true)
    expect(useGameStore.getState().playerName).toBe('ReturnBuddy')
    expect(useGameStore.getState().avatar).toEqual(savedAvatar)
  })

  it('saves and reapplies local avatar styles', () => {
    useGameStore.setState({
      avatar: {
        ...defaultAvatar,
        shirtColor: '#14b8a6',
        avatarSource: 'Test Fit',
      },
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
  it('adds a spendable coin immediately for each Coin Rush pickup', () => {
    useGameStore.setState({
      miniGame: createInitialMiniGame(),
      activeInterior: undefined,
      coins: 0,
      earnedBadges: [],
      chat: [],
    })

    useGameStore.getState().startMiniGame('coin-rush', 1_000)
    useGameStore.getState().tickMiniGame(2_000, coinRushTargets[0].position)

    expect(useGameStore.getState().coins).toBe(1)
    expect(useGameStore.getState().miniGame.points).toBe(10)
    expect(useGameStore.getState().chat.map((message) => message.text)).toContain(
      'Coin collected! +10 pts, +1 coin (1/8)',
    )
  })

  it('awards Delivery Dash drop-off coins and time bonuses before completion', () => {
    useGameStore.setState({
      miniGame: createInitialMiniGame(),
      activeInterior: undefined,
      coins: 0,
      earnedBadges: [],
      chat: [],
    })

    useGameStore.getState().startMiniGame('delivery-dash', 1_000)
    const initialEndsAt = useGameStore.getState().miniGame.endsAt
    useGameStore.getState().tickMiniGame(2_000, deliveryDashTargets[0].position)
    useGameStore.getState().tickMiniGame(3_000, deliveryDashTargets[1].position)

    expect(useGameStore.getState().coins).toBe(8)
    expect(useGameStore.getState().miniGame.score).toBe(2)
    expect(useGameStore.getState().miniGame.endsAt).toBe(initialEndsAt + 5_000)
    expect(useGameStore.getState().chat.map((message) => message.text)).toContain(
      'Park drop-off collected! +20 pts, +8 coins, +5s (2/4)',
    )
  })

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
    expect(useGameStore.getState().playerPosition).toEqual(
      miniGameDefinition('coin-rush').startPosition,
    )
    expect(useGameStore.getState().openPanel).toBeUndefined()
    expect(useGameStore.getState().buildMode).toBe(false)
    expect(useGameStore.getState().miniGame.announcement?.title).toBe('Coin Rush')
    expect(useGameStore.getState().chat.map((message) => message.text)).toContain(
      'Mini game started for all players: Coin Rush',
    )

    coinRushTargets.forEach((target, index) => {
      useGameStore.getState().tickMiniGame(2_000 + index * 100, target.position)
    })

    expect(useGameStore.getState().miniGame.status).toBe('completed')
    expect(useGameStore.getState().coins).toBe(43)
    expect(useGameStore.getState().miniGame.points).toBe(130)
    expect(useGameStore.getState().earnedBadges).toContain('mini-game-star')
    expect(
      useGameStore.getState().miniGame.records['coin-rush']?.bestScore,
    ).toBe(8)
    expect(
      useGameStore.getState().miniGame.records['coin-rush']?.bestPoints,
    ).toBe(130)
  })
})

describe('map fast travel', () => {
  it('leaves interiors, clears movement, and moves to a safe landmark arrival point', () => {
    const sequence = useGameStore.getState().teleportSequence
    useGameStore.setState((state) => ({
      activeInterior: {
        id: 'test-house',
        title: 'Test House',
        kind: 'house',
        returnPosition: [4, 0, 4],
        returnYaw: 0,
      },
      nearbyLocation: undefined,
      openPanel: 'map',
      buildMode: true,
      sleeping: true,
      interactionPrompt: 'wake',
      touch: {
        x: 1,
        y: -1,
        lookX: 0,
        lookY: 0,
        jump: true,
        interact: true,
        run: true,
      },
      obby: { ...state.obby, active: false },
      miniGame: createInitialMiniGame(),
      chat: [],
    }))

    expect(useGameStore.getState().travelToLocation('school')).toBe(true)

    const state = useGameStore.getState()
    const school = getLocation('school')
    expect(state.playerPosition).toEqual(school.travelPosition)
    expect(state.playerYaw).toBe(school.travelYaw)
    expect(state.teleportSequence).toBe(sequence + 1)
    expect(state.activeInterior).toBeUndefined()
    expect(state.openPanel).toBeUndefined()
    expect(state.buildMode).toBe(false)
    expect(state.sleeping).toBe(false)
    expect(state.touch).toEqual({
      x: 0,
      y: 0,
      lookX: 0,
      lookY: 0,
      jump: false,
      interact: false,
      run: false,
    })
    expect(state.chat.at(-1)?.text).toBe('Travelled to Skill School')

    useGameStore.getState().setPlayer([0, 0, 4], 0, sequence)
    expect(useGameStore.getState().playerPosition).toEqual(
      school.travelPosition,
    )
    expect(useGameStore.getState().teleportTarget).toBeDefined()

    useGameStore
      .getState()
      .setPlayer(school.travelPosition, school.travelYaw, sequence + 1)
    expect(useGameStore.getState().teleportTarget).toBeUndefined()
  })

  it('blocks fast travel while a timed activity is active', () => {
    useGameStore.setState((state) => ({
      obby: { ...state.obby, active: true },
      miniGame: createInitialMiniGame(),
      playerPosition: [3, 0, 3],
      chat: [],
    }))

    expect(useGameStore.getState().travelToLocation('park')).toBe(false)
    expect(useGameStore.getState().playerPosition).toEqual([3, 0, 3])
    expect(useGameStore.getState().chat.at(-1)?.text).toContain('active game')
  })
})

describe('world interaction state', () => {
  it('rejects stale controller writes during interior entry and exit', () => {
    useGameStore.setState({
      activeInterior: undefined,
      playerPosition: [0, 0, 4],
      playerYaw: 0,
      teleportSequence: 20,
      teleportTarget: undefined,
      chat: [],
    })
    const visit = {
      id: 'test-school',
      title: 'Test School',
      kind: 'school' as const,
      returnPosition: [8, 0, -2] as [number, number, number],
      returnYaw: 1.2,
    }

    useGameStore.getState().enterInterior(visit, [0, 0, -4.45], 0)
    expect(useGameStore.getState().teleportSequence).toBe(21)
    expect(useGameStore.getState().playerPosition).toEqual([0, 0, -4.45])

    useGameStore.getState().setPlayer([99, 0, 99], 2, 20)
    expect(useGameStore.getState().playerPosition).toEqual([0, 0, -4.45])
    useGameStore.getState().setPlayer([0, 0, -4.45], 0, 21)
    expect(useGameStore.getState().teleportTarget).toBeUndefined()

    expect(useGameStore.getState().leaveInterior()).toEqual(visit)
    expect(useGameStore.getState().teleportSequence).toBe(22)
    expect(useGameStore.getState().playerPosition).toEqual(visit.returnPosition)

    useGameStore.getState().setPlayer([55, 0, 55], 0, 21)
    expect(useGameStore.getState().playerPosition).toEqual(visit.returnPosition)
    useGameStore.getState().setPlayer(visit.returnPosition, visit.returnYaw, 22)
    expect(useGameStore.getState().teleportTarget).toBeUndefined()
  })

  it('switches cleanly between sitting and driving states', () => {
    useGameStore.setState({
      seatedSeatId: undefined,
      activeVehicleId: undefined,
      sleeping: false,
      interactionPrompt: undefined,
      chat: [],
    })

    useGameStore.getState().setSeatedSeat('school-chair-front-left')
    expect(useGameStore.getState().seatedSeatId).toBe('school-chair-front-left')
    expect(useGameStore.getState().interactionPrompt).toBe('stand')

    useGameStore.getState().setActiveVehicle('sunny-car')
    expect(useGameStore.getState().seatedSeatId).toBeUndefined()
    expect(useGameStore.getState().activeVehicleId).toBe('sunny-car')
    expect(useGameStore.getState().interactionPrompt).toBe('exit-vehicle')

    useGameStore.getState().setActiveVehicle(undefined)
    expect(useGameStore.getState().activeVehicleId).toBeUndefined()
    expect(useGameStore.getState().interactionPrompt).toBeUndefined()
  })

  it('creates ordered world-action requests for exact 3D icon taps', () => {
    useGameStore.setState({ worldActionRequest: undefined })

    useGameStore.getState().requestWorldAction('seat', 'seat-a')
    const first = useGameStore.getState().worldActionRequest
    useGameStore.getState().requestWorldAction('vehicle', 'car-a')
    const second = useGameStore.getState().worldActionRequest

    expect(first).toMatchObject({ type: 'seat', id: 'seat-a' })
    expect(second).toMatchObject({ type: 'vehicle', id: 'car-a' })
    expect(second!.sequence).toBeGreaterThan(first!.sequence)
  })
})
