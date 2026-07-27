import { describe, expect, it } from 'vitest'
import {
  selectAudioCues,
  selectMusicMode,
  type AudioSnapshot,
} from './audioCues'

const base: AudioSnapshot = {
  audioEnabled: true,
  screen: 'game',
  coins: 0,
  buildMode: false,
  placedBlockCount: 0,
  playerEmote: 'none',
  sleeping: false,
  completedQuestCount: 0,
  earnedBadgeCount: 0,
  unlockedItemCount: 0,
  directMessageCount: 0,
  unreadMessageCount: 0,
  avatarSignature: 'default',
  obbyActive: false,
  obbyFinished: false,
  miniGameEventSequence: 0,
  miniGameScore: 0,
  miniGameStatus: 'idle',
  jobEventSequence: 0,
  jobScore: 0,
  jobMistakes: 0,
  jobStatus: 'idle',
  footballActionSequence: 0,
}

describe('audio cue selection', () => {
  it('plays UI, travel, and vehicle cues for world actions', () => {
    expect(selectAudioCues(base, { ...base, openPanel: 'map' })).toContain(
      'panel',
    )
    expect(
      selectAudioCues(base, { ...base, activeInteriorId: 'shop' }),
    ).toContain('travel')
    expect(
      selectAudioCues(base, { ...base, activeVehicleId: 'sunny-car' }),
    ).toContain('vehicle-enter')
    expect(
      selectAudioCues({ ...base, activeVehicleId: 'sunny-car' }, base),
    ).toContain('vehicle-exit')
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
    expect(
      selectAudioCues(base, { ...base, audioEnabled: false, coins: 1 }),
    ).toEqual([])
  })

  it('plays football cues for kick, skill, and goal actions', () => {
    expect(
      selectAudioCues(base, {
        ...base,
        footballActionSequence: 1,
        footballActionKind: 'kick',
      }),
    ).toContain('football-kick')
    expect(
      selectAudioCues(base, {
        ...base,
        footballActionSequence: 1,
        footballActionKind: 'skill',
      }),
    ).toContain('football-skill')
    expect(
      selectAudioCues(base, {
        ...base,
        coins: 12,
        footballActionSequence: 1,
        footballActionKind: 'goal',
      }),
    ).toEqual(['coin', 'football-goal'])
  })

  it('plays distinct cues for job starts, correct work, mistakes, and completion', () => {
    const running = {
      ...base,
      jobEventSequence: 1,
      jobStatus: 'running' as const,
    }
    expect(selectAudioCues(base, running)).toContain('job-start')
    expect(
      selectAudioCues(running, {
        ...running,
        jobEventSequence: 2,
        jobScore: 100,
      }),
    ).toContain('job-correct')
    expect(
      selectAudioCues(running, {
        ...running,
        jobEventSequence: 2,
        jobMistakes: 1,
      }),
    ).toContain('job-wrong')
    expect(
      selectAudioCues(running, {
        ...running,
        jobEventSequence: 2,
        jobScore: 360,
        jobStatus: 'completed',
      }),
    ).toContain('job-complete')
    expect(selectMusicMode(running)).toBe('mini-game')
  })

  it('plays richer cues for avatar, social, quest, and build actions', () => {
    expect(
      selectAudioCues(base, { ...base, screen: 'setup-avatar' }),
    ).toContain('screen-start')
    expect(
      selectAudioCues(base, { ...base, avatarSignature: 'changed' }),
    ).toContain('customizer-change')
    expect(selectAudioCues(base, { ...base, playerEmote: 'wave' })).toContain(
      'emote',
    )
    expect(
      selectAudioCues(base, {
        ...base,
        lastChatId: 'chat-1',
        lastChatKind: 'player',
      }),
    ).toContain('chat')
    expect(
      selectAudioCues(base, { ...base, selectedMessageThreadId: 'luna' }),
    ).toContain('message-open')
    expect(selectAudioCues(base, { ...base, directMessageCount: 1 })).toContain(
      'message-send',
    )
    expect(
      selectAudioCues(base, {
        ...base,
        directMessageCount: 1,
        unreadMessageCount: 1,
      }),
    ).toContain('message-receive')
    expect(
      selectAudioCues(base, {
        ...base,
        lastChatId: 'error-1',
        lastChatKind: 'system',
        lastChatText: 'House cannot be placed on road',
      }),
    ).toContain('error')
    expect(
      selectAudioCues(base, { ...base, completedQuestCount: 1 }),
    ).toContain('quest-complete')
    expect(selectAudioCues(base, { ...base, earnedBadgeCount: 2 })).toContain(
      'badge',
    )
    expect(selectAudioCues(base, { ...base, unlockedItemCount: 1 })).toContain(
      'unlock',
    )
    expect(selectAudioCues(base, { ...base, buildMode: true })).toContain(
      'build-toggle',
    )
    expect(selectAudioCues(base, { ...base, placedBlockCount: 1 })).toContain(
      'build-place',
    )
    expect(selectAudioCues({ ...base, placedBlockCount: 1 }, base)).toContain(
      'build-remove',
    )
  })

  it('plays posture, obby, and context music cues', () => {
    expect(selectAudioCues(base, { ...base, sleeping: true })).toContain(
      'sleep',
    )
    expect(selectAudioCues({ ...base, sleeping: true }, base)).toContain('wake')
    expect(
      selectAudioCues(base, { ...base, seatedSeatId: 'chair-1' }),
    ).toContain('sit')
    expect(
      selectAudioCues({ ...base, seatedSeatId: 'chair-1' }, base),
    ).toContain('stand')
    expect(selectAudioCues(base, { ...base, obbyActive: true })).toContain(
      'obby-start',
    )
    expect(selectAudioCues(base, { ...base, obbyFinished: true })).toContain(
      'obby-complete',
    )

    expect(selectMusicMode({ ...base, screen: 'menu' })).toBe('menu')
    expect(selectMusicMode({ ...base, screen: 'setup-avatar' })).toBe(
      'customizer',
    )
    expect(selectMusicMode({ ...base, activeInteriorId: 'shop' })).toBe(
      'interior',
    )
    expect(selectMusicMode({ ...base, activeVehicleId: 'sunny-car' })).toBe(
      'driving',
    )
    expect(selectMusicMode({ ...base, miniGameStatus: 'running' })).toBe(
      'mini-game',
    )
  })
})
