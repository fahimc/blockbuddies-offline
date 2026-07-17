import type { QuestDefinition, QuestProgress } from '../game/types'

export function createQuestProgress(definitions: QuestDefinition[]): QuestProgress[] {
  return definitions.map((quest) => ({
    id: quest.id,
    started: quest.id === 'meet-three-buddies',
    completed: false,
    progress: 0,
  }))
}

export function mergeQuestProgress(
  definitions: QuestDefinition[],
  saved: QuestProgress[] = [],
): QuestProgress[] {
  const fallback = createQuestProgress(definitions)
  const fallbackById = new Map(fallback.map((quest) => [quest.id, quest]))
  const savedById = new Map(saved.map((quest) => [quest.id, quest]))
  return definitions.map((definition) => {
    const base = fallbackById.get(definition.id)!
    const stored = savedById.get(definition.id)
    if (!stored) return base
    const progress = Math.max(0, Math.min(definition.target, stored.progress))
    return {
      id: definition.id,
      started: stored.started || stored.completed || base.started || progress > 0,
      completed: stored.completed || progress >= definition.target,
      progress,
    }
  })
}

export function startQuest(progress: QuestProgress, force = false): QuestProgress {
  return progress.started || force ? { ...progress, started: true } : progress
}

export function advanceQuest(
  progress: QuestProgress,
  definition: QuestDefinition,
  amount: number,
): { progress: QuestProgress; completedNow: boolean } {
  if (progress.completed) {
    return { progress, completedNow: false }
  }
  const started = progress.started || amount > 0
  const nextValue = Math.min(definition.target, progress.progress + amount)
  const completedNow = nextValue >= definition.target
  return {
    progress: {
      ...progress,
      started,
      progress: nextValue,
      completed: completedNow,
    },
    completedNow,
  }
}
