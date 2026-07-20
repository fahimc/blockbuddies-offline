import { describe, expect, it } from 'vitest'
import {
  decodePartySignal,
  electLocalPartyHost,
  encodeLegacyPartySignal,
  encodePartySignal,
  extractPartyCode,
  isRemoteFresh,
  makePartySnapshot,
  rebasePartySavedFriendClocks,
  sanitizePartyName,
  useLocalPartyStore,
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
    expect(
      extractPartyCode('Host invite code\nBBP1.ABC_def-123\nOpen BlockBuddies'),
    ).toBe('BBP1.ABC_def-123')
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
      emote: 'dance',
      updatedAt: 100,
    })

    expect(snapshot).toMatchObject({
      id: 'local-xyz789',
      name: 'Runner',
      position: [1, 0, 2],
      yaw: 1.2,
      avatar,
      action: 'run',
      emote: 'dance',
      updatedAt: 100,
    })
  })

  it('defaults missing or invalid synced emotes to none', () => {
    const missingEmoteSnapshot = makePartySnapshot({
      id: 'local-quiet',
      name: 'Quiet',
      position: [0, 0, 0],
      yaw: 0,
      avatar,
      action: 'idle',
      updatedAt: 100,
    })
    const invalidEmoteSnapshot = makePartySnapshot({
      id: 'local-spin',
      name: 'Spin',
      position: [0, 0, 0],
      yaw: 0,
      avatar,
      action: 'idle',
      emote: 'spin' as never,
      updatedAt: 100,
    })

    expect(missingEmoteSnapshot.emote).toBe('none')
    expect(invalidEmoteSnapshot.emote).toBe('none')
  })

  it('sanitizes synchronized kart motion and race progress', () => {
    const snapshot = makePartySnapshot({
      id: 'local-racer',
      name: 'Racer',
      position: [108, 0, -33],
      yaw: 0,
      avatar,
      action: 'idle',
      kart: {
        id: 'go-kart:blue',
        position: [Number.POSITIVE_INFINITY, 0.08, -33],
        yaw: 99,
        speed: 999,
      },
      kartRace: {
        raceId: 'shared-race',
        vehicleId: 'go-kart:blue',
        status: 'racing',
        lap: 99,
        totalLaps: 99,
        nextCheckpoint: 99,
        startedAt: 500,
      },
      updatedAt: 600,
    })

    expect(snapshot.kart).toEqual({
      id: 'go-kart:blue',
      position: [0, 0.08, -33],
      yaw: Math.PI * 4,
      speed: 30,
    })
    expect(snapshot.kartRace).toMatchObject({
      raceId: 'shared-race',
      vehicleId: 'go-kart:blue',
      status: 'racing',
      lap: 3,
      totalLaps: 3,
      nextCheckpoint: 4,
      startedAt: 500,
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
        name: index === 109 ? '  Party <House>!!!  ' : undefined,
        rotation: Number.NaN,
      })),
      updatedAt: 100,
    })

    expect(snapshot.placedBlocks).toHaveLength(96)
    expect(snapshot.placedBlocks?.[0].id).toBe('piece-14')
    expect(snapshot.placedBlocks?.at(-1)).toMatchObject({
      id: 'piece-109',
      color: '#60a5fa',
      name: 'Party House',
      rotation: 0,
    })
  })

  it('syncs bounded sanitized created friend characters', () => {
    const snapshot = makePartySnapshot({
      id: 'local-friends',
      name: 'Friend Maker',
      position: [1, 0, 2],
      yaw: 0,
      avatar,
      action: 'idle',
      savedFriends: Array.from({ length: 14 }, (_, index) => ({
        id: `friend-${index}`,
        name: index === 11 ? '  Party <Pal>!!!  ' : `Friend ${index}`,
        avatar: {
          ...avatar,
          bodyColor: index === 11 ? 'brown' : '#9a5b43',
          shirtColor: '#a78bfa',
          accessory: 'pet-bot',
        },
        inWorld: index !== 2,
        route: index === 11 ? ['road' as never, 'school'] : ['spawn', 'park'],
        position: index === 11 ? [12.3, 9, -4.7] : undefined,
        movement:
          index === 11
            ? {
                mode: 'walk' as const,
                startedAt: 90,
                speed: 99,
                waypoints: [
                  [12, 0, -5],
                  [54, 0, 9],
                ],
                destination: [54, 4, 9],
              }
            : undefined,
        createdAt: 100 + index,
      })),
      updatedAt: 100,
    })

    expect(snapshot.savedFriends).toHaveLength(12)
    expect(snapshot.savedFriends?.at(-1)).toMatchObject({
      id: 'friend-11',
      name: 'Party Pal',
      inWorld: true,
      route: ['school'],
      position: [12.3, 0, -4.7],
      movement: expect.objectContaining({
        mode: 'walk',
        speed: 8,
        destination: [54, 0, 9],
      }),
      avatar: expect.objectContaining({
        bodyColor: '#9a5b43',
        shirtColor: '#a78bfa',
        accessory: 'pet-bot',
      }),
    })
    expect(snapshot.savedFriends?.[2].inWorld).toBe(false)
  })

  it('rebases synced character movement to the receiving device clock', () => {
    const friend = makePartySnapshot({
      id: 'local-clock',
      name: 'Clock',
      position: [0, 0, 0],
      yaw: 0,
      avatar,
      action: 'idle',
      savedFriends: [
        {
          id: 'walker',
          name: 'Walker',
          avatar,
          inWorld: true,
          route: ['spawn'],
          position: [0, 0, 0],
          movement: {
            mode: 'walk',
            startedAt: 1_000,
            speed: 3,
            waypoints: [
              [0, 0, 0],
              [30, 0, 0],
            ],
            destination: [30, 0, 0],
          },
          createdAt: 1,
        },
      ],
      updatedAt: 6_000,
    }).savedFriends

    const rebased = rebasePartySavedFriendClocks(friend, 6_000, 106_000)

    expect(rebased?.[0].movement?.startedAt).toBe(101_000)
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

    expect(
      electLocalPartyHost(
        'local-zzz',
        { [host.id]: host, [guest.id]: guest },
        1100,
      ),
    ).toBe('local-host')
    expect(
      electLocalPartyHost(
        'local-zzz',
        { [host.id]: host, [guest.id]: guest },
        7001,
      ),
    ).toBe('local-zzz')
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

  it('yields a temporary failover host role when the original host returns', () => {
    const host = makePartySnapshot({
      id: 'original-host',
      name: 'Original Host',
      position: [0, 0, 0],
      yaw: 0,
      avatar,
      action: 'idle',
      role: 'host',
      hostId: 'original-host',
      updatedAt: 1_000,
    })
    useLocalPartyStore.setState({
      status: 'hosting',
      role: 'host',
      promotedHost: true,
      remotePlayers: { [host.id]: host },
    })

    useLocalPartyStore.getState().pruneRemotePlayers(1_100)

    expect(useLocalPartyStore.getState()).toMatchObject({
      status: 'connected',
      role: 'guest',
      promotedHost: false,
      lastEvent: 'Reconnected to Original Host.',
    })
    useLocalPartyStore.setState({
      status: 'idle',
      role: undefined,
      promotedHost: false,
      remotePlayers: {},
    })
  })

  it('gives a newly connected guest time to receive the first host snapshot', () => {
    useLocalPartyStore.setState({
      status: 'connected',
      role: 'guest',
      promotedHost: false,
      lastHostSeenAt: 1_000,
      remotePlayers: {},
    })

    useLocalPartyStore.getState().pruneRemotePlayers(5_000)
    expect(useLocalPartyStore.getState().role).toBe('guest')
    useLocalPartyStore.getState().pruneRemotePlayers(7_001)
    expect(useLocalPartyStore.getState()).toMatchObject({
      status: 'hosting',
      role: 'host',
      promotedHost: true,
    })
    useLocalPartyStore.setState({
      status: 'idle',
      role: undefined,
      promotedHost: false,
      lastHostSeenAt: undefined,
      remotePlayers: {},
    })
  })
})
