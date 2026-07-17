import { describe, expect, it, vi } from 'vitest'
import {
  coinRushTargets,
  createInitialMiniGame,
  deliveryDashTargets,
  miniGameDefinition,
} from '../ai/miniGames'
import { clothingItems, heroSkinItems } from '../data/avatarCustomization'
import { getLocation } from '../data/world'
import { buildPlacementClearsPlayer } from '../ai/buildMode'
import { interiorEntryYaw, interiorSpawnPosition } from '../game/interiors'
import {
  defaultAvatar,
  defaultPlayerName,
  makeSaveSnapshot,
  normalizeSavedAvatar,
  useGameStore,
} from './gameStore'
import { useLocalPartyStore } from './localPartyStore'

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
  it('includes original superhero-style skins with valid avatar patches', () => {
    expect(heroSkinItems).toHaveLength(5)
    expect(heroSkinItems.map((item) => item.name)).toEqual([
      'Sky Guardian',
      'Solar Sprinter',
      'Neon Knight',
      'Forest Defender',
      'Moon Rescuer',
    ])
    expect(heroSkinItems.every((item) => item.kind === 'skin')).toBe(true)
    expect(heroSkinItems.every((item) => item.cost === 0)).toBe(true)
    expect(
      heroSkinItems.every((item) =>
        String(item.patch.outfitStyle).startsWith('hero-'),
      ),
    ).toBe(true)
    expect(
      heroSkinItems.every((item) =>
        String(item.patch.accessory).startsWith('hero-cape-'),
      ),
    ).toBe(true)
  })

  it('applies free superhero-style skins without spending coins', () => {
    const item = heroSkinItems[2]
    useGameStore.setState({
      coins: 25,
      unlockedItems: [],
      avatar: defaultAvatar,
      chat: [],
    })

    useGameStore.getState().selectCustomizationItem(item)

    expect(useGameStore.getState().coins).toBe(25)
    expect(useGameStore.getState().avatar.avatarSource).toBe('Neon Knight Skin')
    expect(useGameStore.getState().avatar.outfitStyle).toBe('hero-armour')
    expect(useGameStore.getState().avatar.accessory).toBe('hero-cape-neon')
  })

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

  it('saves the chosen character when setup is completed', () => {
    useGameStore.setState({
      profileComplete: false,
      playerName: defaultPlayerName,
      avatar: { ...defaultAvatar, shirtColor: '#ef4444' },
      savedAvatars: [],
    })

    useGameStore.getState().completePlayerProfile('SetupBuddy')

    expect(useGameStore.getState().profileComplete).toBe(true)
    expect(useGameStore.getState().playerName).toBe('SetupBuddy')
    expect(useGameStore.getState().savedAvatars[0]).toMatchObject({
      name: 'SetupBuddy',
      avatar: expect.objectContaining({ shirtColor: '#ef4444' }),
    })
  })
})

describe('saved game friends', () => {
  it('creates saved friends that can be toggled into the world and persisted', () => {
    useGameStore.setState({
      playerName: 'Fahim',
      avatar: defaultAvatar,
      savedFriends: [],
      messageThreads: [],
      chat: [],
    })

    useGameStore.getState().createSavedFriend('Builder Pal')
    const friend = useGameStore.getState().savedFriends[0]

    expect(friend.name).toBe('Builder Pal')
    expect(friend.inWorld).toBe(true)
    expect(
      useGameStore
        .getState()
        .messageThreads.some((thread) => thread.botId === friend.id),
    ).toBe(true)

    useGameStore.getState().toggleSavedFriendInWorld(friend.id)

    const snapshot = makeSaveSnapshot(useGameStore.getState())
    expect(snapshot.savedFriends[0].inWorld).toBe(false)
    expect(snapshot.savedFriends[0].route.length).toBeGreaterThan(1)
  })
})

