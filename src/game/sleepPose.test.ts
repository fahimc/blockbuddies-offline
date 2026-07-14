import { Euler, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { avatarSleepRotation } from './sleepPose'

describe('avatar sleep pose', () => {
  it('places the head toward the pillow with the face upward', () => {
    const rotation = new Euler(...avatarSleepRotation)
    const headDirection = new Vector3(0, 1, 0).applyEuler(rotation)
    const faceDirection = new Vector3(0, 0, 1).applyEuler(rotation)

    expect(headDirection.z).toBeGreaterThan(0.99)
    expect(faceDirection.y).toBeGreaterThan(0.99)
  })
})
