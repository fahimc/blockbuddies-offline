import { describe, expect, it } from 'vitest'
import { shadowOracleRearPanels } from './avatarOutfits'

describe('Shadow Oracle outfit geometry', () => {
  it('covers the full rear torso with a purple jacket panel', () => {
    const back = shadowOracleRearPanels.find(
      (panel) => panel.id === 'jacket-back',
    )

    expect(back).toMatchObject({ material: 'accent' })
    expect(back?.position[2]).toBeLessThan(0)
    expect(back?.size[0]).toBeGreaterThanOrEqual(0.82)
    expect(back?.size[1]).toBeGreaterThanOrEqual(0.94)
  })

  it('connects the rear jacket to both sides of the torso', () => {
    const left = shadowOracleRearPanels.find(
      (panel) => panel.id === 'jacket-left-side',
    )
    const right = shadowOracleRearPanels.find(
      (panel) => panel.id === 'jacket-right-side',
    )

    expect(left?.position[0]).toBeLessThan(0)
    expect(right?.position[0]).toBeGreaterThan(0)
    expect(left?.size[2]).toBeGreaterThanOrEqual(0.38)
    expect(right?.size[2]).toBeGreaterThanOrEqual(0.38)
  })

  it('includes visible collar, centre seam, and hem detail on the back', () => {
    expect(shadowOracleRearPanels.map((panel) => panel.id)).toEqual(
      expect.arrayContaining([
        'jacket-back-collar',
        'jacket-back-seam',
        'jacket-back-hem',
      ]),
    )
  })
})
