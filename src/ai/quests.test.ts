import { describe, expect, it } from 'vitest'
import { questDefinitions } from '../data/quests'
import { advanceQuest, createQuestProgress } from './quests'

describe('quests', () => {
  it('starts with meet-three-buddies active', () => {
    const progress = createQuestProgress(questDefinitions)
    expect(progress.find((quest) => quest.id === 'meet-three-buddies')?.started).toBe(true)
  })

  it('completes when target is reached', () => {
    const definition = questDefinitions[0]
    const progress = { id: definition.id, started: true, completed: false, progress: 2 }
    const result = advanceQuest(progress, definition, 1)
    expect(result.completedNow).toBe(true)
    expect(result.progress.completed).toBe(true)
  })
})
