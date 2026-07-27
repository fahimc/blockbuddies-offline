import {
  BookOpen,
  Bus,
  Coins,
  Gamepad2,
  Heart,
  Home,
  MapPin,
  PawPrint,
  Shield,
  Sparkles,
  Star,
  Users,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  buddyActivityStationDefinitions,
  buddyRushGadgets,
  buddyRushPets,
  buddyRushRivals,
  collectableBuddyDefinitions,
  dailyBuddyEvent,
  findCollectableBuddy,
  neighbourhoodRanks,
} from '../data/buddyRush'
import type { BuddyActivityStationId, BuddyRarity } from '../game/types'
import { buddyOutputPerMinute, buddyShieldSeconds } from '../ai/buddyRush'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

type BuddyRushTab = 'clubhouse' | 'bus' | 'book' | 'rush' | 'loadout'

const tabItems: {
  id: BuddyRushTab
  label: string
  icon: typeof Home
}[] = [
  { id: 'clubhouse', label: 'Clubhouse', icon: Home },
  { id: 'bus', label: 'Buddy Bus', icon: Bus },
  { id: 'book', label: 'BuddyBook', icon: BookOpen },
  { id: 'rush', label: 'Rush', icon: Shield },
  { id: 'loadout', label: 'Gear', icon: Wrench },
]

const rarityClasses: Record<BuddyRarity, string> = {
  everyday: 'border-slate-300 bg-slate-50',
  unusual: 'border-emerald-400 bg-emerald-50',
  rare: 'border-sky-400 bg-sky-50',
  epic: 'border-violet-400 bg-violet-50',
  superstar: 'border-amber-400 bg-amber-50',
  secret: 'border-fuchsia-500 bg-fuchsia-50 shadow-fuchsia-200',
}

