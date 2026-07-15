import { describe, expect, it } from 'vitest'
import {
  cameraRelativeMovement,
  orbitYawForCameraHeading,
  playerMovementSpeed,
  playerRunMultiplier,
  playerRunSpeed,
  playerWalkSpeed,
} from './movement'

describe('player movement speed', () => {
  it('runs at exactly twice walking speed', () => {
    expect(playerRunMultiplier).toBe(2)
    expect(playerRunSpeed).toBe(playerWalkSpeed * 2)
    expect(playerMovementSpeed(true)).toBe(playerMovementSpeed(false) * 2)
  })

  it('moves joystick forward away from the camera at every orbit heading', () => {
    const behindAvatar = cameraRelativeMovement(1, 0, 0)
    const inFrontOfAvatar = cameraRelativeMovement(1, 0, Math.PI)

    expect(behindAvatar.x).toBeCloseTo(0)
    expect(behindAvatar.z).toBeCloseTo(1)
    expect(inFrontOfAvatar.x).toBeCloseTo(0)
    expect(inFrontOfAvatar.z).toBeCloseTo(-1)
  })

  it('maps sideways and diagonal input to the camera plane without a speed boost', () => {
    const right = cameraRelativeMovement(0, 1, 0)
    const diagonal = cameraRelativeMovement(1, 1, 0)

    expect(right.x).toBeCloseTo(1)
    expect(right.z).toBeCloseTo(0)
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1)
    expect(diagonal.yaw).toBeCloseTo(Math.PI / 4)
  })

  it('keeps the camera heading fixed when the avatar turns toward travel', () => {
    const cameraYaw = 0.75
    const avatarYaw = -1.1
    const orbitYaw = orbitYawForCameraHeading(cameraYaw, avatarYaw)

    expect(Math.atan2(Math.sin(avatarYaw + orbitYaw), Math.cos(avatarYaw + orbitYaw))).toBeCloseTo(cameraYaw)
  })
})
