import { describe, expect, it } from 'vitest'
import { avatarSeatRootLift } from './scale'
import {
  allSeatTargets,
  nearestSeatTarget,
  outdoorBenchFixtures,
  seatsForContext,
} from './seating'

describe('seat targets', () => {
  it('registers every classroom chair and both places on every park bench', () => {
    expect(seatsForContext('school')).toHaveLength(6)
    expect(seatsForContext()).toHaveLength(outdoorBenchFixtures.length * 2)
    expect(allSeatTargets.every((seat) => seat.position[1] > avatarSeatRootLift)).toBe(true)
  })

  it('only selects a seat inside the interaction radius', () => {
    const seat = seatsForContext('school')[0]

    expect(nearestSeatTarget([seat.position[0] + 0.4, 0, seat.position[2]], seatsForContext('school'))?.id).toBe(seat.id)
    expect(nearestSeatTarget([seat.position[0], 0, seat.position[2] - 5], seatsForContext('school'))).toBeUndefined()
  })

  it('provides a distinct ground-level exit beside every seat', () => {
    allSeatTargets.forEach((seat) => {
      expect(seat.exitPosition[1]).toBe(0)
      expect(Math.hypot(seat.position[0] - seat.exitPosition[0], seat.position[2] - seat.exitPosition[2])).toBeGreaterThan(0.75)
    })
  })
})
