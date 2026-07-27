import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialBuddyRush } from '../ai/buddyRush'
import { createQuestProgress } from '../ai/quests'
import { collectableBuddyDefinitions } from '../data/buddyRush'
import { questDefinitions } from '../data/quests'
import { defaultSettings, makeSaveSnapshot, useGameStore } from './gameStore'

describe('Buddy Rush game-store integration', () => {
  beforeEach(() => {
    useGameStore.setState({
      coins: 0,
      chat: [],
      earnedBadges: [],
      questProgress: createQuestProgress(questDefinitions),
      buddyRush: createInitialBuddyRush(0),
      settings: {
        ...defaultSettings,
        buddyRushEnabled: true,
        buddyRushMode: 'standard',
      },
    })
  })

  it('recruits through the central quest, badge, and coin systems', () => {
    const definitionId =
      useGameStore.getState().buddyRush.bus.offerDefinitionIds[0]
    const definition = collectableBuddyDefinitions.find(
      (buddy) => buddy.id === definitionId,
    )!

    useGameStore.getState().startBuddyRecruitment(definitionId)
    useGameStore
      .getState()
      .answerBuddyRecruitment(definition.recruitmentAnswer, 1_000)

    const state = useGameStore.getState()
    expect(state.buddyRush.ownedBuddies).toHaveLength(1)
    expect(state.earnedBadges).toContain('buddy-recruiter')
    expect(
      state.questProgress.find((quest) => quest.id === 'recruit-first-buddy'),
    ).toMatchObject({ progress: 1, completed: true })
    expect(state.coins).toBeGreaterThanOrEqual(30)
  })

  it('routes consolation and passive rewards into the durable coin balance', () => {
    const definitionId =
      useGameStore.getState().buddyRush.bus.offerDefinitionIds[0]
    useGameStore.getState().startBuddyRecruitment(definitionId)
    useGameStore.getState().answerBuddyRecruitment('wrong answer', 1_000)
    expect(useGameStore.getState().coins).toBe(3)

    useGameStore.setState((state) => ({
      buddyRush: { ...state.buddyRush, unclaimedCoins: 12.75 },
    }))
    useGameStore.getState().collectBuddyRushCoins()
    expect(useGameStore.getState().coins).toBe(45)
    expect(useGameStore.getState().buddyRush.unclaimedCoins).toBeCloseTo(0.75)
    expect(
      useGameStore
        .getState()
        .questProgress.find((quest) => quest.id === 'collect-10-coins'),
    ).toMatchObject({ completed: true })
  })

  it('awards rescue rewards once and preserves the Buddy collection', () => {
    const definitionId =
      useGameStore.getState().buddyRush.bus.offerDefinitionIds[0]
    const definition = collectableBuddyDefinitions.find(
      (buddy) => buddy.id === definitionId,
    )!
    useGameStore.getState().startBuddyRecruitment(definitionId)
    useGameStore
      .getState()
      .answerBuddyRecruitment(definition.recruitmentAnswer, 1_000)
    const buddy = useGameStore.getState().buddyRush.ownedBuddies[0]
    const coinsBefore = useGameStore.getState().coins
    useGameStore.setState((state) => ({
      buddyRush: {
        ...state.buddyRush,
        ownedBuddies: state.buddyRush.ownedBuddies.map((entry) =>
          entry.id === buddy.id
            ? {
                ...entry,
                visitState: {
                  hostPlayerId: 'luna',
                  sourcePlayerId: 'player',
                  startedAtGameTime: 2_000,
                  endsAtGameTime: 50_000,
                  rescueProgress: 0,
                },
              }
            : entry,
        ),
        rescueQuest: {
          buddyInstanceId: buddy.id,
          rivalId: 'luna',
          startedAt: 2_000,
        },
      },
    }))

    useGameStore.getState().rescueBuddyVisitor(buddy.id, 3_000)
    const coinsAfterFirstRescue = useGameStore.getState().coins
    useGameStore.getState().rescueBuddyVisitor(buddy.id, 3_001)

    const state = useGameStore.getState()
    expect(coinsAfterFirstRescue).toBeGreaterThanOrEqual(coinsBefore + 80)
    expect(state.coins).toBe(coinsAfterFirstRescue)
    expect(state.buddyRush.ownedBuddies).toHaveLength(1)
    expect(state.buddyRush.ownedBuddies[0]).toMatchObject({
      id: buddy.id,
      ownerId: 'player',
      visitState: null,
    })
    expect(
      state.questProgress.find((quest) => quest.id === 'rescue-visiting-buddy'),
    ).toMatchObject({ completed: true })
    expect(state.earnedBadges).toContain('rush-rescuer')
    expect(state.buddyRush.neighbourhoodRank).toBe(1)
  })

  it('includes the complete Buddy Rush runtime in save snapshots', () => {
    useGameStore.setState((state) => ({
      buddyRush: {
        ...state.buddyRush,
        neighbourhoodRank: 3,
        unclaimedCoins: 19,
      },
    }))

    const snapshot = makeSaveSnapshot(useGameStore.getState())
    expect(snapshot.saveVersion).toBe(2)
    expect(snapshot.buddyRush).toMatchObject({
      neighbourhoodRank: 3,
      unclaimedCoins: 19,
    })
  })

  it('blocks Buddy Rush fast travel during every active chase', () => {
    useGameStore.setState((state) => ({
      playerPosition: [7, 0, 7],
      teleportTarget: undefined,
      buddyRush: {
        ...state.buddyRush,
        activeRaid: {
          id: 'escape-test',
          direction: 'raid',
          phase: 'chase',
          rivalId: 'luna-club',
          buddyDefinitionId: 'frost-fox',
          startedAt: 1_000,
          phaseEndsAt: 30_000,
          routeIndex: 0,
        },
      },
    }))

    useGameStore.getState().travelToBuddyRushTarget('clubhouse')
    expect(useGameStore.getState().playerPosition).toEqual([7, 0, 7])
    expect(useGameStore.getState().teleportTarget).toBeUndefined()
    expect(useGameStore.getState().chat.at(-1)?.text).toMatch(
      /finish the active Buddy Rush chase/i,
    )
  })
})
