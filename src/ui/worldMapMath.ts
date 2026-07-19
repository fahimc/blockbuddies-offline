import type { Vec3 } from '../game/types'
import type { WorldBounds } from '../data/worldCoordinates'

export type WorldMapCamera = {
  centerX: number
  centerZ: number
  pixelsPerUnit: number
}

export type WorldMapViewport = {
  width: number
  height: number
}

export const minimumMapPixelsPerUnit = 0.9
export const maximumMapPixelsPerUnit = 13

export function worldMapPoint(
  position: Vec3,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
) {
  return {
    left:
      viewport.width / 2 +
      (position[0] - camera.centerX) * camera.pixelsPerUnit,
    top:
      viewport.height / 2 -
      (position[2] - camera.centerZ) * camera.pixelsPerUnit,
  }
}

export function worldPointAtMapPixel(
  pixel: { x: number; y: number },
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
) {
  return {
    x: camera.centerX + (pixel.x - viewport.width / 2) / camera.pixelsPerUnit,
    z: camera.centerZ - (pixel.y - viewport.height / 2) / camera.pixelsPerUnit,
  }
}

export function visibleWorldBounds(
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
): WorldBounds {
  const halfWidth = viewport.width / camera.pixelsPerUnit / 2
  const halfDepth = viewport.height / camera.pixelsPerUnit / 2
  return {
    minX: camera.centerX - halfWidth,
    maxX: camera.centerX + halfWidth,
    minZ: camera.centerZ - halfDepth,
    maxZ: camera.centerZ + halfDepth,
  }
}

export function panWorldMap(
  camera: WorldMapCamera,
  deltaPixels: { x: number; y: number },
): WorldMapCamera {
  return {
    ...camera,
    centerX: camera.centerX - deltaPixels.x / camera.pixelsPerUnit,
    centerZ: camera.centerZ + deltaPixels.y / camera.pixelsPerUnit,
  }
}

export function zoomWorldMapAt(
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
  pixel: { x: number; y: number },
  scale: number,
): WorldMapCamera {
  const anchor = worldPointAtMapPixel(pixel, camera, viewport)
  const pixelsPerUnit = clamp(
    camera.pixelsPerUnit * scale,
    minimumMapPixelsPerUnit,
    maximumMapPixelsPerUnit,
  )
  return {
    centerX: anchor.x - (pixel.x - viewport.width / 2) / pixelsPerUnit,
    centerZ: anchor.z + (pixel.y - viewport.height / 2) / pixelsPerUnit,
    pixelsPerUnit,
  }
}

export function fitWorldMapPoints(
  positions: Vec3[],
  viewport: WorldMapViewport,
  paddingPixels = 42,
): WorldMapCamera {
  if (positions.length === 0)
    return { centerX: 0, centerZ: 0, pixelsPerUnit: 4 }
  const xs = positions.map((position) => position[0])
  const zs = positions.map((position) => position[2])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const usableWidth = Math.max(1, viewport.width - paddingPixels * 2)
  const usableHeight = Math.max(1, viewport.height - paddingPixels * 2)
  const width = Math.max(18, maxX - minX)
  const depth = Math.max(18, maxZ - minZ)
  return {
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    pixelsPerUnit: clamp(
      Math.min(usableWidth / width, usableHeight / depth),
      minimumMapPixelsPerUnit,
      maximumMapPixelsPerUnit,
    ),
  }
}

export function pointIsInsideMap(
  point: { left: number; top: number },
  viewport: WorldMapViewport,
  margin = 24,
) {
  return (
    point.left >= -margin &&
    point.left <= viewport.width + margin &&
    point.top >= -margin &&
    point.top <= viewport.height + margin
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
