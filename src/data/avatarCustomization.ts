import type { AvatarSettings, PlayerEmote, ShopItemId } from '../game/types'

export type CustomizationStepId = 'hub' | 'body' | 'clothing' | 'accessories' | 'emotes' | 'trails'
export type CustomizationAssetKind = 'skin' | 'hair' | 'face' | 'top' | 'pants' | 'hat' | 'accessory' | 'emote' | 'trail'

export type CustomizationItem = {
  id: string
  name: string
  kind: CustomizationAssetKind
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  cost: number
  color?: string
  accent?: string
  shopItemId?: ShopItemId
  emote?: PlayerEmote
  patch: Partial<AvatarSettings>
}

export const customizationSteps: { id: CustomizationStepId; title: string; cta: string; note: string }[] = [
  { id: 'hub', title: 'Customization Hub', cta: 'Customize', note: 'Pick your style. Show off who you are!' },
  { id: 'body', title: 'Body & Style', cta: 'Continue', note: 'Shape your look. Make it yours!' },
  { id: 'clothing', title: 'Clothing', cta: 'Next', note: 'Choose your look and get ready to build!' },
  { id: 'accessories', title: 'Hats & Accessories', cta: 'Continue', note: 'Mix, match, and stand out!' },
  { id: 'emotes', title: 'Emotes & Animations', cta: 'Next: Trails', note: 'Almost there! Pick your favorite moves.' },
  { id: 'trails', title: 'Trails & Effects', cta: 'Finish', note: 'Leave a little sparkle wherever you go.' },
]

export const skinTones = ['#f7c48a', '#e9a76f', '#d38b50', '#b8733b', '#7c3f1d']
export const hairColors = ['#5a2f16', '#6b3a1d', '#222222', '#f3c34f', '#a8411f']
export const eyeColors = ['#111827', '#6b2f12', '#1455b8', '#36a936', '#8b2bd8']
export const accentColors = ['#0b74ff', '#e11d1d', '#2eb82e', '#f59e0b', '#8b2bd8']

export const hairStyles = [
  { id: 'spiky', name: 'Spiky', patch: { hairStyle: 'spiky' as const } },
  { id: 'side', name: 'Side', patch: { hairStyle: 'side' as const } },
  { id: 'curly', name: 'Curly', patch: { hairStyle: 'curly' as const } },
  { id: 'long', name: 'Long', patch: { hairStyle: 'long' as const } },
  { id: 'flat', name: 'Flat', patch: { hairStyle: 'flat' as const } },
]

export const faceStyles = [
  { id: 'smile', name: 'Smile', patch: { face: 'smile' as const } },
  { id: 'happy', name: 'Happy', patch: { face: 'happy' as const } },
  { id: 'wink', name: 'Wink', patch: { face: 'wink' as const } },
  { id: 'wow', name: 'Wow', patch: { face: 'wow' as const } },
  { id: 'cool', name: 'Cool', patch: { face: 'cool' as const, accessory: 'visor-neon' as const } },
]

