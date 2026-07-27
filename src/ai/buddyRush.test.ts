import { describe, expect, it } from 'vitest'
import {
  activateBuddyRushGadget,
  answerBuddyRecruitment,
  assignBuddyToStation,
  buddyOffersForCycle,
  buddyOutputPerMinute,
  buddyWhistleFollowerOffset,
  collectBuddyRushEarnings,
  completePlayerBadgeCapture,
  createInitialBuddyRush,
  isRivalBuddyVisitingPlayer,
  rescueVisitingBuddy,
  sanitizeBuddyRushRuntime,
  setBuddyRushPet,
  startBuddyRecruitment,
  startPlayerBuddyRaid,
  tagBuddyRushRival,
  tickBuddyRushRuntime,
  toggleFavouriteBuddy,
} from './buddyRush'
import {
  buddyRushConfig,
  buddyRushRivals,
  buddyRushRoutes,
  collectableBuddyDefinitions,
  dailyBuddyEvent,
  playerClubhousePosition,
} from '../data/buddyRush'
import type { BuddyRushMode, BuddyRushRuntime } from '../game/types'

const enabled = (mode: BuddyRushMode = 'standard') => ({
  enabled: true,
  mode,
})

function recruit(runtime: BuddyRushRuntime, definitionId: string, now = 1_000) {
  const selected = startBuddyRecruitment(runtime, definitionId)
  const definition = collectableBuddyDefinitions.find(
    (buddy) => buddy.id === definitionId,
  )
  if (!definition) throw new Error(`Missing Buddy definition: ${definitionId}`)
  return answerBuddyRecruitment(selected, definition.recruitmentAnswer, now)
    .state
}

function runtimeWithTwoBuddies(now = 1_000) {
  const initial = createInitialBuddyRush(now)
  const first = recruit(initial, initial.bus.offerDefinitionIds[0], now)
  return recruit(first, first.bus.offerDefinitionIds[0], now)
}

function advanceToChase(
  runtime: BuddyRushRuntime,
  now = 10_000,
  mode: BuddyRushMode = 'standard',
) {
  const ready: BuddyRushRuntime = {
    ...runtime,
    shield: {
      ...runtime.shield,
      phase: 'protected',
      phaseEndsAtGameTime: now,
    },
  }
  const warning = tickBuddyRushRuntime(ready, now, enabled(mode)).state
  const approach = tickBuddyRushRuntime(
    warning,
    warning.shield.phaseEndsAtGameTime,
    enabled(mode),
  ).state
  const capture = tickBuddyRushRuntime(
    approach,
    approach.activeRaid!.phaseEndsAt,
    enabled(mode),
  ).state
  return tickBuddyRushRuntime(
    capture,
    capture.activeRaid!.phaseEndsAt,
    enabled(mode),
  ).state
}

