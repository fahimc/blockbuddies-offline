import { describe, expect, it } from 'vitest'
import { botProfiles } from '../data/botProfiles'
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
})
