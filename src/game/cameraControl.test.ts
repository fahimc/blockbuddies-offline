import { describe, expect, it } from 'vitest'
import { maxCameraPitch, minCameraPitch, pitchFromLookDrag, yawFromLookDrag } from './cameraControl'

describe('camera drag controls', () => {
  it('orbits opposite the dragged screen delta like direct world control', () => {
    expect(yawFromLookDrag(0, 50)).toBeLessThan(0)
    expect(yawFromLookDrag(1, -50)).toBeGreaterThan(1)
  })

  it('inverts vertical orbit drag and clamps it to playable bounds', () => {
    expect(pitchFromLookDrag(0, 9999)).toBe(minCameraPitch)
    expect(pitchFromLookDrag(0, -9999)).toBe(maxCameraPitch)
  })
})
