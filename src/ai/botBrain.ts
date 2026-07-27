import type { BotProfile, BotRuntime, BotState, LocationId, Vec3 } from '../game/types'
import { distance2d, getLocation } from '../data/world'
import {
  resolveHorizontalCollision,
  separateCircleFromBoxes,
  type CollisionBox,
} from '../game/collision'

export type BotTickInput = {
  bot: BotRuntime
  profile: BotProfile
  playerPosition: Vec3
  now: number
  random: () => number
  obstacles?: CollisionBox[]
}

const stateOrder: BotState[] = [
  'idle',
  'wander',
  'go_to_location',
  'greet_player',
  'do_activity',
  'leave_area',
]

export function createInitialBot(profile: BotProfile, index: number): BotRuntime {
  const location = getLocation(profile.schedule[index % profile.schedule.length])
  const offset = index * 0.75
  return {
    id: profile.id,
    state: 'idle',
    position: [location.position[0] + offset, 0, location.position[2] - offset],
    target: location.position,
    targetLocation: location.id,
    mood: profile.mood,
    goal: `Visit ${location.label}`,
    action: 'idle',
    nextDecisionAt: 900 + index * 450,
    speechUntil: 0,
  }
}

export function chooseNextState(
  current: BotState,
  nearPlayer: boolean,
  randomValue: number,
): BotState {
  if (nearPlayer && current !== 'greet_player') return 'greet_player'
  if (current === 'greet_player') return randomValue > 0.55 ? 'do_activity' : 'wander'
  if (current === 'do_activity') return randomValue > 0.5 ? 'leave_area' : 'idle'
  if (current === 'leave_area') return 'go_to_location'
  const nextIndex = Math.floor(randomValue * stateOrder.length) % stateOrder.length
  return stateOrder[nextIndex] === 'greet_player' ? 'wander' : stateOrder[nextIndex]
}

export function scheduleLocation(profile: BotProfile, now: number): LocationId {
  const slot = Math.floor(now / 20000) % profile.schedule.length
  return profile.schedule[slot]
}

function moveToward(position: Vec3, target: Vec3, speed: number): Vec3 {
  const dx = target[0] - position[0]
  const dz = target[2] - position[2]
  const distance = Math.hypot(dx, dz)
  if (distance < 0.05) return [target[0], 0, target[2]]
  const step = Math.min(speed, distance)
  return [position[0] + (dx / distance) * step, 0, position[2] + (dz / distance) * step]
}

export function updateBot(input: BotTickInput): BotRuntime {
  const { bot, profile, playerPosition, now, random, obstacles = [] } = input
  const nearPlayer = distance2d(bot.position, playerPosition) < 3.2
  let next = { ...bot }
  const scheduledLocationId = scheduleLocation(profile, now)
  const scheduledLocation = getLocation(scheduledLocationId)
  const distanceToScheduled = distance2d(bot.position, scheduledLocation.position)

  if (now >= bot.nextDecisionAt) {
    const routeState: BotState =
      !nearPlayer && (bot.targetLocation !== scheduledLocationId || distanceToScheduled > 1.2)
        ? 'go_to_location'
        : !nearPlayer && distanceToScheduled <= 1.2
          ? 'do_activity'
          : chooseNextState(bot.state, nearPlayer, random())
    const state = routeState
    const locationId = state === 'go_to_location' || state === 'do_activity' ? scheduledLocationId : bot.targetLocation
    const location = getLocation(locationId)
    const wobble = () => (random() - 0.5) * 4
    const activityActions: BotRuntime['action'][] =
      locationId === 'obby'
        ? ['jump', 'cheer']
        : locationId === 'park'
          ? ['walk', 'wave']
          : locationId === 'school'
            ? ['idle', 'wave']
            : locationId === 'parking'
              ? ['run', 'cheer']
              : ['cheer', 'wave', 'idle']
    next = {
      ...next,
      state,
      targetLocation: locationId,
      target:
        state === 'wander'
          ? [bot.position[0] + wobble(), 0, bot.position[2] + wobble()]
          : location.position,
      action:
        state === 'greet_player'
          ? 'wave'
          : state === 'do_activity'
            ? activityActions[Math.floor(random() * activityActions.length)] ?? 'cheer'
            : state === 'go_to_location'
              ? 'run'
              : state === 'wander'
                ? 'walk'
                : 'idle',
      goal:
        state === 'greet_player'
          ? 'Say hello'
          : state === 'do_activity'
            ? `Play at ${getLocation(bot.targetLocation).label}`
            : `Visit ${location.label}`,
      nextDecisionAt: now + 2500 + Math.floor(random() * 4500),
    }
  }

  const speed = next.action === 'run' ? 0.055 : next.action === 'walk' ? 0.032 : 0.014
  if (['wander', 'go_to_location', 'leave_area'].includes(next.state)) {
    const collisionRadius = 0.38
    const separated = separateCircleFromBoxes(
      next.position,
      obstacles,
      collisionRadius,
    )
    next.position = resolveHorizontalCollision(
      separated,
      moveToward(separated, next.target, speed),
      obstacles,
      collisionRadius,
    )
  }

  return next
}
