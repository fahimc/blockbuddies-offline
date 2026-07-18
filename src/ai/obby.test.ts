import { describe, expect, it } from 'vitest'
import {
  finishObby,
  obbyFallResetDrop,
  obbyFinish,
  obbyPlatforms,
  obbyStart,
  shouldResetObbyFall,
  startObby,
  updateCheckpoint,
} from './obby'
import { avatarGroundOffset } from '../game/scale'

describe('obby state', () => {
  it('starts with an active checkpoint', () => {
    const state = startObby(1000)
    expect(state.active).toBe(true)
    expect(state.checkpoint).toEqual(obbyStart)
    expect(obbyStart[1] - avatarGroundOffset).toBe(
      obbyPlatforms[0].position[1] + obbyPlatforms[0].scale[1] / 2,
    )
  })

  it('defines a complete obstacle course with readable jumps, beams, and a finish pad', () => {
    expect(obbyPlatforms).toHaveLength(12)
    expect(obbyPlatforms[0].kind).toBe('start')
    expect(obbyPlatforms.at(-1)?.kind).toBe('finish')
    expect(obbyPlatforms.some((platform) => platform.kind === 'beam')).toBe(
      true,
    )
    expect(
      obbyPlatforms.filter((platform) => platform.kind === 'checkpoint'),
    ).toHaveLength(2)
    expect(obbyFinish).toEqual([
      obbyPlatforms.at(-1)!.position[0],
      obbyPlatforms.at(-1)!.position[1] +
        obbyPlatforms.at(-1)!.scale[1] / 2 +
        avatarGroundOffset,
      obbyPlatforms.at(-1)!.position[2],
    ])
  })

  it('keeps every jump reachable by the current player movement physics', () => {
    for (let index = 1; index < obbyPlatforms.length; index += 1) {
      const previous = obbyPlatforms[index - 1]
      const next = obbyPlatforms[index]
      const centerDistance = Math.hypot(
        next.position[0] - previous.position[0],
        next.position[2] - previous.position[2],
      )
      const edgeGap =
        centerDistance -
        Math.max(previous.scale[0], previous.scale[2]) / 2 -
        Math.max(next.scale[0], next.scale[2]) / 2
      const heightChange =
        next.position[1] +
        next.scale[1] / 2 -
        (previous.position[1] + previous.scale[1] / 2)

      expect(edgeGap).toBeLessThanOrEqual(1.4)
      expect(heightChange).toBeLessThanOrEqual(0.45)
    }
  })

  it('updates checkpoints and rewards finish', () => {
    const state = startObby(1000)
    const checked = updateCheckpoint(state, [18, 0, 13], [[18, 0, 13]])
    expect(checked.checkpoint).toEqual([18, 0, 13])
    const result = finishObby(checked, 6000)
    expect(result.reward).toBe(50)
    expect(result.state.finished).toBe(true)
  })

  it('does not award a checkpoint when the player is underneath a platform', () => {
    const state = startObby(1000)
    const checkpoint: [number, number, number] = [19.7, 2.15, 22.35]
    const checked = updateCheckpoint(state, [19.7, 1, 22.35], [checkpoint])
    expect(checked.checkpoint).toEqual(obbyStart)
  })

  it('resets to the latest checkpoint after falling below the course', () => {
    const state = {
      ...startObby(1000),
      checkpoint: [20, 3, 20] as [number, number, number],
    }

    expect(
      shouldResetObbyFall(state, [
        20,
        state.checkpoint[1] - obbyFallResetDrop - 0.01,
        20,
      ]),
    ).toBe(true)
    expect(
      shouldResetObbyFall(state, [20, state.checkpoint[1] - 0.1, 20]),
    ).toBe(false)
    expect(
      shouldResetObbyFall({ ...state, active: false }, [20, -10, 20]),
    ).toBe(false)
  })
})
