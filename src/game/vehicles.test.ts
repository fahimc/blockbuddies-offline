import { describe, expect, it } from 'vitest'
import { realScale } from './scale'
import {
  advanceDrivableVehicle,
  advanceDrivableVehicleWithCollisions,
  collisionBoxOverlapsParkingClearance,
  createParkedVehicles,
  distanceToVehicle,
  drivingInputFromControls,
  drivingSteerFromStrafe,
  drivableVehicleCollisionBox,
  getDrivableVehicle,
  parkingLot,
  parkingClearancePadding,
  safeVehicleExitPosition,
  vehicleRenderYaw,
} from './vehicles'

describe('parking and drivable vehicles', () => {
  it('places three realistically spaced cars fully inside the parking bays', () => {
    const vehicles = createParkedVehicles()
    expect(vehicles).toHaveLength(3)

    vehicles.forEach((vehicle) => {
      const box = drivableVehicleCollisionBox(vehicle)
      expect(
        Math.abs(vehicle.position[0] - parkingLot.center[0]) + box.half[0],
      ).toBeLessThan(parkingLot.width / 2)
      expect(
        Math.abs(vehicle.position[2] - parkingLot.center[2]) + box.half[2],
      ).toBeLessThan(parkingLot.depth / 2)
    })
    expect(
      Math.abs(vehicles[1].position[2] - vehicles[0].position[2]),
    ).toBeGreaterThan(realScale.carWidth)
  })

  it('uses heading yaw for movement and converts it to the car mesh axis', () => {
    const vehicle = createParkedVehicles()[0]
    const moved = advanceDrivableVehicle(
      vehicle,
      { throttle: 1, steer: 0, brake: false },
      0.1,
    )

    expect(moved.position[0]).toBeGreaterThan(vehicle.position[0])
    expect(moved.speed).toBeGreaterThan(0)
    expect(vehicleRenderYaw(Math.PI / 2)).toBeCloseTo(0)
  })

  it('steers, reverses, and brakes without exceeding configured motion', () => {
    const vehicle = { ...createParkedVehicles()[0], speed: 5 }
    const positiveSteer = advanceDrivableVehicle(
      vehicle,
      { throttle: 1, steer: 1, brake: false },
      0.1,
    )
    const negativeSteer = advanceDrivableVehicle(
      vehicle,
      { throttle: 1, steer: -1, brake: false },
      0.1,
    )
    const reversed = advanceDrivableVehicle(
      { ...vehicle, speed: -2 },
      { throttle: -1, steer: 0, brake: false },
      0.1,
    )
    const braked = advanceDrivableVehicle(
      vehicle,
      { throttle: 1, steer: 0, brake: true },
      0.1,
    )

    expect(positiveSteer.yaw).toBeGreaterThan(vehicle.yaw)
    expect(negativeSteer.yaw).toBeLessThan(vehicle.yaw)
    expect(reversed.position[0]).toBeLessThan(vehicle.position[0])
    expect(Math.abs(braked.speed)).toBeLessThan(Math.abs(vehicle.speed))
  })

  it('maps screen left and right controls to the expected car turn direction', () => {
    const vehicle = { ...createParkedVehicles()[0], speed: 5 }
    const fromLeftControl = advanceDrivableVehicle(
      vehicle,
      {
        throttle: 1,
        steer: drivingSteerFromStrafe(-1),
        brake: false,
      },
      0.1,
    )
    const fromRightControl = advanceDrivableVehicle(
      vehicle,
      {
        throttle: 1,
        steer: drivingSteerFromStrafe(1),
        brake: false,
      },
      0.1,
    )

    expect(fromLeftControl.yaw).toBeGreaterThan(vehicle.yaw)
    expect(fromRightControl.yaw).toBeLessThan(vehicle.yaw)
  })

  it('maps player drive controls so forward drives through the car front and back reverses', () => {
    const vehicle = createParkedVehicles()[0]
    const forward = advanceDrivableVehicle(
      vehicle,
      drivingInputFromControls(1, 0, false),
      0.1,
    )
    const reverse = advanceDrivableVehicle(
      vehicle,
      drivingInputFromControls(-1, 0, false),
      0.1,
    )

    expect(forward.position[0]).toBeGreaterThan(vehicle.position[0])
    expect(forward.speed).toBeGreaterThan(0)
    expect(reverse.position[0]).toBeLessThan(vehicle.position[0])
    expect(reverse.speed).toBeLessThan(0)
  })

  it('labels hijacked traffic cars as drivable HUD vehicles', () => {
    expect(getDrivableVehicle('traffic-drive:traffic-1')?.label).toBe(
      'Traffic Car',
    )
  })

  it('stops against solid objects instead of passing through them', () => {
    const vehicle = { ...createParkedVehicles()[0], speed: 8 }
    const obstacle = {
      id: 'wall',
      center: [
        vehicle.position[0] + realScale.carLength / 2 + 0.25,
        1,
        vehicle.position[2],
      ] as [number, number, number],
      half: [0.2, 1, 2] as [number, number, number],
    }
    const stopped = advanceDrivableVehicleWithCollisions(
      vehicle,
      { throttle: 1, steer: 0, brake: false },
      0.1,
      [obstacle],
    )

    expect(stopped.position).toEqual(vehicle.position)
    expect(stopped.speed).toBe(0)
  })

  it('uses swept collision so cars cannot tunnel through thin posts', () => {
    const vehicle = { ...createParkedVehicles()[0], speed: 11 }
    const thinPost = {
      id: 'lamp-post',
      center: [
        vehicle.position[0] + realScale.carLength / 2 + 0.8,
        1.2,
        vehicle.position[2],
      ] as [number, number, number],
      half: [0.08, 1.2, 0.08] as [number, number, number],
    }
    const stopped = advanceDrivableVehicleWithCollisions(
      vehicle,
      { throttle: 1, steer: 0, brake: false },
      0.1,
      [thinPost],
    )

    expect(stopped.position).toEqual(vehicle.position)
    expect(stopped.speed).toBe(0)
  })

  it('drives forward across low road and driveway surface boxes without invisible blocking', () => {
    const vehicle = {
      ...createParkedVehicles()[0],
      position: [10, 0.07, -16] as [number, number, number],
      yaw: Math.PI / 2,
      speed: 8,
    }
    const roadSurface = {
      id: 'road:surface-at-intersection',
      center: [vehicle.position[0] + 0.85, 0.04, vehicle.position[2]] as [
        number,
        number,
        number,
      ],
      half: [4, 0.06, 4] as [number, number, number],
    }

    const moved = advanceDrivableVehicleWithCollisions(
      vehicle,
      drivingInputFromControls(1, 0, false),
      0.1,
      [roadSurface],
    )

    expect(moved.position[0]).toBeGreaterThan(vehicle.position[0] + 0.2)
    expect(moved.speed).toBeGreaterThan(0)
  })

  it('does not stop at the old invisible central-town road boundary', () => {
    const vehicle = {
      ...createParkedVehicles()[0],
      position: [21.1, 0.07, 18] as [number, number, number],
      yaw: Math.PI / 2,
      speed: 8,
    }

    const moved = advanceDrivableVehicleWithCollisions(
      vehicle,
      drivingInputFromControls(1, 0, false),
      0.1,
      [],
    )

    expect(moved.position[0]).toBeGreaterThan(vehicle.position[0])
    expect(moved.speed).toBeGreaterThan(0)
  })

  it('keeps driving and supports exits beyond the former outer world clamp', () => {
    const vehicle = {
      ...createParkedVehicles()[0],
      position: [140, 0.07, -42] as [number, number, number],
      yaw: Math.PI / 2,
      speed: 8,
    }

    const moved = advanceDrivableVehicleWithCollisions(
      vehicle,
      drivingInputFromControls(1, 0, false),
      0.1,
      [],
    )

    expect(moved.position[0]).toBeGreaterThan(140)
    expect(safeVehicleExitPosition(moved, [])?.[0]).toBeGreaterThan(140)
  })

  it('reserves a wider clearance area around the parking bays and driveway', () => {
    expect(parkingClearancePadding).toBeGreaterThanOrEqual(2.5)
    const treeNearCarExit = {
      id: 'tree',
      center: [
        parkingLot.center[0] + parkingLot.width / 2 + 1.7,
        2,
        parkingLot.center[2],
      ] as [number, number, number],
      half: [realScale.treeCanopySize / 2, 2, realScale.treeCanopySize / 2] as [
        number,
        number,
        number,
      ],
    }

    expect(collisionBoxOverlapsParkingClearance(treeNearCarExit)).toBe(true)
  })

  it('measures interaction from the car body and finds a clear side exit', () => {
    const vehicle = createParkedVehicles()[0]
    const body = drivableVehicleCollisionBox(vehicle)
    const besideCar: [number, number, number] = [
      vehicle.position[0],
      0,
      vehicle.position[2] - realScale.carWidth / 2 - 0.5,
    ]
    const exit = safeVehicleExitPosition(vehicle, [body])

    expect(distanceToVehicle(besideCar, vehicle)).toBeCloseTo(0.5)
    expect(exit).toBeDefined()
    expect(distanceToVehicle(exit!, vehicle)).toBeGreaterThan(0.4)
  })

  it('allows safe vehicle exits on generated roads outside the old central town box', () => {
    const vehicle = {
      ...createParkedVehicles()[0],
      position: [42, 0.07, 18] as [number, number, number],
      yaw: Math.PI / 2,
    }

    const exit = safeVehicleExitPosition(vehicle, [])

    expect(exit).toBeDefined()
    expect(exit?.[0]).toBeGreaterThan(40)
  })
})
