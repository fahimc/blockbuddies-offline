import { miniGameDefinition, miniGameTargets } from '../ai/miniGames'
import type {
  BotRuntime,
  BuddyRushRuntime,
  BuildBlock,
  MessageThread,
  MiniGameId,
  MiniGameRuntime,
  PlayerEmote,
  QuestProgress,
  SavedFriend,
  Vec3,
} from '../game/types'
import { answerBuddyRecruitment, startBuddyRecruitment } from '../ai/buddyRush'
import {
  buddyRushRivals,
  findCollectableBuddy,
  playerClubhousePosition,
} from '../data/buddyRush'
import {
  buddyRushSiteByRivalId,
  buddyRushWorldSites,
} from '../data/buddyRushWorldPlan'
import { obbyCheckpoints, obbyFinish } from '../ai/obby'
import { houseBedWakePosition } from '../game/interiors'
import { seatsForContext } from '../game/seating'
import { footballPitch } from '../game/football'
import {
  createInitialKartRace,
  goKartCheckpoints,
  goKartTrack,
  goKartTrackTravelPosition,
  type KartRaceRuntime,
} from '../game/goKart'
import {
  createParkedVehicles,
  drivableVehicleCollisionBoxes,
  safeVehicleExitPosition,
} from '../game/vehicles'
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
  chatTexts: string[]
}

export type BlockBuddiesE2EBridge = {
  collectNextMiniGameTarget: () => MiniGameE2ESnapshot
  completeMiniGameRoute: () => MiniGameE2ESnapshot
  broadcastLocalPartySnapshot: (
    position?: Vec3,
    placedBlocks?: BuildBlock[],
    emote?: PlayerEmote,
  ) => LocalPartyE2ESnapshot
  openLocalPartyMessageThread: (
    playerId: string,
    playerName: string,
  ) => GameplayE2ESnapshot
  createLocalPartyFriend: (name?: string) => LocalPartyE2ESnapshot
  sendSelectedPredefinedMessage: (presetId: string) => GameplayE2ESnapshot
  getLocalPartySnapshot: () => LocalPartyE2ESnapshot
  getGameplaySnapshot: () => GameplayE2ESnapshot
  getSnapshot: () => MiniGameE2ESnapshot
  prepareHouseBedInteraction: () => GameplayE2ESnapshot
  prepareClassroomSeatInteraction: () => GameplayE2ESnapshot
  prepareParkingInteraction: () => GameplayE2ESnapshot
  prepareGoKartInteraction: () => GameplayE2ESnapshot
  completeGoKartRace: () => GameplayE2ESnapshot
  prepareMessageTargetInteraction: (distance?: number) => GameplayE2ESnapshot
  prepareMovementInteraction: () => GameplayE2ESnapshot
  prepareNpcDragInteraction: () => GameplayE2ESnapshot
  prepareBuildModeInteraction: () => GameplayE2ESnapshot
  prepareFootballInteraction: () => GameplayE2ESnapshot
  prepareBuddyRushDefence: () => GameplayE2ESnapshot
  prepareBuddyRushWorldView: (
    target: 'luna-club' | 'nori-club' | 'pip-club' | 'bus-stop',
  ) => GameplayE2ESnapshot
  prepareBuddyRushVisualState: (
    visualState:
      'protected' | 'warning' | 'recovery' | 'capture' | 'chase' | 'rescue',
    reducedMotion?: boolean,
  ) => GameplayE2ESnapshot
  finishBuddyRushDefence: () => GameplayE2ESnapshot
  letBuddyRushRivalEscape: () => GameplayE2ESnapshot
  completeBuddyRushRescue: () => GameplayE2ESnapshot
  completePlayerBuddyRushEscape: () => GameplayE2ESnapshot
  startObbyGame: () => GameplayE2ESnapshot
  completeObbyCourse: () => GameplayE2ESnapshot
  setDriveInput: (
    throttle: number,
    steer?: number,
    brake?: boolean,
  ) => GameplayE2ESnapshot
  setMovementInput: (
    forward: number,
    strafe?: number,
    lookX?: number,
  ) => GameplayE2ESnapshot
}

