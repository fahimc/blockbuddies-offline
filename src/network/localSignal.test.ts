import { describe, expect, it } from 'vitest'
import { roomLabel, sanitizeRoomName } from './localSignal'

describe('local signal helpers', () => {
  it('sanitizes room names for Android service discovery', () => {
    expect(sanitizeRoomName('  Buddy Room!!  ')).toBe('Buddy Room')
    expect(sanitizeRoomName('***')).toBe('BlockBuddies')
    expect(sanitizeRoomName('Very Long Room Name For Kids')).toHaveLength(18)
  })

  it('builds a readable room label', () => {
    expect(roomLabel({ roomName: 'Town', host: '192.168.1.10', port: 30555 })).toBe('Town (192.168.1.10:30555)')
  })
})
