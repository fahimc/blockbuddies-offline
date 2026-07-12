import { describe, expect, it } from 'vitest'
import { completeTogether, friendshipLabel, touchMemory } from './relationship'

describe('relationship memory', () => {
  it('increments meetings and friendship', () => {
    const memory = touchMemory(undefined, 'luna', 100)
    const next = touchMemory(memory, 'luna', 200)
    expect(next.timesMet).toBe(2)
    expect(next.friendship).toBe(2)
  })

  it('rewards shared quest completion', () => {
    const memory = completeTogether(touchMemory(undefined, 'luna', 100), 200)
    expect(memory.questsCompletedTogether).toBe(1)
    expect(friendshipLabel(memory.friendship)).toBe('New Friend')
  })
})
