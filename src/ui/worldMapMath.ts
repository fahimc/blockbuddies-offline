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
export const minimumMapZoomStep = 0.5
export const maximumMapZoomStep = 2

const defaultWorldMapCamera: WorldMapCamera = {
  centerX: 0,
  centerZ: 0,
  pixelsPerUnit: 4,
}

export function normalizeWorldMapCamera(
  camera: WorldMapCamera,
  fallback: WorldMapCamera = defaultWorldMapCamera,
): WorldMapCamera {
  const fallbackPixelsPerUnit = Number.isFinite(fallback.pixelsPerUnit)
    ? clamp(
        fallback.pixelsPerUnit,
        minimumMapPixelsPerUnit,
        maximumMapPixelsPerUnit,
      )
    : defaultWorldMapCamera.pixelsPerUnit
  return {
    centerX: Number.isFinite(camera.centerX)
      ? camera.centerX
      : finiteOr(fallback.centerX, defaultWorldMapCamera.centerX),
    centerZ: Number.isFinite(camera.centerZ)
      ? camera.centerZ
      : finiteOr(fallback.centerZ, defaultWorldMapCamera.centerZ),
    pixelsPerUnit: Number.isFinite(camera.pixelsPerUnit)
      ? clamp(
          camera.pixelsPerUnit,
          minimumMapPixelsPerUnit,
          maximumMapPixelsPerUnit,
        )
      : fallbackPixelsPerUnit,
  }
}

export function worldMapPoint(
  position: Vec3,
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
) {
  const safeCamera = normalizeWorldMapCamera(camera)
  const safeViewport = normalizeViewport(viewport)
  return {
    left:
      safeViewport.width / 2 +
      (finiteOr(position[0], safeCamera.centerX) - safeCamera.centerX) *
        safeCamera.pixelsPerUnit,
    top:
      safeViewport.height / 2 -
      (finiteOr(position[2], safeCamera.centerZ) - safeCamera.centerZ) *
        safeCamera.pixelsPerUnit,
  }
}

export function worldPointAtMapPixel(
  pixel: { x: number; y: number },
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
) {
  const safeCamera = normalizeWorldMapCamera(camera)
  const safeViewport = normalizeViewport(viewport)
  const pixelX = finiteOr(pixel.x, safeViewport.width / 2)
  const pixelY = finiteOr(pixel.y, safeViewport.height / 2)
  return {
    x:
      safeCamera.centerX +
      (pixelX - safeViewport.width / 2) / safeCamera.pixelsPerUnit,
    z:
      safeCamera.centerZ -
      (pixelY - safeViewport.height / 2) / safeCamera.pixelsPerUnit,
  }
}

export function visibleWorldBounds(
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
): WorldBounds {
  const safeCamera = normalizeWorldMapCamera(camera)
  const safeViewport = normalizeViewport(viewport)
  const halfWidth = safeViewport.width / safeCamera.pixelsPerUnit / 2
  const halfDepth = safeViewport.height / safeCamera.pixelsPerUnit / 2
  return {
    minX: safeCamera.centerX - halfWidth,
    maxX: safeCamera.centerX + halfWidth,
    minZ: safeCamera.centerZ - halfDepth,
    maxZ: safeCamera.centerZ + halfDepth,
  }
}

export function panWorldMap(
  camera: WorldMapCamera,
  deltaPixels: { x: number; y: number },
): WorldMapCamera {
  const safeCamera = normalizeWorldMapCamera(camera)
  if (!Number.isFinite(deltaPixels.x) || !Number.isFinite(deltaPixels.y))
    return safeCamera
  return {
    ...safeCamera,
    centerX: safeCamera.centerX - deltaPixels.x / safeCamera.pixelsPerUnit,
    centerZ: safeCamera.centerZ + deltaPixels.y / safeCamera.pixelsPerUnit,
  }
}

export function zoomWorldMapAt(
  camera: WorldMapCamera,
  viewport: WorldMapViewport,
  pixel: { x: number; y: number },
  scale: number,
): WorldMapCamera {
  const safeCamera = normalizeWorldMapCamera(camera)
  const safeViewport = normalizeViewport(viewport)
  if (
    !Number.isFinite(pixel.x) ||
    !Number.isFinite(pixel.y) ||
    !Number.isFinite(scale) ||
    scale <= 0
  )
    return safeCamera
  const safeScale = clamp(scale, minimumMapZoomStep, maximumMapZoomStep)
  const anchor = worldPointAtMapPixel(pixel, safeCamera, safeViewport)
  const pixelsPerUnit = clamp(
    safeCamera.pixelsPerUnit * safeScale,
    minimumMapPixelsPerUnit,
    maximumMapPixelsPerUnit,
  )
  return normalizeWorldMapCamera(
    {
      centerX: anchor.x - (pixel.x - safeViewport.width / 2) / pixelsPerUnit,
      centerZ: anchor.z + (pixel.y - safeViewport.height / 2) / pixelsPerUnit,
      pixelsPerUnit,
    },
    safeCamera,
  )
}

export function fitWorldMapPoints(
  positions: Vec3[],
  viewport: WorldMapViewport,
  paddingPixels = 42,
): WorldMapCamera {
  const safeViewport = normalizeViewport(viewport)
  const safePositions = positions.filter(
    (position) => Number.isFinite(position[0]) && Number.isFinite(position[2]),
  )
  if (safePositions.length === 0) return { ...defaultWorldMapCamera }
  const xs = safePositions.map((position) => position[0])
  const zs = safePositions.map((position) => position[2])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const safePadding = Math.max(0, finiteOr(paddingPixels, 42))
  const usableWidth = Math.max(1, safeViewport.width - safePadding * 2)
  const usableHeight = Math.max(1, safeViewport.height - safePadding * 2)
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

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}

function normalizeViewport(viewport: WorldMapViewport): WorldMapViewport {
  return {
    width:
      Number.isFinite(viewport.width) && viewport.width > 0
        ? viewport.width
        : 1,
    height:
      Number.isFinite(viewport.height) && viewport.height > 0
        ? viewport.height
        : 1,
  }
}
