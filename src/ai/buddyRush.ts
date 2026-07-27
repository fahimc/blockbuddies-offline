import {
  buddyActivityStationDefinitions,
  buddyRushConfig,
  buddyRushGadgets,
  buddyRushModeModifiers,
  buddyRushRivals,
  collectableBuddyDefinitions,
  findBuddyGadget,
  findBuddyRival,
  findBuddyStation,
  findCollectableBuddy,
  playerClubhousePosition,
} from '../data/buddyRush'
import type {
  BuddyActivityStationId,
  BuddyGadgetId,
  BuddyPetId,
  BuddyRushMode,
  BuddyRushNotice,
  BuddyRushRuntime,
  CollectableBuddyInstance,
  Vec3,
} from '../game/types'

export type BuddyRushTickOptions = {
  enabled: boolean
  mode: BuddyRushMode
  playerPosition?: Vec3
  pauseRaids?: boolean
}

export type BuddyRushTickResult = {
  state: BuddyRushRuntime
  coinsAwarded: number
  completedPlayerRaid: boolean
  escapedBuddyId?: string
  returnedBuddyIds: string[]
}

export type BuddyRecruitmentResult = {
  state: BuddyRushRuntime
  recruited?: CollectableBuddyInstance
  consolationCoins: number
}

export type BuddyRushActionResult = {
  state: BuddyRushRuntime
  coinsAwarded: number
  buddyInstanceId?: string
}

export function createInitialBuddyRush(now = Date.now()): BuddyRushRuntime {
  return {
    ownedBuddies: [],
    discoveredDefinitionIds: [],
    discoveredStyleIds: [],
    stations: buddyActivityStationDefinitions.map((station) => ({
      id: station.id,
      level: 1,
      assignedBuddyIds: [],
    })),
    unclaimedCoins: 0,
    passiveCoinRemainder: 0,
    lastPassiveAt: now,
    shield: {
      phase: 'protected',
      phaseEndsAtGameTime: now + buddyRushConfig.newPlayerProtectedMs,
      lastRaiderId: null,
    },
    bus: {
      cycle: 0,
      arrivedAt: now,
      departsAt: now + buddyRushConfig.busVisitMs,
      nextArrivalAt: now + buddyRushConfig.busIntervalMs,
      offerDefinitionIds: buddyOffersForCycle(0),
    },
    visitors: [],
    gadgetLoadout: buddyRushGadgets.map((gadget) => gadget.id),
    gadgetCooldownEndsAt: {},
    boostEndsAt: 0,
    rivalPauseStartedAt: 0,
    rivalPausedUntil: 0,
    routeHintEndsAt: 0,
    whistlePullEndsAt: 0,
    petLoadout: {
      adventurePetId: 'tracker-pup',
      guardPetId: 'guard-bot',
    },
    rivalMemories: Object.fromEntries(
      buddyRushRivals.map((rival) => [
        rival.id,
        {
          rivalId: rival.id,
          targetCount: 0,
          lastTargetedAt: 0,
          lastOutcome: 'none' as const,
        },
      ]),
    ),
    raidSequence: 0,
    recentRescueStreak: 0,
    neighbourhoodRank: 0,
    eventSequence: 0,
  }
}

export function buddyOffersForCycle(cycle: number) {
  const start = (cycle * 3) % collectableBuddyDefinitions.length
  return [0, 1, 2].map(
    (offset) =>
      collectableBuddyDefinitions[
        (start + offset) % collectableBuddyDefinitions.length
      ].id,
  )
}

export function buddyOutputPerMinute(runtime: BuddyRushRuntime) {
  const assignedOutput = runtime.ownedBuddies.reduce((total, buddy) => {
    if (!buddy.activityStationId || buddy.visitState) return total
    const definition = findCollectableBuddy(buddy.definitionId)
    const station = findBuddyStation(buddy.activityStationId)
    const stationState = runtime.stations.find(
      (entry) => entry.id === buddy.activityStationId,
    )
    if (!definition || !station || !stationState) return total
    const talentBonus = definition.talent === station.preferredTalent ? 1.25 : 1
    const levelBonus = 1 + Math.max(0, stationState.level - 1) * 0.2
    const happinessBonus = Math.max(0.5, Math.min(1, buddy.happiness / 100))
    return (
      total +
      definition.passiveCoinsPerMinute *
        talentBonus *
        levelBonus *
        happinessBonus
    )
  }, 0)
  const visitorOutput = runtime.visitors.reduce((total, visitor) => {
    const definition = findCollectableBuddy(visitor.definitionId)
    return total + (definition?.passiveCoinsPerMinute ?? 0) * 0.35
  }, 0)
  return assignedOutput + visitorOutput
}

export function isRivalBuddyVisitingPlayer(
  runtime: Pick<BuddyRushRuntime, 'visitors'>,
  rivalId: string,
  definitionId: string,
) {
  return runtime.visitors.some(
    (visitor) =>
      visitor.sourceRivalId === rivalId &&
      visitor.definitionId === definitionId,
  )
}

