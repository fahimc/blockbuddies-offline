import { Hand, RotateCcw, Zap } from 'lucide-react'
import { useGameStore } from '../state/gameStore'

export function TouchControls() {
  const setTouch = useGameStore((state) => state.setTouch)
  const beginObby = useGameStore((state) => state.beginObby)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-end justify-between px-4 md:hidden">
      <div className="pointer-events-auto grid h-28 w-28 grid-cols-3 grid-rows-3 gap-1">
        <button className="touch-button col-start-2" onPointerDown={() => setTouch({ y: -1 })} onPointerUp={() => setTouch({ y: 0 })}>↑</button>
        <button className="touch-button row-start-2" onPointerDown={() => setTouch({ x: -1 })} onPointerUp={() => setTouch({ x: 0 })}>←</button>
        <button className="touch-button col-start-3 row-start-2" onPointerDown={() => setTouch({ x: 1 })} onPointerUp={() => setTouch({ x: 0 })}>→</button>
        <button className="touch-button col-start-2 row-start-3" onPointerDown={() => setTouch({ y: 1 })} onPointerUp={() => setTouch({ y: 0 })}>↓</button>
      </div>

      <div className="pointer-events-auto flex gap-2">
        <button type="button" className="touch-action" onPointerDown={() => setTouch({ jump: true })} onPointerUp={() => setTouch({ jump: false })} title="Jump">
          <Zap size={24} aria-hidden />
        </button>
        <button type="button" className="touch-action" onPointerDown={() => setTouch({ interact: true })} onPointerUp={() => setTouch({ interact: false })} title="Interact">
          <Hand size={24} aria-hidden />
        </button>
        <button type="button" className="touch-action" onClick={() => beginObby(performance.now())} title="Restart obby">
          <RotateCcw size={24} aria-hidden />
        </button>
      </div>
    </div>
  )
}
