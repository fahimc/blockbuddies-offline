import type { Vec3 } from '../game/types'

export function miniMapPlayerRotation(playerYaw: number) {
  return Math.PI - playerYaw
}

export function miniMapPointPercent(position: Vec3, center: Vec3, mapRange: number) {
  return {
    left: percentFor(position[0], center[0], mapRange),
    top: percentFor(position[2], center[2], mapRange),
  }
}

export function miniMapRoadPercent(centerLine: number, center: number, mapRange: number) {
  return percentFor(centerLine, center, mapRange)
}

function percentFor(value: number, center: number, mapRange: number) {
  return clamp(((value - center + mapRange / 2) / mapRange) * 100, 0, 100)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
