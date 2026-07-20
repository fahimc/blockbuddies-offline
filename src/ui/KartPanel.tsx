import { Check, Flag, Gauge, MapPin, Play, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { goKartVehicleDefinitions, isGoKartId } from '../game/goKart'
import { useGameStore } from '../state/gameStore'
import { useLocalPartyStore } from '../state/localPartyStore'
import { Panel } from './Panel'

export function KartPanel() {
  const activeVehicleId = useGameStore((state) => state.activeVehicleId)
  const obbyActive = useGameStore((state) => state.obby.active)
  const miniGameRunning = useGameStore(
    (state) => state.miniGame.status === 'running',
  )
  const travelToLocation = useGameStore((state) => state.travelToLocation)
  const setActiveVehicle = useGameStore((state) => state.setActiveVehicle)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const partyStatus = useLocalPartyStore((state) => state.status)
  const remotePlayers = useLocalPartyStore((state) => state.remotePlayers)
  const occupiedKartIds = useMemo(
    () =>
      new Set(
        Object.values(remotePlayers)
          .map((player) => player.kart?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    [remotePlayers],
  )
  const availableKarts = useMemo(
    () =>
      goKartVehicleDefinitions.filter((kart) => !occupiedKartIds.has(kart.id)),
    [occupiedKartIds],
  )
  const [selectedKartId, setSelectedKartId] = useState(
    () => availableKarts[0]?.id ?? goKartVehicleDefinitions[0].id,
  )
  const selectedKart = goKartVehicleDefinitions.find(
    (kart) => kart.id === selectedKartId,
  )
  const activityBlocked = obbyActive || miniGameRunning
  const alreadyRacing = isGoKartId(activeVehicleId)
  const selectedUnavailable = occupiedKartIds.has(selectedKartId)
  const connectedRacers = Object.keys(remotePlayers).length

  useEffect(() => {
    if (!selectedUnavailable) return
    const fallback = availableKarts[0]
    if (fallback) setSelectedKartId(fallback.id)
  }, [availableKarts, selectedUnavailable])

  const play = () => {
    if (alreadyRacing) {
      setOpenPanel(undefined)
      return
    }
    if (!selectedKart || selectedUnavailable || activityBlocked) return
    if (!travelToLocation('kart')) return
    setActiveVehicle(selectedKart.id)
  }

  return (
    <div data-testid="kart-panel">
      <Panel title="Go Kart Racing">
        <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl">
          <div className="h-2 bg-gradient-to-r from-cyan-300 via-blue-500 to-fuchsia-500" />
          <div className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-300 text-slate-950 shadow-lg">
                <Gauge size={30} aria-hidden />
              </span>
              <div>
                <h3 className="text-xl font-black">Buddy Kart Circuit</h3>
                <p className="text-sm font-bold text-slate-300">
                  Choose a kart below. Play takes you straight to the starting
                  grid—then press Start race when everyone is ready.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
              <span className="rounded-xl bg-white/10 px-2 py-2">
                <Flag className="mx-auto mb-1 text-cyan-300" size={18} />3 laps
              </span>
              <span className="rounded-xl bg-white/10 px-2 py-2">
                <Users className="mx-auto mb-1 text-cyan-300" size={18} />
                1–4 racers
              </span>
              <span className="rounded-xl bg-white/10 px-2 py-2">
                <MapPin className="mx-auto mb-1 text-cyan-300" size={18} />
                Direct travel
              </span>
            </div>
          </div>
        </section>

        <h3 className="mb-2 mt-4 font-black text-slate-950">
          Choose your kart
        </h3>
        <div
          className="grid grid-cols-2 gap-2"
          role="radiogroup"
          aria-label="Choose your go kart"
        >
          {goKartVehicleDefinitions.map((kart) => {
            const occupied = occupiedKartIds.has(kart.id)
            const selected = kart.id === selectedKartId && !occupied
            return (
              <button
                key={kart.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${kart.label}${occupied ? ' - in use' : ''}`}
                disabled={occupied}
                onClick={() => setSelectedKartId(kart.id)}
                className={`relative min-h-20 rounded-2xl border-4 p-3 text-left shadow transition ${
                  selected
                    ? 'border-slate-950 bg-cyan-50'
                    : 'border-transparent bg-slate-100'
                } disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <span
                  className="mb-2 block h-5 w-full rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: kart.color }}
                />
                <strong className="block text-sm font-black text-slate-950">
                  {kart.label}
                </strong>
                <small className="font-bold text-slate-500">
                  {occupied
                    ? 'Another racer is using this kart'
                    : 'Ready to race'}
                </small>
                {selected ? (
                  <Check
                    size={18}
                    className="absolute right-2 top-2 rounded-full bg-slate-950 p-0.5 text-white"
                    aria-hidden
                  />
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-950">
          <span className="inline-flex items-center gap-2 font-black">
            <Users size={17} aria-hidden />
            {partyStatus === 'connected'
              ? `Local Party: ${connectedRacers + 1} connected`
              : 'Solo race or Local Party'}
          </span>
          <p className="mt-1 text-xs text-blue-800">
            For multiplayer, each player opens Go Kart Racing and picks a free
            kart. The race host presses Start race after everyone joins.
          </p>
        </div>

        {activityBlocked ? (
          <p
            className="mt-3 rounded-xl bg-rose-100 p-3 text-sm font-black text-rose-800"
            role="status"
          >
            Finish or cancel the current activity before starting Go Karts.
          </p>
        ) : null}
        {!availableKarts.length ? (
          <p
            className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-black text-amber-900"
            role="status"
          >
            All four karts are currently in use. Wait for a racer to leave one.
          </p>
        ) : null}

        <button
          type="button"
          onClick={play}
          disabled={
            !alreadyRacing &&
            (activityBlocked || !selectedKart || selectedUnavailable)
          }
          className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-amber-300 to-orange-500 px-4 text-lg font-black text-slate-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play size={22} fill="currentColor" aria-hidden />
          {alreadyRacing ? 'Return to Race' : 'Play Go Karts'}
        </button>
      </Panel>
    </div>
  )
}
