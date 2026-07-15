import { describe, expect, it } from 'vitest'
import { selectAudioCues, type AudioSnapshot } from './audioCues'

const base: AudioSnapshot = {
  audioEnabled: true,
  coins: 0,
  miniGameEventSequence: 0,
  miniGameScore: 0,
  miniGameStatus: 'idle',
}

describe('audio cue selection', () => {
  it('plays UI, travel, and vehicle cues for world actions', () => {
    expect(selectAudioCues(base, { ...base, openPanel: 'map' })).toContain('panel')
    expect(selectAudioCues(base, { ...base, activeInteriorId: 'shop' })).toContain('travel')
    expect(selectAudioCues(base, { ...base, activeVehicleId: 'sunny-car' })).toContain('vehicle-enter')
    expect(selectAudioCues({ ...base, activeVehicleId: 'sunny-car' }, base)).toContain('vehicle-exit')
  })

  it('plays coin and mini game cues without firing while muted', () => {
    expect(selectAudioCues(base, { ...base, coins: 1 })).toEqual(['coin'])
    expect(
      selectAudioCues(base, {
        ...base,
        miniGameEventSequence: 1,
        miniGameStatus: 'running',
      }),
    ).toEqual(['mini-game-start'])
    expect(selectAudioCues(base, { ...base, audioEnabled: false, coins: 1 })).toEqual([])
  })
})
