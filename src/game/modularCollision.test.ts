import { describe, expect, it } from 'vitest'
import {
  buddyRushRivalSites,
  buddyRushWorldSites,
  orientedBuddyRushFootprint,
} from '../data/buddyRushWorldPlan'
import {
  actorCollisionBox,
  buddyRushWorldCollisionModules,
  createCollisionModule,
} from './modularCollision'
import { collidesCircleWithBox } from './collision'

describe('modular world collision', () => {
  it('rotates compound collision parts with their visual module', () => {
    const module = createCollisionModule({
      id: 'rotated',
      category: 'object',
      origin: [10, 0, 20],
      yaw: Math.PI / 2,
      parts: [{ id: 'wide', center: [1, 1, 2], size: [4, 2, 1] }],
    })

    expect(module.boxes[0].center[0]).toBeCloseTo(12)
    expect(module.boxes[0].center[2]).toBeCloseTo(19)
    expect(module.boxes[0].half[0]).toBeCloseTo(0.5)
    expect(module.boxes[0].half[2]).toBeCloseTo(2)
  })

  it('gives every rival club and the bus stop a uniquely named compound proxy', () => {
    const moduleIds = new Set(
      buddyRushWorldCollisionModules.map((module) => module.id),
    )
    for (const site of [...buddyRushRivalSites, buddyRushWorldSites.bus]) {
      expect(moduleIds.has(`buddy-rush:${site.id}`), site.id).toBe(true)
    }
    const boxIds = buddyRushWorldCollisionModules.flatMap((module) =>
      module.boxes.map((box) => box.id),
    )
    expect(new Set(boxIds).size).toBe(boxIds.length)
  })

  it('keeps clubhouse collision proxies inside their reserved lots', () => {
    for (const site of buddyRushRivalSites) {
      const footprint = orientedBuddyRushFootprint(site)
      const module = buddyRushWorldCollisionModules.find(
        (candidate) => candidate.id === `buddy-rush:${site.id}`,
      )
      expect(module).toBeDefined()
      expect(
        module?.boxes.every(
          (box) =>
            Math.abs(box.center[0] - site.position[0]) + box.half[0] <=
              footprint[0] / 2 + 0.001 &&
            Math.abs(box.center[2] - site.position[2]) + box.half[2] <=
              footprint[2] / 2 + 0.001,
        ),
      ).toBe(true)
    }
  })

  it('uses the same collision API for people', () => {
    const person = actorCollisionBox('npc:maya', [3, 0, 4])
    expect(person.id).toBe('person:npc:maya')
    expect(collidesCircleWithBox(3.2, 4.1, 0.42, person)).toBe(true)
    expect(collidesCircleWithBox(8, 8, 0.42, person)).toBe(false)
  })
})