export type GameplayE2ESnapshot = {
  sleeping: boolean
  interactionPrompt?: InteractionPrompt
  run: boolean
  seatedSeatId?: string
  activeVehicleId?: string
  kartRace: KartRaceRuntime
  playerPosition: Vec3
  teleportSequence: number
  interiorKind?: string
  buildMode: boolean
  selectedBuildPiece: string
  selectedBuildBlockId?: string
  obbyActive: boolean
  obbyFinished: boolean
  coins: number
  earnedBadges: string[]
  questProgress: QuestProgress[]
  miniGameStatus: string
  playerEmote: string
  chatTexts: string[]
  placedBlocks: BuildBlock[]
  messageThreads: MessageThread[]
  savedFriends: SavedFriend[]
  bots: BotRuntime[]
  buddyRush: BuddyRushRuntime
  nearbyFootballBallId?: string
  footballActionSequence: number
  footballActionKind?: string
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
    openLocalPartyMessageThread,
    createLocalPartyFriend,
    sendSelectedPredefinedMessage,
    getLocalPartySnapshot,
    getGameplaySnapshot,
    getSnapshot,
    prepareHouseBedInteraction,
    prepareClassroomSeatInteraction,
    prepareParkingInteraction,
    prepareGoKartInteraction,
    completeGoKartRace,
    prepareMessageTargetInteraction,
    prepareMovementInteraction,
    prepareNpcDragInteraction,
    prepareBuildModeInteraction,
    prepareFootballInteraction,
    prepareBuddyRushDefence,
    prepareBuddyRushWorldView,
    prepareBuddyRushVisualState,
    finishBuddyRushDefence,
    letBuddyRushRivalEscape,
    completeBuddyRushRescue,
    completePlayerBuddyRushEscape,
    startObbyGame,
    completeObbyCourse,
    setDriveInput,
    setMovementInput,
  }
}

function prepareBuddyRushWorldView(
  target: 'luna-club' | 'nori-club' | 'pip-club' | 'bus-stop',
) {
  const game = useGameStore.getState()
  const site =
    target === 'bus-stop'
      ? buddyRushWorldSites.bus
      : buddyRushSiteByRivalId[target]
  const frontX = Math.sin(site.facingYaw)
  const frontZ = Math.cos(site.facingYaw)
  const arrival: Vec3 = [
    site.position[0] + frontX * 7.2,
    0,
    site.position[2] + frontZ * 7.2,
  ]
  const yaw = site.facingYaw + Math.PI
  const teleportSequence = game.teleportSequence + 1
  useGameStore.setState({
    activeInterior: undefined,
    openPanel: undefined,
    playerPosition: arrival,
    playerYaw: yaw,
    teleportSequence,
    teleportTarget: {
      sequence: teleportSequence,
      position: arrival,
      yaw,
      resetView: true,
    },
    sleeping: false,
    seatedSeatId: undefined,
    activeVehicleId: undefined,
    interactionPrompt: undefined,
    worldActionRequest: undefined,
    settings: {
      ...game.settings,
      reducedMotion: true,
      proceduralWorld: true,
      worldViewDistance: 2,
    },
    touch: {
      ...game.touch,
      x: 0,
      y: 0,
      lookX: 0,
      lookY: 0,
      jump: false,
      interact: false,
      run: false,
    },
  })
  return getGameplaySnapshot()
}

