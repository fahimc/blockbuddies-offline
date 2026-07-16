import { describe, expect, it } from 'vitest'
import {
  botReplyForPreset,
  messageCategories,
  predefinedMessages,
} from './predefinedMessages'

describe('predefined messages', () => {
  it('provides exactly 100 kid-safe preset messages', () => {
    expect(predefinedMessages).toHaveLength(100)
    expect(new Set(predefinedMessages.map((message) => message.id)).size).toBe(
      100,
    )
    expect(predefinedMessages.every((message) => message.text.length > 0)).toBe(
      true,
    )
  })

  it('has messages for every category shown in the inbox', () => {
    for (const category of messageCategories) {
      expect(
        predefinedMessages.some((message) => message.category === category.id),
      ).toBe(true)
    }
  })

  it('selects a deterministic bot reply for a player preset', () => {
    expect(botReplyForPreset('game-002')?.text).toBe('Hello buddy!')
    expect(botReplyForPreset('unknown')?.text).toBe('Hi!')
  })
})
