import {
  Backpack,
  Blocks,
  Coins,
  HeartHandshake,
  ListChecks,
  Medal,
  Palette,
  Server,
  Settings,
  ShoppingBag,
  Smile,
  Sparkles,
  Trophy,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { getLocation } from '../data/world'
import { useGameStore } from '../state/gameStore'

export function HUD() {
  const coins = useGameStore((state) => state.coins)
  const nearbyLocation = useGameStore((state) => state.nearbyLocation)
  const obby = useGameStore((state) => state.obby)
  const saveStatus = useGameStore((state) => state.saveStatus)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)

  const locationLabel = nearbyLocation ? getLocation(nearbyLocation).label : undefined

  return (
    <>
      <div className="desktop-hud pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-24 max-md:top-16 max-md:px-3">
        <div className="pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto rounded-lg bg-white/90 p-2 shadow-xl backdrop-blur">
        <Badge icon={<Coins size={18} />} text={`${coins}`} tone="bg-amber-300" />
        {obby.active ? <Badge icon={<Trophy size={18} />} text="Obby running" tone="bg-red-200" /> : null}
        {locationLabel ? <Badge icon={<Backpack size={18} />} text={`Near ${locationLabel}`} tone="bg-sky-200" /> : null}
        <button type="button" onClick={() => setOpenPanel('quests')} className="hud-button" title="Quests" aria-label="Quests">
          <ListChecks size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('shop')} className="hud-button" title="Shop" aria-label="Shop">
          <ShoppingBag size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('avatar')} className="hud-button" title="Avatar" aria-label="Avatar">
          <Palette size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('friends')} className="hud-button" title="Friends" aria-label="Friends">
          <HeartHandshake size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('leaderboard')} className="hud-button" title="Leaderboard" aria-label="Leaderboard">
          <Trophy size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('badges')} className="hud-button" title="Badges" aria-label="Badges">
          <Medal size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('build')} className="hud-button" title="Build" aria-label="Build">
          <Blocks size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('server')} className="hud-button" title="Server" aria-label="Server">
          <Server size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('emotes')} className="hud-button" title="Emotes" aria-label="Emotes">
          <Smile size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('settings')} className="hud-button" title="Settings" aria-label="Settings">
          <Settings size={20} aria-hidden />
        </button>
        <span className="px-2 text-xs font-bold text-slate-500">{saveStatus}</span>
        </div>
      </div>

      <div className="mobile-game-hud pointer-events-none absolute inset-x-0 top-3 z-20 hidden">
        <div className="mobile-scorebar pointer-events-auto mx-auto flex w-max max-w-[58vw] items-center gap-1.5 rounded-full bg-white/40 p-1 shadow-lg backdrop-blur">
          <MobilePill icon={<Coins size={14} />} text={`${coins}`} tone="bg-amber-400 text-slate-950" />
          {obby.active ? <MobilePill icon={<Trophy size={14} />} text="Obby" tone="bg-rose-500 text-white" /> : null}
          <MobilePill icon={<Sparkles size={14} />} text={locationLabel ?? saveStatus} tone="bg-emerald-500 text-white" />
        </div>
        <div className="mobile-right-actions pointer-events-auto absolute right-3 top-12 flex flex-col items-end gap-1.5">
          <button type="button" onClick={() => setOpenPanel('server')} className="mobile-action-pill bg-sky-500">
            <Server size={13} aria-hidden />
            Travel
          </button>
          <button type="button" onClick={() => setOpenPanel('settings')} className="mobile-action-pill bg-fuchsia-500">
            <Settings size={13} aria-hidden />
            Settings
          </button>
        </div>
        <div className="mobile-left-actions pointer-events-auto absolute left-3 top-12 flex flex-col gap-1.5">
          <button type="button" onClick={() => setOpenPanel('build')} className="mobile-action-pill bg-amber-400 text-slate-950">
            <Blocks size={13} aria-hidden />
            Build
          </button>
          <button type="button" onClick={() => setOpenPanel('shop')} className="mobile-action-pill bg-rose-500">
            <ShoppingBag size={13} aria-hidden />
            Shop
          </button>
        </div>
      </div>
    </>
  )
}

function Badge({ icon, text, tone }: { icon: ReactNode; text: string; tone: string }) {
  return (
    <span className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-black text-slate-950 ${tone}`}>
      {icon}
      {text}
    </span>
  )
}

function MobilePill({ icon, text, tone }: { icon: ReactNode; text: string; tone: string }) {
  return (
    <span className={`inline-flex min-h-7 items-center gap-1 rounded-full px-3 text-[11px] font-black shadow ${tone}`}>
      {icon}
      {text}
    </span>
  )
}