function prepareBuildModeInteraction() {
  const game = useGameStore.getState()
  const teleportSequence = game.teleportSequence + 1
  const playerPosition: Vec3 = [34, 0, 34]
  const placedBlocks: BuildBlock[] = [
    {
      id: 'e2e-build-house',
      kind: 'house',
      name: 'My House',
      position: [34, 0.02, 40],
      color: '#60a5fa',
      rotation: 0,
    },
    {
      id: 'e2e-build-tree',
      kind: 'tree',
      position: [40, 0.02, 38],
      color: '#16a34a',
      rotation: 0,
    },
  ]
  useGameStore.setState({
    activeInterior: undefined,
    buildMode: true,
    openPanel: undefined,
    placedBlocks,
    selectedBuildBlockId: undefined,
    playerPosition,
    playerYaw: 0,
    teleportSequence,
    teleportTarget: {
      sequence: teleportSequence,
      position: playerPosition,
      yaw: 0,
    },
  })
  return getGameplaySnapshot()
}

function prepareFootballInteraction() {
  const game = useGameStore.getState()
  const teleportSequence = game.teleportSequence + 1
  const playerPosition: Vec3 = [
    footballPitch.center[0],
    0,
    footballPitch.center[2] + 1.25,
  ]
  useGameStore.setState({
    activeInterior: undefined,
    buildMode: false,
    openPanel: undefined,
    playerPosition,
    playerYaw: Math.PI,
    teleportSequence,
    teleportTarget: {
      sequence: teleportSequence,
      position: playerPosition,
      yaw: Math.PI,
      resetView: true,
    },
    sleeping: false,
    seatedSeatId: undefined,
    activeVehicleId: undefined,
    interactionPrompt: undefined,
    nearbyFootballBallId: undefined,
    worldActionRequest: undefined,
    touch: {
      ...game.touch,
      x: 0,
      y: 0,
      lookX: 0,
      lookY: 0,
      jump: false,
      interact: false,
      run: false,
    },
  })
  return getGameplaySnapshot()
}

function ensureBuddyRushTestBuddies() {
  let runtime = useGameStore.getState().buddyRush
  while (runtime.ownedBuddies.length < 2) {
    const definitionId = runtime.bus.offerDefinitionIds[0]
    const definition = definitionId
      ? findCollectableBuddy(definitionId)
      : undefined
    if (!definition)
      throw new Error('Buddy Bus has no visitor available for E2E setup')
    runtime = answerBuddyRecruitment(
      startBuddyRecruitment(runtime, definition.id),
      definition.recruitmentAnswer,
      Date.now(),
    ).state
  }
  useGameStore.setState({ buddyRush: runtime })
}

function prepareBuddyRushDefence() {
  ensureBuddyRushTestBuddies()
  const now = Date.now()
  useGameStore.setState((state) => ({
    buddyRush: {
      ...state.buddyRush,
      activeRaid: undefined,
      rescueQuest: undefined,
      ownedBuddies: state.buddyRush.ownedBuddies.map((buddy) => ({
        ...buddy,
        visitState: null,
      })),
      shield: {
        ...state.buddyRush.shield,
        phase: 'warning',
        phaseEndsAtGameTime: now,
      },
    },
  }))
  useGameStore.getState().tickBuddyRush(now)
  const approachEnd =
    useGameStore.getState().buddyRush.activeRaid?.phaseEndsAt ?? now
  useGameStore.getState().tickBuddyRush(approachEnd)
  const captureEnd =
    useGameStore.getState().buddyRush.activeRaid?.phaseEndsAt ?? approachEnd
  useGameStore.getState().tickBuddyRush(captureEnd)
  return getGameplaySnapshot()
}

