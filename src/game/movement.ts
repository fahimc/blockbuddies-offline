export const playerWalkSpeed = 5
export const playerRunMultiplier = 2
export const playerRunSpeed = playerWalkSpeed * playerRunMultiplier

export function playerMovementSpeed(running: boolean) {
  return running ? playerRunSpeed : playerWalkSpeed
}