export const clothingItems: CustomizationItem[] = [
  { id: 'top-blue-hoodie', name: 'Blue Hoodie', kind: 'top', rarity: 'Common', cost: 100, color: '#0b74ff', shopItemId: 'top-blue-hoodie', patch: { shirtColor: '#0b74ff', topStyle: 'top-blue-hoodie' } },
  { id: 'top-green-hoodie', name: 'Green Hoodie', kind: 'top', rarity: 'Common', cost: 100, color: '#168a2d', shopItemId: 'top-green-hoodie', patch: { shirtColor: '#168a2d', topStyle: 'top-green-hoodie' } },
  { id: 'top-red-hoodie', name: 'Red Hoodie', kind: 'top', rarity: 'Rare', cost: 150, color: '#dc2626', shopItemId: 'top-red-hoodie', patch: { shirtColor: '#dc2626', topStyle: 'top-red-hoodie' } },
  { id: 'top-fire-hoodie', name: 'Fire Hoodie', kind: 'top', rarity: 'Epic', cost: 200, color: '#111827', accent: '#f97316', shopItemId: 'top-fire-hoodie', patch: { shirtColor: '#111827', accentColor: '#f97316', topStyle: 'top-fire-hoodie' } },
  { id: 'top-yellow-hoodie', name: 'Sunny Hoodie', kind: 'top', rarity: 'Rare', cost: 150, color: '#facc15', shopItemId: 'top-yellow-hoodie', patch: { shirtColor: '#facc15', topStyle: 'top-yellow-hoodie' } },
  { id: 'top-raglan', name: 'Raglan Tee', kind: 'top', rarity: 'Common', cost: 100, color: '#f8fafc', accent: '#111827', shopItemId: 'top-raglan', patch: { shirtColor: '#f8fafc', accentColor: '#111827', topStyle: 'top-raglan' } },
  { id: 'top-star-tee', name: 'Star Tee', kind: 'top', rarity: 'Rare', cost: 150, color: '#14b8a6', accent: '#ffffff', shopItemId: 'top-star-tee', patch: { shirtColor: '#14b8a6', accentColor: '#ffffff', topStyle: 'top-star-tee' } },
  { id: 'top-purple-hoodie', name: 'Galaxy Hoodie', kind: 'top', rarity: 'Epic', cost: 200, color: '#7c3aed', shopItemId: 'top-purple-hoodie', patch: { shirtColor: '#7c3aed', topStyle: 'top-purple-hoodie' } },
  { id: 'top-stripe-shirt', name: 'Stripe Shirt', kind: 'top', rarity: 'Rare', cost: 150, color: '#e0f2fe', accent: '#2563eb', shopItemId: 'top-stripe-shirt', patch: { shirtColor: '#e0f2fe', accentColor: '#2563eb', topStyle: 'top-stripe-shirt' } },
  { id: 'top-orange-hoodie', name: 'Orange Hoodie', kind: 'top', rarity: 'Epic', cost: 250, color: '#f97316', shopItemId: 'top-orange-hoodie', patch: { shirtColor: '#f97316', topStyle: 'top-orange-hoodie' } },
]

export const pantsItems: CustomizationItem[] = [
  { id: 'pants-black', name: 'Black Pants', kind: 'pants', rarity: 'Common', cost: 80, color: '#111827', shopItemId: 'pants-black', patch: { pantsColor: '#111827' } },
  { id: 'pants-blue', name: 'Blue Jeans', kind: 'pants', rarity: 'Common', cost: 80, color: '#1d4ed8', shopItemId: 'pants-blue', patch: { pantsColor: '#1d4ed8' } },
  { id: 'shoes-white', name: 'Fresh Shoes', kind: 'pants', rarity: 'Rare', cost: 120, color: '#f8fafc', shopItemId: 'shoes-white', patch: { pantsColor: '#111827' } },
]

export const accessoryItems: CustomizationItem[] = [
  { id: 'hat-red-cap', name: 'Red Cap', kind: 'hat', rarity: 'Common', cost: 0, color: '#ef4444', shopItemId: 'hat-red-cap', patch: { hat: 'hat-red-cap' } },
  { id: 'hat-blue-beanie', name: 'Blue Beanie', kind: 'hat', rarity: 'Common', cost: 80, color: '#2563eb', shopItemId: 'hat-blue-beanie', patch: { hat: 'hat-blue-beanie' } },
  { id: 'glasses-star', name: 'Star Shades', kind: 'accessory', rarity: 'Rare', cost: 120, color: '#facc15', shopItemId: 'glasses-star', patch: { accessory: 'glasses-star' } },
  { id: 'headphones-blue', name: 'Headphones', kind: 'accessory', rarity: 'Rare', cost: 150, color: '#1f2937', accent: '#38bdf8', shopItemId: 'headphones-blue', patch: { accessory: 'headphones-blue' } },
  { id: 'backpack-blue', name: 'Blue Pack', kind: 'accessory', rarity: 'Rare', cost: 180, color: '#2563eb', shopItemId: 'backpack-blue', patch: { accessory: 'backpack-blue' } },
  { id: 'pet-bot', name: 'Mini Bot', kind: 'accessory', rarity: 'Epic', cost: 220, color: '#e5e7eb', accent: '#22d3ee', shopItemId: 'pet-bot', patch: { accessory: 'pet-bot' } },
  { id: 'wings-night', name: 'Bat Wings', kind: 'accessory', rarity: 'Epic', cost: 300, color: '#4c1d95', shopItemId: 'wings-night', patch: { accessory: 'wings-night' } },
  { id: 'halo-gold', name: 'Halo', kind: 'accessory', rarity: 'Epic', cost: 300, color: '#facc15', shopItemId: 'halo-gold', patch: { accessory: 'halo-gold' } },
  { id: 'pet-puppy', name: 'Puppy Pal', kind: 'accessory', rarity: 'Epic', cost: 220, color: '#d97706', shopItemId: 'pet-puppy', patch: { accessory: 'pet-puppy' } },
  { id: 'visor-neon', name: 'Neon Visor', kind: 'accessory', rarity: 'Epic', cost: 220, color: '#111827', accent: '#d946ef', shopItemId: 'visor-neon', patch: { accessory: 'visor-neon' } },
  { id: 'rocket-trail', name: 'Rocket', kind: 'accessory', rarity: 'Legendary', cost: 500, color: '#ef4444', accent: '#38bdf8', shopItemId: 'rocket-trail', patch: { accessory: 'rocket-trail' } },
  { id: 'wing-pack', name: 'Wing Pack', kind: 'accessory', rarity: 'Legendary', cost: 500, color: '#64748b', accent: '#38bdf8', shopItemId: 'wing-pack', patch: { accessory: 'wing-pack' } },
]

