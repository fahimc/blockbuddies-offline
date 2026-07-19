import { describe, expect, it } from 'vitest'
import {
  boundsToChunks,
  chunkToSector,
  worldChunkSize,
  worldSectorSize,
  worldToChunk,
} from './worldCoordinates'
import {
  footballStadiumCenter,
  getWorldFeature,
  worldFeaturesForChunk,
} from './worldFeatures'
import { predictChunkRequests } from './worldStreaming'

describe('world coordinates and feature streaming', () => {
  it('uses 36-unit chunks and six-chunk sectors across negative coordinates', () => {
    expect(worldChunkSize).toBe(36)
    expect(worldSectorSize).toBe(216)
    expect(worldToChunk(-0.01, -36.01)).toEqual({ cx: -1, cz: -2 })
    expect(chunkToSector(-1, -7)).toEqual({ sx: -1, sz: -2 })
  })

  it('indexes multi-chunk authored features without moving the central town', () => {
    const central = getWorldFeature('central-buddy-town')
    const stadium = getWorldFeature('football-stadium')

    expect(central?.bounds).toEqual({
      minX: -27,
      maxX: 27,
      minZ: -27,
      maxZ: 27,
    })
    expect(footballStadiumCenter).toEqual([90, 0, -42])
    expect(stadium?.bounds.minX).toBeGreaterThan(27)
    expect(worldFeaturesForChunk(2, -2).map((feature) => feature.id)).toContain(
      'football-stadium',
    )
    expect(boundsToChunks(stadium!.bounds).length).toBeGreaterThan(1)
  })

  it('prioritizes active chunks and predicts the leading movement edge', () => {
    const requests = predictChunkRequests({
      position: [34, 0, 0],
      velocity: [12, 0, 0],
      viewDistance: 1,
    })

    expect(requests[0]).toMatchObject({ reason: 'active' })
    expect(
      requests.some(
        (request) => request.cx >= 2 && request.reason !== 'active',
      ),
    ).toBe(true)
    expect(
      new Set(requests.map((request) => `${request.cx}:${request.cz}`)).size,
    ).toBe(requests.length)
  })
})
