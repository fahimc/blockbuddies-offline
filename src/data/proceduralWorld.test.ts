import { describe, expect, it } from 'vitest'
import { buildingHeightForFloors, realScale } from '../game/scale'
import { footprintOverlapsAuthoredCore } from '../game/townPlacement'
import {
  districtFor,
  generateProceduralWorld,
  hashSeed,
  roadDriveCorridorPadding,
} from './proceduralWorld'
import {
  buddyRushReservationFootprint,
  buddyRushReservedSites,
} from './buddyRushWorldPlan'

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

    const firstBuildings = first.pieces
      .filter((piece) => piece.kind === 'building')
      .map((piece) => piece.scale.join(','))
    const secondBuildings = second.pieces
      .filter((piece) => piece.kind === 'building')
      .map((piece) => piece.scale.join(','))
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
    expect(districtFor([-50, 0, 3])).toBe('West Gardens')
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
    expect(
      buildings.every((piece) => piece.scale[1] >= buildingHeightForFloors(2)),
    ).toBe(true)
    expect(
      doors.every((piece) => piece.scale[1] === realScale.doorHeight),
    ).toBe(true)
    expect(
      doors.every((piece) => piece.scale[1] / realScale.avatarHeight > 1.1),
    ).toBe(true)
  })

  it('keeps tree trunks and phone boxes off roads and pavements', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [18, 0, 18],
      viewDistance: 2,
      night: false,
    })

    const roadsAndPavements = world.pieces.filter(
      (piece) => piece.kind === 'road' || piece.kind === 'pavement',
    )
    const blockers = world.pieces.filter(
      (piece) => piece.kind === 'tree-trunk' || piece.kind === 'phone-box',
    )

    expect(blockers.length).toBeGreaterThan(0)
    expect(roadsAndPavements.length).toBeGreaterThan(0)
    expect(
      blockers.every((blocker) =>
        roadsAndPavements.every(
          (road) => !overlapsTopDown(blocker, road, 0.04),
        ),
      ),
    ).toBe(true)
  })

  it('keeps traffic lanes clear of scenery inside the drivable road corridor', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [18, 0, 18],
      viewDistance: 2,
      night: true,
    })

    const driveCorridors = world.pieces
      .filter((piece) => piece.kind === 'road')
      .map((road) => ({
        position: road.position,
        scale: [
          road.scale[0] + roadDriveCorridorPadding * 2,
          road.scale[1],
          road.scale[2] + roadDriveCorridorPadding * 2,
        ] as [number, number, number],
      }))
    const blockers = world.pieces.filter(
      (piece) =>
        piece.kind === 'tree-trunk' ||
        piece.kind === 'tree-top' ||
        piece.kind === 'lamp-post' ||
        piece.kind === 'lamp-light' ||
        piece.kind === 'phone-box',
    )

    expect(driveCorridors.length).toBeGreaterThan(0)
    expect(blockers.length).toBeGreaterThan(0)
    expect(
      blockers.every((blocker) =>
        driveCorridors.every((road) => !overlapsTopDown(blocker, road, 0.04)),
      ),
    ).toBe(true)
  })

  it('does not generate obsolete stationary buses in traffic lanes', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [18, 0, 18],
      viewDistance: 3,
      night: false,
    })

    expect(world.pieces.some((piece) => piece.id.startsWith('bus:'))).toBe(
      false,
    )
  })

  it('uses sparse sandbox-style building plots and wide roads', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [18, 0, 18],
      viewDistance: 2,
      night: false,
    })

    const generatedBuildings = world.pieces.filter(
      (piece) => piece.kind === 'building' && piece.id.startsWith('building:'),
    )
    const roads = world.pieces.filter(
      (piece) => piece.kind === 'road' && piece.id.startsWith('road-'),
    )

    expect(generatedBuildings.length).toBeLessThanOrEqual(18)
    expect(generatedBuildings.length).toBeGreaterThan(0)
    expect(
      roads.every((road) => Math.max(road.scale[0], road.scale[2]) === 36),
    ).toBe(true)
    expect(
      roads.every(
        (road) => Math.min(road.scale[0], road.scale[2]) === realScale.roadTile,
      ),
    ).toBe(true)
    expect(
      roads.every(() => realScale.roadTile / realScale.carWidth > 3.4),
    ).toBe(true)
  })

  it('keeps procedural door safe zones clear of scenery blockers', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [18, 0, 18],
      viewDistance: 2,
      night: false,
    })

    const doorZones = world.pieces
      .filter((piece) => piece.kind === 'door')
      .map((door) => ({
        position: [door.position[0], 0, door.position[2] + 0.58] as [
          number,
          number,
          number,
        ],
        scale: [3.7, 2, 3.7] as [number, number, number],
      }))
    const blockers = world.pieces.filter(
      (piece) =>
        piece.kind === 'tree-trunk' ||
        piece.kind === 'phone-box' ||
        piece.kind === 'lamp-post',
    )

    expect(doorZones.length).toBeGreaterThan(0)
    expect(
      blockers.every((blocker) =>
        doorZones.every((zone) => !overlapsTopDown(blocker, zone, 0.04)),
      ),
    ).toBe(true)
  })

  it('snaps independent scenery to grid cells and prevents occupied-cell overlap', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [54, 0, 54],
      viewDistance: 2,
      night: true,
    })
    const anchors = world.pieces.filter(
      (piece) =>
        piece.kind === 'building' ||
        piece.kind === 'tree-trunk' ||
        piece.kind === 'lamp-post' ||
        piece.kind === 'phone-box',
    )
    const footprints = anchors.map((piece) => ({
      ...piece,
      scale:
        piece.kind === 'tree-trunk'
          ? ([
              realScale.treeCanopySize,
              piece.scale[1],
              realScale.treeCanopySize,
            ] as [number, number, number])
          : piece.kind === 'lamp-post'
            ? ([0.8, piece.scale[1], 0.8] as [number, number, number])
            : piece.scale,
    }))

    expect(anchors.length).toBeGreaterThan(0)
    expect(
      anchors.every(
        (piece) =>
          Number.isInteger(piece.position[0]) &&
          Number.isInteger(piece.position[2]),
      ),
    ).toBe(true)
    expect(
      footprints.every((piece, index) =>
        footprints
          .slice(index + 1)
          .every((other) => !overlapsTopDown(piece, other)),
      ),
    ).toBe(true)
  })

  it('keeps parks clear of transport surfaces and lamps on sidewalk cells only', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [54, 0, 54],
      viewDistance: 2,
      night: true,
    })
    const roads = world.pieces.filter((piece) => piece.kind === 'road')
    const pavements = world.pieces.filter((piece) => piece.kind === 'pavement')
    const parks = world.pieces.filter((piece) => piece.kind === 'park')
    const lamps = world.pieces.filter((piece) => piece.kind === 'lamp-post')

    expect(realScale.pavementWidth).toBeGreaterThan(realScale.avatarHeight)
    expect(parks.length).toBeGreaterThan(0)
    expect(
      parks.every((park) =>
        roads.every((road) => !overlapsTopDown(park, road)),
      ),
    ).toBe(true)
    expect(
      parks.every((park) =>
        pavements.every((pavement) => !overlapsTopDown(park, pavement)),
      ),
    ).toBe(true)
    expect(lamps.length).toBeGreaterThan(0)
    expect(
      lamps.every((lamp) =>
        roads.every((road) => !overlapsTopDown(lamp, road)),
      ),
    ).toBe(true)
    expect(
      lamps.every((lamp) =>
        pavements.some((pavement) => overlapsTopDown(lamp, pavement)),
      ),
    ).toBe(true)
  })

  it('renders continuous shared road surfaces across chunk boundaries and the core', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [18, 0, 18],
      viewDistance: 3,
      night: false,
    })
    const roads = world.pieces.filter((piece) => piece.kind === 'road')
    const samples: Array<[number, number]> = []
    for (let x = -96; x <= 132; x += 6) samples.push([x, 9])
    for (let z = -96; z <= 132; z += 6) {
      samples.push([-54, z], [54, z])
    }

    expect(
      samples.every(([x, z]) =>
        roads.some(
          (road) =>
            Math.abs(x - road.position[0]) <= road.scale[0] / 2 + 0.01 &&
            Math.abs(z - road.position[2]) <= road.scale[2] / 2 + 0.01,
        ),
      ),
    ).toBe(true)
  })

  it('keeps generated buildings inside planned parcels and reserves empty lots for players', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [54, 0, 54],
      viewDistance: 2,
      night: false,
    })
    const buildings = world.pieces.filter(
      (piece) => piece.kind === 'building' && piece.id.startsWith('building:'),
    )

    expect(buildings.length).toBeGreaterThan(0)
    expect(world.buildableParcels.length).toBeGreaterThan(0)
    expect(
      world.buildableParcels.every((parcel) =>
        buildings.every(
          (building) =>
            !overlapsTopDown(
              {
                position: parcel.center,
                scale: parcel.size,
              },
              building,
            ),
        ),
      ),
    ).toBe(true)
  })

  it.each(['LONDON-2026', 'BUDDY-TOWN', 'PARTY-9000'])(
    'uses tile-grid reservations to keep procedural objects clear of Buddy Rush sites for seed %s',
    (seed) => {
      for (const site of buddyRushReservedSites) {
        const world = generateProceduralWorld({
          seed,
          center: site.position,
          viewDistance: 1,
          night: true,
        })
        const reservation = {
          position: site.position,
          scale: buddyRushReservationFootprint(site),
        }
        const anchors = world.pieces.filter(
          (piece) =>
            piece.kind === 'building' ||
            piece.kind === 'tree-trunk' ||
            piece.kind === 'lamp-post' ||
            piece.kind === 'phone-box',
        )

        expect(
          anchors.every((anchor) => !overlapsTopDown(anchor, reservation)),
          `${site.id} must remain clear`,
        ).toBe(true)
      }
    },
  )

  it('keeps the clocktower hall as one complete landmark assembly', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [0, 0, -34],
      viewDistance: 1,
      night: true,
    })

    expect(
      world.pieces.some(
        (piece) =>
          piece.id === 'landmark:town-hall' && piece.kind === 'building',
      ),
    ).toBe(true)
    expect(
      world.pieces.some(
        (piece) => piece.id === 'landmark:town-hall:clock-tower',
      ),
    ).toBe(true)
    expect(
      world.pieces.some(
        (piece) => piece.id === 'landmark:town-hall:clock-face',
      ),
    ).toBe(true)
    expect(
      world.pieces.some((piece) => piece.id === 'landmark:town-hall:door'),
    ).toBe(true)
  })

  it('allows the shared road layer through the core while suppressing procedural props', () => {
    const world = generateProceduralWorld({
      seed: 'LONDON-2026',
      center: [18, 0, 18],
      viewDistance: 1,
      night: true,
    })
    const allowedCoreLayers = new Set([
      'ground',
      'water',
      'road',
      'pavement',
      'line',
    ])
    const coreConflicts = world.pieces.filter(
      (piece) =>
        !allowedCoreLayers.has(piece.kind) &&
        !piece.id.startsWith('landmark:') &&
        footprintOverlapsAuthoredCore(piece.position, piece.scale, 0.08),
    )

    expect(coreConflicts.map((piece) => `${piece.kind}:${piece.id}`)).toEqual(
      [],
    )
  })
})

function overlapsTopDown(
  a: { position: [number, number, number]; scale: [number, number, number] },
  b: { position: [number, number, number]; scale: [number, number, number] },
  padding = 0,
) {
  const xOverlap =
    Math.abs(a.position[0] - b.position[0]) <
    (a.scale[0] + b.scale[0]) / 2 + padding
  const zOverlap =
    Math.abs(a.position[2] - b.position[2]) <
    (a.scale[2] + b.scale[2]) / 2 + padding
  return xOverlap && zOverlap
}
