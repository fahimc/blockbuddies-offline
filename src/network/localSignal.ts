import { Capacitor, registerPlugin } from '@capacitor/core'

export type LanRoom = {
  roomName: string
  host: string
  port: number
  serviceName: string
}

export type LanHostInfo = {
  roomName: string
  port: number
  serviceName: string
}

type LocalSignalPlugin = {
  isAvailable: () => Promise<{ available: boolean }>
  startHost: (options: { roomName: string; offerCode: string }) => Promise<LanHostInfo>
  stopHost: () => Promise<{ stopped: boolean }>
  discoverRooms: (options?: { timeoutMs?: number }) => Promise<{ rooms: LanRoom[] }>
  getOffer: (options: { host: string; port: number }) => Promise<{ offerCode: string; roomName: string }>
  sendAnswer: (options: { host: string; port: number; answerCode: string; name: string }) => Promise<{ sent: boolean }>
  getAnswers: () => Promise<{ answers: Array<{ answerCode: string; name: string }> }>
}

const LocalSignal = registerPlugin<LocalSignalPlugin>('LocalSignal')

export function isLocalSignalSupported() {
  return Capacitor.isNativePlatform()
}

export async function isLocalSignalAvailable() {
  if (!isLocalSignalSupported()) return false
  try {
    const result = await LocalSignal.isAvailable()
    return result.available
  } catch {
    return false
  }
}

export function sanitizeRoomName(input: string) {
  const cleaned = input.replace(/[^\w -]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18)
  return cleaned || 'BlockBuddies'
}

export function roomLabel(room: Pick<LanRoom, 'roomName' | 'host' | 'port'>) {
  return `${sanitizeRoomName(room.roomName)} (${room.host}:${room.port})`
}

export async function startSignalHost(roomName: string, offerCode: string) {
  return LocalSignal.startHost({ roomName: sanitizeRoomName(roomName), offerCode })
}

export async function stopSignalHost() {
  if (!isLocalSignalSupported()) return
  try {
    await LocalSignal.stopHost()
  } catch {
    // Stopping is best effort; a fresh host attempt replaces the old server.
  }
}

export async function discoverSignalRooms(timeoutMs = 1800) {
  const result = await LocalSignal.discoverRooms({ timeoutMs })
  return [...result.rooms].sort((a, b) => roomLabel(a).localeCompare(roomLabel(b)))
}

export async function getSignalOffer(room: LanRoom) {
  const result = await LocalSignal.getOffer({ host: room.host, port: room.port })
  return result.offerCode
}

export async function sendSignalAnswer(room: LanRoom, answerCode: string, name: string) {
  await LocalSignal.sendAnswer({ host: room.host, port: room.port, answerCode, name })
}

export async function getSignalAnswers() {
  const result = await LocalSignal.getAnswers()
  return result.answers
}
