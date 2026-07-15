import { miniGameDefinition, miniGameTargets } from '../ai/miniGames'
import type { MiniGameId, MiniGameRuntime, Vec3 } from '../game/types'
import { houseBedWakePosition } from '../game/interiors'
import { seatsForContext } from '../game/seating'
import { createParkedVehicles, drivableVehicleCollisionBoxes, safeVehicleExitPosition } from '../game/vehicles'
import { useGameStore, type InteractionPrompt } from '../state/gameStore'
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
  getGameplaySnapshot: () => GameplayE2ESnapshot
  getSnapshot: () => MiniGameE2ESnapshot
  prepareHouseBedInteraction: () => GameplayE2ESnapshot
  prepareClassroomSeatInteraction: () => GameplayE2ESnapshot
  prepareParkingInteraction: () => GameplayE2ESnapshot
  setDriveInput: (throttle: number, steer?: number, brake?: boolean) => GameplayE2ESnapshot
}

export type GameplayE2ESnapshot = {
  sleeping: boolean
  interactionPrompt?: InteractionPrompt
  run: boolean
  seatedSeatId?: string
  activeVehicleId?: string
  playerPosition: Vec3
  teleportSequence: number
  interiorKind?: string
  buildMode: boolean
  obbyActive: boolean
  miniGameStatus: string
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
    getGameplaySnapshot,
    getSnapshot,
    prepareHouseBedInteraction,
    prepareClassroomSeatInteraction,
    prepareParkingInteraction,
    setDriveInput,
  }
}

function prepareClassroomSeatInteraction() {
  const game = useGameStore.getState()
  const seat = seatsForContext('school').find((target) => target.id.includes('back-centre')) ?? seatsForContext('school')[0]
  useGameStore.setState({
    activeInterior: {
      id: 'e2e-school',
      title: 'Test Classroom',
      kind: 'school',
      returnPosition: [0, 0, 4],
      returnYaw: 0,
    },
    playerPosition: [seat.exitPosition[0], 0, seat.exitPosition[2]],
    playerYaw: seat.yaw,
    sleeping: false,
    seatedSeatId: undefined,
    activeVehicleId: undefined,
    interactionPrompt: undefined,
    worldActionRequest: undefined,
    touch: { ...game.touch, x: 0, y: 0, jump: false, interact: false, run: false },
  })
  return getGameplaySnapshot()
}

function prepareParkingInteraction() {
  const game = useGameStore.getState()
  const vehicles = createParkedVehicles()
  const vehicle = vehicles[0]
  const arrival = safeVehicleExitPosition(vehicle, drivableVehicleCollisionBoxes(vehicles, vehicle.id))!
  const teleportSequence = game.teleportSequence + 1
  useGameStore.setState({
    activeInterior: undefined,
    playerPosition: arrival,
    playerYaw: vehicle.yaw,
    teleportSequence,
    teleportTarget: { sequence: teleportSequence, position: arrival, yaw: vehicle.yaw },
    sleeping: false,
    seatedSeatId: undefined,
    activeVehicleId: undefined,
    interactionPrompt: undefined,
    worldActionRequest: undefined,
    touch: { ...game.touch, x: 0, y: 0, jump: false, interact: false, run: false },
  })
  return getGameplaySnapshot()
}

function setDriveInput(throttle: number, steer = 0, brake = false) {
  useGameStore.getState().setTouch({
    y: -Math.max(-1, Math.min(1, throttle)),
    x: Math.max(-1, Math.min(1, steer)),
    jump: brake,
  })
  return getGameplaySnapshot()
}

function prepareHouseBedInteraction() {
  useGameStore.getState().enterInterior(
    {
      id: 'e2e-house',
      title: 'Test House',
      kind: 'house',
      returnPosition: [0, 0, 4],
      returnYaw: 0,
    },
    [houseBedWakePosition[0], 0, houseBedWakePosition[2]],
    0,
  )
  return getGameplaySnapshot()
}

function getGameplaySnapshot(): GameplayE2ESnapshot {
  const game = useGameStore.getState()
  return {
    sleeping: game.sleeping,
    interactionPrompt: game.interactionPrompt,
    run: game.touch.run,
    seatedSeatId: game.seatedSeatId,
    activeVehicleId: game.activeVehicleId,
    playerPosition: game.playerPosition,
    teleportSequence: game.teleportSequence,
    interiorKind: game.activeInterior?.kind,
    buildMode: game.buildMode,
    obbyActive: game.obby.active,
    miniGameStatus: game.miniGame.status,
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
  const game = useGameStore.getState()
  game.setPlayer(position, game.playerYaw, game.teleportSequence)
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
