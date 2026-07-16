import { useEffect, useMemo, useRef } from 'react'
import { useGameStore } from '../state/gameStore'
import { selectAudioCues, selectMusicMode, type AudioCue, type AudioSnapshot, type MusicMode } from './audioCues'

export function GameAudio() {
  const screen = useGameStore((state) => state.screen)
  const audioEnabled = useGameStore((state) => state.settings.audio)
  const musicEnabled = useGameStore((state) => state.settings.music)
  const coins = useGameStore((state) => state.coins)
  const openPanel = useGameStore((state) => state.openPanel)
  const activeInteriorId = useGameStore((state) => state.activeInterior?.id)
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const buildMode = useGameStore((state) => state.buildMode)
  const placedBlockCount = useGameStore((state) => state.placedBlocks.length)
  const playerEmote = useGameStore((state) => state.playerEmote)
  const sleeping = useGameStore((state) => state.sleeping)
  const seatedSeatId = useGameStore((state) => state.seatedSeatId)
  const completedQuestCount = useGameStore((state) => state.questProgress.filter((quest) => quest.completed).length)
  const earnedBadgeCount = useGameStore((state) => state.earnedBadges.length)
  const unlockedItemCount = useGameStore((state) => state.unlockedItems.length)
  const lastChat = useGameStore((state) => state.chat.at(-1))
  const avatar = useGameStore((state) => state.avatar)
  const obby = useGameStore((state) => state.obby)
  const miniGame = useGameStore((state) => state.miniGame)
  const snapshot: AudioSnapshot = useMemo(
    () => ({
      audioEnabled,
      screen,
      coins,
      openPanel,
      activeInteriorId,
      activeVehicleId,
      buildMode,
      placedBlockCount,
      playerEmote,
      sleeping,
      seatedSeatId,
      completedQuestCount,
      earnedBadgeCount,
      unlockedItemCount,
      lastChatId: lastChat?.id,
      lastChatKind: lastChat?.kind,
      avatarSignature: JSON.stringify(avatar),
      obbyActive: obby.active,
      obbyFinished: obby.finished,
      miniGameEventSequence: miniGame.eventSequence,
      miniGameScore: miniGame.score,
      miniGameStatus: miniGame.status,
    }),
    [
      activeInteriorId,
      activeVehicleId,
      audioEnabled,
      avatar,
      buildMode,
      coins,
      completedQuestCount,
      earnedBadgeCount,
      lastChat?.id,
      lastChat?.kind,
      miniGame.eventSequence,
      miniGame.score,
      miniGame.status,
      obby.active,
      obby.finished,
      openPanel,
      placedBlockCount,
      playerEmote,
      screen,
      seatedSeatId,
      sleeping,
      unlockedItemCount,
    ],
  )
  const previous = useRef(snapshot)
  const musicMode = selectMusicMode(snapshot)

  useEffect(() => {
    const cues = selectAudioCues(previous.current, snapshot)
    previous.current = snapshot
    cues.forEach(playCue)
  }, [snapshot])

  useEffect(() => {
    if (!musicEnabled) return undefined
    let disposed = false
    const play = () => {
      if (!disposed) playMusicBar(musicMode)
    }
    const timeout = window.setTimeout(play, musicMode === 'menu' ? 800 : 420)
    const interval = window.setInterval(play, musicInterval(musicMode))
    return () => {
      disposed = true
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [musicEnabled, musicMode])

  return null
}

function playCue(cue: AudioCue) {
  switch (cue) {
    case 'panel':
      playTone([330, 440], 0.035, 0.035)
      break
    case 'coin':
      playTone([880, 1175], 0.045, 0.08)
      break
    case 'travel':
      playTone([523, 392, 523], 0.055, 0.045)
      break
    case 'screen-start':
      playTone([392, 494, 659], 0.055, 0.045)
      break
    case 'customizer-change':
      playTone([659, 784], 0.04, 0.035)
      break
    case 'chat':
      playTone([520, 670], 0.025, 0.028, 'sine')
      break
    case 'quest-complete':
      playTone([523, 659, 784, 988], 0.065, 0.072)
      break
    case 'badge':
      playTone([784, 988, 1175], 0.055, 0.06)
      break
    case 'unlock':
      playTone([440, 660, 880], 0.055, 0.052)
      break
    case 'emote':
      playTone([330, 494, 660, 494], 0.048, 0.045)
      break
    case 'sit':
      playTone([262, 220], 0.055, 0.04, 'triangle')
      break
    case 'stand':
      playTone([220, 262, 330], 0.05, 0.04, 'triangle')
      break
    case 'sleep':
      playTone([392, 330, 262], 0.18, 0.026, 'sine')
      break
    case 'wake':
      playTone([262, 392, 523], 0.055, 0.045, 'sine')
      break
    case 'build-toggle':
      playTone([196, 247], 0.045, 0.04, 'square')
      break
    case 'build-place':
      playTone([165, 220, 330], 0.04, 0.05, 'square')
      break
    case 'build-remove':
      playTone([330, 220], 0.045, 0.045, 'square')
      break
    case 'obby-start':
      playTone([392, 587, 784], 0.07, 0.065, 'triangle')
      break
    case 'obby-complete':
      playTone([523, 659, 784, 1047, 1319], 0.065, 0.075)
      break
    case 'vehicle-enter':
      playTone([110, 147, 196, 294], 0.06, 0.055, 'sawtooth')
      break
    case 'vehicle-exit':
      playTone([294, 196], 0.065, 0.04, 'sawtooth')
      break
    case 'mini-game-start':
      playTone([392, 523, 659], 0.075, 0.07)
      break
    case 'mini-game-collect':
      playTone([784, 988], 0.055, 0.065)
      break
    case 'mini-game-complete':
      playTone([523, 659, 784, 1047], 0.08, 0.075)
      break
    case 'mini-game-fail':
      playTone([220, 196], 0.11, 0.05, 'square')
      break
  }
}

function playTone(
  frequencies: number[],
  durationSeconds: number,
  volume: number,
  type: OscillatorType = 'triangle',
) {
  try {
    const context = getAudioContext()
    if (!context) return
    if (context.state === 'suspended') void context.resume()
    let startAt = context.currentTime
    frequencies.forEach((frequency) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = type
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(startAt)
      oscillator.stop(startAt + durationSeconds + 0.02)
      startAt += durationSeconds
    })
  } catch {
    // Some mobile WebViews block audio until after a direct user gesture.
  }
}

function musicInterval(mode: MusicMode) {
  if (mode === 'driving') return 3200
  if (mode === 'mini-game') return 3000
  if (mode === 'interior') return 5200
  if (mode === 'customizer') return 4600
  return 4200
}

function playMusicBar(mode: MusicMode) {
  try {
    const context = getAudioContext()
    if (!context) return
    if (context.state === 'suspended') void context.resume()
    const start = context.currentTime
    const notes = musicNotes(mode)
    const noteGap = mode === 'driving' || mode === 'mini-game' ? 0.28 : 0.38
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = mode === 'driving' ? 'triangle' : 'sine'
      oscillator.frequency.value = frequency
      const at = start + index * noteGap
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(musicVolume(mode), at + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + noteGap * 0.88)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(at)
      oscillator.stop(at + noteGap)
    })
    if (mode === 'driving' || mode === 'mini-game') playRhythmTick(context, start, notes.length, noteGap)
  } catch {
    // Mobile browsers can block music until after the first direct user gesture.
  }
}

