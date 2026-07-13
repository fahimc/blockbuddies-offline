import { describe, expect, it } from 'vitest'
import { brickAvatarPresets, mapBlockSkinProject, presetToAvatar } from './brickAvatar'

describe('brick avatar mapping', () => {
  it('maps a preset into BlockBuddies avatar settings', () => {
    const avatar = presetToAvatar(brickAvatarPresets[0])

    expect(avatar.outfitStyle).toBe('hoodie')
    expect(avatar.bottomStyle).toBe('jeans')
    expect(avatar.shoeStyle).toBe('sneakers')
    expect(avatar.avatarSource).toBe('London Explorer')
  })

  it('maps Brick Borough skin JSON settings into local avatar settings', () => {
    const imported = mapBlockSkinProject({
      name: 'Neon Tester',
      settings: {
        currentSkin: '#f8d6c2',
        hairStyle: 'mohawk',
        hairColor: '#111827',
        faceStyle: 'robot',
        outfitStyle: 'sport',
        primaryColor: '#14b8a6',
        secondaryColor: '#facc15',
        bottomStyle: 'cargo',
        bottomColor: '#334155',
        shoeStyle: 'highTops',
        shoeColor: '#ffffff',
      },
    })

    expect(imported.name).toBe('Neon Tester')
    expect(imported.avatar).toMatchObject({
      bodyColor: '#f8d6c2',
      hairStyle: 'mohawk',
      face: 'robot',
      outfitStyle: 'sport',
      bottomStyle: 'cargo',
      shoeStyle: 'highTops',
      avatarSource: 'Neon Tester',
    })
  })
})
