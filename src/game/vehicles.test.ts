import { describe, expect, it } from 'vitest'
import { realScale } from './scale'
import {
  advanceDrivableVehicle,
  advanceDrivableVehicleWithCollisions,
  createParkedVehicles,
  distanceToVehicle,
  drivableVehicleCollisionBox,
  parkingLot,
  safeVehicleExitPosition,
  vehicleRenderYaw,
} from './vehicles'

describe('parking and drivable vehicles', () => {
  it('places three realistically spaced cars fully inside the parking bays', () => {
    const vehicles = createParkedVehicles()
    expect(vehicles).toHaveLength(3)

    vehicles.forEach((vehicle) => {
      const box = drivableVehicleCollisionBox(vehicle)
      expect(Math.abs(vehicle.position[0] - parkingLot.center[0]) + box.half[0]).toBeLessThan(parkingLot.width / 2)
      expect(Math.abs(vehicle.position[2] - parkingLot.center[2]) + box.half[2]).toBeLessThan(parkingLot.depth / 2)
    })
    expect(Math.abs(vehicles[1].position[2] - vehicles[0].position[2])).toBeGreaterThan(realScale.carWidth)
  })

  it('uses heading yaw for movement and converts it to the car mesh axis', () => {
    const vehicle = createParkedVehicles()[0]
    const moved = advanceDrivableVehicle(vehicle, { throttle: 1, steer: 0, brake: false }, 0.1)

    expect(moved.position[0]).toBeLessThan(vehicle.position[0])
    expect(moved.speed).toBeGreaterThan(0)
    expect(vehicleRenderYaw(-Math.PI / 2)).toBeCloseTo(-Math.PI)
  })

  it('steers, reverses, and brakes without exceeding configured motion', () => {
    const vehicle = { ...createParkedVehicles()[0], speed: 5 }
    const steered = advanceDrivableVehicle(vehicle, { throttle: 1, steer: 1, brake: false }, 0.1)
    const reversed = advanceDrivableVehicle({ ...vehicle, speed: -2 }, { throttle: -1, steer: 0, brake: false }, 0.1)
    const braked = advanceDrivableVehicle(vehicle, { throttle: 1, steer: 0, brake: true }, 0.1)

    expect(steered.yaw).toBeLessThan(vehicle.yaw)
    expect(reversed.position[0]).toBeGreaterThan(vehicle.position[0])
    expect(Math.abs(braked.speed)).toBeLessThan(Math.abs(vehicle.speed))
  })

  it('stops against solid objects instead of passing through them', () => {
    const vehicle = { ...createParkedVehicles()[0], speed: 8 }
    const obstacle = {
      id: 'wall',
      center: [vehicle.position[0] - realScale.carLength / 2 - 0.25, 1, vehicle.position[2]] as [number, number, number],
      half: [0.2, 1, 2] as [number, number, number],
    }
    const stopped = advanceDrivableVehicleWithCollisions(vehicle, { throttle: 1, steer: 0, brake: false }, 0.1, [obstacle])

    expect(stopped.position).toEqual(vehicle.position)
    expect(stopped.speed).toBe(0)
  })

  it('measures interaction from the car body and finds a clear side exit', () => {
    const vehicle = createParkedVehicles()[0]
    const body = drivableVehicleCollisionBox(vehicle)
    const besideCar: [number, number, number] = [vehicle.position[0], 0, vehicle.position[2] - realScale.carWidth / 2 - 0.5]
    const exit = safeVehicleExitPosition(vehicle, [body])

    expect(distanceToVehicle(besideCar, vehicle)).toBeCloseTo(0.5)
    expect(exit).toBeDefined()
    expect(distanceToVehicle(exit!, vehicle)).toBeGreaterThan(0.4)
  })
})
