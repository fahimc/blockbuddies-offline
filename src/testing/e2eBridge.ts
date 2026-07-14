import { miniGameDefinition, miniGameTargets } from '../ai/miniGames'
import type { MiniGameId, MiniGameRuntime, Vec3 } from '../game/types'
import { useGameStore } from '../state/gameStore'
import {
  makePartySnapshot,
  useLocalPartyStore,
  type LocalPartySnapshot,
  type LocalPartyStatus,
} from '../state/localPartyStore'

export type MiniGameE2ESnapshot = {
  miniGame: MiniGameRuntime
  coins: number
  earnedBadges: string[]
  playerPosition: Vec3
}

export type BlockBuddiesE2EBridge = {
  collectNextMiniGameTarget: () => MiniGameE2ESnapshot
  completeMiniGameRoute: () => MiniGameE2ESnapshot
  broadcastLocalPartySnapshot: (position?: Vec3) => LocalPartyE2ESnapshot
  getLocalPartySnapshot: () => LocalPartyE2ESnapshot
  getSnapshot: () => MiniGameE2ESnapshot
}

export type LocalPartyE2ESnapshot = {
  playerId: string
  playerName: string
  status: LocalPartyStatus
  role?: string
  inviteCode: string
  answerCode: string
  answerCodeInput: string
  remotePlayers: LocalPartySnapshot[]
  lastEvent: string
  error?: string
}

declare global {
  interface Window {
    __blockBuddiesE2E?: BlockBuddiesE2EBridge
  }
}

export function installE2EBridge() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return

  window.__blockBuddiesE2E = {
    collectNextMiniGameTarget,
    completeMiniGameRoute,
    broadcastLocalPartySnapshot,
    getLocalPartySnapshot,
    getSnapshot,
  }
}

function collectNextMiniGameTarget() {
  const state = useGameStore.getState()
  const activeId = state.miniGame.activeId
  if (state.miniGame.status !== 'running' || !activeId) {
    throw new Error('No active mini game is running')
  }

  const target = nextTarget(activeId, state.miniGame)
  if (!target) {
    throw new Error(
      `No target available for ${miniGameDefinition(activeId).title}`,
    )
  }

  const position = target.position
  useGameStore.getState().setPlayer(position, useGameStore.getState().playerYaw)
  useGameStore.getState().tickMiniGame(performance.now(), position)
  return getSnapshot()
}

function completeMiniGameRoute() {
  const initial = useGameStore.getState().miniGame
  const activeId = initial.activeId
  if (initial.status !== 'running' || !activeId) {
    throw new Error('No active mini game is running')
  }

  const maxSteps = miniGameTargets(activeId).length + 1
  for (let step = 0; step < maxSteps; step += 1) {
    const state = useGameStore.getState().miniGame
    if (state.status !== 'running') break
    collectNextMiniGameTarget()
  }
  return getSnapshot()
}

function nextTarget(activeId: MiniGameId, miniGame: MiniGameRuntime) {
  const targets = miniGameTargets(activeId)
  if (activeId === 'delivery-dash') return targets[miniGame.score]
  return targets.find((target) => !miniGame.collected.includes(target.id))
}

function getSnapshot(): MiniGameE2ESnapshot {
  const state = useGameStore.getState()
  return {
    miniGame: state.miniGame,
    coins: state.coins,
    earnedBadges: state.earnedBadges,
    playerPosition: state.playerPosition,
  }
}

function broadcastLocalPartySnapshot(position?: Vec3): LocalPartyE2ESnapshot {
  const game = useGameStore.getState()
  const party = useLocalPartyStore.getState()
  party.broadcastSnapshot(
    makePartySnapshot({
      id: party.playerId,
      name: party.playerName,
      position: position ?? game.playerPosition,
      yaw: game.playerYaw,
      avatar: game.avatar,
      action: 'run',
      interiorId: game.activeInterior?.id,
    }),
  )
  return getLocalPartySnapshot()
}

function getLocalPartySnapshot(): LocalPartyE2ESnapshot {
  const party = useLocalPartyStore.getState()
  return {
    playerId: party.playerId,
    playerName: party.playerName,
    status: party.status,
    role: party.role,
    inviteCode: party.inviteCode,
    answerCode: party.answerCode,
    answerCodeInput: party.answerCodeInput,
    remotePlayers: Object.values(party.remotePlayers),
    lastEvent: party.lastEvent,
    error: party.error,
  }
}
