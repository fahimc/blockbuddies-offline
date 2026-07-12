import type { QuestDefinition, QuestProgress } from '../game/types'

export function createQuestProgress(definitions: QuestDefinition[]): QuestProgress[] {
  return definitions.map((quest) => ({
    id: quest.id,
    started: quest.id === 'meet-three-buddies',
    completed: false,
    progress: 0,
  }))
}

export function startQuest(progress: QuestProgress, force = false): QuestProgress {
  return progress.started || force ? { ...progress, started: true } : progress
}

export function advanceQuest(
  progress: QuestProgress,
  definition: QuestDefinition,
  amount: number,
): { progress: QuestProgress; completedNow: boolean } {
  if (!progress.started || progress.completed) {
    return { progress, completedNow: false }
  }
  const nextValue = Math.min(definition.target, progress.progress + amount)
  const completedNow = nextValue >= definition.target
  return {
    progress: {
      ...progress,
      progress: nextValue,
      completed: completedNow,
    },
    completedNow,
  }
}
