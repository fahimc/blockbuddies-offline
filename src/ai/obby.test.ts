import { describe, expect, it } from 'vitest'
import { finishObby, obbyPlatforms, obbyStart, startObby, updateCheckpoint } from './obby'

describe('obby state', () => {
  it('starts with an active checkpoint', () => {
    const state = startObby(1000)
    expect(state.active).toBe(true)
    expect(state.checkpoint[0]).toBe(16)
    expect(obbyStart[1]).toBe(obbyPlatforms[0].position[1] + obbyPlatforms[0].scale[1] / 2)
  })

  it('updates checkpoints and rewards finish', () => {
    const state = startObby(1000)
    const checked = updateCheckpoint(state, [18, 0, 13], [[18, 0, 13]])
    expect(checked.checkpoint).toEqual([18, 0, 13])
    const result = finishObby(checked, 6000)
    expect(result.reward).toBe(50)
    expect(result.state.finished).toBe(true)
  })
})
