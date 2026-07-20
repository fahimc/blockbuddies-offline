import type { AvatarSettings, ShopItem, ShopItemId } from '../game/types'

export function purchaseItem(
  coins: number,
  unlocked: ShopItemId[],
  item: ShopItem,
): { coins: number; unlocked: ShopItemId[]; purchased: boolean } {
  if (unlocked.includes(item.id)) return { coins, unlocked, purchased: false }
  if (coins < item.cost) return { coins, unlocked, purchased: false }
  return { coins: coins - item.cost, unlocked: [...unlocked, item.id], purchased: true }
}

export function applyItem(avatar: AvatarSettings, item: ShopItem): AvatarSettings {
  if (item.avatarPatch) return { ...avatar, ...item.avatarPatch }
  if (item.category === 'body' && item.color) return { ...avatar, bodyColor: item.color }
  if (item.category === 'shirt' && item.color) return { ...avatar, shirtColor: item.color }
  if (item.category === 'pants' && item.color) return { ...avatar, pantsColor: item.color }
  if (item.category === 'hat') return { ...avatar, hat: item.id }
  if (item.category === 'accessory' || item.category === 'pet') {
    return { ...avatar, accessory: item.id }
  }
  if (item.category === 'trail') return { ...avatar, trail: item.id }
  return avatar
}