export function buddyWhistleFollowerOffset(
  rivalPosition: Vec3,
  playerPosition: Vec3,
  active: boolean,
): Vec3 {
  const base: Vec3 = [-1.05, 0, 0.75]
  if (!active) return base
  const dx = playerPosition[0] - rivalPosition[0]
  const dz = playerPosition[2] - rivalPosition[2]
  const distance = Math.max(0.001, Math.hypot(dx, dz))
  return [base[0] + (dx / distance) * 1.6, 0, base[2] + (dz / distance) * 1.6]
}

export function pointAlongBuddyRoute(route: Vec3[], progress: number): Vec3 {
  if (route.length < 2) return route[0] ?? [0, 0, 0]
  const scaled = Math.max(0, Math.min(0.9999, progress)) * (route.length - 1)
  const segment = Math.floor(scaled)
  const a = route[segment]
  const b = route[segment + 1]
  const segmentProgress = scaled - segment
  return [
    a[0] + (b[0] - a[0]) * segmentProgress,
    a[1] + (b[1] - a[1]) * segmentProgress,
    a[2] + (b[2] - a[2]) * segmentProgress,
  ]
}

export function tickBuddyRushRuntime(
  runtime: BuddyRushRuntime,
  now: number,
  options: BuddyRushTickOptions,
): BuddyRushTickResult {
  let next = accruePassiveCoins(runtime, now)
  const returnedBuddyIds: string[] = []
  next = {
    ...next,
    ownedBuddies: next.ownedBuddies.map((buddy) => {
      if (!buddy.visitState || buddy.visitState.endsAtGameTime > now)
        return buddy
      returnedBuddyIds.push(buddy.id)
      return {
        ...buddy,
        visitState: null,
        friendshipXp: buddy.friendshipXp + 10,
        happiness: Math.min(100, buddy.happiness + 10),
      }
    }),
    visitors: next.visitors.filter((visitor) => visitor.endsAt > now),
  }
  if (
    next.rescueQuest &&
    !next.ownedBuddies.some(
      (buddy) =>
        buddy.id === next.rescueQuest?.buddyInstanceId && buddy.visitState,
    )
  ) {
    next = { ...next, rescueQuest: undefined }
  }
  if (returnedBuddyIds.length > 0) {
    next = withNotice(
      next,
      'success',
      `${returnedBuddyIds.length === 1 ? 'Your Buddy has' : 'Your Buddies have'} returned home safely.`,
    )
  }
  next = tickBuddyBus(next, now)

  if (!options.enabled) {
    return {
      state: {
        ...next,
        activeRaid: undefined,
        shield: {
          phase: 'protected',
          phaseEndsAtGameTime: now + buddyRushConfig.protectedMs,
          lastRaiderId: next.shield.lastRaiderId,
        },
      },
      coinsAwarded: 0,
      completedPlayerRaid: false,
      returnedBuddyIds,
    }
  }

  if (next.activeRaid) {
    const raidResult = tickRaid(next, now, options)
    return { ...raidResult, returnedBuddyIds }
  }

  if (options.pauseRaids) {
    return {
      state: next,
      coinsAwarded: 0,
      completedPlayerRaid: false,
      returnedBuddyIds,
    }
  }

  if (now < next.shield.phaseEndsAtGameTime) {
    return {
      state: next,
      coinsAwarded: 0,
      completedPlayerRaid: false,
      returnedBuddyIds,
    }
  }

  const modifiers = buddyRushModeModifiers[options.mode]
  if (next.shield.phase === 'protected' || next.shield.phase === 'recovery') {
    if (eligibleBuddies(next).length === 0) {
      return {
        state: {
          ...withNotice(
            next,
            'info',
            'Recruit a Buddy before the next Clubhouse Rush can begin.',
          ),
          shield: {
            ...next.shield,
            phase: 'protected',
            phaseEndsAtGameTime:
              now + buddyRushConfig.protectedMs * modifiers.shieldMultiplier,
          },
        },
        coinsAwarded: 0,
        completedPlayerRaid: false,
        returnedBuddyIds,
      }
    }
    return {
      state: {
        ...withNotice(
          next,
          'warning',
          'Clubhouse Shield warning! A rival is planning a Buddy Rush.',
        ),
        shield: {
          ...next.shield,
          phase: 'warning',
          phaseEndsAtGameTime:
            now +
            buddyRushConfig.warningMs *
              modifiers.warningMultiplier *
              guardPetWarningMultiplier(next),
        },
      },
      coinsAwarded: 0,
      completedPlayerRaid: false,
      returnedBuddyIds,
    }
  }

  if (next.shield.phase === 'warning') {
    const activeRaid = createDefenceRaid(next, now, options.mode)
    if (!activeRaid) {
      return {
        state: {
          ...next,
          shield: {
            ...next.shield,
            phase: 'protected',
            phaseEndsAtGameTime: now + buddyRushConfig.protectedMs,
          },
        },
        coinsAwarded: 0,
        completedPlayerRaid: false,
        returnedBuddyIds,
      }
    }
    const rival = findBuddyRival(activeRaid.rivalId)
    return {
      state: {
        ...withNotice(
          next,
          'warning',
          rival?.chatLines.warning ?? 'A rival Buddy Rush has started!',
        ),
        activeRaid,
        raidSequence: next.raidSequence + 1,
        shield: {
          ...next.shield,
          phase: 'rush',
          phaseEndsAtGameTime: now + buddyRushConfig.rushMs,
          lastRaiderId: activeRaid.rivalId,
        },
      },
      coinsAwarded: 0,
      completedPlayerRaid: false,
      returnedBuddyIds,
    }
  }

  return {
    state: {
      ...next,
      shield: {
        ...next.shield,
        phase: 'recovery',
        phaseEndsAtGameTime: now + buddyRushConfig.recoveryMs,
      },
    },
    coinsAwarded: 0,
    completedPlayerRaid: false,
    returnedBuddyIds,
  }
}

