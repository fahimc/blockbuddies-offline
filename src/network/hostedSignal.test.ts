import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  closeHostedRoom,
  createHostedRoom,
  getHostedAnswers,
  getHostedRoom,
  normalizeHostedRoomName,
  sendHostedAnswer,
} from './hostedSignal'

describe('hosted Netlify party signaling', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes room names for web party lookup', () => {
    expect(normalizeHostedRoomName('  Sunny ### Party Room  ')).toBe('Sunny Party Room')
    expect(normalizeHostedRoomName('***')).toBe('BlockBuddies')
  })

  it('creates a hosted room with sanitized host details', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ roomName: 'Buddy Room', roomKey: 'buddy-room', expiresAt: 1000 }), { status: 200 }),
    )

    await expect(createHostedRoom('Buddy Room!', 'BBP1.offer', 'local-host', 'Host!!')).resolves.toMatchObject({
      roomName: 'Buddy Room',
      roomKey: 'buddy-room',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/.netlify/functions/party-room',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"hostName":"Host"'),
      }),
    )
  })

  it('loads a hosted room offer by room name', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ roomName: 'Buddy Room', hostName: 'Host', offerCode: 'BBP1.offer', createdAt: 1, expiresAt: 2 }), {
        status: 200,
      }),
    )

    await expect(getHostedRoom('Buddy Room')).resolves.toMatchObject({ offerCode: 'BBP1.offer' })
  })

  it('sends and polls hosted join answers', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, roomName: 'Buddy Room' }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            roomName: 'Buddy Room',
            answers: [{ id: 'local-guest', guestId: 'local-guest', guestName: 'Guest', answerCode: 'BBP1.answer', createdAt: 1 }],
            expiresAt: 2,
          }),
          { status: 200 },
        ),
      )

    await expect(sendHostedAnswer('Buddy Room', 'BBP1.answer', 'local-guest', 'Guest')).resolves.toEqual({
      ok: true,
      roomName: 'Buddy Room',
    })
    await expect(getHostedAnswers('Buddy Room', 'local-host')).resolves.toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('closes a hosted room by host id', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    await expect(closeHostedRoom('Buddy Room', 'local-host')).resolves.toEqual({ ok: true })
  })

  it('surfaces server errors clearly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Room is not open.' }), { status: 404 }))

    await expect(getHostedRoom('Missing Room')).rejects.toThrow('Room is not open.')
  })
})
