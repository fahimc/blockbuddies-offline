import { describe, expect, it } from 'vitest'
import { botProfiles } from '../data/botProfiles'
import { joinLeaveMessage, sanitizeDialogue, selectDialogue } from './dialogue'

describe('dialogue', () => {
  it('selects safe deterministic lines', () => {
    const line = selectDialogue(botProfiles[0], 'quick-hi', 1)
    expect(['Hi!', 'Hello buddy!', 'Good to see you!']).toContain(line)
  })

  it('sanitizes unsafe fragments', () => {
    expect(sanitizeDialogue('badword here')).toBe('Let us keep it friendly!')
  })

  it('creates local join messages', () => {
    expect(joinLeaveMessage('BuddyOne', true)).toBe('BuddyOne joined the local server')
  })
})
