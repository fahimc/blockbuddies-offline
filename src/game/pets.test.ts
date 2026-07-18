import { describe, expect, it } from 'vitest'
import { petAccessoryModel } from './pets'

describe('pet accessory models', () => {
  it('renders puppy pets with distinct body, head, ears, legs, tail, and collar parts', () => {
    const puppy = petAccessoryModel('pet-puppy', '#22d3ee', '#f8fafc')

    expect(puppy?.id).toBe('puppy')
    expect(puppy?.parts.map((part) => part.id)).toEqual(
      expect.arrayContaining([
        'body',
        'head',
        'snout',
        'ear-left',
        'ear-right',
        'tail',
        'leg-front-left',
        'leg-back-right',
        'collar',
      ]),
    )
    expect(puppy?.parts.length).toBeGreaterThanOrEqual(12)
  })

  it('renders bot pets with screen, glowing eyes, antenna, arms, feet, and heart parts', () => {
    const bot = petAccessoryModel('pet-bot', '#22d3ee', '#f8fafc')

    expect(bot?.id).toBe('bot')
    expect(bot?.parts.map((part) => part.id)).toEqual(
      expect.arrayContaining([
        'body',
        'head',
        'screen',
        'eye-left',
        'eye-right',
        'antenna',
        'antenna-light',
        'arm-left',
        'arm-right',
        'foot-left',
        'foot-right',
        'heart',
      ]),
    )
    expect(bot?.parts.filter((part) => part.emissive).length).toBeGreaterThanOrEqual(3)
  })
})
