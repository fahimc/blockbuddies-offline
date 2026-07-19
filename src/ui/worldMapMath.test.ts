import { describe, expect, it } from 'vitest'
import {
  fitWorldMapPoints,
  maximumMapZoomStep,
  normalizeWorldMapCamera,
  panWorldMap,
  visibleWorldBounds,
  worldMapPoint,
  worldPointAtMapPixel,
  zoomWorldMapAt,
} from './worldMapMath'

describe('infinite world map camera', () => {
  const viewport = { width: 600, height: 400 }
  const camera = { centerX: 0, centerZ: 0, pixelsPerUnit: 4 }

  it('round-trips signed world coordinates through screen pixels', () => {
    const pixel = worldMapPoint([-72, 0, 54], camera, viewport)
    expect(
      worldPointAtMapPixel({ x: pixel.left, y: pixel.top }, camera, viewport),
    ).toEqual({
      x: -72,
      z: 54,
    })
  })

  it('pans without clamping and preserves the zoom anchor', () => {
    const panned = panWorldMap(camera, { x: 1200, y: -800 })
    expect(panned).toMatchObject({ centerX: -300, centerZ: -200 })

    const pixel = { x: 530, y: 80 }
    const before = worldPointAtMapPixel(pixel, panned, viewport)
    const zoomed = zoomWorldMapAt(panned, viewport, pixel, 1.8)
    expect(worldPointAtMapPixel(pixel, zoomed, viewport).x).toBeCloseTo(
      before.x,
    )
    expect(worldPointAtMapPixel(pixel, zoomed, viewport).z).toBeCloseTo(
      before.z,
    )
  })

  it('fits the authored and outlying destinations into an initial viewport', () => {
    const fitted = fitWorldMapPoints(
      [
        [-21, 0, 22],
        [90, 0, -42],
        [67, 0, 54],
      ],
      viewport,
    )
    const bounds = visibleWorldBounds(fitted, viewport)
    expect(bounds.minX).toBeLessThanOrEqual(-21)
    expect(bounds.maxX).toBeGreaterThanOrEqual(90)
    expect(bounds.minZ).toBeLessThanOrEqual(-42)
    expect(bounds.maxZ).toBeGreaterThanOrEqual(54)
  })

  it('recovers from invalid camera and interrupted pinch values', () => {
    const recovered = normalizeWorldMapCamera({
      centerX: Number.NaN,
      centerZ: Number.POSITIVE_INFINITY,
      pixelsPerUnit: Number.NaN,
    })
    expect(recovered).toEqual(camera)
    expect(panWorldMap(recovered, { x: Number.NaN, y: 10 })).toEqual(camera)
    expect(
      zoomWorldMapAt(recovered, viewport, { x: 300, y: 200 }, Number.NaN),
    ).toEqual(camera)
  })

  it('bounds a single pinch update while preserving a finite camera', () => {
    const zoomed = zoomWorldMapAt(
      camera,
      viewport,
      { x: 300, y: 200 },
      1_000_000,
    )

    expect(zoomed).toEqual({
      centerX: 0,
      centerZ: 0,
      pixelsPerUnit: camera.pixelsPerUnit * maximumMapZoomStep,
    })
    expect(Object.values(zoomed).every(Number.isFinite)).toBe(true)
  })
})
