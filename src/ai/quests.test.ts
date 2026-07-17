import { describe, expect, it } from 'vitest'
import { questDefinitions } from '../data/quests'
import { advanceQuest, createQuestProgress, mergeQuestProgress } from './quests'

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

  it('defines unique kid-friendly quests with visible instructions', () => {
    expect(questDefinitions.length).toBeGreaterThanOrEqual(16)
    expect(new Set(questDefinitions.map((quest) => quest.id)).size).toBe(
      questDefinitions.length,
    )
    expect(
      questDefinitions.every(
        (quest) =>
          quest.title.length > 0 &&
          quest.description.length > 0 &&
          quest.howTo.length > 0 &&
          quest.tip.length > 0 &&
          quest.reward > 0 &&
          quest.target > 0,
      ),
    ).toBe(true)
  })

  it('migrates old save progress and clamps impossible values', () => {
    const merged = mergeQuestProgress(questDefinitions, [
      {
        id: 'collect-10-coins',
        started: true,
        completed: false,
        progress: 99,
      },
    ])

    expect(merged).toHaveLength(questDefinitions.length)
    expect(
      merged.find((quest) => quest.id === 'collect-10-coins'),
    ).toMatchObject({
      started: true,
      completed: true,
      progress: 10,
    })
    expect(merged.find((quest) => quest.id === 'visit-school')).toMatchObject({
      started: false,
      completed: false,
      progress: 0,
    })
  })
})
