import { describe, expect, it } from 'vitest'
import { miniGameDefinition } from '../ai/miniGames'
import { staticTownBuildings } from '../game/townPlacement'
import type { JobId, LocationId, MiniGameId, QuestId } from '../game/types'
import { getJobDefinition } from './jobs'
import { getLocation, worldLocations } from './world'
import { questDefinitions } from './quests'

type QuestCompletionRoute =
  | { kind: 'location'; locationId: LocationId }
  | { kind: 'map'; locationIds: LocationId[] }
  | { kind: 'message' }
  | { kind: 'obby'; locationId: 'obby' }
  | { kind: 'coinPickup' }
  | { kind: 'toy'; locationId: 'houses' }
  | { kind: 'build'; locationId: 'builder' }
  | { kind: 'vehicle'; locationId: 'parking' }
  | { kind: 'seat' }
  | { kind: 'bed'; locationId: 'houses' }
  | { kind: 'emote' }
  | { kind: 'miniGame'; miniGameId: MiniGameId }
  | { kind: 'job'; jobId: JobId }
  | { kind: 'buddyRush'; action: 'recruit' | 'defend' | 'rescue' }

const questCompletionRoutes = {
  'meet-three-buddies': {
    kind: 'map',
    locationIds: ['spawn', 'park', 'school'],
  },
  'visit-park': { kind: 'location', locationId: 'park' },
  'visit-school': { kind: 'location', locationId: 'school' },
  'visit-shop': { kind: 'location', locationId: 'shop' },
  'use-town-map': {
    kind: 'map',
    locationIds: ['spawn', 'park', 'shop', 'school', 'obby', 'houses'],
  },
  'message-a-buddy': { kind: 'message' },
  'beginner-obby': { kind: 'obby', locationId: 'obby' },
  'collect-10-coins': { kind: 'coinPickup' },
  'find-toy': { kind: 'toy', locationId: 'houses' },
  'build-first-piece': { kind: 'build', locationId: 'builder' },
  'drive-a-car': { kind: 'vehicle', locationId: 'parking' },
  'take-a-seat': { kind: 'seat' },
  'sleep-in-bed': { kind: 'bed', locationId: 'houses' },
  'try-an-emote': { kind: 'emote' },
  'play-coin-rush': { kind: 'miniGame', miniGameId: 'coin-rush' },
  'deliver-a-package': { kind: 'miniGame', miniGameId: 'delivery-dash' },
  'find-hidden-buddies': { kind: 'miniGame', miniGameId: 'hide-and-seek' },
  'work-shopkeeper-shift': { kind: 'job', jobId: 'shopkeeper' },
  'work-restaurant-shift': { kind: 'job', jobId: 'restaurant' },
  'work-delivery-shift': { kind: 'job', jobId: 'delivery' },
  'work-farm-shift': { kind: 'job', jobId: 'farming' },
  'recruit-first-buddy': { kind: 'buddyRush', action: 'recruit' },
  'defend-buddy-rush': { kind: 'buddyRush', action: 'defend' },
  'rescue-visiting-buddy': { kind: 'buddyRush', action: 'rescue' },
} satisfies Record<QuestId, QuestCompletionRoute>

describe('quest definitions', () => {
  it('gives every quest actionable completion instructions and a tested route', () => {
    expect(questDefinitions).toHaveLength(
      Object.keys(questCompletionRoutes).length,
    )

    questDefinitions.forEach((quest) => {
      expect(quest.title.trim().length).toBeGreaterThan(3)
      expect(quest.description.trim().length).toBeGreaterThan(12)
      expect(quest.howTo.trim().length).toBeGreaterThan(24)
      expect(quest.tip.trim().length).toBeGreaterThan(16)
      expect(quest.howTo).not.toMatch(/\.\.\.|todo|tbd/i)
      expect(quest.tip).not.toMatch(/\.\.\.|todo|tbd/i)
      expect(quest.target).toBeGreaterThan(0)
      expect(quest.reward).toBeGreaterThan(0)
      expect(questCompletionRoutes[quest.id]).toBeDefined()
    })
  })

  it('points location quests at real world destinations and buildings', () => {
    Object.values(questCompletionRoutes).forEach((route) => {
      if ('locationId' in route) {
        expect(getLocation(route.locationId).id).toBe(route.locationId)
      }
      if (route.kind === 'map') {
        route.locationIds.forEach((locationId) =>
          expect(getLocation(locationId).id).toBe(locationId),
        )
      }
      if (route.kind === 'miniGame') {
        expect(miniGameDefinition(route.miniGameId).id).toBe(route.miniGameId)
      }
      if (route.kind === 'job') {
        expect(getJobDefinition(route.jobId).id).toBe(route.jobId)
      }
    })

    const school = getLocation('school')
    expect(school.label).toBe('Skill School')
    expect(worldLocations.map((location) => location.id)).toContain('school')
    expect(
      staticTownBuildings.some(
        (building) =>
          building.id === 'skill-school' &&
          building.title === 'Skill School' &&
          building.interiorKind === 'school',
      ),
    ).toBe(true)
  })
})
