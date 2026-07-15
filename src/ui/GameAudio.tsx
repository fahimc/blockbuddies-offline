import { useEffect, useMemo, useRef } from 'react'
import { useGameStore } from '../state/gameStore'
import { selectAudioCues, type AudioCue, type AudioSnapshot } from './audioCues'

export function GameAudio() {
  const audioEnabled = useGameStore((state) => state.settings.audio)
  const musicEnabled = useGameStore((state) => state.settings.music)
  const coins = useGameStore((state) => state.coins)
  const openPanel = useGameStore((state) => state.openPanel)
  const activeInteriorId = useGameStore((state) => state.activeInterior?.id)
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const miniGame = useGameStore((state) => state.miniGame)
  const snapshot: AudioSnapshot = useMemo(
    () => ({
      audioEnabled,
      coins,
      openPanel,
      activeInteriorId,
      activeVehicleId,
      miniGameEventSequence: miniGame.eventSequence,
      miniGameScore: miniGame.score,
      miniGameStatus: miniGame.status,
    }),
    [
      activeInteriorId,
      activeVehicleId,
      audioEnabled,
      coins,
      miniGame.eventSequence,
      miniGame.score,
      miniGame.status,
      openPanel,
    ],
  )
  const previous = useRef(snapshot)

  useEffect(() => {
    const cues = selectAudioCues(previous.current, snapshot)
    previous.current = snapshot
    cues.forEach(playCue)
  }, [snapshot])

  useEffect(() => {
    if (!musicEnabled) return undefined
    let disposed = false
    const play = () => {
      if (!disposed) playMusicBar()
    }
    const timeout = window.setTimeout(play, 500)
    const interval = window.setInterval(play, 4200)
    return () => {
      disposed = true
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [musicEnabled])

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
    case 'vehicle-enter':
      playTone([147, 196, 294], 0.07, 0.055, 'sawtooth')
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

function playMusicBar() {
  try {
    const context = getAudioContext()
    if (!context) return
    if (context.state === 'suspended') void context.resume()
    const start = context.currentTime
    const notes = [261.63, 329.63, 392, 523.25, 392, 329.63]
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      const at = start + index * 0.38
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.026, at + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.34)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(at)
      oscillator.stop(at + 0.38)
    })
  } catch {
    // Mobile browsers can block music until after the first direct user gesture.
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
