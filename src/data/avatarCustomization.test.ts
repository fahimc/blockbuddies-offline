import { describe, expect, it } from 'vitest'
import { petAccessoryIds } from '../game/pets'
import { accessoryItems } from './avatarCustomization'

describe('avatar customization pet catalog', () => {
  it('offers every blocky reference pet in the pets catalog', () => {
    const selectablePetIds = accessoryItems.flatMap((item) => {
      const id = item.patch.accessory
      return typeof id === 'string' && id.startsWith('pet-') ? [id] : []
    })

    expect(selectablePetIds).toEqual(
      expect.arrayContaining([...petAccessoryIds]),
    )
    expect(new Set(selectablePetIds).size).toBe(petAccessoryIds.length)
  })

  it('keeps each pet buyable and equippable through the same shop item id', () => {
    petAccessoryIds.forEach((petId) => {
      const item = accessoryItems.find((candidate) => candidate.id === petId)

      expect(item).toBeDefined()
      expect(item?.kind).toBe('accessory')
      expect(item?.shopItemId).toBe(petId)
      expect(item?.patch.accessory).toBe(petId)
      expect(item?.cost).toBeGreaterThanOrEqual(0)
    })
  })
})
