import {
  BellRing,
  Bubbles,
  Footprints,
  Home,
  Radio,
  Shield,
  Sparkles,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import {
  buddyRushConfig,
  buddyRushGadgets,
  buddyRushModeModifiers,
  findBuddyRival,
  findCollectableBuddy,
} from '../data/buddyRush'
import { buddyShieldSeconds } from '../ai/buddyRush'
import { useGameStore } from '../state/gameStore'
import type { BuddyGadgetId } from '../game/types'

export function BuddyRushHUD() {
  const runtime = useGameStore((state) => state.buddyRush)
  const settings = useGameStore((state) => state.settings)
  const tick = useGameStore((state) => state.tickBuddyRush)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const activateGadget = useGameStore((state) => state.activateBuddyRushGadget)
  const completeCapture = useGameStore(
    (state) => state.completePlayerBuddyCapture,
  )
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const update = () => {
      const time = Date.now()
      setNow(time)
      tick(time)
    }
    update()
    const timer = window.setInterval(update, 1_000)
    return () => window.clearInterval(timer)
  }, [tick])

  const activeRaid = runtime.activeRaid
  const rival = activeRaid ? findBuddyRival(activeRaid.rivalId) : undefined
  const buddy = activeRaid
    ? findCollectableBuddy(activeRaid.buddyDefinitionId)
    : undefined
  const shieldSeconds = buddyShieldSeconds(runtime, now)
  const raidSeconds = activeRaid
    ? Math.max(0, Math.ceil((activeRaid.phaseEndsAt - now) / 1_000))
    : 0
  const urgent =
    runtime.shield.phase === 'warning' ||
    runtime.shield.phase === 'rush' ||
    Boolean(activeRaid)

  return (
    <>
      <button
        type="button"
        className={`absolute bottom-40 left-3 z-30 flex min-h-11 items-center gap-2 rounded-2xl border-2 px-3 text-left text-xs font-black shadow-xl backdrop-blur ${
          urgent
            ? 'border-rose-300 bg-rose-600/95 text-white'
            : 'border-emerald-300 bg-slate-950/90 text-white'
        }`}
        onClick={() => setOpenPanel('buddy-rush')}
        aria-label={`Buddy Rush, shield ${runtime.shield.phase}, ${shieldSeconds} seconds`}
      >
        <Shield size={19} aria-hidden />
        <span>
          <span className="block leading-none">Buddy Rush</span>
          <span className="mt-1 block text-[10px] opacity-80">
            {settings.buddyRushEnabled ? (
              <>
                {runtime.shield.phase} ·{' '}
                <span
                  className="inline-block w-9 tabular-nums"
                  data-testid="buddy-rush-shield-time"
                >
                  {formatTime(shieldSeconds)}
                </span>
              </>
            ) : (
              'Friendly system only'
            )}
          </span>
        </span>
      </button>

      {runtime.shield.phase === 'warning' && !activeRaid ? (
        <aside
          className="absolute inset-x-3 top-56 z-40 mx-auto max-w-xl rounded-2xl border-2 border-amber-300 bg-amber-500/95 p-3 text-white shadow-2xl"
          role="status"
          aria-live="assertive"
        >
          <div className="flex items-center gap-3">
            <BellRing className="shrink-0" size={24} aria-hidden />
            <div className="min-w-0 flex-1">
              <strong className="block">Clubhouse Shield warning</strong>
              <span className="block text-xs font-black text-amber-50">
                A rival may arrive in{' '}
                <span
                  className="inline-block w-10 tabular-nums"
                  data-testid="buddy-rush-warning-time"
                >
                  {formatTime(shieldSeconds)}
                </span>
                . Favourite Buddies remain protected.
              </span>
            </div>
          </div>
        </aside>
      ) : null}

      {activeRaid ? (
        <aside
          className="absolute inset-x-3 top-56 z-40 mx-auto max-w-xl overflow-hidden rounded-2xl border-2 border-fuchsia-400 bg-slate-950/95 text-white shadow-2xl"
          aria-label="Active Buddy Rush"
          data-testid="buddy-rush-active-hud"
        >
          <div className="flex items-start gap-3 p-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: rival?.color ?? '#a855f7' }}
            >
              {activeRaid.direction === 'raid' ? (
                <Home size={22} aria-hidden />
              ) : (
                <Shield size={22} aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block truncate">
                {activeRaid.direction === 'raid'
                  ? `Friendly Rush at ${rival?.clubhouseName ?? 'Rival Clubhouse'}`
                  : `${rival?.name ?? 'A rival'} is rushing your clubhouse`}
              </strong>
              <span className="block text-xs font-black text-fuchsia-200">
                {raidInstruction(
                  activeRaid.direction,
                  activeRaid.phase,
                  buddy?.name,
                )}
              </span>
              {activeRaid.phase !== 'capture' ||
              activeRaid.direction === 'defend' ? (
                <span
                  className="mt-1 block text-[11px] font-black text-white/70 tabular-nums"
                  data-testid="buddy-rush-raid-time"
                >
                  {formatTime(raidSeconds)} remaining
                </span>
              ) : null}
            </div>
          </div>

          {activeRaid.direction === 'raid' && activeRaid.phase === 'capture' ? (
            <div className="border-t border-white/15 p-3">
              <HoldCaptureButton
                durationMs={
                  buddyRushConfig.captureHoldMs *
                  buddyRushModeModifiers[settings.buddyRushMode]
                    .captureMultiplier
                }
                onComplete={() => completeCapture(Date.now())}
              />
            </div>
          ) : null}

          {activeRaid.phase === 'chase' ? (
            <div className="grid grid-cols-3 gap-2 border-t border-white/15 p-3">
              {buddyRushGadgets.map((gadget) => {
                const cooldown = Math.max(
                  0,
                  Math.ceil(
                    ((runtime.gadgetCooldownEndsAt[gadget.id] ?? 0) - now) /
                      1_000,
                  ),
                )
                return (
                  <button
                    key={gadget.id}
                    type="button"
                    className="min-h-12 rounded-xl bg-white/10 px-2 text-[10px] font-black disabled:opacity-40"
                    disabled={cooldown > 0}
                    onClick={() => activateGadget(gadget.id, Date.now())}
                    aria-label={`${gadget.name}${cooldown ? `, ready in ${cooldown} seconds` : ''}`}
                  >
                    <GadgetIcon id={gadget.id} />
                    <span className="block">
                      {cooldown > 0 ? `${cooldown}s` : gadget.name}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </aside>
      ) : null}

      {runtime.rescueQuest ? (
        <button
          type="button"
          className="absolute bottom-40 right-3 z-30 flex min-h-11 items-center gap-2 rounded-2xl bg-amber-500 px-3 text-xs font-black text-white shadow-xl"
          onClick={() => setOpenPanel('buddy-rush')}
        >
          <Radio size={18} aria-hidden />
          Rescue Quest
        </button>
      ) : null}
    </>
  )
}

function HoldCaptureButton({
  durationMs,
  onComplete,
}: {
  durationMs: number
  onComplete: () => void
}) {
  const timerRef = useRef<number | undefined>(undefined)
  const intervalRef = useRef<number | undefined>(undefined)
  const startedAtRef = useRef(0)
  const [progress, setProgress] = useState(0)

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current)
      window.clearInterval(intervalRef.current)
    },
    [],
  )

  const cancel = () => {
    window.clearTimeout(timerRef.current)
    window.clearInterval(intervalRef.current)
    timerRef.current = undefined
    intervalRef.current = undefined
    setProgress(0)
  }
  const start = () => {
    if (timerRef.current) return
    startedAtRef.current = Date.now()
    setProgress(1)
    intervalRef.current = window.setInterval(() => {
      setProgress(
        Math.min(100, ((Date.now() - startedAtRef.current) / durationMs) * 100),
      )
    }, 50)
    timerRef.current = window.setTimeout(() => {
      cancel()
      setProgress(100)
      onComplete()
    }, durationMs)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      start()
    }
  }
  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') cancel()
  }
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    start()
  }

  return (
    <button
      type="button"
      className="relative min-h-14 w-full overflow-hidden rounded-2xl border-2 border-white/30 bg-fuchsia-600 font-black text-white"
      onPointerDown={onPointerDown}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      aria-label={`Hold for ${formatHoldDuration(durationMs)} to capture Friendship Badge`}
    >
      <span
        className="absolute inset-y-0 left-0 bg-emerald-400/70 transition-[width]"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
      <span className="relative">
        <Sparkles className="mr-2 inline" size={18} aria-hidden />
        Hold to capture Friendship Badge
      </span>
    </button>
  )
}

function formatHoldDuration(durationMs: number) {
  const seconds = durationMs / 1_000
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)} seconds`
}

function GadgetIcon({ id }: { id: BuddyGadgetId }) {
  const Icon =
    id === 'bubble-blaster'
      ? Bubbles
      : id === 'roller-skates'
        ? Footprints
        : Radio
  return <Icon className="mx-auto mb-1" size={17} aria-hidden />
}

function raidInstruction(
  direction: 'defend' | 'raid',
  phase: 'approach' | 'capture' | 'chase',
  buddyName?: string,
) {
  if (direction === 'raid') {
    if (phase === 'capture')
      return `Hold the badge beside ${buddyName ?? 'the Buddy'}`
    return `Escort ${buddyName ?? 'the Buddy'} back to your clubhouse`
  }
  if (phase === 'approach') return 'The rival is approaching your clubhouse'
  if (phase === 'capture')
    return `The rival is capturing ${buddyName ?? 'a Buddy'}'s badge`
  return 'Follow the tracker and tag the rival before they escape'
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds)
  return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`
}