export const emoteItems: CustomizationItem[] = [
  { id: 'wave', name: 'Wave', kind: 'emote', rarity: 'Common', cost: 0, emote: 'wave', patch: {} },
  { id: 'dance', name: 'Dance', kind: 'emote', rarity: 'Rare', cost: 200, emote: 'dance', patch: {} },
  { id: 'cheer', name: 'Cheer', kind: 'emote', rarity: 'Rare', cost: 250, emote: 'cheer', patch: {} },
  { id: 'sit', name: 'Sit', kind: 'emote', rarity: 'Common', cost: 150, emote: 'sit', patch: {} },
  { id: 'jump-pose', name: 'Jump Pose', kind: 'emote', rarity: 'Rare', cost: 200, emote: 'cheer', patch: {} },
  { id: 'thumbs-up', name: 'Thumbs Up', kind: 'emote', rarity: 'Common', cost: 150, emote: 'wave', patch: {} },
  { id: 'point', name: 'Point', kind: 'emote', rarity: 'Common', cost: 150, emote: 'wave', patch: {} },
  { id: 'salute', name: 'Salute', kind: 'emote', rarity: 'Rare', cost: 200, emote: 'wave', patch: {} },
  { id: 'laugh', name: 'Laugh', kind: 'emote', rarity: 'Rare', cost: 200, emote: 'cheer', patch: {} },
]

export const trailItems: CustomizationItem[] = [
  { id: 'trail-rainbow', name: 'Rainbow Trail', kind: 'trail', rarity: 'Rare', cost: 180, color: '#22c55e', accent: '#d946ef', shopItemId: 'trail-rainbow', patch: { trail: 'trail-rainbow' } },
  { id: 'trail-neon', name: 'Neon Trail', kind: 'trail', rarity: 'Rare', cost: 200, color: '#22d3ee', accent: '#f0abfc', shopItemId: 'trail-neon', patch: { trail: 'trail-neon' } },
  { id: 'trail-galaxy', name: 'Galaxy Trail', kind: 'trail', rarity: 'Epic', cost: 250, color: '#7c3aed', accent: '#facc15', shopItemId: 'trail-galaxy', patch: { trail: 'trail-galaxy' } },
  { id: 'trail-stars', name: 'Star Trail', kind: 'trail', rarity: 'Legendary', cost: 300, color: '#facc15', accent: '#ffffff', shopItemId: 'trail-stars', patch: { trail: 'trail-stars' } },
  { id: 'trail-spark', name: 'Spark Trail', kind: 'trail', rarity: 'Common', cost: 90, color: '#f0abfc', accent: '#fde047', shopItemId: 'trail-spark', patch: { trail: 'trail-spark' } },
]

export const allCustomizationItems = [...clothingItems, ...pantsItems, ...accessoryItems, ...emoteItems, ...trailItems]
