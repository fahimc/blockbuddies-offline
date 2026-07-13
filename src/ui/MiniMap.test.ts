import { describe, expect, it } from 'vitest'
import { miniMapPlayerRotation } from './miniMapMath'

describe('mini map heading', () => {
  it('converts world yaw to screen-space map rotation', () => {
    expect(miniMapPlayerRotation(0)).toBeCloseTo(0, 3)
    expect(miniMapPlayerRotation(Math.PI / 2)).toBeCloseTo(Math.PI / 2, 3)
    expect(miniMapPlayerRotation(Math.PI)).toBeCloseTo(Math.PI, 3)
  })
})
