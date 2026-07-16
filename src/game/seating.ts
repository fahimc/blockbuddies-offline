import { classroomStations } from './classroom'
import { avatarSeatRootLift } from './scale'
import type { InteriorKind, Vec3 } from './types'

export type SeatKind = 'chair' | 'sofa' | 'bench'

export type SeatTarget = {
  id: string
  label: string
  kind: SeatKind
  context: InteriorKind | 'outdoor'
  position: Vec3
  exitPosition: Vec3
  yaw: number
}

export const seatInteractionRadius = 1.45
export const seatMarkerRadius = 3.1

export const outdoorBenchFixtures: { position: Vec3; rotation: number }[] = [
  { position: [-19, 0.35, -12], rotation: 0 },
  { position: [-7.5, 0.35, -12], rotation: 0 },
  { position: [-19, 0.35, -1], rotation: Math.PI },
  { position: [-7.5, 0.35, -1], rotation: Math.PI },
]

const classroomSeats: SeatTarget[] = classroomStations.map((station) =>
  makeSeat({
    id: `school-chair-${station.id}`,
    label: 'Classroom chair',
    kind: 'chair',
    context: 'school',
    position: station.chairPosition,
    surfaceY: 0.56,
    yaw: 0,
    exitOffset: [station.chairPosition[0] >= 0 ? 0.92 : -0.92, 0, 0],
  }),
)

const houseSeats: SeatTarget[] = [-0.72, 0.72].map((z, index) =>
  makeSeat({
    id: `house-sofa-${index + 1}`,
    label: 'Sofa seat',
    kind: 'sofa',
    context: 'house',
    position: [-4.02, 0, 1.3 + z],
    surfaceY: 0.58,
    yaw: Math.PI / 2,
    exitOffset: [1.45, 0, 0],
  }),
)

const lobbySeats: SeatTarget[] = [
  ...[-0.72, 0.72].map((z, index) =>
    makeSeat({
      id: `lobby-left-sofa-${index + 1}`,
      label: 'Lobby sofa',
      kind: 'sofa',
      context: 'building',
      position: [-4.02, 0, 0.6 + z],
      surfaceY: 0.58,
      yaw: Math.PI / 2,
      exitOffset: [1.45, 0, 0],
    }),
  ),
  ...[-0.72, 0.72].map((z, index) =>
    makeSeat({
      id: `lobby-right-sofa-${index + 1}`,
      label: 'Lobby sofa',
      kind: 'sofa',
      context: 'building',
      position: [4.02, 0, 0.6 + z],
      surfaceY: 0.58,
      yaw: -Math.PI / 2,
      exitOffset: [-1.45, 0, 0],
    }),
  ),
]

const outdoorSeats: SeatTarget[] = outdoorBenchFixtures.flatMap((fixture, benchIndex) =>
  [-0.58, 0.58].map((localX, seatIndex) => {
    const position = rotatePoint(fixture.position, fixture.rotation, [localX, 0, 0.04])
    const exit = rotatePoint(fixture.position, fixture.rotation, [localX, 0, 1.08])
    return makeSeat({
      id: `park-bench-${benchIndex + 1}-${seatIndex + 1}`,
      label: 'Park bench',
      kind: 'bench',
      context: 'outdoor',
      position,
      surfaceY: 0.61,
      yaw: fixture.rotation,
      exitPosition: [exit[0], 0, exit[2]],
    })
  }),
)

export const allSeatTargets = [
  ...classroomSeats,
  ...houseSeats,
  ...lobbySeats,
  ...outdoorSeats,
]

export function seatsForContext(kind?: InteriorKind) {
  const context = kind ?? 'outdoor'
  return allSeatTargets.filter((seat) => seat.context === context)
}

export function nearestSeatTarget(position: Vec3, seats: SeatTarget[], maxDistance = seatInteractionRadius) {
  let nearest: SeatTarget | undefined
  let nearestDistance = Infinity
  for (const seat of seats) {
    const distance = seatDistance(position, seat)
    if (distance <= maxDistance && distance < nearestDistance) {
      nearest = seat
      nearestDistance = distance
    }
  }
  return nearest
}

export function seatDistance(position: Vec3, seat: SeatTarget) {
  return Math.hypot(position[0] - seat.position[0], position[2] - seat.position[2])
}

function makeSeat({
  id,
  label,
  kind,
  context,
  position,
  surfaceY,
  yaw,
  exitOffset,
  exitPosition,
}: {
  id: string
  label: string
  kind: SeatKind
  context: InteriorKind | 'outdoor'
  position: Vec3
  surfaceY: number
  yaw: number
  exitOffset?: Vec3
  exitPosition?: Vec3
}): SeatTarget {
  const exit = exitPosition ?? [position[0] + (exitOffset?.[0] ?? 0), 0, position[2] + (exitOffset?.[2] ?? 0)]
  return {
    id,
    label,
    kind,
    context,
    position: [position[0], surfaceY + avatarSeatRootLift, position[2]],
    exitPosition: exit as Vec3,
    yaw,
  }
}

function rotatePoint(origin: Vec3, yaw: number, offset: Vec3): Vec3 {
  const cosine = Math.cos(yaw)
  const sine = Math.sin(yaw)
  return [
    origin[0] + offset[0] * cosine + offset[2] * sine,
    origin[1] + offset[1],
    origin[2] - offset[0] * sine + offset[2] * cosine,
  ]
}
