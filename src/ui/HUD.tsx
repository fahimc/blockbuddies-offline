import {
  Armchair,
  Backpack,
  CarFront,
  Coins,
  Flag,
  Gamepad2,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { miniGameDefinition } from '../ai/miniGames'
import { miniGameTargetInstruction } from '../ai/miniGameProgress'
import { getLocation } from '../data/world'
import {
  goKartCountdownMs,
  isGoKartId,
  kartRaceElapsed,
  kartRaceProgress,
} from '../game/goKart'
import { getDrivableVehicle } from '../game/vehicles'
import { useGameStore } from '../state/gameStore'
import { useLocalPartyStore } from '../state/localPartyStore'

export function HUD() {
  const coins = useGameStore((state) => state.coins)
  const nearbyLocation = useGameStore((state) => state.nearbyLocation)
  const activeInterior = useGameStore((state) => state.activeInterior)
  const obby = useGameStore((state) => state.obby)
  const miniGame = useGameStore((state) => state.miniGame)
  const seatedSeatId = useGameStore((state) => state.seatedSeatId)
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const activeVehicle = activeVehicleId
    ? getDrivableVehicle(activeVehicleId)
    : undefined

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
              <span className="rounded-md bg-blue-500 px-2 py-1">
                {miniGame.score}/{miniGame.target}
              </span>
              <span className="rounded-md bg-amber-300 px-2 py-1 text-slate-950">
                {miniGame.points} pts
              </span>
              {miniGameInstruction ? (
                <span className="max-w-48 truncate rounded-md bg-white px-2 py-1 text-slate-950">
                  {miniGameInstruction.text}
                </span>
              ) : null}
              <strong className="rounded-md bg-rose-500 px-2 py-1 text-lg leading-none">
                {miniGameSecondsLeft}s
              </strong>
            </span>
          ) : null}
          {locationLabel ? (
            <Badge
              icon={
                activeVehicle ? (
                  <CarFront size={18} />
                ) : seatedSeatId ? (
                  <Armchair size={18} />
                ) : (
                  <Backpack size={18} />
                )
              }
              text={
                activeVehicle || seatedSeatId || activeInterior
                  ? locationLabel
                  : `Near ${locationLabel}`
              }
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
              <span>
                {miniGame.score}/{miniGame.target}
              </span>
              <span>{miniGame.points}p</span>
              {miniGameInstruction ? (
                <span className="max-w-20 truncate rounded-full bg-white px-1.5 py-0.5 text-slate-950">
                  {miniGameInstruction.text}
                </span>
              ) : null}
              <strong className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[13px] leading-none">
                {miniGameSecondsLeft}s
              </strong>
            </span>
          ) : null}
          {locationLabel ? (
            <MobilePill
              icon={
                activeVehicle ? (
                  <CarFront size={14} />
                ) : seatedSeatId ? (
                  <Armchair size={14} />
                ) : (
                  <Sparkles size={14} />
                )
              }
              text={locationLabel}
              tone="bg-emerald-500 text-white"
            />
          ) : null}
        </div>
      </div>
      <KartRaceHUD />
    </>
  )
}

