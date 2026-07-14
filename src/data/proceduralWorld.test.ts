import { describe, expect, it } from 'vitest'
import { buildingHeightForFloors, realScale } from '../game/scale'
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

  it('generates human-scale buildings with full-height doors', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [36, 0, 36],
      viewDistance: 1,
      night: false,
    })

    const buildings = world.pieces.filter((piece) => piece.kind === 'building')
    const doors = world.pieces.filter((piece) => piece.kind === 'door')

    expect(buildings.length).toBeGreaterThan(0)
    expect(doors.length).toBeGreaterThan(0)
    expect(buildings.every((piece) => piece.scale[1] >= buildingHeightForFloors(2))).toBe(true)
    expect(doors.every((piece) => piece.scale[1] === realScale.doorHeight)).toBe(true)
    expect(doors.every((piece) => piece.scale[1] / realScale.avatarHeight > 1.1)).toBe(true)
  })

  it('keeps tree trunks and phone boxes off roads and pavements', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [18, 0, 18],
      viewDistance: 2,
      night: false,
    })

    const roadsAndPavements = world.pieces.filter((piece) => piece.kind === 'road' || piece.kind === 'pavement')
    const blockers = world.pieces.filter((piece) => piece.kind === 'tree-trunk' || piece.kind === 'phone-box')

    expect(blockers.length).toBeGreaterThan(0)
    expect(roadsAndPavements.length).toBeGreaterThan(0)
    expect(blockers.every((blocker) => roadsAndPavements.every((road) => !overlapsTopDown(blocker, road, 0.04)))).toBe(true)
  })

  it('uses sparse sandbox-style building plots and wide roads', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [18, 0, 18],
      viewDistance: 2,
      night: false,
    })

    const generatedBuildings = world.pieces.filter((piece) => piece.kind === 'building' && piece.id.startsWith('building:'))
    const roads = world.pieces.filter((piece) => piece.kind === 'road' && piece.id.startsWith('road-'))

    expect(generatedBuildings.length).toBeLessThanOrEqual(18)
    expect(generatedBuildings.length).toBeGreaterThan(0)
    expect(roads.every((road) => Math.max(road.scale[0], road.scale[2]) === 36)).toBe(true)
    expect(roads.every((road) => Math.min(road.scale[0], road.scale[2]) === realScale.roadTile)).toBe(true)
    expect(roads.every(() => realScale.roadTile / realScale.carWidth > 3.4)).toBe(true)
  })
})

function overlapsTopDown(
  a: { position: [number, number, number]; scale: [number, number, number] },
  b: { position: [number, number, number]; scale: [number, number, number] },
  padding = 0,
) {
  const xOverlap = Math.abs(a.position[0] - b.position[0]) < (a.scale[0] + b.scale[0]) / 2 + padding
  const zOverlap = Math.abs(a.position[2] - b.position[2]) < (a.scale[2] + b.scale[2]) / 2 + padding
  return xOverlap && zOverlap
}
