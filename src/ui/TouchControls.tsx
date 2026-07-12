import { ArrowUp, Hand, X } from 'lucide-react'
import type { PointerEvent } from 'react'
import { useRef, useState } from 'react'
import { useGameStore } from '../state/gameStore'

type TouchPatch = Partial<{
  x: number
  y: number
  jump: boolean
  interact: boolean
}>

const joystickRadius = 42

export function TouchControls() {
  const setTouch = useGameStore((state) => state.setTouch)
  const beginObby = useGameStore((state) => state.beginObby)
  const removeLastBlock = useGameStore((state) => state.removeLastBlock)
  const buildMode = useGameStore((state) => state.buildMode)
  const joystickRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState({ x: 0, y: 0 })

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
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setThumb({ x: 0, y: 0 })
    setTouch({ x: 0, y: 0 })
  }

  const press =
    (input: TouchPatch) =>
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      setTouch(input)
    }
  const release =
    (input: TouchPatch) =>
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      setTouch(input)
    }

  return (
    <div className="touch-control-layer pointer-events-none absolute inset-x-0 bottom-3 z-20 hidden items-end justify-between px-5">
      <div
        ref={joystickRef}
        className="virtual-joystick pointer-events-auto relative grid place-items-center rounded-full"
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          updateJoystick(event)
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) updateJoystick(event)
        }}
        onPointerUp={resetJoystick}
        onPointerCancel={resetJoystick}
        title="Move"
      >
        <div
          className="joystick-thumb absolute rounded-full"
          style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }}
        />
      </div>

      <button
        type="button"
        className="mobile-remove-button pointer-events-auto"
        onClick={(event) => {
          event.preventDefault()
          if (buildMode) {
            removeLastBlock()
          } else {
            beginObby(performance.now())
          }
        }}
        title={buildMode ? 'Remove block' : 'Restart obby'}
      >
        <X size={28} aria-hidden />
        <span>{buildMode ? 'Remove' : 'Reset'}</span>
      </button>

      <div className="pointer-events-auto flex items-end gap-2">
        <button
          type="button"
          className="mobile-use-button"
          onPointerDown={press({ interact: true })}
          onPointerUp={release({ interact: false })}
          onPointerCancel={release({ interact: false })}
          title="Interact"
        >
          <Hand size={22} aria-hidden />
        </button>
        <button
          type="button"
          className="mobile-jump-button"
          onPointerDown={press({ jump: true })}
          onPointerUp={release({ jump: false })}
          onPointerCancel={release({ jump: false })}
          title="Jump"
        >
          <ArrowUp size={30} aria-hidden />
        </button>
      </div>
    </div>
  )
}
