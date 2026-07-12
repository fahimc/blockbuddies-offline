import type { BuildBlock, Vec3 } from '../game/types'

export function nextBuildPosition(playerPosition: Vec3, yaw: number): Vec3 {
  const forwardX = Math.sin(yaw) * 2.2
  const forwardZ = Math.cos(yaw) * 2.2
  const snap = (value: number) => Math.round(value * 2) / 2
  return [snap(playerPosition[0] + forwardX), 0.55, snap(playerPosition[2] + forwardZ)]
}

export function canPlaceBlock(blocks: BuildBlock[], position: Vec3) {
  return !blocks.some((block) => {
    const dx = block.position[0] - position[0]
    const dz = block.position[2] - position[2]
    return Math.hypot(dx, dz) < 0.75
  })
}