export function startBuddyRecruitment(
  runtime: BuddyRushRuntime,
  definitionId: string,
) {
  if (!runtime.bus.offerDefinitionIds.includes(definitionId)) return runtime
  return {
    ...runtime,
    bus: {
      ...runtime.bus,
      selectedDefinitionId: definitionId,
      feedback: undefined,
    },
  }
}

export function answerBuddyRecruitment(
  runtime: BuddyRushRuntime,
  answer: string,
  now: number,
): BuddyRecruitmentResult {
  const definition = runtime.bus.selectedDefinitionId
    ? findCollectableBuddy(runtime.bus.selectedDefinitionId)
    : undefined
  if (!definition) return { state: runtime, consolationCoins: 0 }
  if (answer !== definition.recruitmentAnswer) {
    return {
      state: {
        ...runtime,
        bus: {
          ...runtime.bus,
          feedback: {
            kind: 'wrong',
            message:
              'Good try! You earned 3 practice coins. Try another answer.',
          },
        },
      },
      consolationCoins: 3,
    }
  }

  const styleId =
    definition.rarity === 'secret' || runtime.ownedBuddies.length === 4
      ? 'galaxy'
      : null
  const recruited: CollectableBuddyInstance = {
    id: `buddy-${definition.id}-${runtime.bus.cycle}-${runtime.ownedBuddies.length}`,
    definitionId: definition.id,
    ownerId: 'player',
    rarity: definition.rarity,
    styleId,
    talent: definition.talent,
    friendshipLevel: 1,
    friendshipXp: 0,
    happiness: 100,
    isFavourite: runtime.ownedBuddies.length === 0,
    activityStationId: null,
    visitState: null,
    rescues: 0,
  }
  const discoveredDefinitionIds = runtime.discoveredDefinitionIds.includes(
    definition.id,
  )
    ? runtime.discoveredDefinitionIds
    : [...runtime.discoveredDefinitionIds, definition.id]
  return {
    state: withNotice(
      {
        ...runtime,
        ownedBuddies: [...runtime.ownedBuddies, recruited],
        discoveredDefinitionIds,
        discoveredStyleIds:
          styleId && !runtime.discoveredStyleIds.includes(styleId)
            ? [...runtime.discoveredStyleIds, styleId]
            : runtime.discoveredStyleIds,
        bus: {
          ...runtime.bus,
          offerDefinitionIds: runtime.bus.offerDefinitionIds.filter(
            (id) => id !== definition.id,
          ),
          selectedDefinitionId: undefined,
          feedback: {
            kind: 'success',
            message: `${definition.name} joined your clubhouse!`,
          },
        },
        shield:
          runtime.ownedBuddies.length === 0
            ? {
                ...runtime.shield,
                phaseEndsAtGameTime: now + buddyRushConfig.newPlayerProtectedMs,
              }
            : runtime.shield,
      },
      'success',
      `${styleId ? 'Galaxy ' : ''}${definition.name} joined your Buddy collection!`,
    ),
    recruited,
    consolationCoins: 0,
  }
}

export function assignBuddyToStation(
  runtime: BuddyRushRuntime,
  buddyInstanceId: string,
  stationId: BuddyActivityStationId | null,
) {
  const buddy = runtime.ownedBuddies.find(
    (entry) => entry.id === buddyInstanceId,
  )
  if (!buddy || buddy.visitState) return runtime
  const nextStations = runtime.stations.map((station) => ({
    ...station,
    assignedBuddyIds: station.assignedBuddyIds.filter(
      (id) => id !== buddyInstanceId,
    ),
  }))
  if (stationId) {
    const target = nextStations.find((station) => station.id === stationId)
    if (!target || target.assignedBuddyIds.length >= 4) return runtime
    target.assignedBuddyIds = [...target.assignedBuddyIds, buddyInstanceId]
  }
  return {
    ...runtime,
    ownedBuddies: runtime.ownedBuddies.map((entry) =>
      entry.id === buddyInstanceId
        ? { ...entry, activityStationId: stationId }
        : entry,
    ),
    stations: nextStations,
  }
}

