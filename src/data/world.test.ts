import { describe, expect, it } from 'vitest'
import {
  createParkedVehicles,
  distanceToVehicle,
  vehicleInteractionRadius,
} from '../game/vehicles'
import { staticTownBuildings } from '../game/townPlacement'
import {
  proceduralBuildableParcelFor,
  proceduralTerrainAt,
} from './proceduralTownPlan'
import { footballPitch } from '../game/football'
import { goKartTrack } from '../game/goKart'
import { distance2d, getLocation, worldLocations } from './world'
import type { LocationId } from '../game/types'

describe('world travel destinations', () => {
  it('keeps every central-town destination at its established coordinates', () => {
    expect(
      Object.fromEntries(
        worldLocations
          .filter((location) =>
            [
              'spawn',
              'park',
              'shop',
              'school',
              'obby',
              'houses',
              'parking',
            ].includes(location.id),
          )
          .map((location) => [location.id, location.position]),
      ),
    ).toEqual({
      spawn: [0, 0, 0],
      park: [-12, 0, -8],
      shop: [12, 0, -7],
      school: [-21, 0, 22],
      obby: [18, 0, 21],
      houses: [0, 0, 22],
      parking: [14, 0, -17],
    })
  })

  it('provides one grounded, nearby arrival point for every key location', () => {
    expect(worldLocations).toHaveLength(15)
    expect(new Set(worldLocations.map((location) => location.id)).size).toBe(
      worldLocations.length,
    )

    worldLocations.forEach((location) => {
      expect(location.travelPosition[1]).toBe(0)
      if (location.id === 'builder') {
        expect(distance2d(location.position, location.travelPosition)).toBe(0)
      } else if (location.id === 'football') {
        expect(
          distance2d(location.position, location.travelPosition),
        ).toBeGreaterThan(footballPitch.length / 2)
        expect(
          distance2d(location.position, location.travelPosition),
        ).toBeLessThan(footballPitch.length / 2 + 4)
      } else if (location.id === 'kart') {
        expect(
          distance2d(location.position, location.travelPosition),
        ).toBeGreaterThan(goKartTrack.depth / 2)
        expect(
          distance2d(location.position, location.travelPosition),
        ).toBeLessThan(goKartTrack.depth / 2 + 5)
      } else if (
        ['market', 'restaurant', 'delivery', 'farm'].includes(location.id)
      ) {
        expect(
          distance2d(location.position, location.travelPosition),
        ).toBeGreaterThan(7)
        expect(
          distance2d(location.position, location.travelPosition),
        ).toBeLessThan(9)
      } else {
        expect(
          distance2d(location.position, location.travelPosition),
        ).toBeGreaterThan(2.5)
        expect(
          distance2d(location.position, location.travelPosition),
        ).toBeLessThan(6)
      }
      expect(Number.isFinite(location.travelYaw)).toBe(true)
    })
  })

  it('arrives close enough to a parked car to make driving discoverable', () => {
    const parking = getLocation('parking')
    const nearestDistance = Math.min(
      ...createParkedVehicles().map((vehicle) =>
        distanceToVehicle(parking.travelPosition, vehicle),
      ),
    )

    expect(parking.label).toBe('Buddy Parking')
    expect(
      distance2d(parking.position, parking.travelPosition),
    ).toBeGreaterThan(2.5)
    expect(distance2d(parking.position, parking.travelPosition)).toBeLessThan(
      5.5,
    )
    expect(nearestDistance).toBeLessThan(vehicleInteractionRadius)
  })

  it('keeps building destinations outside their occupied footprints', () => {
    const buildingClearance: Record<
      'park' | 'shop' | 'school' | 'houses',
      number
    > = {
      park: 3.8,
      shop: 4,
      school: 4.25,
      houses: 4.4,
    }

    Object.entries(buildingClearance).forEach(([id, clearance]) => {
      const location = getLocation(id as keyof typeof buildingClearance)
      expect(
        distance2d(location.position, location.travelPosition),
      ).toBeGreaterThan(clearance)
    })
  })

  it('keeps Skill School as a real travel destination with a matching school building', () => {
    const school = getLocation('school')
    const schoolBuilding = staticTownBuildings.find(
      (building) => building.id === 'skill-school',
    )

    expect(school.label).toBe('Skill School')
    expect(school.description).toContain('school')
    expect(schoolBuilding).toMatchObject({
      title: 'Skill School',
      interiorKind: 'school',
    })
    expect(distance2d(school.position, schoolBuilding!.position)).toBe(0)
  })

  it('adds the outlying Football Pitch as a discoverable grid destination', () => {
    const football = getLocation('football')
    const parking = getLocation('parking')

    expect(football.label).toBe('Football Pitch')
    expect(football.description).toContain('score goals')
    expect(football.position).toEqual(footballPitch.center)
    expect(Math.abs(football.position[0])).toBeGreaterThan(27)
    expect(distance2d(football.position, parking.position)).toBeGreaterThan(
      footballPitch.width,
    )
  })

  it('adds the Go Kart Track as a discoverable remote activity destination', () => {
    const kart = getLocation('kart')
    const football = getLocation('football')

    expect(kart.label).toBe('Go Kart Track')
    expect(kart.description).toContain('driving')
    expect(kart.position).toEqual(goKartTrack.center)
    expect(Math.abs(kart.position[0])).toBeGreaterThan(27)
    expect(distance2d(kart.position, football.position)).toBeGreaterThan(
      footballPitch.width,
    )
  })

  it('places Builder Meadows on a clear player-buildable ground parcel', () => {
    const builder = getLocation('builder')

    expect(
      proceduralTerrainAt(builder.travelPosition[0], builder.travelPosition[2]),
    ).toBe('ground')
    expect(
      proceduralBuildableParcelFor(
        'LONDON-2026',
        builder.travelPosition,
        [1, 1, 1],
      ),
    ).toBeDefined()
  })

  it('adds four separated workplaces outside the central town', () => {
    const workLocations = ['market', 'restaurant', 'delivery', 'farm'].map(
      (id) => getLocation(id as LocationId),
    )

    expect(workLocations.map((location) => location.label)).toEqual([
      'Buddy Market',
      'Sunny Bites',
      'Buddy Delivery',
      'Sunshine Farm',
    ])
    workLocations.forEach((location) => {
      expect(Math.abs(location.position[0])).toBeGreaterThan(27)
      expect(
        distance2d(location.position, location.travelPosition),
      ).toBeGreaterThan(7)
      expect(
        distance2d(location.position, location.travelPosition),
      ).toBeLessThan(9)
    })
  })
})
