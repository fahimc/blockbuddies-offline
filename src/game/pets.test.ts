import { describe, expect, it } from 'vitest'
import { petAccessoryIds, petAccessoryModel } from './pets'

describe('pet accessory models', () => {
  it('renders every catalog pet as a detailed block model', () => {
    petAccessoryIds.forEach((petId) => {
      const model = petAccessoryModel(petId, '#22d3ee', '#f8fafc')
      const partIds = model?.parts.map((part) => part.id) ?? []

      expect(model?.id).toBe(petId)
      expect(partIds).toEqual(expect.arrayContaining(['body', 'head']))
      expect(partIds.some((id) => id.startsWith('eye'))).toBe(true)
      expect(model?.parts.length).toBeGreaterThanOrEqual(12)
    })
  })

  it('renders animal-specific parts for the full reference pet set', () => {
    const expectedParts: Record<string, string[]> = {
      'pet-puppy': ['snout', 'ear-left', 'ear-right', 'tail', 'collar', 'tag'],
      'pet-kitten': ['whisker-left-top', 'whisker-right-low', 'tail', 'collar'],
      'pet-bunny': ['ear-inner-left', 'ear-inner-right', 'tail', 'paw-left'],
      'pet-panda': ['eye-patch-left', 'eye-patch-right', 'bamboo-stem'],
      'pet-fox': ['tail-tip', 'bandana', 'ear-left'],
      'pet-duck': ['bill', 'wing-left', 'wing-right', 'foot-left'],
      'pet-pig': ['snout', 'nostril-left', 'nostril-right', 'tail-curl'],
      'pet-monkey': ['face-patch', 'ear-left', 'tail-curl'],
      'pet-dragon': ['horn-left', 'horn-right', 'wing-left', 'tooth-left'],
      'pet-dino': ['back-spike-1', 'back-spike-3', 'tooth-right'],
      'pet-unicorn': ['horn', 'mane-purple', 'mane-cyan', 'tail-purple'],
      'pet-bot': ['screen', 'antenna', 'antenna-light', 'heart'],
    }

    Object.entries(expectedParts).forEach(([petId, requiredParts]) => {
      const model = petAccessoryModel(petId, '#22d3ee', '#f8fafc')
      expect(model?.parts.map((part) => part.id)).toEqual(
        expect.arrayContaining(requiredParts),
      )
    })
  })

  it('keeps bot pets visibly powered with emissive screen details', () => {
    const bot = petAccessoryModel('pet-bot', '#22d3ee', '#f8fafc')

    expect(
      bot?.parts.filter((part) => part.emissive).length,
    ).toBeGreaterThanOrEqual(3)
  })
})
