import { describe, expect, it } from 'vitest'
import { createParkedVehicles, distanceToVehicle, vehicleInteractionRadius } from '../game/vehicles'
import { distance2d, getLocation, worldLocations } from './world'

describe('world travel destinations', () => {
  it('provides one grounded, nearby arrival point for every key location', () => {
    expect(worldLocations).toHaveLength(7)
    expect(new Set(worldLocations.map((location) => location.id)).size).toBe(worldLocations.length)

    worldLocations.forEach((location) => {
      expect(location.travelPosition[1]).toBe(0)
      expect(distance2d(location.position, location.travelPosition)).toBeGreaterThan(2.5)
      expect(distance2d(location.position, location.travelPosition)).toBeLessThan(5.5)
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
    expect(distance2d(parking.position, parking.travelPosition)).toBeGreaterThan(2.5)
    expect(distance2d(parking.position, parking.travelPosition)).toBeLessThan(5.5)
    expect(nearestDistance).toBeLessThan(vehicleInteractionRadius)
  })

  it('keeps building destinations outside their occupied footprints', () => {
    const buildingClearance: Record<'park' | 'shop' | 'school' | 'houses', number> = {
      park: 3.8,
      shop: 4,
      school: 4.25,
      houses: 4.4,
    }

    Object.entries(buildingClearance).forEach(([id, clearance]) => {
      const location = getLocation(id as keyof typeof buildingClearance)
      expect(distance2d(location.position, location.travelPosition)).toBeGreaterThan(clearance)
    })
  })
})
