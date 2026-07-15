import type { MiniGameRuntime } from '../game/types'
import { miniGameDefinition, miniGameTargets, type MiniGameTarget } from './miniGames'

export function activeMiniGameTarget(miniGame: MiniGameRuntime): MiniGameTarget | undefined {
  if (miniGame.status !== 'running' || !miniGame.activeId) return undefined
  const targets = miniGameTargets(miniGame.activeId)
  if (miniGame.activeId === 'delivery-dash') return targets[miniGame.score]
  return targets.find((target) => !miniGame.collected.includes(target.id))
}

export function miniGameTargetInstruction(miniGame: MiniGameRuntime) {
  const target = activeMiniGameTarget(miniGame)
  if (!target || !miniGame.activeId) return undefined
  const definition = miniGameDefinition(miniGame.activeId)
  const step = Math.min(miniGame.score + 1, miniGame.target)
  return {
    target,
    text: target.mapLabel ?? target.label,
    stepText: `${step}/${miniGame.target}`,
    title: definition.title,
  }
}
