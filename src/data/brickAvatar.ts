import type {
  AvatarBottomStyle,
  AvatarFaceStyle,
  AvatarHairStyle,
  AvatarOutfitStyle,
  AvatarSettings,
  AvatarShoeStyle,
} from '../game/types'

type UnknownRecord = Record<string, unknown>

export type BrickAvatarPreset = {
  name: string
  skinColor: string
  hairStyle: AvatarHairStyle
  hairColor: string
  faceStyle: AvatarFaceStyle
  outfitStyle: AvatarOutfitStyle
  primaryColor: string
  secondaryColor: string
  bottomStyle: AvatarBottomStyle
  bottomColor: string
  shoeStyle: AvatarShoeStyle
  shoeColor: string
}

export const brickSkinTones = [
  '#f8d6c2',
  '#efc09e',
  '#d99b70',
  '#bf7a50',
  '#9a5e3a',
  '#77452d',
  '#523021',
  '#2f1b16',
  '#f1c7a5',
  '#c98664',
  '#8e5c45',
  '#5d3d31',
  '#d8a07c',
  '#a46d51',
]

export const brickHairStyles: { id: AvatarHairStyle; name: string }[] = [
  { id: 'short', name: 'Short' },
  { id: 'spiky', name: 'Spiky' },
  { id: 'bob', name: 'Bob' },
  { id: 'long', name: 'Long' },
  { id: 'curls', name: 'Curls' },
  { id: 'mohawk', name: 'Mohawk' },
  { id: 'beanie', name: 'Beanie' },
  { id: 'none', name: 'None' },
]

export const brickFaceStyles: { id: AvatarFaceStyle; name: string }[] = [
  { id: 'smile', name: 'Smile' },
  { id: 'happy', name: 'Happy' },
  { id: 'wink', name: 'Wink' },
  { id: 'cool', name: 'Cool' },
  { id: 'sleepy', name: 'Sleepy' },
  { id: 'surprised', name: 'Wow' },
  { id: 'robot', name: 'Robot' },
  { id: 'plain', name: 'Plain' },
]

export const brickOutfitStyles: { id: AvatarOutfitStyle; name: string }[] = [
  { id: 'hoodie', name: 'Hoodie' },
  { id: 'tee', name: 'Tee' },
  { id: 'jacket', name: 'Jacket' },
  { id: 'suit', name: 'Suit' },
  { id: 'sport', name: 'Sport' },
  { id: 'armour', name: 'Armour' },
  { id: 'hero-suit', name: 'Hero' },
  { id: 'hero-armour', name: 'Hero Armour' },
  { id: 'hero-cape', name: 'Cape Suit' },
  { id: 'pajamas', name: 'PJs' },
  { id: 'tank', name: 'Tank' },
  { id: 'none', name: 'None' },
]

export const brickBottomStyles: { id: AvatarBottomStyle; name: string }[] = [
  { id: 'jeans', name: 'Jeans' },
  { id: 'shorts', name: 'Shorts' },
  { id: 'joggers', name: 'Joggers' },
  { id: 'cargo', name: 'Cargo' },
  { id: 'skirt', name: 'Skirt' },
  { id: 'leggings', name: 'Leggings' },
  { id: 'none', name: 'None' },
]

export const brickShoeStyles: { id: AvatarShoeStyle; name: string }[] = [
  { id: 'sneakers', name: 'Sneakers' },
  { id: 'boots', name: 'Boots' },
  { id: 'highTops', name: 'High Tops' },
  { id: 'sandals', name: 'Sandals' },
  { id: 'none', name: 'None' },
]

export const brickAvatarPresets: BrickAvatarPreset[] = [
  {
    name: 'London Explorer',
    skinColor: '#efc09e',
    hairStyle: 'spiky',
    hairColor: '#5a2f16',
    faceStyle: 'happy',
    outfitStyle: 'hoodie',
    primaryColor: '#0b74ff',
    secondaryColor: '#ffffff',
    bottomStyle: 'jeans',
    bottomColor: '#111827',
    shoeStyle: 'sneakers',
    shoeColor: '#f8fafc',
  },
  {
    name: 'City Runner',
    skinColor: '#bf7a50',
    hairStyle: 'short',
    hairColor: '#1f140f',
    faceStyle: 'wink',
    outfitStyle: 'sport',
    primaryColor: '#14b8a6',
    secondaryColor: '#f8fafc',
    bottomStyle: 'joggers',
    bottomColor: '#1f2937',
    shoeStyle: 'highTops',
    shoeColor: '#e5e7eb',
  },
  {
    name: 'Royal Guard',
    skinColor: '#d99b70',
    hairStyle: 'beanie',
    hairColor: '#111827',
    faceStyle: 'plain',
    outfitStyle: 'jacket',
    primaryColor: '#dc2626',
    secondaryColor: '#facc15',
    bottomStyle: 'cargo',
    bottomColor: '#111827',
    shoeStyle: 'boots',
    shoeColor: '#1f2937',
  },
  {
    name: 'Neon Tourist',
    skinColor: '#f1c7a5',
    hairStyle: 'bob',
    hairColor: '#7c3aed',
    faceStyle: 'cool',
    outfitStyle: 'tee',
    primaryColor: '#ec4899',
    secondaryColor: '#22d3ee',
    bottomStyle: 'shorts',
    bottomColor: '#2563eb',
    shoeStyle: 'sneakers',
    shoeColor: '#fef3c7',
  },
  {
    name: 'Park Day',
    skinColor: '#c98664',
    hairStyle: 'long',
    hairColor: '#6b3a1d',
    faceStyle: 'smile',
    outfitStyle: 'tank',
    primaryColor: '#22c55e',
    secondaryColor: '#f8fafc',
    bottomStyle: 'leggings',
    bottomColor: '#334155',
    shoeStyle: 'sandals',
    shoeColor: '#a16207',
  },
  {
    name: 'Night Builder',
    skinColor: '#9a5e3a',
    hairStyle: 'mohawk',
    hairColor: '#111827',
    faceStyle: 'robot',
    outfitStyle: 'armour',
    primaryColor: '#475569',
    secondaryColor: '#38bdf8',
    bottomStyle: 'cargo',
    bottomColor: '#0f172a',
    shoeStyle: 'boots',
    shoeColor: '#64748b',
  },
]

