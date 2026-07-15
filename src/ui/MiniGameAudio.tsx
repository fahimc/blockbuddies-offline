import { useEffect, useRef } from 'react'
import { useGameStore } from '../state/gameStore'

export function MiniGameAudio() {
  const audioEnabled = useGameStore((state) => state.settings.audio)
  const miniGame = useGameStore((state) => state.miniGame)
  const previous = useRef({
    sequence: miniGame.eventSequence,
    score: miniGame.score,
    status: miniGame.status,
  })

  useEffect(() => {
    if (!audioEnabled) {
      previous.current = {
        sequence: miniGame.eventSequence,
        score: miniGame.score,
        status: miniGame.status,
      }
      return
    }

    if (miniGame.eventSequence !== previous.current.sequence && miniGame.status === 'running') {
      playTone([392, 523, 659], 0.075)
    } else if (miniGame.score > previous.current.score) {
      playTone([784, 988], 0.055)
    } else if (previous.current.status === 'running' && miniGame.status === 'completed') {
      playTone([523, 659, 784, 1047], 0.08)
    } else if (previous.current.status === 'running' && miniGame.status === 'failed') {
      playTone([220, 196], 0.11)
    }

    previous.current = {
      sequence: miniGame.eventSequence,
      score: miniGame.score,
      status: miniGame.status,
    }
  }, [audioEnabled, miniGame.eventSequence, miniGame.score, miniGame.status])

  return null
}

function playTone(frequencies: number[], durationSeconds: number) {
  try {
    const context = getAudioContext()
    if (!context) return
    if (context.state === 'suspended') void context.resume()
    let startAt = context.currentTime
    frequencies.forEach((frequency) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(startAt)
      oscillator.stop(startAt + durationSeconds + 0.02)
      startAt += durationSeconds
    })
  } catch {
    // Audio can be blocked until a user gesture on some WebViews.
  }
}

let sharedAudioContext: AudioContext | undefined

function getAudioContext() {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    return sharedAudioContext
  }
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
