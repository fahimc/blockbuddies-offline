import type { BotMemory } from '../game/types'

export function touchMemory(memory: BotMemory | undefined, botId: string, now: number): BotMemory {
  return {
    botId,
    timesMet: (memory?.timesMet ?? 0) + 1,
    questsCompletedTogether: memory?.questsCompletedTogether ?? 0,
    lastInteraction: now,
    friendship: Math.min(10, (memory?.friendship ?? 0) + 1),
  }
}

export function completeTogether(memory: BotMemory, now: number): BotMemory {
  return {
    ...memory,
    questsCompletedTogether: memory.questsCompletedTogether + 1,
    lastInteraction: now,
    friendship: Math.min(10, memory.friendship + 2),
  }
}

export function friendshipLabel(level: number) {
  if (level >= 8) return 'Best Buddy'
  if (level >= 5) return 'Good Friend'
  if (level >= 2) return 'New Friend'
  return 'Just Met'
}