export function toggleFavouriteBuddy(
  runtime: BuddyRushRuntime,
  buddyInstanceId: string,
) {
  const selected = runtime.ownedBuddies.find(
    (buddy) => buddy.id === buddyInstanceId,
  )
  if (!selected) return runtime
  if (selected.isFavourite) return runtime
  return {
    ...runtime,
    ownedBuddies: runtime.ownedBuddies.map((buddy) =>
      buddy.id === buddyInstanceId
        ? { ...buddy, isFavourite: true }
        : { ...buddy, isFavourite: false },
    ),
  }
}

export function collectBuddyRushEarnings(runtime: BuddyRushRuntime) {
  const coins = Math.max(0, Math.floor(runtime.unclaimedCoins))
  return {
    state: {
      ...runtime,
      unclaimedCoins: runtime.unclaimedCoins - coins,
    },
    coins,
  }
}

export function startPlayerBuddyRaid(
  runtime: BuddyRushRuntime,
  rivalId: string,
  now: number,
) {
  const rival = findBuddyRival(rivalId)
  if (
    !rival?.clubhousePosition ||
    runtime.activeRaid ||
    runtime.ownedBuddies.length === 0
  )
    return runtime
  const buddyDefinitionId =
    rival.buddyDefinitionIds[
      runtime.raidSequence % rival.buddyDefinitionIds.length
    ]
  return withNotice(
    {
      ...runtime,
      activeRaid: {
        id: `player-raid-${runtime.raidSequence}`,
        direction: 'raid',
        phase: 'capture',
        rivalId,
        buddyDefinitionId,
        startedAt: now,
        phaseEndsAt: 0,
        routeIndex:
          Math.max(
            0,
            buddyRushRivals
              .filter((entry) => entry.clubhousePosition)
              .findIndex((entry) => entry.id === rivalId),
          ) *
            2 +
          (runtime.raidSequence % 2),
      },
      raidSequence: runtime.raidSequence + 1,
    },
    'info',
    `Visit ${rival.clubhouseName} and hold the Friendship Badge control.`,
  )
}

export function completePlayerBadgeCapture(
  runtime: BuddyRushRuntime,
  now: number,
  mode: BuddyRushMode,
) {
  const raid = runtime.activeRaid
  if (!raid || raid.direction !== 'raid' || raid.phase !== 'capture')
    return runtime
  return withNotice(
    {
      ...runtime,
      activeRaid: {
        ...raid,
        phase: 'chase',
        phaseEndsAt:
          now +
          buddyRushConfig.chaseMs *
            buddyRushModeModifiers[mode].chaseMultiplier *
            trackerPetChaseMultiplier(runtime),
      },
    },
    'warning',
    'Friendship Badge captured! Return to your clubhouse before time runs out.',
  )
}

export function tagBuddyRushRival(
  runtime: BuddyRushRuntime,
  now: number,
): BuddyRushActionResult {
  const raid = runtime.activeRaid
  if (!raid || raid.direction !== 'defend' || raid.phase !== 'chase')
    return { state: runtime, coinsAwarded: 0 }
  const buddy = runtime.ownedBuddies.find(
    (entry) => entry.id === raid.buddyInstanceId,
  )
  const rival = findBuddyRival(raid.rivalId)
  const rescueStreak = runtime.recentRescueStreak + 1
  return {
    state: withNotice(
      {
        ...runtime,
        activeRaid: undefined,
        ownedBuddies: runtime.ownedBuddies.map((entry) =>
          entry.id === buddy?.id
            ? {
                ...entry,
                friendshipXp: entry.friendshipXp + 25,
                friendshipLevel: friendshipLevel(entry.friendshipXp + 25),
                happiness: 100,
                rescues: entry.rescues + 1,
              }
            : entry,
        ),
        recentRescueStreak: rescueStreak,
        neighbourhoodRank: Math.max(
          runtime.neighbourhoodRank,
          neighbourhoodRankForStreak(rescueStreak),
        ),
        shield: {
          phase: 'recovery',
          phaseEndsAtGameTime: now + buddyRushConfig.recoveryMs,
          lastRaiderId: raid.rivalId,
        },
        rivalMemories: updateRivalMemory(
          runtime,
          raid.rivalId,
          'defended',
          now,
        ),
      },
      'success',
      rival?.chatLines.defended ?? 'Friendship Badge saved!',
    ),
    coinsAwarded: 25,
    buddyInstanceId: buddy?.id,
  }
}

