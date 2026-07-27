import { describe, expect, it } from 'vitest'
import { proceduralBuildableParcelFor, proceduralTerrainAt } from './proceduralTownPlan'
import { worldTerrainAt } from './worldTileMap'
import { buddyRushRoutes, playerClubhousePosition } from './buddyRush'
import {
  buddyRushRivalSites,
  buddyRushWorldSites,
  orientedBuddyRushFootprint,
} from './buddyRushWorldPlan'

const seeds = ['LONDON-2026', 'BUDDY-TOWN', 'MOON-CLUB-42', 'PARTY-9000']

describe('Buddy Rush deterministic world sites', () => {
  it('keeps the original central clubhouse and spreads rivals across districts', () => {
    expect(playerClubhousePosition).toEqual([-12, 0, -8])
    for (let first = 0; first < buddyRushRivalSites.length; first += 1) {
      for (
        let second = first + 1;
        second < buddyRushRivalSites.length;
        second += 1
      ) {
        const a = buddyRushRivalSites[first].position
        const b = buddyRushRivalSites[second].position
        expect(Math.hypot(a[0] - b[0], a[2] - b[2])).toBeGreaterThan(70)
      }
    }
  })

  it.each(seeds)(
    'reserves every rival footprint in a buildable parcel for seed %s',
    (seed) => {
      for (const site of buddyRushRivalSites) {
        const footprint = orientedBuddyRushFootprint(site)
        const parcel = proceduralBuildableParcelFor(
          seed,
          site.position,
          footprint,
        )
        expect(parcel?.use, site.id).toBe('buildable')
        const halfX = footprint[0] / 2
        const halfZ = footprint[2] / 2
        expect(
          [
            [site.position[0] - halfX, site.position[2] - halfZ],
            [site.position[0] + halfX, site.position[2] - halfZ],
            [site.position[0] - halfX, site.position[2] + halfZ],
            [site.position[0] + halfX, site.position[2] + halfZ],
          ].every(([x, z]) => proceduralTerrainAt(x, z) === 'ground'),
          site.id,
        ).toBe(true)
      }
    },
  )

  it('keeps the compact bus shelter beside the road and clear of driving and parking lanes', () => {
    const site = buddyRushWorldSites.bus
    const footprint = orientedBuddyRushFootprint(site)
    const samples = [
      site.position,
      [
        site.position[0] - footprint[0] / 2,
        0,
        site.position[2] - footprint[2] / 2,
      ],
      [
        site.position[0] + footprint[0] / 2,
        0,
        site.position[2] + footprint[2] / 2,
      ],
    ] as const

    expect(
      samples.every(([x, , z]) => {
        const terrain = worldTerrainAt(x, z)
        return terrain === 'ground' || terrain === 'sidewalk'
      }),
    ).toBe(true)
  })

  it('ends both deterministic routes for each rival at its reserved site', () => {
    buddyRushRivalSites.forEach((site, rivalIndex) => {
      expect(buddyRushRoutes[rivalIndex * 2].at(-1)).toEqual(site.position)
      expect(buddyRushRoutes[rivalIndex * 2 + 1].at(-1)).toEqual(site.position)
    })
  })
})
