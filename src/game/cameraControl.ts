export const lookDragSensitivity = 0.006
export const lookPitchSensitivity = 0.004
export const minCameraPitch = -0.5
export const maxCameraPitch = 0.55

export function yawFromLookDrag(currentYaw: number, pixelDeltaX: number) {
  return currentYaw + pixelDeltaX * lookDragSensitivity
}

export function pitchFromLookDrag(currentPitch: number, pixelDeltaY: number) {
  return clamp(currentPitch + pixelDeltaY * lookPitchSensitivity, minCameraPitch, maxCameraPitch)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