export function rescueVisitingBuddy(
  runtime: BuddyRushRuntime,
  buddyInstanceId: string,
  now: number,
): BuddyRushActionResult {
  const buddy = runtime.ownedBuddies.find(
    (entry) => entry.id === buddyInstanceId && entry.visitState,
  )
  if (!buddy?.visitState) return { state: runtime, coinsAwarded: 0 }
  const rival = findBuddyRival(buddy.visitState.hostPlayerId)
  const rescueStreak = runtime.recentRescueStreak + 1
  return {
    state: withNotice(
      {
        ...runtime,
        ownedBuddies: runtime.ownedBuddies.map((entry) =>
          entry.id === buddy.id
            ? {
                ...entry,
                visitState: null,
                rescues: entry.rescues + 1,
                friendshipXp: entry.friendshipXp + 35,
                friendshipLevel: friendshipLevel(entry.friendshipXp + 35),
                happiness: 100,
              }
            : entry,
        ),
        rescueQuest: undefined,
        recentRescueStreak: rescueStreak,
        neighbourhoodRank: Math.max(
          runtime.neighbourhoodRank,
          neighbourhoodRankForStreak(rescueStreak),
        ),
        rivalMemories: updateRivalMemory(
          runtime,
          buddy.visitState.hostPlayerId,
          'rescued',
          now,
        ),
      },
      'success',
      rival?.chatLines.rescued ?? 'Your Buddy is safely home!',
    ),
    coinsAwarded: 30,
    buddyInstanceId: buddy.id,
  }
}

export function activateBuddyRushGadget(
  runtime: BuddyRushRuntime,
  gadgetId: BuddyGadgetId,
  now: number,
) {
  const gadget = findBuddyGadget(gadgetId)
  if (
    !gadget ||
    !runtime.gadgetLoadout.includes(gadgetId) ||
    (runtime.gadgetCooldownEndsAt[gadgetId] ?? 0) > now
  )
    return runtime
  const activeRaid =
    runtime.activeRaid?.phase === 'chase'
      ? {
          ...runtime.activeRaid,
          phaseEndsAt:
            runtime.activeRaid.phaseEndsAt +
            (gadgetId === 'bubble-blaster'
              ? 6_000
              : gadgetId === 'buddy-whistle'
                ? 4_000
                : 0),
        }
      : runtime.activeRaid
  const message =
    gadgetId === 'roller-skates'
      ? 'Roller Skates activated: movement boost ready!'
      : gadgetId === 'bubble-blaster'
        ? 'Bubble popped! The rival is briefly paused.'
        : 'Buddy Whistle used: the rescue route is easier.'
  return withNotice(
    {
      ...runtime,
      activeRaid,
      boostEndsAt:
        gadgetId === 'roller-skates' ? now + 8_000 : runtime.boostEndsAt,
      rivalPauseStartedAt:
        gadgetId === 'bubble-blaster' ? now : runtime.rivalPauseStartedAt,
      rivalPausedUntil:
        gadgetId === 'bubble-blaster' ? now + 2_000 : runtime.rivalPausedUntil,
      routeHintEndsAt:
        gadgetId === 'buddy-whistle' ? now + 8_000 : runtime.routeHintEndsAt,
      whistlePullEndsAt:
        gadgetId === 'buddy-whistle' ? now + 2_500 : runtime.whistlePullEndsAt,
      gadgetCooldownEndsAt: {
        ...runtime.gadgetCooldownEndsAt,
        [gadgetId]: now + gadget.cooldownMs,
      },
    },
    'info',
    message,
  )
}

export function setBuddyRushPet(
  runtime: BuddyRushRuntime,
  slot: 'adventure' | 'guard',
  petId: BuddyPetId,
) {
  return {
    ...runtime,
    petLoadout: {
      ...runtime.petLoadout,
      [slot === 'adventure' ? 'adventurePetId' : 'guardPetId']: petId,
    },
  }
}