function prepareBuddyRushVisualState(
  visualState:
    'protected' | 'warning' | 'recovery' | 'capture' | 'chase' | 'rescue',
  reducedMotion = false,
) {
  ensureBuddyRushTestBuddies()
  useGameStore.setState((state) => ({
    settings: { ...state.settings, reducedMotion },
  }))
  if (visualState === 'chase' || visualState === 'rescue') {
    prepareBuddyRushDefence()
    if (visualState === 'rescue') letBuddyRushRivalEscape()
    return getGameplaySnapshot()
  }

  const now = Date.now()
  if (visualState === 'capture') {
    const rival = buddyRushRivals.find(
      (entry) => entry.clubhousePosition && entry.buddyDefinitionIds.length > 0,
    )
    if (!rival) throw new Error('No rival clubhouse is available')
    useGameStore.setState((state) => ({
      buddyRush: {
        ...state.buddyRush,
        activeRaid: {
          id: 'e2e-visual-player-capture',
          rivalId: rival.id,
          direction: 'raid',
          phase: 'capture',
          buddyDefinitionId: rival.buddyDefinitionIds[0],
          routeIndex: 0,
          startedAt: now,
          phaseEndsAt: now + 90_000,
        },
        shield: {
          ...state.buddyRush.shield,
          phase: 'rush',
          phaseEndsAtGameTime: now + 90_000,
        },
      },
    }))
    return getGameplaySnapshot()
  }

  useGameStore.setState((state) => ({
    buddyRush: {
      ...state.buddyRush,
      activeRaid: undefined,
      rescueQuest: undefined,
      shield: {
        ...state.buddyRush.shield,
        phase: visualState,
        phaseEndsAtGameTime: now + 90_000,
      },
    },
  }))
  return getGameplaySnapshot()
}

function finishBuddyRushDefence() {
  useGameStore.getState().tagBuddyRushRival(Date.now())
  return getGameplaySnapshot()
}

function letBuddyRushRivalEscape() {
  const raid = useGameStore.getState().buddyRush.activeRaid
  if (!raid || raid.direction !== 'defend' || raid.phase !== 'chase')
    throw new Error('No AI Buddy Rush chase is active')
  useGameStore.getState().tickBuddyRush(raid.phaseEndsAt)
  return getGameplaySnapshot()
}

function completeBuddyRushRescue() {
  const quest = useGameStore.getState().buddyRush.rescueQuest
  if (!quest) throw new Error('No Buddy Rescue Quest is active')
  useGameStore.getState().rescueBuddyVisitor(quest.buddyInstanceId, Date.now())
  return getGameplaySnapshot()
}

function completePlayerBuddyRushEscape() {
  const raid = useGameStore.getState().buddyRush.activeRaid
  if (!raid || raid.direction !== 'raid' || raid.phase !== 'chase')
    throw new Error('No player Buddy Rush escape is active')
  useGameStore.setState({ playerPosition: playerClubhousePosition })
  useGameStore.getState().tickBuddyRush(Date.now())
  return getGameplaySnapshot()
}

function startObbyGame() {
  useGameStore.getState().beginObby(performance.now())
  return getGameplaySnapshot()
}

function completeObbyCourse() {
  const startedAt = performance.now()
  useGameStore.getState().beginObby(startedAt)
  obbyCheckpoints.forEach((checkpoint, index) => {
    useGameStore.setState({
      playerPosition: checkpoint,
      teleportTarget: undefined,
    })
    useGameStore
      .getState()
      .updateObby(startedAt + 500 + index * 500, obbyCheckpoints)
  })
  useGameStore.setState({
    playerPosition: obbyFinish,
    teleportTarget: undefined,
  })
  useGameStore.getState().completeObby(startedAt + 12_000)
  return getGameplaySnapshot()
}

function prepareClassroomSeatInteraction() {
  const game = useGameStore.getState()
  const seat =
    seatsForContext('school').find((target) =>
      target.id.includes('back-centre'),
    ) ?? seatsForContext('school')[0]
  game.enterInterior(
    {
      id: 'e2e-school',
      title: 'Test Classroom',
      kind: 'school',
      returnPosition: [0, 0, 4],
      returnYaw: 0,
    },
    [seat.exitPosition[0], 0, seat.exitPosition[2]],
    seat.yaw,
  )
  useGameStore.setState({
    touch: {
      ...game.touch,
      x: 0,
      y: 0,
      jump: false,
      interact: false,
      run: false,
    },
  })
  return getGameplaySnapshot()
}

