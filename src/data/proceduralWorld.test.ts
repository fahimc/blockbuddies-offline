import { describe, expect, it } from 'vitest'
import { districtFor, generateProceduralWorld, hashSeed } from './proceduralWorld'

describe('procedural borough world', () => {
  it('generates deterministic chunks for the same seed and center', () => {
    const first = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [0, 0, 0],
      viewDistance: 1,
      night: false,
    })
    const second = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [0, 0, 0],
      viewDistance: 1,
      night: false,
    })

    expect(first.pieces.slice(0, 24)).toEqual(second.pieces.slice(0, 24))
    expect(first.buildingCount).toBe(second.buildingCount)
  })

  it('changes building layout when the seed changes', () => {
    const first = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [0, 0, 0],
      viewDistance: 1,
      night: false,
    })
    const second = generateProceduralWorld({
      seed: 'BLOCK-BOROUGH',
      center: [0, 0, 0],
      viewDistance: 1,
      night: false,
    })

    const firstBuildings = first.pieces.filter((piece) => piece.kind === 'building').map((piece) => piece.scale.join(','))
    const secondBuildings = second.pieces.filter((piece) => piece.kind === 'building').map((piece) => piece.scale.join(','))
    expect(firstBuildings).not.toEqual(secondBuildings)
  })

  it('scales piece count with view distance and names districts', () => {
    const near = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [0, 0, 0],
      viewDistance: 1,
      night: false,
    })
    const far = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [0, 0, 0],
      viewDistance: 2,
      night: false,
    })

    expect(far.pieces.length).toBeGreaterThan(near.pieces.length)
    expect(districtFor([-50, 0, 3])).toBe('Westminster')
    expect(hashSeed('LONDON-2026')).toBe(hashSeed('LONDON-2026'))
  })
})
