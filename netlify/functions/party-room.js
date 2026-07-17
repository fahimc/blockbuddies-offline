import { connectLambda, getStore } from '@netlify/blobs'
import { Buffer } from 'node:buffer'

const roomTtlMs = 1000 * 60 * 30
const maxAnswers = 12

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(body),
  }
}

function sanitizeRoomName(input) {
  const cleaned = String(input ?? '')
    .replace(/[^\w -]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18)
  return cleaned || 'Buddy Room'
}

function roomKey(input) {
  return sanitizeRoomName(input).toLowerCase().replace(/\s+/g, '-')
}

function sanitizePlayerName(input) {
  const cleaned = String(input ?? '')
    .replace(/[^\w -]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18)
  return cleaned || 'LocalBuddy'
}

async function readRoom(store, key) {
  const room = await store.get(key, { type: 'json' })
  if (!room) return undefined
  if (typeof room.expiresAt === 'number' && room.expiresAt < Date.now()) {
    await store.delete(key)
    return undefined
  }
  return room
}

async function readBody(event) {
  if (!event.body) return {}
  try {
    return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body)
  } catch {
    throw new Error('Request body must be valid JSON.')
  }
}

export async function handler(event) {
  connectLambda(event)
  const store = getStore('blockbuddies-party-rooms')
  const method = event.httpMethod.toUpperCase()

  if (method === 'OPTIONS') return json(204, {})

  try {
    if (method === 'GET') {
      const params = event.queryStringParameters ?? {}
      const action = params.action ?? 'room'
      const key = roomKey(params.room)
      if (!key) return json(400, { error: 'Room name is required.' })
      const room = await readRoom(store, key)
      if (!room) return json(404, { error: 'Room is not open.' })

      if (action === 'answers') {
        if (params.hostId !== room.hostId) return json(403, { error: 'Only the host can read join requests.' })
        return json(200, {
          roomName: room.roomName,
          answers: room.answers ?? [],
          expiresAt: room.expiresAt,
        })
      }

      return json(200, {
        roomName: room.roomName,
        hostName: room.hostName,
        offerCode: room.offerCode,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
      })
    }

    if (method !== 'POST') return json(405, { error: 'Method is not supported.' })

    const body = await readBody(event)
    const action = body.action
    const key = roomKey(body.roomName)
    if (!key) return json(400, { error: 'Room name is required.' })

    if (action === 'create') {
      if (typeof body.offerCode !== 'string' || !body.offerCode.startsWith('BBP1.')) {
        return json(400, { error: 'Offer code is required.' })
      }
      const now = Date.now()
      const room = {
        roomName: sanitizeRoomName(body.roomName),
        roomKey: key,
        hostId: String(body.hostId ?? '').slice(0, 64),
        hostName: sanitizePlayerName(body.hostName),
        offerCode: body.offerCode,
        answers: [],
        createdAt: now,
        updatedAt: now,
        expiresAt: now + roomTtlMs,
      }
      if (!room.hostId) return json(400, { error: 'Host id is required.' })
      await store.setJSON(key, room)
      return json(200, { roomName: room.roomName, roomKey: key, expiresAt: room.expiresAt })
    }

    if (action === 'answer') {
      if (typeof body.answerCode !== 'string' || !body.answerCode.startsWith('BBP1.')) {
        return json(400, { error: 'Answer code is required.' })
      }
      const room = await readRoom(store, key)
      if (!room) return json(404, { error: 'Room is not open.' })
      const answer = {
        id: String(body.guestId ?? `${Date.now()}`).slice(0, 64),
        guestId: String(body.guestId ?? '').slice(0, 64),
        guestName: sanitizePlayerName(body.guestName),
        answerCode: body.answerCode,
        createdAt: Date.now(),
      }
      const dedupedAnswers = (room.answers ?? []).filter((entry) => entry.guestId !== answer.guestId)
      const nextRoom = {
        ...room,
        answers: [...dedupedAnswers, answer].slice(-maxAnswers),
        updatedAt: Date.now(),
      }
      await store.setJSON(key, nextRoom)
      return json(200, { ok: true, roomName: nextRoom.roomName })
    }

    if (action === 'close') {
      const room = await readRoom(store, key)
      if (room && body.hostId === room.hostId) await store.delete(key)
      return json(200, { ok: true })
    }

    return json(400, { error: 'Action is not supported.' })
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Party room service failed.' })
  }
}