export function presetToAvatar(preset: BrickAvatarPreset): Partial<AvatarSettings> {
  return {
    bodyColor: preset.skinColor,
    shirtColor: preset.primaryColor,
    hairColor: preset.hairColor,
    hairStyle: preset.hairStyle,
    face: preset.faceStyle,
    eyeColor: preset.faceStyle === 'robot' ? preset.secondaryColor : '#111827',
    accentColor: preset.secondaryColor,
    secondaryColor: preset.secondaryColor,
    pantsColor: preset.bottomColor,
    outfitStyle: preset.outfitStyle,
    bottomStyle: preset.bottomStyle,
    shoeStyle: preset.shoeStyle,
    shoeColor: preset.shoeColor,
    avatarSource: preset.name,
  }
}

export function mapBlockSkinProject(project: unknown): { name?: string; avatar: Partial<AvatarSettings> } {
  const root = isRecord(project) ? project : {}
  const settings = isRecord(root.settings) ? root.settings : root
  const maybeAvatar = isRecord(root.avatar) ? root.avatar : {}
  const sourceName = firstString(root.name, maybeAvatar.name, settings.name, settings.title)

  const primaryColor = firstHex(settings.primaryColor, settings.shirtColor, settings.topColor, maybeAvatar.primaryColor)
  const secondaryColor = firstHex(settings.secondaryColor, settings.accentColor, maybeAvatar.secondaryColor)
  const bodyColor = firstHex(settings.currentSkin, settings.skinColor, settings.bodyColor, maybeAvatar.skinColor)
  const hairColor = firstHex(settings.hairColor, maybeAvatar.hairColor)
  const bottomColor = firstHex(settings.bottomColor, settings.pantsColor, maybeAvatar.bottomColor)
  const shoeColor = firstHex(settings.shoeColor, maybeAvatar.shoeColor)

  return {
    name: sourceName,
    avatar: {
      ...(bodyColor ? { bodyColor } : {}),
      ...(primaryColor ? { shirtColor: primaryColor } : {}),
      ...(hairColor ? { hairColor } : {}),
      ...(secondaryColor ? { accentColor: secondaryColor, secondaryColor } : {}),
      ...(bottomColor ? { pantsColor: bottomColor } : {}),
      ...(shoeColor ? { shoeColor } : {}),
      hairStyle: parseHairStyle(firstString(settings.hairStyle, maybeAvatar.hairStyle)),
      face: parseFaceStyle(firstString(settings.faceStyle, settings.face, maybeAvatar.faceStyle)),
      outfitStyle: parseOutfitStyle(firstString(settings.outfitStyle, settings.topStyle, maybeAvatar.outfitStyle)),
      bottomStyle: parseBottomStyle(firstString(settings.bottomStyle, settings.pantsStyle, maybeAvatar.bottomStyle)),
      shoeStyle: parseShoeStyle(firstString(settings.shoeStyle, maybeAvatar.shoeStyle)),
      avatarSource: sourceName ?? 'Imported Brick Borough skin',
    },
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim()
}

function firstHex(...values: unknown[]): string | undefined {
  const value = firstString(...values)
  if (!value) return undefined
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : undefined
}

function parseHairStyle(value: string | undefined): AvatarHairStyle {
  const normalized = normalizeStyle(value)
  if (normalized === 'curly') return 'curls'
  if (normalized === 'side') return 'short'
  if (normalized === 'none') return 'none'
  return findId(brickHairStyles, normalized) ?? 'spiky'
}

function parseFaceStyle(value: string | undefined): AvatarFaceStyle {
  const normalized = normalizeStyle(value)
  if (normalized === 'wow') return 'surprised'
  return findId(brickFaceStyles, normalized) ?? 'smile'
}

function parseOutfitStyle(value: string | undefined): AvatarOutfitStyle {
  const normalized = normalizeStyle(value).replace(/^top/, '')
  if (normalized.includes('hoodie')) return 'hoodie'
  if (normalized.includes('raglan') || normalized.includes('startee') || normalized.includes('shirt')) return 'tee'
  return findId(brickOutfitStyles, normalized) ?? 'hoodie'
}

function parseBottomStyle(value: string | undefined): AvatarBottomStyle {
  const normalized = normalizeStyle(value)
  if (normalized.includes('pants')) return 'jeans'
  return findId(brickBottomStyles, normalized) ?? 'jeans'
}

function parseShoeStyle(value: string | undefined): AvatarShoeStyle {
  const normalized = normalizeStyle(value)
  return findId(brickShoeStyles, normalized) ?? 'sneakers'
}

function normalizeStyle(value: string | undefined) {
  return (value ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function findId<T extends { id: string }>(items: T[], id: string): T['id'] | undefined {
  return items.find((item) => item.id.toLowerCase() === id)?.id
}
