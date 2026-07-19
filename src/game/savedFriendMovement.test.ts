import { describe, expect, it } from 'vitest'
import { defaultAvatar } from '../state/gameStore'
import type { SavedFriend } from './types'
import {
  createSavedFriendMovement,
  createSavedFriendNavigationPath,
  savedFriendPositionAt,
  savedFriendTravelSeconds,
  snapSavedFriendDestination,
} from './savedFriendMovement'

function friendAt(position: [number, number, number]): SavedFriend {
  return {
    id: 'friend-1',
    name: 'Map Walker',
    avatar: defaultAvatar,
    inWorld: true,
    route: ['spawn'],
    position,
    createdAt: 1,
  }
}

describe('saved friend movement', () => {
  it('plans long journeys through the deterministic connected road grid', () => {
    const path = createSavedFriendNavigationPath([0, 0, 0], [90, 0, -32.8])

    expect(path[0]).toEqual([0, 0, 0])
    expect(path.at(-1)).toEqual([90, 0, -33])
    expect(path).toContainEqual([54, 0, 9])
    expect(path).toContainEqual([54, 0, -63])
  })

  it('interpolates the same persisted waypoint command for every renderer', () => {
    const startedAt = 10_000
    const friend = friendAt([0, 0, 0])
    const movement = createSavedFriendMovement(
      friend,
      [90, 0, -32.8],
      startedAt,
    )
    const movingFriend = { ...friend, movement }

    expect(savedFriendPositionAt(movingFriend, startedAt)).toEqual([0, 0, 0])
    expect(savedFriendPositionAt(movingFriend, startedAt + 5_000)).not.toEqual(
      movement.destination,
    )
    expect(
      savedFriendPositionAt(
        movingFriend,
        startedAt + savedFriendTravelSeconds(movement) * 1_000 + 1,
      ),
    ).toEqual(movement.destination)
  })

  it('snaps teleport and map destinations to stable half-unit coordinates', () => {
    expect(snapSavedFriendDestination([-72.24, 9, 54.26])).toEqual([
      -72, 0, 54.5,
    ])
  })
})