function prepareParkingInteraction() {
  const game = useGameStore.getState()
  const vehicles = createParkedVehicles()
  const vehicle = vehicles[0]
  const arrival = safeVehicleExitPosition(
    vehicle,
    drivableVehicleCollisionBoxes(vehicles, vehicle.id),
  )!
  const teleportSequence = game.teleportSequence + 1
  useGameStore.setState({
    activeInterior: undefined,
    playerPosition: arrival,
    playerYaw: vehicle.yaw,
    teleportSequence,
    teleportTarget: {
      sequence: teleportSequence,
      position: arrival,
      yaw: vehicle.yaw,
    },
    sleeping: false,
    seatedSeatId: undefined,
    activeVehicleId: undefined,
    interactionPrompt: undefined,
    worldActionRequest: undefined,
    touch: {
      ...game.touch,
      x: 0,
      y: 0,
      jump: false,
      interact: false,
      run: false,
    },
  })
  return getGameplaySnapshot()
}

function prepareGoKartInteraction() {
  const game = useGameStore.getState()
  const teleportSequence = game.teleportSequence + 1
  useGameStore.setState({
    activeInterior: undefined,
    openPanel: undefined,
    playerPosition: [...goKartTrackTravelPosition],
    playerYaw: Math.PI / 2,
    teleportSequence,
    teleportTarget: {
      sequence: teleportSequence,
      position: [...goKartTrackTravelPosition],
      yaw: Math.PI / 2,
      resetView: true,
    },
    sleeping: false,
    seatedSeatId: undefined,
    activeVehicleId: undefined,
    kartRace: createInitialKartRace(),
    interactionPrompt: undefined,
    worldActionRequest: undefined,
    touch: {
      ...game.touch,
      x: 0,
      y: 0,
      lookX: 0,
      lookY: 0,
      jump: false,
      interact: false,
      run: false,
    },
  })
  return getGameplaySnapshot()
}

function completeGoKartRace() {
  const game = useGameStore.getState()
  if (!game.activeVehicleId?.startsWith('go-kart:'))
    throw new Error('No go-kart is active')
  const baseTime = Date.now()
  if (game.kartRace.status === 'lobby')
    game.startKartRace(baseTime - 4_000, 'e2e-kart-race')
  useGameStore.getState().tickKartRace(baseTime, goKartTrack.center)
  for (let lap = 1; lap <= 3; lap += 1) {
    for (const checkpoint of goKartCheckpoints)
      useGameStore
        .getState()
        .tickKartRace(baseTime + lap * 1_000, checkpoint.center)
  }
  return getGameplaySnapshot()
}

