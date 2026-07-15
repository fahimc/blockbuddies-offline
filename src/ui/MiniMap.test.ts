import { describe, expect, it } from 'vitest'
import { miniMapPlayerRotation, miniMapPointPercent } from './miniMapMath'

describe('mini map heading', () => {
  it('converts world yaw to screen-space map rotation with positive z moving down-screen', () => {
    expect(miniMapPlayerRotation(0)).toBeCloseTo(Math.PI, 3)
    expect(miniMapPlayerRotation(Math.PI / 2)).toBeCloseTo(Math.PI / 2, 3)
    expect(miniMapPlayerRotation(Math.PI)).toBeCloseTo(0, 3)
  })

  it('keeps minimap markers moving in the same screen direction as world travel', () => {
    expect(miniMapPointPercent([0, 0, 10], [0, 0, 0], 100).top).toBeGreaterThan(50)
    expect(miniMapPointPercent([10, 0, 0], [0, 0, 0], 100).left).toBeGreaterThan(50)
  })
})
