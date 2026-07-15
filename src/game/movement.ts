export const playerWalkSpeed = 5
export const playerRunMultiplier = 2
export const playerRunSpeed = playerWalkSpeed * playerRunMultiplier

export type PlanarMovement = {
  x: number
  z: number
  yaw: number
  magnitude: number
}

export type PlanarPoint = {
  x: number
  z: number
}

export function playerMovementSpeed(running: boolean) {
  return running ? playerRunSpeed : playerWalkSpeed
}

export function playerStrafeFromInput(strafe: number) {
  return -strafe
}

export function cameraRelativeMovement(forward: number, strafe: number, cameraYaw: number): PlanarMovement {
  const inputMagnitude = Math.hypot(forward, strafe)
  if (inputMagnitude < 0.0001) return { x: 0, z: 0, yaw: cameraYaw, magnitude: 0 }

  const scale = inputMagnitude > 1 ? 1 / inputMagnitude : 1
  const normalizedForward = forward * scale
  const normalizedStrafe = strafe * scale
  const forwardX = Math.sin(cameraYaw)
  const forwardZ = Math.cos(cameraYaw)
  const rightX = Math.cos(cameraYaw)
  const rightZ = -Math.sin(cameraYaw)
  const x = forwardX * normalizedForward + rightX * normalizedStrafe
  const z = forwardZ * normalizedForward + rightZ * normalizedStrafe

  return {
    x,
    z,
    yaw: Math.atan2(x, z),
    magnitude: Math.min(1, inputMagnitude),
  }
}

export function cameraViewHeading(player: PlanarPoint, camera: PlanarPoint, fallbackYaw: number) {
  const x = player.x - camera.x
  const z = player.z - camera.z
  if (Math.hypot(x, z) < 0.0001) return fallbackYaw
  return Math.atan2(x, z)
}

export function orbitYawForCameraHeading(cameraYaw: number, avatarYaw: number) {
  return normalizeYaw(cameraYaw - avatarYaw)
}

function normalizeYaw(yaw: number) {
  return Math.atan2(Math.sin(yaw), Math.cos(yaw))
}
