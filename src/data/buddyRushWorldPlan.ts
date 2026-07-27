import type { Vec3 } from '../game/types'

export type BuddyRushClubhouseStyle =
  'player' | 'moonlight' | 'builder' | 'party'

export type BuddyRushWorldSite = {
  id: string
  label: string
  kind: 'clubhouse' | 'bus-stop'
  style: BuddyRushClubhouseStyle
  position: Vec3
  footprint: Vec3
  placementClearance: number
  facingYaw: number
}

/**
 * Authored Buddy Rush sites live on the same deterministic 36-unit parcel grid
 * as the infinite town. The player's original central clubhouse remains fixed,
 * while rival clubs reserve one road-served parcel in three different districts.
 */
export const buddyRushWorldSites = {
  player: {
    id: 'player-clubhouse',
    label: 'Your Buddy Clubhouse',
    kind: 'clubhouse',
    style: 'player',
    position: [-12, 0, -8],
    footprint: [6.6, 1, 7.2],
    placementClearance: 0,
    facingYaw: 0,
  },
  luna: {
    id: 'luna-clubhouse',
    label: 'Moonlight Club',
    kind: 'clubhouse',
    style: 'moonlight',
    position: [67.35, 0, -41.075],
    footprint: [6.6, 1, 7],
    placementClearance: 2.5,
    facingYaw: -Math.PI / 2,
  },
  nori: {
    id: 'nori-clubhouse',
    label: 'Builder Base',
    kind: 'clubhouse',
    style: 'builder',
    position: [-67.35, 0, -18],
    footprint: [6.6, 1, 7],
    placementClearance: 2.5,
    facingYaw: Math.PI / 2,
  },
  pip: {
    id: 'pip-clubhouse',
    label: 'Pop Party House',
    kind: 'clubhouse',
    style: 'party',
    position: [67.35, 0, 42.667],
    footprint: [6.6, 1, 7],
    placementClearance: 2.5,
    facingYaw: -Math.PI / 2,
  },
  bus: {
    id: 'buddy-bus-stop',
    label: 'Buddy Bus Stop',
    kind: 'bus-stop',
    style: 'player',
    position: [45.2, 0, -18],
    footprint: [4, 1, 5.4],
    placementClearance: 1.25,
    // The shelter's open local +Z side faces east toward the x=54 road.
    facingYaw: Math.PI / 2,
  },
} as const satisfies Record<string, BuddyRushWorldSite>

export const buddyRushRivalSites = [
  buddyRushWorldSites.luna,
  buddyRushWorldSites.nori,
  buddyRushWorldSites.pip,
] as const

export const buddyRushReservedSites = [
  ...buddyRushRivalSites,
  buddyRushWorldSites.bus,
] as const

export const buddyRushSiteByRivalId = {
  'luna-club': buddyRushWorldSites.luna,
  'nori-club': buddyRushWorldSites.nori,
  'pip-club': buddyRushWorldSites.pip,
} as const

export function orientedBuddyRushFootprint(site: BuddyRushWorldSite): Vec3 {
  const cosine = Math.abs(Math.cos(site.facingYaw))
  const sine = Math.abs(Math.sin(site.facingYaw))
  return [
    site.footprint[0] * cosine + site.footprint[2] * sine,
    site.footprint[1],
    site.footprint[0] * sine + site.footprint[2] * cosine,
  ]
}

export function buddyRushReservationFootprint(site: BuddyRushWorldSite): Vec3 {
  const footprint = orientedBuddyRushFootprint(site)
  return [
    footprint[0] + site.placementClearance * 2,
    footprint[1],
    footprint[2] + site.placementClearance * 2,
  ]
}

export function footprintsOverlap(
  firstCenter: Vec3,
  firstSize: Vec3,
  secondCenter: Vec3,
  secondSize: Vec3,
  padding = 0,
) {
  return (
    Math.abs(firstCenter[0] - secondCenter[0]) <
      firstSize[0] / 2 + secondSize[0] / 2 + padding &&
    Math.abs(firstCenter[2] - secondCenter[2]) <
      firstSize[2] / 2 + secondSize[2] / 2 + padding
  )
}