export function sanitizeBuddyRushRuntime(
  saved: Partial<BuddyRushRuntime> | undefined,
  now = Date.now(),
): BuddyRushRuntime {
  const initial = createInitialBuddyRush(now)
  if (!saved) return initial
  const validDefinitions = new Set(
    collectableBuddyDefinitions.map((definition) => definition.id),
  )
  const migratedBuddies = (saved.ownedBuddies ?? [])
    .filter((buddy) => validDefinitions.has(buddy.definitionId))
    .map((buddy) => ({
      ...buddy,
      ownerId: 'player' as const,
      activityStationId: buddy.activityStationId ?? null,
      visitState:
        buddy.visitState && buddy.visitState.endsAtGameTime > now
          ? buddy.visitState
          : null,
      friendshipLevel: Math.max(1, buddy.friendshipLevel || 1),
      friendshipXp: Math.max(0, buddy.friendshipXp || 0),
      happiness: Math.max(0, Math.min(100, buddy.happiness ?? 100)),
      rescues: Math.max(0, buddy.rescues ?? 0),
    }))
  const selectedFavouriteId =
    migratedBuddies.find((buddy) => buddy.isFavourite)?.id ??
    migratedBuddies[0]?.id
  const ownedBuddies = migratedBuddies.map((buddy) => ({
    ...buddy,
    isFavourite: buddy.id === selectedFavouriteId,
  }))
  const stationAssignments = new Map(
    ownedBuddies.map((buddy) => [buddy.id, buddy.activityStationId]),
  )
  const stations = initial.stations.map((station) => {
    const savedStation = saved.stations?.find(
      (entry) => entry.id === station.id,
    )
    return {
      ...station,
      level: Math.max(1, savedStation?.level ?? 1),
      assignedBuddyIds: ownedBuddies
        .filter((buddy) => stationAssignments.get(buddy.id) === station.id)
        .map((buddy) => buddy.id),
    }
  })
  let next: BuddyRushRuntime = {
    ...initial,
    ...saved,
    ownedBuddies,
    stations,
    discoveredDefinitionIds: (saved.discoveredDefinitionIds ?? []).filter(
      (id) => validDefinitions.has(id),
    ),
    discoveredStyleIds: (saved.discoveredStyleIds ?? []).filter(
      (id) => id === 'galaxy',
    ),
    visitors: (saved.visitors ?? []).filter(
      (visitor) =>
        visitor.endsAt > now && validDefinitions.has(visitor.definitionId),
    ),
    gadgetLoadout: (saved.gadgetLoadout ?? initial.gadgetLoadout).filter((id) =>
      buddyRushGadgets.some((gadget) => gadget.id === id),
    ),
    gadgetCooldownEndsAt: saved.gadgetCooldownEndsAt ?? {},
    rivalPauseStartedAt: Math.max(0, saved.rivalPauseStartedAt ?? 0),
    rivalPausedUntil: Math.max(0, saved.rivalPausedUntil ?? 0),
    routeHintEndsAt: Math.max(0, saved.routeHintEndsAt ?? 0),
    whistlePullEndsAt: Math.max(0, saved.whistlePullEndsAt ?? 0),
    petLoadout: {
      ...initial.petLoadout,
      ...saved.petLoadout,
    },
    rivalMemories: {
      ...initial.rivalMemories,
      ...saved.rivalMemories,
    },
    lastPassiveAt: Math.min(now, saved.lastPassiveAt ?? now),
    activeRaid: undefined,
    rescueQuest:
      saved.rescueQuest &&
      ownedBuddies.some(
        (buddy) =>
          buddy.id === saved.rescueQuest?.buddyInstanceId && buddy.visitState,
      )
        ? saved.rescueQuest
        : undefined,
    shield: saved.activeRaid
      ? {
          phase: 'recovery',
          phaseEndsAtGameTime: now + buddyRushConfig.recoveryMs,
          lastRaiderId: saved.activeRaid.rivalId,
        }
      : {
          ...initial.shield,
          ...saved.shield,
          phaseEndsAtGameTime: Math.max(
            now,
            saved.shield?.phaseEndsAtGameTime ?? now,
          ),
        },
  }
  if (saved.activeRaid) {
    next = withNotice(
      next,
      'info',
      'The interrupted Buddy Rush ended safely. Every Buddy is secure.',
    )
  }
  return next
}

export function buddyShieldSeconds(runtime: BuddyRushRuntime, now: number) {
  return Math.max(
    0,
    Math.ceil((runtime.shield.phaseEndsAtGameTime - now) / 1_000),
  )
}

export function buddyRaidPathProgress(runtime: BuddyRushRuntime, now: number) {
  const raid = runtime.activeRaid
  if (!raid || raid.phase !== 'chase') return 0
  const duration = Math.max(1, raid.phaseEndsAt - raid.startedAt)
  const remaining = Math.max(0, raid.phaseEndsAt - now)
  return Math.max(0, Math.min(1, 1 - remaining / duration))
}

function accruePassiveCoins(runtime: BuddyRushRuntime, now: number) {
  const elapsed = Math.max(
    0,
    Math.min(buddyRushConfig.passiveTickCapMs, now - runtime.lastPassiveAt),
  )
  if (elapsed < 1_000) return runtime
  const raw =
    runtime.passiveCoinRemainder +
    buddyOutputPerMinute(runtime) * (elapsed / 60_000)
  const whole = Math.floor(raw)
  return {
    ...runtime,
    unclaimedCoins: runtime.unclaimedCoins + whole,
    passiveCoinRemainder: raw - whole,
    lastPassiveAt: now,
  }
}

