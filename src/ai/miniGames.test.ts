import { describe, expect, it } from 'vitest'
import {
  coinRushTargets,
  deliveryDashTargets,
  miniGameDefinition,
  startMiniGameSession,
  tickMiniGameSession,
} from './miniGames'

describe('mini game sessions', () => {
  it('starts a session with the configured target and timer', () => {
    const session = startMiniGameSession('coin-rush', 100, {})

    expect(session.activeId).toBe('coin-rush')
    expect(session.status).toBe('running')
    expect(session.target).toBe(8)
    expect(session.points).toBe(0)
    expect(session.endsAt).toBe(45_100)
    expect(session.announcement).toMatchObject({
      title: 'Coin Rush',
      objective: 'Collect 8 event coins',
    })
  })

  it('collects coin rush targets once and completes with points and a reward record', () => {
    let session = startMiniGameSession('coin-rush', 1_000, {})
    const first = tickMiniGameSession(session, 2_000, coinRushTargets[0].position)
    session = first.state
    const repeated = tickMiniGameSession(session, 2_100, coinRushTargets[0].position)
    session = repeated.state

    expect(first.collected).toHaveLength(1)
    expect(first.pointsAwarded).toBe(miniGameDefinition('coin-rush').pointsPerTarget)
    expect(first.coinsAwarded).toBe(1)
    expect(repeated.collected).toHaveLength(0)
    expect(session.score).toBe(1)
    expect(session.points).toBe(10)

    for (let index = 1; index < coinRushTargets.length; index += 1) {
      session = tickMiniGameSession(session, 2_000 + index * 100, coinRushTargets[index].position).state
    }

    expect(session.status).toBe('completed')
    expect(session.activeId).toBeUndefined()
    expect(session.points).toBe(130)
    expect(session.records['coin-rush']).toMatchObject({ plays: 1, bestScore: 8, bestPoints: 130 })
  })

  it('requires delivery dash targets in route order', () => {
    let session = startMiniGameSession('delivery-dash', 0, {})
    const skipped = tickMiniGameSession(session, 500, deliveryDashTargets[1].position)
    session = skipped.state

    expect(skipped.collected).toHaveLength(0)
    expect(session.score).toBe(0)

    const pickup = tickMiniGameSession(session, 700, deliveryDashTargets[0].position)
    session = pickup.state

    expect(pickup.collected[0]?.id).toBe('delivery-pickup')
    expect(pickup.pointsAwarded).toBe(5)
    expect(pickup.coinsAwarded).toBe(0)
    expect(session.score).toBe(1)

    const firstDropOff = tickMiniGameSession(session, 900, deliveryDashTargets[1].position)

    expect(firstDropOff.collected[0]?.id).toBe('delivery-park')
    expect(firstDropOff.state.score).toBe(2)
    expect(firstDropOff.coinsAwarded).toBe(8)
    expect(firstDropOff.timeBonusMs).toBe(5_000)
    expect(firstDropOff.state.endsAt).toBe(session.endsAt + 5_000)
  })

  it('fails on timeout and records the best partial score without reward', () => {
    const session = startMiniGameSession('hide-and-seek', 1_000, {})
    const result = tickMiniGameSession(session, session.endsAt, [99, 0, 99])

    expect(result.failedNow).toBe(true)
    expect(result.reward).toBe(0)
    expect(result.state.status).toBe('failed')
    expect(result.state.records['hide-and-seek']).toMatchObject({ plays: 1, bestScore: 0 })
  })
})
