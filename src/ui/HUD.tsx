import { Armchair, Backpack, CarFront, Coins, Gamepad2, Sparkles, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { miniGameDefinition } from '../ai/miniGames'
import { miniGameTargetInstruction } from '../ai/miniGameProgress'
import { getLocation } from '../data/world'
import { getDrivableVehicle } from '../game/vehicles'
import { useGameStore } from '../state/gameStore'

export function HUD() {
  const coins = useGameStore((state) => state.coins)
  const nearbyLocation = useGameStore((state) => state.nearbyLocation)
  const activeInterior = useGameStore((state) => state.activeInterior)
  const obby = useGameStore((state) => state.obby)
  const miniGame = useGameStore((state) => state.miniGame)
  const seatedSeatId = useGameStore((state) => state.seatedSeatId)
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const activeVehicle = activeVehicleId ? getDrivableVehicle(activeVehicleId) : undefined

  const locationLabel = activeVehicle
    ? `Driving ${activeVehicle.label}`
    : seatedSeatId
      ? 'Taking a seat'
      : activeInterior
        ? `Inside ${activeInterior.title}`
        : nearbyLocation
          ? getLocation(nearbyLocation).label
          : undefined
  const activeMiniGame =
    miniGame.status === 'running' && miniGame.activeId
      ? miniGameDefinition(miniGame.activeId)
      : undefined
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    if (!activeMiniGame) return undefined
    const interval = window.setInterval(() => setNow(performance.now()), 250)
    return () => window.clearInterval(interval)
  }, [activeMiniGame])

  const miniGameSecondsLeft = activeMiniGame
    ? Math.max(0, Math.ceil((miniGame.endsAt - now) / 1000))
    : 0
  const miniGameInstruction = miniGameTargetInstruction(miniGame)

  return (
    <>
      <div className="desktop-hud pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-24 max-md:top-16 max-md:px-3">
        <div className="pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto rounded-lg bg-white/90 p-2 shadow-xl backdrop-blur">
          <Badge
            icon={<Coins size={18} />}
            text={`${coins}`}
            tone="bg-amber-300"
          />
          {obby.active ? (
            <Badge
              icon={<Trophy size={18} />}
              text="Obby running"
              tone="bg-red-200"
            />
          ) : null}
          {activeMiniGame ? (
            <span
              data-testid="mini-game-hud"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-black text-white shadow"
            >
              <Gamepad2 size={18} aria-hidden />
              <span>{activeMiniGame.title}</span>
              <span className="rounded-md bg-blue-500 px-2 py-1">{miniGame.score}/{miniGame.target}</span>
              <span className="rounded-md bg-amber-300 px-2 py-1 text-slate-950">{miniGame.points} pts</span>
              {miniGameInstruction ? (
                <span className="max-w-48 truncate rounded-md bg-white px-2 py-1 text-slate-950">
                  {miniGameInstruction.text}
                </span>
              ) : null}
              <strong className="rounded-md bg-rose-500 px-2 py-1 text-lg leading-none">{miniGameSecondsLeft}s</strong>
            </span>
          ) : null}
          {locationLabel ? (
            <Badge
              icon={activeVehicle ? <CarFront size={18} /> : seatedSeatId ? <Armchair size={18} /> : <Backpack size={18} />}
              text={activeVehicle || seatedSeatId || activeInterior ? locationLabel : `Near ${locationLabel}`}
              tone="bg-sky-200"
            />
          ) : null}
        </div>
      </div>

      <div className="mobile-game-hud pointer-events-none absolute inset-x-0 top-3 z-20 hidden">
        <div className="mobile-scorebar pointer-events-auto mx-auto flex w-max max-w-[58vw] items-center gap-1.5 rounded-full bg-white/40 p-1 shadow-lg backdrop-blur">
          <MobilePill
            icon={<Coins size={14} />}
            text={`${coins}`}
            tone="bg-amber-400 text-slate-950"
          />
          {obby.active ? (
            <MobilePill
              icon={<Trophy size={14} />}
              text="Obby"
              tone="bg-rose-500 text-white"
            />
          ) : null}
          {activeMiniGame ? (
            <span
              data-testid="mini-game-hud-mobile"
              className="inline-flex min-h-7 items-center gap-1 rounded-full bg-slate-950 px-2.5 text-[11px] font-black text-white shadow"
            >
              <Gamepad2 size={14} aria-hidden />
              <span>{miniGame.score}/{miniGame.target}</span>
              <span>{miniGame.points}p</span>
              {miniGameInstruction ? (
                <span className="max-w-20 truncate rounded-full bg-white px-1.5 py-0.5 text-slate-950">
                  {miniGameInstruction.text}
                </span>
              ) : null}
              <strong className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[13px] leading-none">{miniGameSecondsLeft}s</strong>
            </span>
          ) : null}
          {locationLabel ? (
            <MobilePill
              icon={activeVehicle ? <CarFront size={14} /> : seatedSeatId ? <Armchair size={14} /> : <Sparkles size={14} />}
              text={locationLabel}
              tone="bg-emerald-500 text-white"
            />
          ) : null}
        </div>
      </div>
    </>
  )
}

function Badge({
  icon,
  text,
  tone,
  testId,
}: {
  icon: ReactNode
  text: string
  tone: string
  testId?: string
}) {
  return (
    <span
      data-testid={testId}
      className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-black text-slate-950 ${tone}`}
    >
      {icon}
      {text}
    </span>
  )
}

function MobilePill({
  icon,
  text,
  tone,
  testId,
}: {
  icon: ReactNode
  text: string
  tone: string
  testId?: string
}) {
  return (
    <span
      data-testid={testId}
      className={`inline-flex min-h-7 items-center gap-1 rounded-full px-3 text-[11px] font-black shadow ${tone}`}
    >
      {icon}
      {text}
    </span>
  )
}