function tickBuddyBus(runtime: BuddyRushRuntime, now: number) {
  if (
    runtime.bus.offerDefinitionIds.length > 0 &&
    now >= runtime.bus.departsAt
  ) {
    return {
      ...runtime,
      bus: {
        ...runtime.bus,
        offerDefinitionIds: [],
        selectedDefinitionId: undefined,
        feedback: undefined,
      },
    }
  }
  if (
    runtime.bus.offerDefinitionIds.length === 0 &&
    now >= runtime.bus.nextArrivalAt
  ) {
    const cycle = runtime.bus.cycle + 1
    return withNotice(
      {
        ...runtime,
        bus: {
          cycle,
          arrivedAt: now,
          departsAt: now + buddyRushConfig.busVisitMs,
          nextArrivalAt: now + buddyRushConfig.busIntervalMs,
          offerDefinitionIds: buddyOffersForCycle(cycle),
        },
      },
      'info',
      'The Buddy Bus has arrived in Spawn Plaza!',
    )
  }
  return runtime
}

function createDefenceRaid(
  runtime: BuddyRushRuntime,
  now: number,
  mode: BuddyRushMode,
) {
  const buddies = eligibleBuddies(runtime)
  if (buddies.length === 0) return undefined
  const rivals = buddyRushRivals.filter(
    (rival) =>
      rival.clubhousePosition && rival.id !== runtime.shield.lastRaiderId,
  )
  const rival =
    rivals[runtime.raidSequence % rivals.length] ?? buddyRushRivals[0]
  const buddy = buddies[runtime.raidSequence % buddies.length]
  return {
    id: `ai-raid-${runtime.raidSequence}`,
    direction: 'defend' as const,
    phase: 'approach' as const,
    rivalId: rival.id,
    buddyInstanceId: buddy.id,
    buddyDefinitionId: buddy.definitionId,
    startedAt: now,
    phaseEndsAt:
      now +
      buddyRushConfig.aiApproachMs *
        (mode === 'reduced-tension' ? 1.4 : 1) *
        rivalApproachMultiplier(rival.archetype),
    routeIndex:
      Math.max(
        0,
        buddyRushRivals
          .filter((entry) => entry.clubhousePosition)
          .findIndex((entry) => entry.id === rival.id),
      ) *
        2 +
      (runtime.raidSequence % 2),
  }
}

function tickRaid(
  runtime: BuddyRushRuntime,
  now: number,
  options: BuddyRushTickOptions,
): Omit<BuddyRushTickResult, 'returnedBuddyIds'> {
  const raid = runtime.activeRaid!
  const modifiers = buddyRushModeModifiers[options.mode]
  if (
    raid.direction === 'raid' &&
    raid.phase === 'chase' &&
    options.playerPosition &&
    distance2d(options.playerPosition, playerClubhousePosition) <= 5
  ) {
    const visitor = {
      id: `visitor-${raid.id}`,
      definitionId: raid.buddyDefinitionId,
      sourceRivalId: raid.rivalId,
      startedAt: now,
      endsAt:
        now +
        Math.max(
          60_000,
          buddyRushConfig.visitorMs * modifiers.visitorMultiplier,
        ),
    }
    return {
      state: withNotice(
        {
          ...runtime,
          activeRaid: undefined,
          visitors: [...runtime.visitors, visitor],
        },
        'success',
        'Escape complete! The Buddy is visiting your clubhouse temporarily.',
      ),
      coinsAwarded: 30,
      completedPlayerRaid: true,
    }
  }
  if (raid.direction === 'raid' && raid.phase === 'capture') {
    return {
      state: runtime,
      coinsAwarded: 0,
      completedPlayerRaid: false,
    }
  }
  if (now < raid.phaseEndsAt) {
    return {
      state: runtime,
      coinsAwarded: 0,
      completedPlayerRaid: false,
    }
  }
  if (raid.direction === 'raid') {
    return {
      state: withNotice(
        { ...runtime, activeRaid: undefined },
        'info',
        'The Friendship Badge returned safely. Try a different escape route.',
      ),
      coinsAwarded: 0,
      completedPlayerRaid: false,
    }
  }
  if (raid.phase === 'approach') {
    return {
      state: {
        ...runtime,
        activeRaid: {
          ...raid,
          phase: 'capture',
          phaseEndsAt:
            now + buddyRushConfig.captureHoldMs * modifiers.captureMultiplier,
        },
      },
      coinsAwarded: 0,
      completedPlayerRaid: false,
    }
  }
  if (raid.phase === 'capture') {
    return {
      state: withNotice(
        {
          ...runtime,
          activeRaid: {
            ...raid,
            phase: 'chase',
            startedAt: now,
            phaseEndsAt:
              now +
              buddyRushConfig.chaseMs *
                modifiers.chaseMultiplier *
                trackerPetChaseMultiplier(runtime) *
                rivalChaseMultiplier(runtime, raid.rivalId),
          },
        },
        'warning',
        'Friendship Badge captured! Chase the rival and tag them.',
      ),
      coinsAwarded: 0,
      completedPlayerRaid: false,
    }
  }

  const buddy = runtime.ownedBuddies.find(
    (entry) => entry.id === raid.buddyInstanceId,
  )
  const rival = findBuddyRival(raid.rivalId)
  if (!buddy || options.mode === 'friendly') {
    return {
      state: withNotice(
        {
          ...runtime,
          activeRaid: undefined,
          shield: {
            phase: 'recovery',
            phaseEndsAtGameTime: now + buddyRushConfig.recoveryMs,
            lastRaiderId: raid.rivalId,
          },
        },
        'info',
        'Friendly tag complete. Your Buddy stayed safely at home.',
      ),
      coinsAwarded: 8,
      completedPlayerRaid: false,
    }
  }
  const visitEndsAt =
    now +
    Math.max(60_000, buddyRushConfig.visitorMs * modifiers.visitorMultiplier)
  return {
    state: withNotice(
      {
        ...runtime,
        activeRaid: undefined,
        ownedBuddies: runtime.ownedBuddies.map((entry) =>
          entry.id === buddy.id
            ? {
                ...entry,
                visitState: {
                  hostPlayerId: raid.rivalId,
                  sourcePlayerId: 'player',
                  startedAtGameTime: now,
                  endsAtGameTime: visitEndsAt,
                  rescueProgress: 0,
                },
              }
            : entry,
        ),
        rescueQuest: {
          buddyInstanceId: buddy.id,
          rivalId: raid.rivalId,
          startedAt: now,
        },
        shield: {
          phase: 'recovery',
          phaseEndsAtGameTime: now + buddyRushConfig.recoveryMs,
          lastRaiderId: raid.rivalId,
        },
        recentRescueStreak: 0,
        rivalMemories: updateRivalMemory(runtime, raid.rivalId, 'escaped', now),
      },
      'warning',
      rival?.chatLines.escaped ??
        'Your Buddy is visiting a rival clubhouse. A Rescue Quest is ready.',
    ),
    coinsAwarded: 0,
    completedPlayerRaid: false,
    escapedBuddyId: buddy.id,
  }
}

