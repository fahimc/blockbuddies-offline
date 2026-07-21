import {
  Armchair,
  ArrowUp,
  BedDouble,
  CarFront,
  CircleStop,
  CircleDot,
  Gauge,
  Hand,
  Music2,
  RotateCw,
  Sparkles,
  X,
} from 'lucide-react'
import type { PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { PlayerEmote } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { EquipmentHud } from './EquipmentHud'

type TouchPatch = Partial<{
  x: number
  y: number
  lookX: number
  lookY: number
  jump: boolean
  interact: boolean
  run: boolean
}>

const joystickRadius = 42
const maxQueuedLookDelta = 80
const mobileEmoteCycle: PlayerEmote[] = ['none', 'wave', 'dance', 'cheer']

export function TouchControls() {
  const setTouch = useGameStore((state) => state.setTouch)
  const miniGame = useGameStore((state) => state.miniGame)
  const cancelMiniGame = useGameStore((state) => state.cancelMiniGame)
  const rotateBuildPiece = useGameStore((state) => state.rotateBuildPiece)
  const buildMode = useGameStore((state) => state.buildMode)
  const running = useGameStore((state) => state.touch.run)
  const playerEmote = useGameStore((state) => state.playerEmote)
  const setPlayerEmote = useGameStore((state) => state.setPlayerEmote)
  const interactionPrompt = useGameStore((state) => state.interactionPrompt)
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const nearbyFootballBallId = useGameStore(
    (state) => state.nearbyFootballBallId,
  )
  const requestWorldAction = useGameStore((state) => state.requestWorldAction)
  const joystickRef = useRef<HTMLDivElement>(null)
  const lookDragRef = useRef<
    { pointerId: number; x: number; y: number } | undefined
  >(undefined)
  const [thumb, setThumb] = useState({ x: 0, y: 0 })
  const [kickStartedAt, setKickStartedAt] = useState<number>()
  const [kickPower, setKickPower] = useState(0)

  useEffect(
    () => () => {
      useGameStore.getState().setTouch({ run: false })
    },
    [],
  )

  useEffect(() => {
    if (!kickStartedAt) return undefined
    const updatePower = () => {
      setKickPower(clamp((performance.now() - kickStartedAt) / 1100, 0, 1))
    }
    updatePower()
    const interval = window.setInterval(updatePower, 45)
    return () => window.clearInterval(interval)
  }, [kickStartedAt])

  useEffect(() => {
    if (nearbyFootballBallId) return
    setKickStartedAt(undefined)
    setKickPower(0)
  }, [nearbyFootballBallId])

  useEffect(() => {
    let drag: { pointerId: number; x: number; y: number } | undefined

    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof HTMLCanvasElement)) return
      drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    }
    const onPointerMove = (event: globalThis.PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
      const npcDrag = useGameStore.getState().npcDrag
      if (npcDrag?.pointerId === event.pointerId) return
      const current = useGameStore.getState().touch
      useGameStore.getState().setTouch({
        lookX: clamp(
          current.lookX + dx,
          -maxQueuedLookDelta,
          maxQueuedLookDelta,
        ),
        lookY: clamp(
          current.lookY + dy,
          -maxQueuedLookDelta,
          maxQueuedLookDelta,
        ),
      })
    }
    const stopDrag = (event: globalThis.PointerEvent) => {
      if (drag?.pointerId === event.pointerId) drag = undefined
    }

    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('pointermove', onPointerMove, true)
    window.addEventListener('pointerup', stopDrag, true)
    window.addEventListener('pointercancel', stopDrag, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointermove', onPointerMove, true)
      window.removeEventListener('pointerup', stopDrag, true)
      window.removeEventListener('pointercancel', stopDrag, true)
    }
  }, [])

  const queueLookDelta = (dx: number, dy: number) => {
    const current = useGameStore.getState().touch
    setTouch({
      lookX: clamp(current.lookX + dx, -maxQueuedLookDelta, maxQueuedLookDelta),
      lookY: clamp(current.lookY + dy, -maxQueuedLookDelta, maxQueuedLookDelta),
    })
  }

  const updateJoystick = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = joystickRef.current?.getBoundingClientRect()
    if (!bounds) return
    const centerX = bounds.left + bounds.width / 2
    const centerY = bounds.top + bounds.height / 2
    const rawX = event.clientX - centerX
    const rawY = event.clientY - centerY
    const distance = Math.hypot(rawX, rawY)
    const scale = distance > joystickRadius ? joystickRadius / distance : 1
    const x = rawX * scale
    const y = rawY * scale
    setThumb({ x, y })
    setTouch({
      x: Number((x / joystickRadius).toFixed(2)),
      y: Number((y / joystickRadius).toFixed(2)),
    })
  }

  const resetJoystick = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setThumb({ x: 0, y: 0 })
    setTouch({ x: 0, y: 0 })
  }

  const press =
    (input: TouchPatch) => (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture?.(event.pointerId)
      setTouch(input)
    }
  const release =
    (input: TouchPatch) => (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      setTouch(input)
    }

  const pulseInteract = () => {
    setTouch({ interact: true })
    window.setTimeout(
      () => useGameStore.getState().setTouch({ interact: false }),
      100,
    )
  }
  const cycleEmote = () => {
    const currentIndex = mobileEmoteCycle.indexOf(playerEmote)
    const next = mobileEmoteCycle[(currentIndex + 1) % mobileEmoteCycle.length]
    setPlayerEmote(next)
  }
  const emoteLabel =
    playerEmote === 'none'
      ? 'Emote'
      : playerEmote.charAt(0).toUpperCase() + playerEmote.slice(1)
  const interactionLabel = buildMode
    ? 'Place'
    : interactionPrompt === 'sleep'
      ? 'Sleep'
      : interactionPrompt === 'wake'
        ? 'Wake up'
        : interactionPrompt === 'sit'
          ? 'Sit'
          : interactionPrompt === 'stand'
            ? 'Stand up'
            : interactionPrompt === 'enter-vehicle'
              ? 'Drive car'
              : interactionPrompt === 'exit-vehicle'
                ? 'Exit car'
                : 'Interact'
  const showFootballActions =
    Boolean(nearbyFootballBallId) &&
    !buildMode &&
    !activeVehicleId &&
    miniGame.status !== 'running'
  const startFootballKick = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId)
    } catch {
      // Some synthetic/WebView pointer events do not expose an active capture target.
    }
    setKickStartedAt(performance.now())
    setKickPower(0.12)
  }
  const finishFootballKick = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    } catch {
      // Matching the capture guard above keeps release safe in test/mobile shells.
    }
    if (nearbyFootballBallId)
      requestWorldAction(
        'football-kick',
        nearbyFootballBallId,
        clamp(kickPower || 0.12, 0.12, 1),
      )
    setKickStartedAt(undefined)
    setKickPower(0)
  }
  const requestFootballSkill = () => {
    if (!nearbyFootballBallId) return
    requestWorldAction('football-skill', nearbyFootballBallId)
  }

  return (
    <>
      <div
        className="world-drag-layer pointer-events-none absolute inset-0 z-[8]"
        data-testid="world-drag-control"
        aria-hidden="true"
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          event.preventDefault()
          event.currentTarget.setPointerCapture?.(event.pointerId)
          lookDragRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          }
        }}
        onPointerMove={(event) => {
          const drag = lookDragRef.current
          if (
            !drag ||
            drag.pointerId !== event.pointerId ||
            (event.currentTarget.hasPointerCapture &&
              !event.currentTarget.hasPointerCapture(event.pointerId))
          )
            return
          event.preventDefault()
          const dx = event.clientX - drag.x
          const dy = event.clientY - drag.y
          lookDragRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          }
          const npcDrag = useGameStore.getState().npcDrag
          if (npcDrag?.pointerId === event.pointerId) return
          queueLookDelta(dx, dy)
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture?.(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
          if (lookDragRef.current?.pointerId === event.pointerId)
            lookDragRef.current = undefined
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture?.(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
          if (lookDragRef.current?.pointerId === event.pointerId)
            lookDragRef.current = undefined
        }}
      />
      {showFootballActions ? (
        <div className="football-hud-panel pointer-events-auto absolute z-20">
          <button
            type="button"
            className={`football-kick-button ${kickStartedAt ? 'charging' : ''}`}
            aria-label="Hold to kick ball"
            title="Hold to kick"
            onPointerDown={startFootballKick}
            onPointerUp={finishFootballKick}
            onPointerCancel={finishFootballKick}
          >
            <CircleDot size={24} aria-hidden />
            <span>Kick</span>
          </button>
          <button
            type="button"
            className="football-skill-button"
            aria-label="Do football skills"
            title="Skills"
            onClick={requestFootballSkill}
          >
            <Sparkles size={22} aria-hidden />
            <span>Skills</span>
          </button>
          <div
            className={`football-power-gauge ${kickStartedAt ? 'visible' : ''}`}
            aria-hidden={!kickStartedAt}
          >
            <span style={{ width: `${Math.round(kickPower * 100)}%` }} />
          </div>
        </div>
      ) : null}
      <div className="touch-control-layer pointer-events-none absolute inset-x-0 bottom-3 z-20 hidden items-end justify-between px-5">
        <div
          ref={joystickRef}
          className={`virtual-joystick pointer-events-auto relative grid place-items-center rounded-full ${activeVehicleId ? 'driving' : ''}`}
          onPointerDown={(event) => {
            event.preventDefault()
            event.currentTarget.setPointerCapture?.(event.pointerId)
            updateJoystick(event)
          }}
          onPointerMove={(event) => {
            if (
              !event.currentTarget.hasPointerCapture ||
              event.currentTarget.hasPointerCapture(event.pointerId)
            )
              updateJoystick(event)
          }}
          onPointerUp={resetJoystick}
          onPointerCancel={resetJoystick}
          title={activeVehicleId ? 'Drive' : 'Move'}
          aria-label={activeVehicleId ? 'Driving joystick' : 'Move joystick'}
        >
          <div
            className="joystick-thumb absolute rounded-full"
            style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }}
          />
          {activeVehicleId ? (
            <span className="joystick-mode-label">Drive</span>
          ) : null}
        </div>

        {activeVehicleId ? (
          <button
            type="button"
            className="mobile-drive-exit-button pointer-events-auto"
            onClick={(event) => {
              event.preventDefault()
              pulseInteract()
            }}
            title="Exit car"
            aria-label="Exit car"
          >
            <CarFront size={21} aria-hidden />
            <span>Exit</span>
          </button>
        ) : miniGame.status === 'running' ? (
          <button
            type="button"
            className="mobile-remove-button pointer-events-auto"
            onClick={(event) => {
              event.preventDefault()
              cancelMiniGame()
            }}
            title="Cancel mini game"
            aria-label="Cancel"
          >
            <X size={28} aria-hidden />
            <span>Cancel</span>
          </button>
        ) : (
          <button
            type="button"
            className={`mobile-emote-button pointer-events-auto ${playerEmote !== 'none' ? 'active' : ''}`}
            onClick={(event) => {
              event.preventDefault()
              cycleEmote()
            }}
            title="Toggle emotes"
            aria-label="Toggle emotes"
            aria-pressed={playerEmote !== 'none'}
          >
            <Music2 size={20} aria-hidden />
            <span>{emoteLabel}</span>
          </button>
        )}

        <div className="mobile-action-cluster pointer-events-auto flex items-end gap-2">
          <div className="flex flex-col gap-2">
            {buildMode ? (
              <button
                type="button"
                className="mobile-use-button"
                onClick={rotateBuildPiece}
                title="Rotate"
                aria-label="Rotate"
              >
                <RotateCw size={22} aria-hidden />
              </button>
            ) : !activeVehicleId ? (
              <div className="mobile-run-row flex items-center gap-2">
                <EquipmentHud />
                <button
                  type="button"
                  className={`mobile-run-button ${running ? 'active' : ''}`}
                  onPointerDown={press({ run: true })}
                  onPointerUp={release({ run: false })}
                  onPointerCancel={release({ run: false })}
                  onLostPointerCapture={() => setTouch({ run: false })}
                  aria-label="Run"
                  aria-pressed={running}
                  title="Hold to run"
                >
                  <Gauge size={20} aria-hidden />
                  <span>Run</span>
                </button>
              </div>
            ) : null}
            {!activeVehicleId ? (
              <button
                type="button"
                className={`mobile-use-button ${interactionPrompt ? 'contextual' : ''}`}
                onClick={pulseInteract}
                title={interactionLabel}
                aria-label={interactionLabel}
              >
                {interactionPrompt === 'sleep' ||
                interactionPrompt === 'wake' ? (
                  <BedDouble size={22} aria-hidden />
                ) : interactionPrompt === 'sit' ||
                  interactionPrompt === 'stand' ? (
                  <Armchair size={22} aria-hidden />
                ) : interactionPrompt === 'enter-vehicle' ? (
                  <CarFront size={22} aria-hidden />
                ) : (
                  <Hand size={22} aria-hidden />
                )}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className={`mobile-jump-button ${activeVehicleId ? 'brake' : ''}`}
            onPointerDown={press({ jump: true })}
            onPointerUp={release({ jump: false })}
            onPointerCancel={release({ jump: false })}
            title={activeVehicleId ? 'Hold to brake' : 'Jump'}
            aria-label={activeVehicleId ? 'Brake' : 'Jump'}
          >
            {activeVehicleId ? (
              <CircleStop size={28} aria-hidden />
            ) : (
              <ArrowUp size={30} aria-hidden />
            )}
          </button>
        </div>
      </div>
    </>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
