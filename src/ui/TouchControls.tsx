import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Hand, RotateCcw, Zap } from 'lucide-react'
import type { PointerEvent } from 'react'
import { useGameStore } from '../state/gameStore'

type TouchPatch = Partial<{
  x: number
  y: number
  jump: boolean
  interact: boolean
}>

export function TouchControls() {
  const setTouch = useGameStore((state) => state.setTouch)
  const beginObby = useGameStore((state) => state.beginObby)
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
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-end justify-between px-4 md:hidden">
      <div className="pointer-events-auto grid h-28 w-28 grid-cols-3 grid-rows-3 gap-1">
        <button
          className="touch-button col-start-2"
          onPointerDown={press({ y: -1 })}
          onPointerUp={release({ y: 0 })}
          onPointerCancel={release({ y: 0 })}
          title="Move forward"
        >
          <ArrowUp size={20} aria-hidden />
        </button>
        <button
          className="touch-button row-start-2"
          onPointerDown={press({ x: -1 })}
          onPointerUp={release({ x: 0 })}
          onPointerCancel={release({ x: 0 })}
          title="Turn left"
        >
          <ArrowLeft size={20} aria-hidden />
        </button>
        <button
          className="touch-button col-start-3 row-start-2"
          onPointerDown={press({ x: 1 })}
          onPointerUp={release({ x: 0 })}
          onPointerCancel={release({ x: 0 })}
          title="Turn right"
        >
          <ArrowRight size={20} aria-hidden />
        </button>
        <button
          className="touch-button col-start-2 row-start-3"
          onPointerDown={press({ y: 1 })}
          onPointerUp={release({ y: 0 })}
          onPointerCancel={release({ y: 0 })}
          title="Move back"
        >
          <ArrowDown size={20} aria-hidden />
        </button>
      </div>

      <div className="pointer-events-auto flex gap-2">
        <button
          type="button"
          className="touch-action"
          onPointerDown={press({ jump: true })}
          onPointerUp={release({ jump: false })}
          onPointerCancel={release({ jump: false })}
          title="Jump"
        >
          <Zap size={24} aria-hidden />
        </button>
        <button
          type="button"
          className="touch-action"
          onPointerDown={press({ interact: true })}
          onPointerUp={release({ interact: false })}
          onPointerCancel={release({ interact: false })}
          title="Interact"
        >
          <Hand size={24} aria-hidden />
        </button>
        <button
          type="button"
          className="touch-action"
          onClick={(event) => {
            event.preventDefault()
            beginObby(performance.now())
          }}
          title="Restart obby"
        >
          <RotateCcw size={24} aria-hidden />
        </button>
      </div>
    </div>
  )
}
