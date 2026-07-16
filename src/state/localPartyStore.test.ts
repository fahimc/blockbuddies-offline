import { describe, expect, it } from 'vitest'
import {
  decodePartySignal,
  electLocalPartyHost,
  encodeLegacyPartySignal,
  encodePartySignal,
  extractPartyCode,
  isRemoteFresh,
  makePartySnapshot,
  sanitizePartyName,
} from './localPartyStore'
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

  it('keeps compact party codes shorter than legacy base64 for SDP payloads', () => {
    const signal = {
      v: 1 as const,
      type: 'offer' as const,
      from: 'local-abc123',
      name: 'SunnyBuddy',
      sessionId: 'party-short',
      sdp: {
        type: 'offer' as const,
        sdp: `v=0\r\n${'a=candidate:foundation 1 udp 2122260223 192.168.1.20 50000 typ host generation 0\r\n'.repeat(18)}`,
      },
    }

    const compactCode = encodePartySignal(signal)
    const legacyCode = encodeLegacyPartySignal(signal)

    expect(compactCode.startsWith('BBP1.')).toBe(true)
    expect(compactCode.length).toBeLessThan(legacyCode.length)
    expect(decodePartySignal(compactCode)).toEqual(signal)
    expect(decodePartySignal(legacyCode)).toEqual(signal)
  })

  it('extracts compact codes from shared text', () => {
    expect(extractPartyCode('Host invite code\nBBP1.ABC_def-123\nOpen BlockBuddies')).toBe('BBP1.ABC_def-123')
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

  it('syncs a bounded sanitized set of built world objects', () => {
    const snapshot = makePartySnapshot({
      id: 'local-builder',
      name: 'Builder',
      position: [1, 0, 2],
      yaw: 0,
      avatar,
      action: 'idle',
      placedBlocks: Array.from({ length: 110 }, (_, index) => ({
        id: `piece-${index}`,
        kind: index % 2 === 0 ? 'house' : 'tree',
        position: [index, 0, index + 1],
        color: index === 109 ? 'orange' : '#22c55e',
        rotation: Number.NaN,
      })),
      updatedAt: 100,
    })

    expect(snapshot.placedBlocks).toHaveLength(96)
    expect(snapshot.placedBlocks?.[0].id).toBe('piece-14')
    expect(snapshot.placedBlocks?.at(-1)).toMatchObject({
      id: 'piece-109',
      color: '#60a5fa',
      rotation: 0,
    })
  })

  it('elects a live explicit host before falling back to deterministic failover', () => {
    const host = makePartySnapshot({
      id: 'local-host',
      name: 'Host',
      position: [0, 0, 0],
      yaw: 0,
      avatar,
      action: 'idle',
      role: 'host',
      hostId: 'local-host',
      updatedAt: 1000,
    })
    const guest = makePartySnapshot({
      id: 'local-aaa',
      name: 'Guest',
      position: [1, 0, 1],
      yaw: 0,
      avatar,
      action: 'idle',
      role: 'guest',
      hostId: 'local-host',
      updatedAt: 1000,
    })

    expect(electLocalPartyHost('local-zzz', { [host.id]: host, [guest.id]: guest }, 1100)).toBe('local-host')
    expect(electLocalPartyHost('local-zzz', { [host.id]: host, [guest.id]: guest }, 7001)).toBe('local-zzz')
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
