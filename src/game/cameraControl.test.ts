import { describe, expect, it } from 'vitest'
import { maxCameraPitch, minCameraPitch, pitchFromLookDrag, yawFromLookDrag } from './cameraControl'

describe('camera drag controls', () => {
  it('turns the camera yaw from horizontal screen drag', () => {
    expect(yawFromLookDrag(0, 50)).toBeGreaterThan(0)
    expect(yawFromLookDrag(1, -50)).toBeLessThan(1)
  })

  it('clamps vertical drag pitch to playable camera bounds', () => {
    expect(pitchFromLookDrag(0, 9999)).toBe(maxCameraPitch)
    expect(pitchFromLookDrag(0, -9999)).toBe(minCameraPitch)
  })
})
