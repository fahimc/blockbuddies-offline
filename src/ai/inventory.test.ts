import { describe, expect, it } from 'vitest'
import { clothingItems } from '../data/avatarCustomization'
import { shopItems } from '../data/shopItems'
import { defaultAvatar } from '../state/gameStore'
import { applyItem, purchaseItem } from './inventory'

describe('inventory', () => {
  it('prevents negative coin purchases', () => {
    const result = purchaseItem(1, [], shopItems[0])
    expect(result.purchased).toBe(false)
    expect(result.coins).toBe(1)
  })

  it('unlocks and applies a shirt', () => {
    const result = purchaseItem(100, [], shopItems[0])
    expect(result.purchased).toBe(true)
    expect(applyItem(defaultAvatar, shopItems[0]).shirtColor).toBe(shopItems[0].color)
  })

  it('applies the complete Shadow Oracle outfit patch', () => {
    const outfit = shopItems.find((item) => item.id === 'outfit-shadow-oracle')
    expect(outfit).toBeDefined()

    const avatar = applyItem(defaultAvatar, outfit!)
    expect(avatar.avatarSource).toBe('Shadow Oracle Outfit')
    expect(avatar.hairStyle).toBe('long')
    expect(avatar.face).toBe('smile')
    expect(avatar.topStyle).toBe('outfit-shadow-oracle')
    expect(avatar.outfitStyle).toBe('jacket')
    expect(avatar.bottomStyle).toBe('skirt')
    expect(avatar.shoeStyle).toBe('boots')
    expect(avatar.shoeColor).toBe('#6d28d9')
    expect(avatar.accessory).toBe('none')
  })

  it('offers the complete Shadow Oracle set in clothing customization', () => {
    const shopOutfit = shopItems.find(
      (item) => item.id === 'outfit-shadow-oracle',
    )
    const customizationOutfit = clothingItems.find(
      (item) => item.id === 'outfit-shadow-oracle',
    )

    expect(customizationOutfit).toMatchObject({
      name: 'Shadow Oracle Outfit',
      kind: 'top',
      cost: 260,
      shopItemId: 'outfit-shadow-oracle',
    })
    expect(customizationOutfit?.patch).toEqual(shopOutfit?.avatarPatch)
  })

  it('equips the hovering void orb in the accessory slot', () => {
    const pet = shopItems.find((item) => item.id === 'pet-void-orb')
    expect(pet).toBeDefined()
    expect(applyItem(defaultAvatar, pet!).accessory).toBe('pet-void-orb')
  })
})