function eligibleBuddies(runtime: BuddyRushRuntime) {
  return runtime.ownedBuddies.filter(
    (buddy) => !buddy.isFavourite && !buddy.visitState,
  )
}

function updateRivalMemory(
  runtime: BuddyRushRuntime,
  rivalId: string,
  outcome: 'defended' | 'escaped' | 'rescued',
  now: number,
) {
  const memory = runtime.rivalMemories[rivalId] ?? {
    rivalId,
    targetCount: 0,
    lastTargetedAt: 0,
    lastOutcome: 'none' as const,
  }
  return {
    ...runtime.rivalMemories,
    [rivalId]: {
      ...memory,
      targetCount: memory.targetCount + 1,
      lastTargetedAt: now,
      lastOutcome: outcome,
    },
  }
}

function withNotice(
  runtime: BuddyRushRuntime,
  kind: BuddyRushNotice['kind'],
  text: string,
) {
  const sequence = runtime.eventSequence + 1
  return {
    ...runtime,
    eventSequence: sequence,
    notice: { sequence, kind, text },
  }
}

function guardPetWarningMultiplier(runtime: BuddyRushRuntime) {
  return runtime.petLoadout.guardPetId === 'guard-bot' ? 1.35 : 1
}

function trackerPetChaseMultiplier(runtime: BuddyRushRuntime) {
  return runtime.petLoadout.adventurePetId === 'tracker-pup' ? 1.2 : 1
}

function friendshipLevel(xp: number) {
  return Math.max(1, Math.min(10, 1 + Math.floor(xp / 100)))
}

function neighbourhoodRankForStreak(streak: number) {
  if (streak >= 10) return 4
  if (streak >= 6) return 3
  if (streak >= 3) return 2
  if (streak >= 1) return 1
  return 0
}

function rivalApproachMultiplier(archetype: string) {
  if (archetype === 'friendly') return 1.2
  if (archetype === 'prankster') return 0.9
  if (archetype === 'competitive') return 0.82
  return 1
}

function rivalChaseMultiplier(runtime: BuddyRushRuntime, rivalId: string) {
  const rival = findBuddyRival(rivalId)
  const personalityMultiplier =
    rival?.archetype === 'friendly'
      ? 1.18
      : rival?.archetype === 'prankster'
        ? 0.92
        : rival?.archetype === 'competitive'
          ? 0.84
          : 1
  const memory = runtime.rivalMemories[rivalId]
  const rememberedAttempts = memory?.targetCount ?? 0
  const adaptiveMultiplier =
    memory?.lastOutcome === 'escaped'
      ? 1.18
      : memory?.lastOutcome === 'defended' || memory?.lastOutcome === 'rescued'
        ? Math.max(
            0.88,
            1 -
              Math.min(5, rememberedAttempts) * 0.018 -
              Math.min(4, runtime.recentRescueStreak) * 0.012,
          )
        : 1
  return personalityMultiplier * adaptiveMultiplier
}

function distance2d(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}
