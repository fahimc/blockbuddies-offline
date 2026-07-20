import { describe, expect, it } from 'vitest'
import {
  lightSaberHandSocket,
  lightSaberPreviewFromSearch,
} from './lightSaber'

describe('world equipment placement', () => {
  it('anchors the light saber inside the right-hand mesh instead of at the shoulder', () => {
    const [x, y, z] = lightSaberHandSocket.position

    expect(x).toBe(0)
    expect(y).toBeCloseTo(-0.57)
    expect(y).toBeLessThan(-0.42)
    expect(y).toBeGreaterThan(-0.72)
    expect(z).toBeCloseTo(0.04)
    expect(lightSaberHandSocket.rotation[2]).toBeLessThan(0)
  })

  it('only accepts valid saber ids for the development visual preview', () => {
    expect(
      lightSaberPreviewFromSearch('?saber-preview=weapon-light-saber-purple'),
    ).toBe('weapon-light-saber-purple')
    expect(lightSaberPreviewFromSearch('?saber-preview=invalid')).toBeUndefined()
  })
})