describe('quest progression', () => {
  it('auto-starts quests when natural gameplay progress happens', () => {
    useGameStore.setState({
      questProgress: useGameStore
        .getState()
        .questProgress.map((quest) =>
          quest.id === 'visit-park'
            ? { ...quest, started: false, completed: false, progress: 0 }
            : quest,
        ),
      chat: [],
      coins: 0,
    })

    useGameStore.getState().advanceQuest('visit-park', 1)

    const quest = useGameStore
      .getState()
      .questProgress.find((entry) => entry.id === 'visit-park')
    expect(quest).toMatchObject({ started: true, completed: true, progress: 1 })
    expect(useGameStore.getState().coins).toBeGreaterThan(0)
  })
})

describe('direct message inbox', () => {
  it('marks buddy messages read when the thread is opened', () => {
    useGameStore.setState({
      openPanel: undefined,
      selectedMessageThreadId: undefined,
      messageThreads: [
        {
          id: 'luna',
          botId: 'luna',
          botName: 'LunaBlocks',
          updatedAt: 100,
          messages: [
            {
              id: 'dm-test',
              presetId: 'greeting-008',
              text: 'Welcome back!',
              from: 'bot',
              read: false,
              createdAt: 100,
            },
          ],
        },
      ],
    })

    useGameStore.getState().openMessageThread('luna')

    const thread = useGameStore
      .getState()
      .messageThreads.find((entry) => entry.botId === 'luna')
    expect(useGameStore.getState().openPanel).toBe('messages')
    expect(useGameStore.getState().selectedMessageThreadId).toBe('luna')
    expect(thread?.messages[0]?.read).toBe(true)
  })

  it('sends only predefined messages and stores the bot reply in the inbox', () => {
    useGameStore.setState({
      playerName: 'BlockBuddy',
      chat: [],
      earnedBadges: [],
      openPanel: undefined,
      selectedMessageThreadId: undefined,
      messageThreads: [
        {
          id: 'luna',
          botId: 'luna',
          botName: 'LunaBlocks',
          updatedAt: 100,
          messages: [],
        },
      ],
    })

    useGameStore.getState().sendPredefinedMessage('luna', 'game-001')

    const thread = useGameStore
      .getState()
      .messageThreads.find((entry) => entry.botId === 'luna')
    expect(thread?.messages.map((message) => message.text)).toEqual([
      'Want to play a mini game?',
      'Hi!',
    ])
    expect(thread?.messages[1]?.read).toBe(false)
    expect(useGameStore.getState().chat.map((message) => message.text)).toEqual(
      ['Want to play a mini game?', 'Hi!', 'Badge earned: Social Buddy'],
    )
    expect(useGameStore.getState().earnedBadges).toContain('social-buddy')
  })

  it('persists message threads in the save snapshot', () => {
    useGameStore.setState({
      messageThreads: [
        {
          id: 'max',
          botId: 'max',
          botName: 'MaxJumps',
          updatedAt: 200,
          messages: [
            {
              id: 'dm-save',
              presetId: 'game-004',
              text: 'Meet me at the obby.',
              from: 'bot',
              read: false,
              createdAt: 200,
            },
          ],
        },
      ],
    })

    const snapshot = makeSaveSnapshot(useGameStore.getState())

    expect(
      snapshot.messageThreads?.find((thread) => thread.botId === 'max'),
    ).toMatchObject({
      botName: 'MaxJumps',
      messages: [{ text: 'Meet me at the obby.', read: false }],
    })
  })

  it('creates local party player inbox threads and sends predefined messages', () => {
    const sendDirectMessage = vi.fn()
    useLocalPartyStore.setState({
      remotePlayers: {
        'local-guest': {
          id: 'local-guest',
          name: 'GuestBuddy',
          position: [1, 0, 1],
          yaw: 0,
          avatar: defaultAvatar,
          action: 'idle',
          updatedAt: Date.now(),
        },
      },
      sendDirectMessage,
    })
    useGameStore.setState({
      playerName: 'HostBuddy',
      chat: [],
      earnedBadges: [],
      openPanel: undefined,
      selectedMessageThreadId: undefined,
      messageThreads: [],
    })

    useGameStore.getState().openMessageThread('local-guest', 'GuestBuddy')
    useGameStore.getState().sendPredefinedMessage('local-guest', 'greeting-001')
    useGameStore.getState().receiveLocalPartyMessage({
      id: 'party-dm-test',
      fromId: 'local-guest',
      fromName: 'GuestBuddy',
      toId: 'local-host',
      presetId: 'game-001',
      text: 'Want to play a mini game?',
      createdAt: 500,
    })

    const thread = useGameStore
      .getState()
      .messageThreads.find((entry) => entry.botId === 'local-guest')
    expect(thread?.botName).toBe('GuestBuddy')
    expect(thread?.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'player', text: 'Hi!' }),
        expect.objectContaining({
          from: 'bot',
          text: 'Want to play a mini game?',
          read: false,
        }),
      ]),
    )
    expect(useGameStore.getState().openPanel).toBe('messages')
    expect(useGameStore.getState().selectedMessageThreadId).toBe('local-guest')
    expect(useGameStore.getState().earnedBadges).toContain('social-buddy')
    expect(sendDirectMessage).toHaveBeenCalledWith(
      'local-guest',
      'greeting-001',
      'Hi!',
    )
  })
})

