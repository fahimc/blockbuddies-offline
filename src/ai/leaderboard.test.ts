import { describe, expect, it } from 'vitest'
import { createLocalLeaderboard } from './leaderboard'

describe('local leaderboard', () => {
  it('includes the player and sorts by score', () => {
    const rows = createLocalLeaderboard(500, 30, {})
    expect(rows[0].username).toBe('You')
    expect(rows.every((row, index) => index === 0 || rows[index - 1].score >= row.score)).toBe(true)
  })
})
