import { describe, expect, it } from 'vitest'
import {
  answerBuddyRecruitment,
  assignBuddyToStation,
  buddyOffersForCycle,
  createInitialBuddyRush,
  pointAlongBuddyRoute,
  sanitizeBuddyRushRuntime,
  startBuddyRecruitment,
  tickBuddyRushRuntime,
} from './buddyRush'
import { buddyRushRoutes, collectableBuddyDefinitions } from '../data/buddyRush'

describe('Buddy Rush performance budgets', () => {
  it('ticks a full twelve-Buddy clubhouse through a long offline session quickly', () => {
    let runtime = createInitialBuddyRush(0)
    collectableBuddyDefinitions.forEach((definition, index) => {
      runtime = {
        ...runtime,
        bus: {
          ...runtime.bus,
          cycle: index,
          offerDefinitionIds: buddyOffersForCycle(Math.floor(index / 3)),
        },
      }
      const recruited = answerBuddyRecruitment(
        startBuddyRecruitment(runtime, definition.id),
        definition.recruitmentAnswer,
        index,
      ).state
      runtime = assignBuddyToStation(
        recruited,
        recruited.ownedBuddies.at(-1)!.id,
        index % 3 === 0
          ? 'clubhouse-bakery'
          : index % 3 === 1
            ? 'clubhouse-garden'
            : 'clubhouse-arcade',
      )
    })

    const startedAt = performance.now()
    for (let tick = 1; tick <= 5_000; tick += 1) {
      runtime = tickBuddyRushRuntime(runtime, tick * 1_000, {
        enabled: true,
        mode: 'standard',
        pauseRaids: true,
      }).state
    }
    const elapsed = performance.now() - startedAt

    expect(runtime.ownedBuddies).toHaveLength(12)
    expect(runtime.unclaimedCoins).toBeGreaterThan(0)
    expect(elapsed).toBeLessThan(2_000)
  })

  it('sanitizes and serializes a mature save within a low-end-device budget', () => {
    const initial = createInitialBuddyRush(0)
    const startedAt = performance.now()
    let restored = initial
    for (let pass = 0; pass < 1_000; pass += 1) {
      restored = sanitizeBuddyRushRuntime(restored, pass)
      JSON.stringify(restored)
    }
    const elapsed = performance.now() - startedAt

    expect(elapsed).toBeLessThan(1_500)
    expect(JSON.stringify(restored).length).toBeLessThan(25_000)
  })

  it('keeps several simultaneous AI route calculations inside a low-end frame budget', () => {
    const startedAt = performance.now()
    let checksum = 0
    for (let frame = 0; frame < 60_000; frame += 1) {
      for (const route of buddyRushRoutes) {
        const point = pointAlongBuddyRoute(route, (frame % 1_000) / 1_000)
        checksum += point[0] + point[2]
      }
    }
    const elapsed = performance.now() - startedAt

    expect(Number.isFinite(checksum)).toBe(true)
    expect(elapsed).toBeLessThan(1_500)
  })

  it('runs a long session with repeated live Rush events inside budget', () => {
    let runtime = createInitialBuddyRush(0)
    for (let index = 0; index < 4; index += 1) {
      const definition = collectableBuddyDefinitions[index]
      runtime = {
        ...runtime,
        bus: {
          ...runtime.bus,
          offerDefinitionIds: [definition.id],
        },
      }
      runtime = answerBuddyRecruitment(
        startBuddyRecruitment(runtime, definition.id),
        definition.recruitmentAnswer,
        index,
      ).state
    }
    runtime = {
      ...runtime,
      shield: {
        ...runtime.shield,
        phaseEndsAtGameTime: 1,
      },
    }

    const startedAt = performance.now()
    for (let tick = 1; tick <= 30_000; tick += 1) {
      runtime = tickBuddyRushRuntime(runtime, tick * 1_000, {
        enabled: true,
        mode: 'standard',
        playerPosition: [999, 0, 999],
      }).state
    }
    const elapsed = performance.now() - startedAt

    expect(runtime.raidSequence).toBeGreaterThan(10)
    expect(elapsed).toBeLessThan(2_000)
  })
})