function musicNotes(mode: MusicMode) {
  switch (mode) {
    case 'menu':
      return [261.63, 329.63, 392, 523.25, 392, 329.63]
    case 'customizer':
      return [329.63, 392, 493.88, 659.25, 493.88]
    case 'interior':
      return [220, 261.63, 329.63, 392, 329.63]
    case 'driving':
      return [196, 246.94, 293.66, 392, 293.66, 246.94]
    case 'mini-game':
      return [392, 493.88, 587.33, 783.99, 659.25, 587.33]
    case 'town':
    default:
      return [261.63, 329.63, 392, 523.25, 587.33, 523.25, 392]
  }
}

function musicVolume(mode: MusicMode) {
  if (mode === 'interior') return 0.018
  if (mode === 'driving' || mode === 'mini-game') return 0.032
  return 0.024
}

function playRhythmTick(context: AudioContext, start: number, count: number, gap: number) {
  for (let index = 0; index < count; index += 2) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'square'
    oscillator.frequency.value = 82.41
    const at = start + index * gap
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.012, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.075)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(at)
    oscillator.stop(at + 0.08)
  }
}

let sharedAudioContext: AudioContext | undefined

function getAudioContext() {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') return sharedAudioContext
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext
  if (!AudioContextClass) return undefined
  sharedAudioContext = new AudioContextClass()
  return sharedAudioContext
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