export function BuddyRushPanel() {
  const runtime = useGameStore((state) => state.buddyRush)
  const settings = useGameStore((state) => state.settings)
  const collectCoins = useGameStore((state) => state.collectBuddyRushCoins)
  const startRecruitment = useGameStore((state) => state.startBuddyRecruitment)
  const answerRecruitment = useGameStore(
    (state) => state.answerBuddyRecruitment,
  )
  const assignBuddy = useGameStore((state) => state.assignBuddyToStation)
  const toggleFavourite = useGameStore((state) => state.toggleFavouriteBuddy)
  const startRush = useGameStore((state) => state.startPlayerBuddyRush)
  const startRescue = useGameStore((state) => state.startBuddyRescue)
  const setPet = useGameStore((state) => state.setBuddyRushPet)
  const travel = useGameStore((state) => state.travelToBuddyRushTarget)
  const [tab, setTab] = useState<BuddyRushTab>(
    runtime.ownedBuddies.length > 0 ? 'clubhouse' : 'bus',
  )
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const selectedDefinition = runtime.bus.selectedDefinitionId
    ? findCollectableBuddy(runtime.bus.selectedDefinitionId)
    : undefined
  const output = buddyOutputPerMinute(runtime)
  const shieldSeconds = buddyShieldSeconds(runtime, now)
  const eventName = dailyBuddyEvent(now)
  const bookCompletion = Math.round(
    (runtime.discoveredDefinitionIds.length /
      collectableBuddyDefinitions.length) *
      100,
  )

  return (
    <Panel title="Buddy Rush">
      <section className="mb-3 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-4 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20">
            <Users size={24} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-black">
              Build your collection. Bring your clubhouse to life.
            </h3>
            <p className="mt-1 text-xs font-bold text-white/85">
              Recruit friendly characters, assign activities, and protect their
              Friendship Badges. Buddies are never permanently lost.
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black">
          <Stat label="Buddies" value={`${runtime.ownedBuddies.length}/12`} />
          <Stat label="BuddyBook" value={`${bookCompletion}%`} />
          <Stat
            label="Shield"
            value={`${titleCase(runtime.shield.phase)} ${formatTime(shieldSeconds)}`}
            valueTestId="buddy-rush-panel-shield-time"
          />
        </div>
      </section>

      <nav
        className="mb-3 grid grid-cols-5 gap-1 rounded-2xl bg-slate-100 p-1"
        aria-label="Buddy Rush sections"
      >
        {tabItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`grid min-h-12 place-items-center rounded-xl px-1 text-[10px] font-black ${
                tab === item.id
                  ? 'bg-white text-indigo-700 shadow'
                  : 'text-slate-600'
              }`}
              aria-current={tab === item.id ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden />
              {item.label}
            </button>
          )
        })}
      </nav>

      {tab === 'clubhouse' ? (
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="min-h-12 rounded-xl bg-emerald-500 px-3 text-sm font-black text-white shadow"
              onClick={collectCoins}
              disabled={runtime.unclaimedCoins < 1}
            >
              <Coins className="mr-1 inline" size={17} aria-hidden />
              Collect {Math.floor(runtime.unclaimedCoins)}
            </button>
            <button
              type="button"
              className="min-h-12 rounded-xl bg-indigo-600 px-3 text-sm font-black text-white shadow"
              onClick={() => travel('clubhouse')}
            >
              <MapPin className="mr-1 inline" size={17} aria-hidden />
              Visit clubhouse
            </button>
          </div>
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
            <Sparkles className="mr-1 inline" size={15} aria-hidden />
            {output.toFixed(1)} coins/min · Today: {eventName}
          </p>

          {runtime.ownedBuddies.length === 0 ? (
            <EmptyClubhouse onBus={() => setTab('bus')} />
          ) : (
            runtime.ownedBuddies.map((buddy) => {
              const definition = findCollectableBuddy(buddy.definitionId)
              if (!definition) return null
              return (
                <article
                  key={buddy.id}
                  className={`rounded-2xl border-2 p-3 shadow-sm ${rarityClasses[buddy.rarity]}`}
                >
                  <div className="flex items-start gap-3">
                    <BuddyDot
                      color={definition.color}
                      accent={definition.accentColor}
                      galaxy={buddy.styleId === 'galaxy'}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate font-black text-slate-950">
                          {buddy.styleId === 'galaxy' ? 'Galaxy ' : ''}
                          {definition.name}
                        </h3>
                        <button
                          type="button"
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                            buddy.isFavourite
                              ? 'bg-rose-500 text-white'
                              : 'bg-white text-slate-500'
                          }`}
                          onClick={() => toggleFavourite(buddy.id)}
                          disabled={buddy.isFavourite}
                          aria-label={
                            buddy.isFavourite
                              ? `${definition.name} is your protected favourite`
                              : `Make ${definition.name} favourite`
                          }
                          title={
                            buddy.isFavourite
                              ? 'Choose another Buddy to move favourite protection'
                              : 'One Favourite Buddy can be protected from capture'
                          }
                        >
                          <Heart
                            size={17}
                            fill={buddy.isFavourite ? 'currentColor' : 'none'}
                            aria-hidden
                          />
                        </button>
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                        {buddy.rarity} · {buddy.talent} · Friendship Lv.
                        {buddy.friendshipLevel}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-600">
                        {definition.ability}
                      </p>
                    </div>
                  </div>
                  {buddy.visitState ? (
                    <div className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-900">
                      Visiting {findRivalName(buddy.visitState.hostPlayerId)} ·
                      returns in{' '}
                      {formatTime(
                        Math.ceil(
                          (buddy.visitState.endsAtGameTime - now) / 1_000,
                        ),
                      )}
                      <button
                        type="button"
                        className="mt-2 block min-h-10 w-full rounded-lg bg-amber-500 text-white"
                        onClick={() => startRescue(buddy.id)}
                      >
                        Start Rescue Quest
                      </button>
                    </div>
                  ) : (
                    <label className="mt-3 flex items-center gap-2 text-xs font-black text-slate-700">
                      Activity
                      <select
                        value={buddy.activityStationId ?? ''}
                        onChange={(event) =>
                          assignBuddy(
                            buddy.id,
                            (event.target.value ||
                              null) as BuddyActivityStationId | null,
                          )
                        }
                        className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-2"
                        aria-label={`Activity for ${definition.name}`}
                      >
                        <option value="">Relax in clubhouse</option>
                        {buddyActivityStationDefinitions.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </article>
              )
            })
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            {buddyActivityStationDefinitions.map((definition) => {
              const station = runtime.stations.find(
                (entry) => entry.id === definition.id,
              )
              return (
                <article
                  key={definition.id}
                  className="rounded-xl bg-slate-100 p-3"
                >
                  <strong className="text-sm text-slate-950">
                    {definition.name}
                  </strong>
                  <p className="text-[11px] font-bold text-slate-500">
                    Prefers {definition.preferredTalent} · Lv.
                    {station?.level ?? 1}
                  </p>
                  <p className="mt-1 text-xs font-black text-indigo-700">
                    {station?.assignedBuddyIds.length ?? 0}/4 assigned
                  </p>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {tab === 'bus' ? (
        <section className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-sky-100 p-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-500 text-white">
              <Bus size={26} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-slate-950">Buddy Bus Stop</h3>
              <p className="text-xs font-bold text-slate-600">
                {runtime.bus.offerDefinitionIds.length > 0
                  ? `Visitors leave in ${formatTime(Math.ceil((runtime.bus.departsAt - now) / 1_000))}`
                  : `Next bus in ${formatTime(Math.ceil((runtime.bus.nextArrivalAt - now) / 1_000))}`}
              </p>
            </div>
            <button
              type="button"
              className="min-h-10 rounded-xl bg-sky-600 px-3 text-xs font-black text-white"
              onClick={() => travel('bus')}
            >
              Visit
            </button>
          </div>

          {selectedDefinition ? (
            <article
              className={`rounded-2xl border-2 p-4 ${rarityClasses[selectedDefinition.rarity]}`}
            >
              <div className="flex items-center gap-3">
                <BuddyDot
                  color={selectedDefinition.color}
                  accent={selectedDefinition.accentColor}
                />
                <div>
                  <h3 className="font-black text-slate-950">
                    Recruit {selectedDefinition.name}
                  </h3>
                  <p className="text-xs font-black uppercase text-slate-500">
                    {selectedDefinition.rarity} · {selectedDefinition.talent}
                  </p>
                </div>
              </div>
              <p className="mt-3 rounded-xl bg-white p-3 text-sm font-black text-slate-900">
                {selectedDefinition.recruitmentPrompt}
              </p>
              {runtime.bus.feedback ? (
                <p
                  className={`mt-2 rounded-lg px-3 py-2 text-xs font-black ${
                    runtime.bus.feedback.kind === 'wrong'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                  role="status"
                >
                  {runtime.bus.feedback.message}
                </p>
              ) : null}
              <div className="mt-3 grid gap-2">
                {selectedDefinition.recruitmentOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="min-h-12 rounded-xl border-2 border-slate-200 bg-white px-3 text-left text-sm font-black text-slate-900 shadow-sm"
                    onClick={() => answerRecruitment(option, Date.now())}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </article>
          ) : runtime.bus.offerDefinitionIds.length === 0 ? (
            <p className="rounded-2xl bg-slate-100 p-4 text-center text-sm font-black text-slate-600">
              The bus is exploring town. It will return with three new visitors.
            </p>
          ) : (
            <div className="grid gap-2">
              {runtime.bus.offerDefinitionIds.map((definitionId) => {
                const definition = findCollectableBuddy(definitionId)
                if (!definition) return null
                return (
                  <button
                    key={definition.id}
                    type="button"
                    className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 p-3 text-left shadow-sm ${rarityClasses[definition.rarity]}`}
                    onClick={() => startRecruitment(definition.id)}
                  >
                    <BuddyDot
                      color={definition.color}
                      accent={definition.accentColor}
                    />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-slate-950">
                        {definition.name}
                      </strong>
                      <span className="block text-xs font-black uppercase text-slate-500">
                        {definition.rarity} · {definition.talent}
                      </span>
                    </span>
                    <span className="rounded-full bg-indigo-600 px-3 py-2 text-xs font-black text-white">
                      Challenge
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'book' ? (
        <section>
          <div className="mb-3 flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2">
            <strong className="text-sm text-indigo-900">
              BuddyBook Collection
            </strong>
            <span className="text-xs font-black text-indigo-700">
              {runtime.discoveredDefinitionIds.length}/12 discovered
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {collectableBuddyDefinitions.map((definition) => {
              const discovered = runtime.discoveredDefinitionIds.includes(
                definition.id,
              )
              const owned = runtime.ownedBuddies.some(
                (buddy) => buddy.definitionId === definition.id,
              )
              return (
                <article
                  key={definition.id}
                  className={`min-h-36 rounded-2xl border-2 p-3 text-center ${
                    discovered
                      ? rarityClasses[definition.rarity]
                      : 'border-slate-300 bg-slate-200'
                  }`}
                >
                  {discovered ? (
                    <>
                      <div className="mx-auto w-fit">
                        <BuddyDot
                          color={definition.color}
                          accent={definition.accentColor}
                          galaxy={runtime.ownedBuddies.some(
                            (buddy) =>
                              buddy.definitionId === definition.id &&
                              buddy.styleId === 'galaxy',
                          )}
                        />
                      </div>
                      <strong className="mt-2 block text-sm text-slate-950">
                        {definition.name}
                      </strong>
                      <span className="text-[10px] font-black uppercase text-slate-500">
                        {definition.rarity} · {definition.talent}
                      </span>
                      <span className="mt-1 block text-[10px] font-bold text-indigo-700">
                        {owned ? 'In your clubhouse' : 'Discovered'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-400 text-2xl font-black text-white">
                        ?
                      </span>
                      <strong className="mt-2 block text-sm text-slate-600">
                        Undiscovered
                      </strong>
                      <span className="text-[10px] font-bold text-slate-500">
                        Find this silhouette through buses, quests, or events.
                      </span>
                    </>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {tab === 'rush' ? (
        <section className="space-y-3">
          <div
            className={`rounded-2xl p-4 ${
              runtime.shield.phase === 'warning' ||
              runtime.shield.phase === 'rush'
                ? 'bg-rose-100 text-rose-900'
                : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Shield size={26} aria-hidden />
              <div className="flex-1">
                <strong className="block">
                  Clubhouse Shield: {titleCase(runtime.shield.phase)}
                </strong>
                <span
                  className="text-xs font-black"
                  data-testid="buddy-rush-panel-rush-time"
                >
                  {formatTime(shieldSeconds)} remaining ·{' '}
                  {settings.buddyRushMode.replace('-', ' ')} mode
                </span>
              </div>
            </div>
          </div>

          {!settings.buddyRushEnabled ? (
            <p className="rounded-xl bg-slate-100 p-3 text-sm font-black text-slate-700">
              Buddy Rush is disabled in Settings. Clubhouse activities and the
              Buddy Bus remain available.
            </p>
          ) : null}

          {runtime.rescueQuest ? (
            <article className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
              <strong className="text-amber-950">Active Rescue Quest</strong>
              <p className="mt-1 text-xs font-bold text-amber-800">
                Follow Tracker Pup to{' '}
                {findRivalName(runtime.rescueQuest.rivalId)}
                's clubhouse and bring your Buddy home.
              </p>
              <button
                type="button"
                className="mt-3 min-h-11 w-full rounded-xl bg-amber-500 font-black text-white"
                onClick={() =>
                  startRescue(runtime.rescueQuest!.buddyInstanceId)
                }
              >
                Track Rescue
              </button>
            </article>
          ) : null}

          <h3 className="font-black text-slate-950">Rival clubhouses</h3>
          <p className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-900">
            Buddies may visit temporarily, but ownership, styles, and friendship
            progress never transfer.
          </p>
          {buddyRushRivals
            .filter((rival) => rival.clubhousePosition)
            .map((rival) => (
              <article
                key={rival.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: rival.color }}
                  >
                    <Home size={21} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-slate-950">
                      {rival.clubhouseName}
                    </strong>
                    <span className="text-xs font-black capitalize text-slate-500">
                      {rival.name} · {rival.archetype}
                    </span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="min-h-10 rounded-xl bg-slate-100 text-xs font-black text-slate-700"
                    onClick={() => travel(rival.id)}
                  >
                    Visit
                  </button>
                  <button
                    type="button"
                    className="min-h-10 rounded-xl bg-fuchsia-600 text-xs font-black text-white disabled:opacity-50"
                    disabled={
                      Boolean(runtime.activeRaid) ||
                      runtime.ownedBuddies.length === 0
                    }
                    onClick={() => startRush(rival.id, Date.now())}
                  >
                    Start friendly Rush
                  </button>
                </div>
              </article>
            ))}
        </section>
      ) : null}

      {tab === 'loadout' ? (
        <section className="space-y-3">
          <article className="rounded-2xl bg-slate-100 p-3">
            <div className="mb-2 flex items-center gap-2">
              <PawPrint size={20} className="text-amber-600" aria-hidden />
              <strong className="text-slate-950">Functional pets</strong>
            </div>
            <label className="bb-setting-row mb-2 bg-white">
              <span>Adventure pet</span>
              <select
                value={runtime.petLoadout.adventurePetId}
                onChange={(event) =>
                  setPet(
                    'adventure',
                    event.target
                      .value as typeof runtime.petLoadout.adventurePetId,
                  )
                }
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 font-black"
              >
                {buddyRushPets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} · {pet.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="bb-setting-row bg-white">
              <span>Guard pet</span>
              <select
                value={runtime.petLoadout.guardPetId}
                onChange={(event) =>
                  setPet(
                    'guard',
                    event.target.value as typeof runtime.petLoadout.guardPetId,
                  )
                }
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 font-black"
              >
                {buddyRushPets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} · {pet.role}
                  </option>
                ))}
              </select>
            </label>
          </article>

          <article className="rounded-2xl bg-indigo-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Gamepad2 size={20} className="text-indigo-700" aria-hidden />
              <strong className="text-indigo-950">Prank gadget loadout</strong>
            </div>
            <div className="space-y-2">
              {buddyRushGadgets.map((gadget) => (
                <div
                  key={gadget.id}
                  className="flex items-center gap-3 rounded-xl bg-white p-3"
                >
                  <span
                    className="h-9 w-9 rounded-xl"
                    style={{ backgroundColor: gadget.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm text-slate-950">
                      {gadget.name}
                    </strong>
                    <span className="block text-[11px] font-bold text-slate-500">
                      {gadget.description}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl bg-gradient-to-r from-amber-100 to-yellow-50 p-3">
            <div className="flex items-center gap-2">
              <Star size={20} className="text-amber-600" aria-hidden />
              <strong className="text-amber-950">
                Neighbourhood Rank {runtime.neighbourhoodRank + 1}
              </strong>
            </div>
            <p className="mt-1 text-sm font-black text-amber-800">
              {neighbourhoodRanks[runtime.neighbourhoodRank]}
            </p>
            <p className="text-xs font-bold text-amber-700">
              Recruit more Buddies and complete rescues to unlock future
              neighbourhoods without losing your collection.
            </p>
          </article>
        </section>
      ) : null}
    </Panel>
  )
}

function Stat({
  label,
  value,
  valueTestId,
}: {
  label: string
  value: string
  valueTestId?: string
}) {
  return (
    <span className="rounded-xl bg-white/15 px-2 py-2">
      <span className="block text-[9px] uppercase text-white/70">{label}</span>
      <span
        className="block text-[11px] leading-tight sm:text-xs"
        data-testid={valueTestId}
      >
        {value}
      </span>
    </span>
  )
}

function BuddyDot({
  color,
  accent,
  galaxy = false,
}: {
  color: string
  accent: string
  galaxy?: boolean
}) {
  return (
    <span
      className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-white shadow ${
        galaxy
          ? 'bg-gradient-to-br from-indigo-950 via-violet-700 to-fuchsia-500'
          : ''
      }`}
      style={galaxy ? undefined : { backgroundColor: color }}
      aria-hidden
    >
      <span
        className="h-4 w-6 rounded-full"
        style={{ backgroundColor: accent }}
      />
      {galaxy ? (
        <Sparkles
          className="absolute right-0 top-0 text-yellow-200"
          size={15}
        />
      ) : null}
    </span>
  )
}

function EmptyClubhouse({ onBus }: { onBus: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 p-5 text-center">
      <Bus className="mx-auto text-indigo-600" size={35} aria-hidden />
      <h3 className="mt-2 font-black text-indigo-950">
        Your first visitors are waiting
      </h3>
      <p className="mt-1 text-xs font-bold text-indigo-700">
        Complete a 15-second Buddy Bus challenge to bring your clubhouse to
        life.
      </p>
      <button
        type="button"
        className="mt-3 min-h-11 rounded-xl bg-indigo-600 px-5 font-black text-white"
        onClick={onBus}
      >
        Meet the Buddy Bus
      </button>
    </div>
  )
}

function findRivalName(id: string) {
  return buddyRushRivals.find((rival) => rival.id === id)?.name ?? 'a rival'
}

function titleCase(value: string) {
  return value
    .split('-')
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ')
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}