describe('local party shared build persistence', () => {
  it('places a selected build piece from the playable build panel action', () => {
    const builder = getLocation('builder')
    useGameStore.setState({
      activeInterior: undefined,
      playerPosition: builder.travelPosition,
      playerYaw: builder.travelYaw,
      selectedBuildPiece: 'house',
      selectedBuildColor: '#60a5fa',
      placedBlocks: [],
      earnedBadges: [],
      chat: [],
      settings: {
        ...useGameStore.getState().settings,
        worldSeed: 'LONDON-2026',
      },
    })

    useGameStore.getState().placeBlock()

    const placed = useGameStore.getState().placedBlocks[0]
    expect(placed).toMatchObject({
      kind: 'house',
      color: '#60a5fa',
      name: 'My House',
    })
    expect(
      buildPlacementClearsPlayer(
        placed.position,
        builder.travelPosition,
        'house',
      ),
    ).toBe(true)
    expect(useGameStore.getState().selectedBuildBlockId).toBe(placed.id)
    expect(useGameStore.getState().chat.at(-1)?.text).toBe('World piece placed')
    expect(useGameStore.getState().earnedBadges).toContain('builder')
  })

  it('renames and rotates the selected house while preserving it in saves', () => {
    useGameStore.setState({
      selectedBuildBlockId: 'named-house',
      buildRotation: 0,
      placedBlocks: [
        {
          id: 'named-house',
          kind: 'house',
          name: 'My House',
          position: [12, 0.02, 12],
          color: '#60a5fa',
          rotation: 0,
        },
      ],
      chat: [],
    })

    useGameStore.getState().renameSelectedBuildBlock("  Sunny's <Home>!!!  ")
    useGameStore.getState().rotateBuildPiece()

    const house = useGameStore.getState().placedBlocks[0]
    expect(house.name).toBe("Sunny's Home")
    expect(house.rotation).toBeCloseTo(Math.PI / 2)
    expect(useGameStore.getState().buildRotation).toBeCloseTo(Math.PI / 2)
    expect(makeSaveSnapshot(useGameStore.getState()).placedBlocks[0]).toEqual(
      house,
    )
  })

  it('removes the selected built item instead of the last item', () => {
    useGameStore.setState({
      selectedBuildBlockId: 'first-house',
      placedBlocks: [
        {
          id: 'first-house',
          kind: 'house',
          position: [10, 0.02, 10],
          color: '#60a5fa',
        },
        {
          id: 'second-tree',
          kind: 'tree',
          position: [18, 0.02, 10],
          color: '#16a34a',
        },
      ],
      chat: [],
    })

    useGameStore.getState().removeSelectedBlock()

    expect(
      useGameStore.getState().placedBlocks.map((block) => block.id),
    ).toEqual(['second-tree'])
    expect(useGameStore.getState().selectedBuildBlockId).toBeUndefined()
    expect(useGameStore.getState().chat.at(-1)?.text).toBe(
      'Selected world piece removed',
    )
  })

  it('merges remote player build pieces into the saved custom world', () => {
    const builder = getLocation('builder')
    useGameStore.setState({
      placedBlocks: [],
      earnedBadges: [],
      chat: [],
      settings: {
        ...useGameStore.getState().settings,
        worldSeed: 'LONDON-2026',
      },
    })

    useGameStore.getState().mergeSharedBuildBlocks([
      {
        id: 'party-house-1',
        kind: 'house',
        position: [builder.travelPosition[0], 0, builder.travelPosition[2]],
        color: '#60a5fa',
        rotation: 0,
      },
    ])

    const snapshot = makeSaveSnapshot(useGameStore.getState())
    expect(snapshot.placedBlocks?.map((block) => block.id)).toContain(
      'party-house-1',
    )
    expect(useGameStore.getState().earnedBadges).toContain('builder')
  })

  it('reconciles renamed and rotated Local Party houses already in the world', () => {
    useGameStore.setState({
      placedBlocks: [
        {
          id: 'party-house-edit',
          kind: 'house',
          name: 'Old House',
          position: [34, 0.02, 40],
          color: '#60a5fa',
          rotation: 0,
        },
      ],
      chat: [],
    })

    useGameStore.getState().mergeSharedBuildBlocks([
      {
        id: 'party-house-edit',
        kind: 'house',
        name: 'Party Base',
        position: [34, 0.02, 40],
        color: '#f9a8d4',
        rotation: Math.PI / 2,
      },
    ])

    expect(useGameStore.getState().placedBlocks[0]).toMatchObject({
      name: 'Party Base',
      color: '#f9a8d4',
      rotation: Math.PI / 2,
    })
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
    expect(
      useGameStore.getState().chat.map((message) => message.text),
    ).toContain('Coin collected! +10 pts, +1 coin (1/8)')
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
    expect(
      useGameStore.getState().chat.map((message) => message.text),
    ).toContain('Park drop-off collected! +20 pts, +8 coins, +5s (2/4)')
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
    expect(useGameStore.getState().miniGame.announcement?.title).toBe(
      'Coin Rush',
    )
    expect(
      useGameStore.getState().chat.map((message) => message.text),
    ).toContain('Mini game started for all players: Coin Rush')

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
      touch: {
        x: 1,
        y: -1,
        lookX: 0.4,
        lookY: -0.2,
        jump: true,
        interact: true,
        run: true,
      },
      chat: [],
    })
    const visit = {
      id: 'test-school',
      title: 'Test School',
      kind: 'school' as const,
      returnPosition: [8, 0, -2] as [number, number, number],
      returnYaw: 1.2,
    }

    useGameStore
      .getState()
      .enterInterior(visit, interiorSpawnPosition, interiorEntryYaw)
    expect(useGameStore.getState().teleportSequence).toBe(21)
    expect(useGameStore.getState().playerPosition).toEqual(
      interiorSpawnPosition,
    )
    expect(useGameStore.getState().playerYaw).toBe(interiorEntryYaw)
    expect(useGameStore.getState().teleportTarget).toMatchObject({
      sequence: 21,
      position: interiorSpawnPosition,
      yaw: interiorEntryYaw,
      resetView: true,
    })
    expect(useGameStore.getState().touch).toEqual({
      x: 0,
      y: 0,
      lookX: 0,
      lookY: 0,
      jump: false,
      interact: false,
      run: false,
    })

    useGameStore.getState().setPlayer([99, 0, 99], 2, 20)
    expect(useGameStore.getState().playerPosition).toEqual(
      interiorSpawnPosition,
    )
    useGameStore
      .getState()
      .setPlayer(interiorSpawnPosition, interiorEntryYaw, 21)
    expect(useGameStore.getState().teleportTarget).toBeUndefined()

    expect(useGameStore.getState().leaveInterior()).toEqual(visit)
    expect(useGameStore.getState().teleportSequence).toBe(22)
    expect(useGameStore.getState().playerPosition).toEqual(visit.returnPosition)
    expect(useGameStore.getState().teleportTarget).toMatchObject({
      sequence: 22,
      position: visit.returnPosition,
      yaw: visit.returnYaw,
      resetView: true,
    })
    expect(useGameStore.getState().touch).toEqual({
      x: 0,
      y: 0,
      lookX: 0,
      lookY: 0,
      jump: false,
      interact: false,
      run: false,
    })

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
