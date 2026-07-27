import { buddyActivityStationDefinitions } from '../data/buddyRush'
import {
  buddyRushRivalSites,
  buddyRushWorldSites,
  type BuddyRushWorldSite,
} from '../data/buddyRushWorldPlan'
import type { Vec3 } from './types'
import type { CollisionBox } from './collision'

export type CollisionCategory = 'building' | 'object' | 'person'

export type LocalCollisionPart = {
  id: string
  center: Vec3
  size: Vec3
}

export type CollisionModule = {
  id: string
  category: CollisionCategory
  boxes: CollisionBox[]
}

export const rivalClubhouseSolidParts: readonly LocalCollisionPart[] = [
  {
    id: 'main-room',
    center: [0, 1.55, -0.45],
    size: [5.4, 3.1, 4.4],
  },
  {
    id: 'left-porch-post',
    center: [-2.15, 1.25, 2],
    size: [0.3, 2.5, 0.3],
  },
  {
    id: 'right-porch-post',
    center: [2.15, 1.25, 2],
    size: [0.3, 2.5, 0.3],
  },
]

export const buddyBusStopSolidParts: readonly LocalCollisionPart[] = [
  {
    id: 'shelter-back',
    center: [0, 1.35, -2.55],
    size: [3.3, 2.7, 0.16],
  },
  {
    id: 'shelter-left',
    center: [-1.58, 1.35, -1.55],
    size: [0.16, 2.7, 2.15],
  },
  {
    id: 'shelter-right',
    center: [1.58, 1.35, -1.55],
    size: [0.16, 2.7, 2.15],
  },
  {
    id: 'bench',
    center: [0, 0.55, -1.85],
    size: [2.35, 0.65, 0.58],
  },
  {
    id: 'route-pole',
    center: [1.72, 1.4, 1.4],
    size: [0.18, 2.8, 0.18],
  },
]

export function createCollisionModule({
  id,
  category,
  origin,
  yaw = 0,
  parts,
}: {
  id: string
  category: CollisionCategory
  origin: Vec3
  yaw?: number
  parts: readonly LocalCollisionPart[]
}): CollisionModule {
  const cosine = Math.cos(yaw)
  const sine = Math.sin(yaw)
  const absoluteCosine = Math.abs(cosine)
  const absoluteSine = Math.abs(sine)
  return {
    id,
    category,
    boxes: parts.map((part) => {
      const x = part.center[0] * cosine + part.center[2] * sine
      const z = -part.center[0] * sine + part.center[2] * cosine
      return {
        id: `${id}:${part.id}`,
        center: [
          origin[0] + x,
          origin[1] + part.center[1],
          origin[2] + z,
        ],
        half: [
          (part.size[0] * absoluteCosine +
            part.size[2] * absoluteSine) /
            2,
          part.size[1] / 2,
          (part.size[0] * absoluteSine +
            part.size[2] * absoluteCosine) /
            2,
        ],
      }
    }),
  }
}

function clubhouseCollisionModule(site: BuddyRushWorldSite) {
  return createCollisionModule({
    id: `buddy-rush:${site.id}`,
    category: 'building',
    origin: site.position,
    yaw: site.facingYaw,
    parts: rivalClubhouseSolidParts,
  })
}

function activityCollisionModules(): CollisionModule[] {
  return buddyActivityStationDefinitions.flatMap((station) => {
    const part: LocalCollisionPart | undefined =
      station.id === 'clubhouse-bakery'
        ? {
            id: 'counter',
            center: [0, 0.7, 0],
            size: [1.7, 1.2, 1.2],
          }
        : station.id === 'clubhouse-arcade'
          ? {
              id: 'cabinet',
              center: [0, 0.9, 0],
              size: [1.5, 1.8, 1],
            }
          : undefined
    return part
      ? [
          createCollisionModule({
            id: `buddy-rush:${station.id}`,
            category: 'object',
            origin: station.position,
            parts: [part],
          }),
        ]
      : []
  })
}

export const buddyRushWorldCollisionModules: readonly CollisionModule[] = [
  ...buddyRushRivalSites.map(clubhouseCollisionModule),
  createCollisionModule({
    id: `buddy-rush:${buddyRushWorldSites.bus.id}`,
    category: 'object',
    origin: buddyRushWorldSites.bus.position,
    yaw: buddyRushWorldSites.bus.facingYaw,
    parts: buddyBusStopSolidParts,
  }),
  ...activityCollisionModules(),
]

export const buddyRushWorldCollisionBoxes =
  buddyRushWorldCollisionModules.flatMap((module) => module.boxes)

export function actorCollisionBox(
  id: string,
  position: Vec3,
  radius = 0.48,
): CollisionBox {
  return {
    id: `person:${id}`,
    center: [position[0], 1.28, position[2]],
    half: [radius, 1.28, radius],
  }
}

export function actorCollisionBoxes(
  actors: ReadonlyArray<{ id: string; position: Vec3 }>,
) {
  return actors.map((actor) => actorCollisionBox(actor.id, actor.position))
}
