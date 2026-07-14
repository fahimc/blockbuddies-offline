import { describe, expect, it } from 'vitest'
import {
  coinRushTargets,
  deliveryDashTargets,
  startMiniGameSession,
  tickMiniGameSession,
} from './miniGames'

describe('mini game sessions', () => {
  it('starts a session with the configured target and timer', () => {
    const session = startMiniGameSession('coin-rush', 100, {})

    expect(session.activeId).toBe('coin-rush')
    expect(session.status).toBe('running')
    expect(session.target).toBe(8)
    expect(session.endsAt).toBe(45_100)
  })

  it('collects coin rush targets once and completes with a reward record', () => {
    let session = startMiniGameSession('coin-rush', 1_000, {})
    const first = tickMiniGameSession(session, 2_000, coinRushTargets[0].position)
    session = first.state
    const repeated = tickMiniGameSession(session, 2_100, coinRushTargets[0].position)
    session = repeated.state

    expect(first.collected).toHaveLength(1)
    expect(repeated.collected).toHaveLength(0)
    expect(session.score).toBe(1)

    for (let index = 1; index < coinRushTargets.length; index += 1) {
      session = tickMiniGameSession(session, 2_000 + index * 100, coinRushTargets[index].position).state
    }

    expect(session.status).toBe('completed')
    expect(session.activeId).toBeUndefined()
    expect(session.records['coin-rush']).toMatchObject({ plays: 1, bestScore: 8 })
  })

  it('requires delivery dash targets in route order', () => {
    let session = startMiniGameSession('delivery-dash', 0, {})
    const skipped = tickMiniGameSession(session, 500, deliveryDashTargets[1].position)
    session = skipped.state

    expect(skipped.collected).toHaveLength(0)
    expect(session.score).toBe(0)

    const firstStop = tickMiniGameSession(session, 700, deliveryDashTargets[0].position)

    expect(firstStop.collected[0]?.id).toBe('delivery-park')
    expect(firstStop.state.score).toBe(1)
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