function KartRaceHUD() {
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const race = useGameStore((state) => state.kartRace)
  const startKartRace = useGameStore((state) => state.startKartRace)
  const syncKartRace = useGameStore((state) => state.syncKartRace)
  const partyStatus = useLocalPartyStore((state) => state.status)
  const partyPlayerId = useLocalPartyStore((state) => state.playerId)
  const remotePlayers = useLocalPartyStore((state) => state.remotePlayers)
  const [now, setNow] = useState(() => Date.now())
  const active = isGoKartId(activeVehicleId)
  const raceAuthorityId = [partyPlayerId, ...Object.keys(remotePlayers)].sort(
    (left, right) => left.localeCompare(right),
  )[0]

  useEffect(() => {
    if (!active) return undefined
    const interval = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(interval)
  }, [active])

  useEffect(() => {
    if (!active || raceAuthorityId === partyPlayerId) return
    const host = Object.values(remotePlayers).find(
      (player) => player.id === raceAuthorityId && player.kartRace?.raceId,
    )
    if (
      host?.kartRace &&
      host.kartRace.raceId !== race.raceId &&
      (host.kartRace.status === 'countdown' ||
        host.kartRace.status === 'racing')
    )
      syncKartRace(host.kartRace, Date.now())
  }, [
    active,
    partyPlayerId,
    partyStatus,
    race.raceId,
    raceAuthorityId,
    remotePlayers,
    syncKartRace,
  ])

  if (!active) return null

  const connectedRacers = Object.values(remotePlayers).filter(
    (player) => player.kart && !player.interiorId,
  )
  const racers = race.raceId
    ? [
        { id: 'local', progress: kartRaceProgress(race) },
        ...connectedRacers
          .filter((player) => player.kartRace?.raceId === race.raceId)
          .map((player) => ({
            id: player.id,
            progress: kartRaceProgress(player.kartRace!),
          })),
      ].sort((left, right) => right.progress - left.progress)
    : []
  const position = Math.max(
    1,
    racers.findIndex((racer) => racer.id === 'local') + 1,
  )
  const inMultiplayerRace =
    partyStatus === 'connected' || connectedRacers.length > 0
  const canStart = !inMultiplayerRace || raceAuthorityId === partyPlayerId
  const elapsed = kartRaceElapsed(race, now)
  const countdown = race.countdownEndsAt
    ? Math.max(0, race.countdownEndsAt - now)
    : goKartCountdownMs

  return (
    <div
      data-testid="kart-race-hud"
      className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-3 max-md:top-14"
    >
      <div className="pointer-events-auto flex min-w-64 items-center justify-center gap-3 rounded-2xl border-2 border-cyan-300 bg-slate-950/92 px-4 py-2 text-white shadow-2xl backdrop-blur">
        <Flag className="shrink-0 text-cyan-300" size={22} aria-hidden />
        {race.status === 'lobby' ? (
          <>
            <div>
              <strong className="block text-sm font-black">
                Buddy Kart Circuit
              </strong>
              <span className="flex items-center gap-1 text-xs text-slate-300">
                <Users size={13} aria-hidden /> {connectedRacers.length + 1}/4
                racers - 3 laps
              </span>
            </div>
            {canStart ? (
              <button
                type="button"
                data-testid="start-kart-race"
                className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-black text-slate-950 shadow hover:bg-amber-200"
                onClick={() => startKartRace(Date.now())}
              >
                Start race
              </button>
            ) : (
              <span className="rounded-lg bg-slate-700 px-2 py-1 text-xs font-bold">
                Waiting for host
              </span>
            )}
          </>
        ) : race.status === 'countdown' ? (
          <div className="text-center">
            <strong
              className="block text-4xl font-black leading-none text-amber-300"
              data-testid="kart-countdown"
            >
              {countdown > 0 ? Math.ceil(countdown / 1000) : 'GO!'}
            </strong>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-200">
              Get ready
            </span>
          </div>
        ) : race.status === 'racing' ? (
          <>
            <RaceStat
              label="Position"
              value={`${ordinal(position)} / ${Math.max(1, racers.length)}`}
            />
            <RaceStat label="Lap" value={`${race.lap} / ${race.totalLaps}`} />
            <RaceStat label="Time" value={formatRaceTime(elapsed)} />
          </>
        ) : race.status === 'finished' ? (
          <>
            <div>
              <strong className="block text-lg font-black text-amber-300">
                Finish!
              </strong>
              <span className="text-xs text-slate-300">
                {formatRaceTime(elapsed)} - +30 coins
              </span>
            </div>
            {canStart ? (
              <button
                type="button"
                data-testid="restart-kart-race"
                className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950"
                onClick={() => startKartRace(Date.now())}
              >
                Race again
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}

function RaceStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-16 text-center">
      <small className="block text-[10px] font-bold uppercase tracking-wide text-cyan-200">
        {label}
      </small>
      <strong className="text-base font-black">{value}</strong>
    </span>
  )
}

function formatRaceTime(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60_000)
  const seconds = Math.floor((milliseconds % 60_000) / 1000)
  const tenths = Math.floor((milliseconds % 1000) / 100)
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`
}

function ordinal(value: number) {
  if (value % 10 === 1 && value % 100 !== 11) return `${value}st`
  if (value % 10 === 2 && value % 100 !== 12) return `${value}nd`
  if (value % 10 === 3 && value % 100 !== 13) return `${value}rd`
  return `${value}th`
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
