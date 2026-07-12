import { describe, expect, it } from 'vitest'
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
})
