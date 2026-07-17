import { Capacitor } from '@capacitor/core'
import { sanitizeRoomName } from './localSignal'

export type HostedRoomInfo = {
  roomName: string
  roomKey?: string
  hostName?: string
  offerCode?: string
  createdAt?: number
  expiresAt: number
}

export type HostedAnswer = {
  id: string
  guestId: string
  guestName: string
  answerCode: string
  createdAt: number
}

const endpoint = '/.netlify/functions/party-room'

export function isHostedSignalSupported() {
  return typeof fetch !== 'undefined' && !Capacitor.isNativePlatform()
}

export function normalizeHostedRoomName(input: string) {
  return sanitizeRoomName(input)
}

function sanitizeHostedPlayerName(input: string) {
  const cleaned = input.replace(/[^\w -]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18)
  return cleaned || 'LocalBuddy'
}

async function readJson<T>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = data && typeof data === 'object' && 'error' in data ? String(data.error) : 'Hosted room request failed.'
    throw new Error(error)
  }
  return data as T
}

export async function createHostedRoom(roomName: string, offerCode: string, hostId: string, hostName: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      roomName: normalizeHostedRoomName(roomName),
      offerCode,
      hostId,
      hostName: sanitizeHostedPlayerName(hostName),
    }),
  })
  return readJson<HostedRoomInfo>(response)
}

export async function getHostedRoom(roomName: string) {
  const params = new URLSearchParams({ action: 'room', room: normalizeHostedRoomName(roomName) })
  const response = await fetch(`${endpoint}?${params.toString()}`)
  return readJson<Required<Pick<HostedRoomInfo, 'roomName' | 'hostName' | 'offerCode' | 'createdAt' | 'expiresAt'>>>(response)
}

export async function sendHostedAnswer(roomName: string, answerCode: string, guestId: string, guestName: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      action: 'answer',
      roomName: normalizeHostedRoomName(roomName),
      answerCode,
      guestId,
      guestName: sanitizeHostedPlayerName(guestName),
    }),
  })
  return readJson<{ ok: true; roomName: string }>(response)
}

export async function getHostedAnswers(roomName: string, hostId: string) {
  const params = new URLSearchParams({ action: 'answers', room: normalizeHostedRoomName(roomName), hostId })
  const response = await fetch(`${endpoint}?${params.toString()}`)
  const result = await readJson<{ roomName: string; answers: HostedAnswer[]; expiresAt: number }>(response)
  return result.answers
}

export async function closeHostedRoom(roomName: string, hostId: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'close', roomName: normalizeHostedRoomName(roomName), hostId }),
  })
  return readJson<{ ok: true }>(response)
}
