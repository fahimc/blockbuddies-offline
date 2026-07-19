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
import { distance2d, getLocation, worldLocations } from './world'

describe('world travel destinations', () => {
  it('provides one grounded, nearby arrival point for every key location', () => {
    expect(worldLocations).toHaveLength(10)
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

  it('adds Football Pitch as a discoverable playable destination', () => {
    const football = getLocation('football')
    const parking = getLocation('parking')

    expect(football.label).toBe('Football Pitch')
    expect(football.description).toContain('score goals')
    expect(football.position).toEqual(footballPitch.center)
    expect(Math.abs(football.position[0])).toBeLessThanOrEqual(27)
    expect(Math.abs(football.position[2])).toBeLessThanOrEqual(27)
    expect(distance2d(football.position, parking.position)).toBeGreaterThan(
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
})
