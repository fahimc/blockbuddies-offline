import { describe, expect, it } from 'vitest'
import { botProfiles } from '../data/botProfiles'
import type { BotRuntime } from '../game/types'
import { chooseNextState, createInitialBot, scheduleLocation, updateBot } from './botBrain'

describe('bot brain', () => {
  it('greets the player when nearby', () => {
    expect(chooseNextState('wander', true, 0.1)).toBe('greet_player')
  })

  it('uses staggered schedules', () => {
    expect(scheduleLocation(botProfiles[0], 0)).toBe(botProfiles[0].schedule[0])
    expect(scheduleLocation(botProfiles[0], 21000)).toBe(botProfiles[0].schedule[1])
  })

  it('moves independently toward a target', () => {
    const bot = createInitialBot(botProfiles[1], 1)
    const updated = updateBot({
      bot: { ...bot, state: 'go_to_location', target: [5, 0, 5], nextDecisionAt: 999999 },
      profile: botProfiles[1],
      playerPosition: [20, 0, 20],
      now: 100,
      random: () => 0.4,
    })
    expect(updated.position).not.toEqual(bot.position)
  })

  it('routes bots toward their scheduled location when the schedule changes', () => {
    const profile = botProfiles[0]
    const bot = {
      ...createInitialBot(profile, 0),
      targetLocation: profile.schedule[0],
      nextDecisionAt: 0,
    }

    const updated = updateBot({
      bot,
      profile,
      playerPosition: [100, 0, 100],
      now: 21000,
      random: () => 0.2,
    })

    expect(updated.state).toBe('go_to_location')
    expect(updated.targetLocation).toBe(profile.schedule[1])
    expect(updated.goal).toContain('Visit')
  })

  it('does not let NPCs walk through modular object or person collision', () => {
    const profile = botProfiles[0]
    const bot = {
      ...createInitialBot(profile, 0),
      state: 'go_to_location' as const,
      position: [0, 0, 0] as [number, number, number],
      target: [3, 0, 0] as [number, number, number],
      nextDecisionAt: 999999,
      action: 'run' as const,
    }
    const obstacle = {
      id: 'person:blocker',
      center: [0.85, 1.25, 0] as [number, number, number],
      half: [0.45, 1.25, 0.45] as [number, number, number],
    }

    let current: BotRuntime = bot
    for (let tick = 0; tick < 40; tick += 1) {
      current = updateBot({
        bot: current,
        profile,
        playerPosition: [20, 0, 20],
        now: tick,
        random: () => 0.4,
        obstacles: [obstacle],
      })
    }

    expect(current.position[0]).toBeLessThan(0.05)
  })
})
