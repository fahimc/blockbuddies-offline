import { describe, expect, it } from 'vitest'
import { decodePartySignal, encodePartySignal, isRemoteFresh, makePartySnapshot, sanitizePartyName } from './localPartyStore'
import type { AvatarSettings } from '../game/types'

const avatar: AvatarSettings = {
  bodyColor: '#9a5b43',
  shirtColor: '#5eead4',
  hat: 'none',
  trail: 'none',
}

describe('local party helpers', () => {
  it('sanitizes local player names', () => {
    expect(sanitizePartyName('  Sunny Buddy!  ')).toBe('Sunny Buddy')
    expect(sanitizePartyName('***')).toBe('LocalBuddy')
    expect(sanitizePartyName('Very Long Local Player Name')).toHaveLength(18)
  })

  it('encodes and decodes a manual party signal', () => {
    const signal = {
      v: 1 as const,
      type: 'offer' as const,
      from: 'local-abc123',
      name: 'SunnyBuddy',
      sdp: {
        type: 'offer' as const,
        sdp: 'v=0\r\n',
      },
    }

    const code = encodePartySignal(signal)
    expect(decodePartySignal(code)).toEqual(signal)
  })

  it('rejects invalid party codes', () => {
    expect(() => decodePartySignal('not-a-party-code')).toThrow()
  })

  it('builds a stable remote player snapshot', () => {
    const snapshot = makePartySnapshot({
      id: 'local-xyz789',
      name: 'Runner!',
      position: [1, 0, 2],
      yaw: 1.2,
      avatar,
      action: 'run',
      updatedAt: 100,
    })

    expect(snapshot).toMatchObject({
      id: 'local-xyz789',
      name: 'Runner',
      position: [1, 0, 2],
      yaw: 1.2,
      avatar,
      action: 'run',
      updatedAt: 100,
    })
  })

  it('marks remote players stale after the local party ttl', () => {
    const snapshot = makePartySnapshot({
      id: 'local-stale',
      name: 'Late Buddy',
      position: [0, 0, 0],
      yaw: 0,
      avatar,
      action: 'idle',
      updatedAt: 1000,
    })

    expect(isRemoteFresh(snapshot, 5900)).toBe(true)
    expect(isRemoteFresh(snapshot, 7001)).toBe(false)
  })
})