describe('Buddy Rush feature model', () => {
  it('ships the full first-playable collection and deterministic bus cycles', () => {
    expect(collectableBuddyDefinitions).toHaveLength(12)
    expect(
      new Set(collectableBuddyDefinitions.map((buddy) => buddy.rarity)).size,
    ).toBe(6)
    expect(
      new Set(collectableBuddyDefinitions.map((buddy) => buddy.talent)).size,
    ).toBe(4)
    expect(collectableBuddyDefinitions.map((buddy) => buddy.id)).toContain(
      'nova-owl',
    )
    expect(
      buddyRushRivals.filter((rival) => rival.clubhousePosition),
    ).toHaveLength(3)
    expect(buddyOffersForCycle(4)).toEqual(buddyOffersForCycle(4))
    expect(buddyOffersForCycle(4)).not.toEqual(buddyOffersForCycle(5))
    expect(buddyRushRoutes).toHaveLength(6)
    for (let index = 0; index < buddyRushRoutes.length; index += 2) {
      expect(buddyRushRoutes[index][0]).toEqual(buddyRushRoutes[index + 1][0])
      expect(buddyRushRoutes[index].at(-1)).toEqual(
        buddyRushRoutes[index + 1].at(-1),
      )
      expect(buddyRushRoutes[index].slice(1, -1)).not.toEqual(
        buddyRushRoutes[index + 1].slice(1, -1),
      )
    }
  })

  it('uses a retry-safe recruitment challenge with consolation coins', () => {
    const initial = createInitialBuddyRush(0)
    const definitionId = initial.bus.offerDefinitionIds[0]
    const selected = startBuddyRecruitment(initial, definitionId)
    const wrong = answerBuddyRecruitment(selected, 'Definitely wrong', 100)

    expect(wrong.consolationCoins).toBe(3)
    expect(wrong.state.bus.selectedDefinitionId).toBe(definitionId)
    expect(wrong.state.bus.feedback?.kind).toBe('wrong')

    const definition = collectableBuddyDefinitions.find(
      (buddy) => buddy.id === definitionId,
    )!
    const correct = answerBuddyRecruitment(
      wrong.state,
      definition.recruitmentAnswer,
      200,
    )
    expect(correct.recruited?.ownerId).toBe('player')
    expect(correct.recruited?.isFavourite).toBe(true)
    expect(correct.state.discoveredDefinitionIds).toContain(definitionId)
    expect(correct.state.bus.offerDefinitionIds).not.toContain(definitionId)
  })

  it('assigns Buddies to stations and accrues collectible passive coins', () => {
    const recruited = runtimeWithTwoBuddies(0)
    const buddy = recruited.ownedBuddies[1]
    const assigned = assignBuddyToStation(
      recruited,
      buddy.id,
      'clubhouse-arcade',
    )

    expect(assigned.ownedBuddies[1].activityStationId).toBe('clubhouse-arcade')
    expect(
      assigned.stations.find((station) => station.id === 'clubhouse-arcade')
        ?.assignedBuddyIds,
    ).toContain(buddy.id)
    expect(buddyOutputPerMinute(assigned)).toBeGreaterThan(0)

    const ticked = tickBuddyRushRuntime(
      assigned,
      buddyRushConfig.passiveTickCapMs,
      { ...enabled(), pauseRaids: true },
    ).state
    const collection = collectBuddyRushEarnings(ticked)
    expect(collection.coins).toBeGreaterThan(0)
    expect(collection.state.unclaimedCoins).toBeLessThan(1)
  })

  it('moves through protected, warning, approach, capture, and chase phases', () => {
    const runtime = runtimeWithTwoBuddies()
    const chase = advanceToChase(runtime)

    expect(chase.shield.phase).toBe('rush')
    expect(chase.activeRaid?.direction).toBe('defend')
    expect(chase.activeRaid?.phase).toBe('chase')
    expect(chase.activeRaid?.buddyInstanceId).toBe(runtime.ownedBuddies[1].id)
    expect(chase.activeRaid?.buddyInstanceId).not.toBe(
      runtime.ownedBuddies[0].id,
    )
  })

  it('keeps exactly one selected Favourite Buddy', () => {
    const runtime = runtimeWithTwoBuddies()
    const switched = toggleFavouriteBuddy(runtime, runtime.ownedBuddies[1].id)
    expect(
      switched.ownedBuddies.filter((buddy) => buddy.isFavourite),
    ).toHaveLength(1)
    expect(switched.ownedBuddies[1].isFavourite).toBe(true)
    expect(switched.ownedBuddies[0].isFavourite).toBe(false)
    expect(toggleFavouriteBuddy(switched, switched.ownedBuddies[1].id)).toBe(
      switched,
    )
  })

  it('lets a player tag the AI rival and preserves Buddy ownership', () => {
    const chase = advanceToChase(runtimeWithTwoBuddies())
    const targetId = chase.activeRaid!.buddyInstanceId!
    const result = tagBuddyRushRival(chase, 50_000)

    expect(result.coinsAwarded).toBe(25)
    expect(result.state.activeRaid).toBeUndefined()
    expect(result.state.shield.phase).toBe('recovery')
    expect(
      result.state.ownedBuddies.find((buddy) => buddy.id === targetId)?.ownerId,
    ).toBe('player')
    expect(
      result.state.ownedBuddies.find((buddy) => buddy.id === targetId)?.rescues,
    ).toBe(1)
  })

  it('turns an AI escape into a temporary visit and a recoverable rescue quest', () => {
    const chase = advanceToChase(runtimeWithTwoBuddies())
    const target = chase.ownedBuddies.find(
      (buddy) => buddy.id === chase.activeRaid!.buddyInstanceId,
    )!
    const escaped = tickBuddyRushRuntime(
      chase,
      chase.activeRaid!.phaseEndsAt,
      enabled(),
    )

    expect(escaped.escapedBuddyId).toBe(target.id)
    const visiting = escaped.state.ownedBuddies.find(
      (buddy) => buddy.id === target.id,
    )!
    expect(visiting.ownerId).toBe('player')
    expect(visiting.visitState).not.toBeNull()
    expect(escaped.state.rescueQuest?.buddyInstanceId).toBe(target.id)

    const rescued = rescueVisitingBuddy(escaped.state, target.id, 100_000)
    const home = rescued.state.ownedBuddies.find(
      (buddy) => buddy.id === target.id,
    )!
    expect(rescued.coinsAwarded).toBe(30)
    expect(home.visitState).toBeNull()
    expect(home.ownerId).toBe(target.ownerId)
    expect(home.styleId).toBe(target.styleId)
    expect(home.friendshipXp).toBeGreaterThan(target.friendshipXp)
  })

  it('returns visiting Buddies automatically and never repeats the same raider', () => {
    const firstChase = advanceToChase(runtimeWithTwoBuddies())
    const firstRivalId = firstChase.activeRaid!.rivalId
    const escaped = tickBuddyRushRuntime(
      firstChase,
      firstChase.activeRaid!.phaseEndsAt,
      enabled(),
    ).state
    const visiting = escaped.ownedBuddies.find((buddy) => buddy.visitState)!
    const returned = tickBuddyRushRuntime(
      escaped,
      visiting.visitState!.endsAtGameTime,
      { ...enabled(), pauseRaids: true },
    ).state
    expect(
      returned.ownedBuddies.find((buddy) => buddy.id === visiting.id)
        ?.visitState,
    ).toBeNull()
    expect(returned.rescueQuest).toBeUndefined()

    const nextReady: BuddyRushRuntime = {
      ...returned,
      shield: {
        ...returned.shield,
        phase: 'warning',
        phaseEndsAtGameTime: 999_000,
      },
    }
    const next = tickBuddyRushRuntime(nextReady, 999_000, enabled()).state
    expect(next.activeRaid?.rivalId).not.toBe(firstRivalId)
  })

  it('supports player raids and temporary rival Buddy visits', () => {
    const runtime = runtimeWithTwoBuddies()
    const rival = buddyRushRivals.find((entry) => entry.clubhousePosition)!
    const raid = startPlayerBuddyRaid(runtime, rival.id, 5_000)
    expect(raid.activeRaid?.phase).toBe('capture')
    expect(
      tickBuddyRushRuntime(raid, 6_000, enabled()).state.activeRaid?.phase,
    ).toBe('capture')

    const captured = completePlayerBadgeCapture(raid, 7_000, 'standard')
    const escaped = tickBuddyRushRuntime(captured, 8_000, {
      ...enabled(),
      playerPosition: playerClubhousePosition,
    })
    expect(escaped.completedPlayerRaid).toBe(true)
    expect(escaped.coinsAwarded).toBe(30)
    expect(escaped.state.visitors).toHaveLength(1)
    expect(escaped.state.activeRaid).toBeUndefined()
    expect(
      isRivalBuddyVisitingPlayer(
        escaped.state,
        escaped.state.visitors[0].sourceRivalId,
        escaped.state.visitors[0].definitionId,
      ),
    ).toBe(true)
  })

  it('applies gadgets, cooldowns, and separate pet roles', () => {
    const chase = advanceToChase(runtimeWithTwoBuddies())
    const originalEnd = chase.activeRaid!.phaseEndsAt
    const bubbled = activateBuddyRushGadget(chase, 'bubble-blaster', 20_000)
    expect(bubbled.activeRaid!.phaseEndsAt).toBeGreaterThan(originalEnd)
    expect(bubbled.rivalPauseStartedAt).toBe(20_000)
    expect(bubbled.rivalPausedUntil).toBe(22_000)
    expect(activateBuddyRushGadget(bubbled, 'bubble-blaster', 20_001)).toEqual(
      bubbled,
    )

    const skating = activateBuddyRushGadget(bubbled, 'roller-skates', 30_000)
    expect(skating.boostEndsAt).toBeGreaterThan(30_000)
    const hinted = activateBuddyRushGadget(skating, 'buddy-whistle', 31_000)
    expect(hinted.routeHintEndsAt).toBe(39_000)
    expect(hinted.whistlePullEndsAt).toBe(33_500)
    expect(buddyWhistleFollowerOffset([0, 0, 0], [10, 0, 0], true)).toEqual([
      0.55, 0, 0.75,
    ])
    expect(buddyWhistleFollowerOffset([0, 0, 0], [10, 0, 0], false)).toEqual([
      -1.05, 0, 0.75,
    ])

    const pets = setBuddyRushPet(
      setBuddyRushPet(hinted, 'adventure', 'tracker-pup'),
      'guard',
      'guard-bot',
    )
    expect(pets.petLoadout).toEqual({
      adventurePetId: 'tracker-pup',
      guardPetId: 'guard-bot',
    })
  })

  it('friendly mode never sends a Buddy away', () => {
    const chase = advanceToChase(runtimeWithTwoBuddies(), 10_000, 'friendly')
    const finished = tickBuddyRushRuntime(
      chase,
      chase.activeRaid!.phaseEndsAt,
      enabled('friendly'),
    )
    expect(finished.state.activeRaid).toBeUndefined()
    expect(
      finished.state.ownedBuddies.every((buddy) => !buddy.visitState),
    ).toBe(true)
    expect(finished.coinsAwarded).toBe(8)
  })

  it('gives AI personalities distinct pacing and shortens Reduced Tension capture', () => {
    const base = runtimeWithTwoBuddies()
    const startApproach = (
      runtime: BuddyRushRuntime,
      sequence: number,
      mode: BuddyRushMode,
    ) => {
      const warning: BuddyRushRuntime = {
        ...runtime,
        raidSequence: sequence,
        shield: {
          ...runtime.shield,
          phase: 'warning',
          phaseEndsAtGameTime: 10_000,
        },
      }
      return tickBuddyRushRuntime(warning, 10_000, enabled(mode)).state
    }
    const friendlyApproach = startApproach(base, 0, 'standard')
    const builderApproach = startApproach(base, 1, 'standard')
    expect(friendlyApproach.activeRaid?.rivalId).not.toBe(
      builderApproach.activeRaid?.rivalId,
    )
    expect(friendlyApproach.activeRaid!.phaseEndsAt - 10_000).not.toBe(
      builderApproach.activeRaid!.phaseEndsAt - 10_000,
    )

    const reducedApproach = startApproach(base, 0, 'reduced-tension')
    const captureStartedAt = reducedApproach.activeRaid!.phaseEndsAt
    const reducedCapture = tickBuddyRushRuntime(
      reducedApproach,
      captureStartedAt,
      enabled('reduced-tension'),
    ).state
    expect(reducedCapture.activeRaid?.phase).toBe('capture')
    expect(reducedCapture.activeRaid!.phaseEndsAt - captureStartedAt).toBe(
      buddyRushConfig.captureHoldMs * 0.65,
    )
  })

  it('eases the next chase after an AI escape and tightens it after successful defence', () => {
    const base = runtimeWithTwoBuddies()
    const captureForOutcome = (
      lastOutcome: 'escaped' | 'defended',
    ): BuddyRushRuntime => {
      const warning: BuddyRushRuntime = {
        ...base,
        shield: {
          ...base.shield,
          phase: 'warning',
          phaseEndsAtGameTime: 10_000,
        },
      }
      const approach = tickBuddyRushRuntime(warning, 10_000, enabled()).state
      const capture = tickBuddyRushRuntime(
        approach,
        approach.activeRaid!.phaseEndsAt,
        enabled(),
      ).state
      const rivalId = capture.activeRaid!.rivalId
      return {
        ...capture,
        recentRescueStreak: lastOutcome === 'defended' ? 3 : 0,
        rivalMemories: {
          ...capture.rivalMemories,
          [rivalId]: {
            ...capture.rivalMemories[rivalId],
            targetCount: 4,
            lastOutcome,
          },
        },
      }
    }
    const escapedMemory = captureForOutcome('escaped')
    const defendedMemory = captureForOutcome('defended')
    const escapedChase = tickBuddyRushRuntime(
      escapedMemory,
      escapedMemory.activeRaid!.phaseEndsAt,
      enabled(),
    ).state
    const defendedChase = tickBuddyRushRuntime(
      defendedMemory,
      defendedMemory.activeRaid!.phaseEndsAt,
      enabled(),
    ).state
    const escapedDuration =
      escapedChase.activeRaid!.phaseEndsAt - escapedChase.activeRaid!.startedAt
    const defendedDuration =
      defendedChase.activeRaid!.phaseEndsAt -
      defendedChase.activeRaid!.startedAt

    expect(escapedDuration).toBeGreaterThan(defendedDuration)
  })

  it('disables competitive Rushes without disabling collection progress', () => {
    const chase = advanceToChase(runtimeWithTwoBuddies())
    const disabled = tickBuddyRushRuntime(chase, 20_000, {
      enabled: false,
      mode: 'standard',
    }).state
    expect(disabled.activeRaid).toBeUndefined()
    expect(disabled.shield.phase).toBe('protected')
    expect(disabled.ownedBuddies).toHaveLength(2)
    expect(disabled.bus).toBeDefined()
  })

  it('uses a deterministic offline daily event schedule', () => {
    const morning = new Date('2026-07-27T09:00:00Z').getTime()
    expect(dailyBuddyEvent(morning)).toBe(dailyBuddyEvent(morning))
    expect(dailyBuddyEvent(morning)).toBe(
      dailyBuddyEvent(morning + 60 * 60 * 1_000),
    )
  })

  it.each(['approach', 'capture', 'chase'] as const)(
    'restores an interrupted AI %s save safely without losing collection data',
    (phase) => {
      const chase = advanceToChase(runtimeWithTwoBuddies())
      const interrupted = {
        ...chase,
        activeRaid: { ...chase.activeRaid!, phase },
        ownedBuddies: chase.ownedBuddies.map((buddy) => ({
          ...buddy,
          isFavourite: true,
        })),
      }
      const target = chase.ownedBuddies[1]
      const restored = sanitizeBuddyRushRuntime(interrupted, 200_000)

      expect(restored.activeRaid).toBeUndefined()
      expect(restored.shield.phase).toBe('recovery')
      expect(restored.ownedBuddies).toHaveLength(chase.ownedBuddies.length)
      expect(
        restored.ownedBuddies.find((buddy) => buddy.id === target.id),
      ).toMatchObject({
        ownerId: 'player',
        definitionId: target.definitionId,
        styleId: target.styleId,
        friendshipXp: target.friendshipXp,
      })
      expect(restored.notice?.text).toMatch(/secure/i)
      expect(
        restored.ownedBuddies.filter((buddy) => buddy.isFavourite),
      ).toHaveLength(1)
    },
  )
})