function prepareMessageTargetInteraction(distance = 5) {
  const game = useGameStore.getState()
  const teleportSequence = game.teleportSequence + 1
  const playerPosition: Vec3 = [0, 0, 0]
  const lateralOffset = Math.max(1.4, Math.min(2.4, Math.abs(distance) * 0.35))
  const targetPositions: Record<string, Vec3> = {
    luna: [-lateralOffset, 0, distance],
    max: [lateralOffset, 0, distance],
  }

  useGameStore.setState({
    activeInterior: undefined,
    activeVehicleId: undefined,
    playerPosition,
    playerYaw: 0,
    teleportSequence,
    teleportTarget: {
      sequence: teleportSequence,
      position: playerPosition,
      yaw: 0,
    },
    bots: game.bots.map((bot) => {
      const target = targetPositions[bot.id]
      if (!target) return bot
      return {
        ...bot,
        action: 'idle',
        nextDecisionAt: Number.MAX_SAFE_INTEGER,
        position: target,
        target,
        targetLocation: 'spawn',
        state: 'idle',
        speech: undefined,
        speechUntil: 0,
      }
    }),
    touch: {
      ...game.touch,
      x: 0,
      y: 0,
      lookX: 0,
      lookY: 0,
      jump: false,
      interact: false,
      run: false,
    },
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

function prepareMovementInteraction() {
  const game = useGameStore.getState()
  game.enterInterior(
    {
      id: 'e2e-movement-room',
      title: 'Movement Test Room',
      kind: 'shop',
      returnPosition: [0, 0, 4],
      returnYaw: 0,
    },
    [0, 0, 0],
    0,
  )
  useGameStore.setState({
    touch: {
      ...game.touch,
      x: 0,
      y: 0,
      lookX: 0,
      lookY: 0,
      jump: false,
      interact: false,
      run: false,
    },
  })
  return getGameplaySnapshot()
}

function setMovementInput(forward: number, strafe = 0, lookX = 0) {
  useGameStore.getState().setTouch({
    y: -Math.max(-1, Math.min(1, forward)),
    x: Math.max(-1, Math.min(1, strafe)),
    lookX,
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
    kartRace: game.kartRace,
    playerPosition: game.playerPosition,
    teleportSequence: game.teleportSequence,
    interiorKind: game.activeInterior?.kind,
    buildMode: game.buildMode,
    selectedBuildPiece: game.selectedBuildPiece,
    selectedBuildBlockId: game.selectedBuildBlockId,
    obbyActive: game.obby.active,
    obbyFinished: game.obby.finished,
    coins: game.coins,
    earnedBadges: game.earnedBadges,
    questProgress: game.questProgress,
    miniGameStatus: game.miniGame.status,
    playerEmote: game.playerEmote,
    chatTexts: game.chat.map((message) => message.text),
    placedBlocks: game.placedBlocks,
    messageThreads: game.messageThreads,
    savedFriends: game.savedFriends,
    bots: game.bots,
    buddyRush: game.buddyRush,
    nearbyFootballBallId: game.nearbyFootballBallId,
    footballActionSequence: game.footballActionSequence,
    footballActionKind: game.footballActionKind,
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
    chatTexts: state.chat.map((message) => message.text),
  }
}

function broadcastLocalPartySnapshot(
  position?: Vec3,
  placedBlocks?: BuildBlock[],
  emote?: PlayerEmote,
): LocalPartyE2ESnapshot {
  if (placedBlocks) useGameStore.setState({ placedBlocks })
  if (emote) useGameStore.setState({ playerEmote: emote })
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
      emote: emote ?? game.playerEmote,
      interiorId: game.activeInterior?.id,
      placedBlocks: placedBlocks ?? game.placedBlocks,
      savedFriends: game.savedFriends,
    }),
  )
  return getLocalPartySnapshot()
}

function openLocalPartyMessageThread(
  playerId: string,
  playerName: string,
): GameplayE2ESnapshot {
  useGameStore.getState().openMessageThread(playerId, playerName)
  return getGameplaySnapshot()
}

function createLocalPartyFriend(name = 'Party Pal'): LocalPartyE2ESnapshot {
  const game = useGameStore.getState()
  game.createSavedFriend(name, {
    ...game.avatar,
    shirtColor: '#a78bfa',
    accentColor: '#facc15',
    accessory: 'pet-bot',
  })
  return broadcastLocalPartySnapshot()
}

function prepareNpcDragInteraction(): GameplayE2ESnapshot {
  const game = useGameStore.getState()
  if (!game.savedFriends.some((friend) => friend.name === 'Drag Buddy'))
    game.createSavedFriend('Drag Buddy', {
      ...game.avatar,
      shirtColor: '#38bdf8',
      accentColor: '#facc15',
      hat: 'hat-star',
      accessory: 'pet-bot',
      trail: 'trail-spark',
    })
  const next = useGameStore.getState()
  const friend = next.savedFriends.find((entry) => entry.name === 'Drag Buddy')
  const bot = next.bots[0]
  if (friend) next.placeSavedFriend(friend.id, [2, 0, 0])
  if (bot) useGameStore.getState().placeBot(bot.id, [-2, 0, 0])
  return getGameplaySnapshot()
}

function sendSelectedPredefinedMessage(presetId: string): GameplayE2ESnapshot {
  const selectedThreadId = useGameStore.getState().selectedMessageThreadId
  if (selectedThreadId)
    useGameStore.getState().sendPredefinedMessage(selectedThreadId, presetId)
  return getGameplaySnapshot()
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
