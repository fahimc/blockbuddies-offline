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

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-24 max-md:top-16 max-md:px-3">
      <div className="pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto rounded-lg bg-white/90 p-2 shadow-xl backdrop-blur">
        <Badge icon={<Coins size={18} />} text={`${coins}`} tone="bg-amber-300" />
        {obby.active ? <Badge icon={<Trophy size={18} />} text="Obby running" tone="bg-red-200" /> : null}
        {nearbyLocation ? (
          <Badge icon={<Backpack size={18} />} text={`Near ${getLocation(nearbyLocation).label}`} tone="bg-sky-200" />
        ) : null}
        <button type="button" onClick={() => setOpenPanel('quests')} className="hud-button" title="Quests">
          <ListChecks size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('shop')} className="hud-button" title="Shop">
          <ShoppingBag size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('avatar')} className="hud-button" title="Avatar">
          <Palette size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('friends')} className="hud-button" title="Friends">
          <HeartHandshake size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('leaderboard')} className="hud-button" title="Leaderboard">
          <Trophy size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('badges')} className="hud-button" title="Badges">
          <Medal size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('build')} className="hud-button" title="Build">
          <Blocks size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('server')} className="hud-button" title="Server">
          <Server size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('emotes')} className="hud-button" title="Emotes">
          <Smile size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => setOpenPanel('settings')} className="hud-button" title="Settings">
          <Settings size={20} aria-hidden />
        </button>
        <span className="px-2 text-xs font-bold text-slate-500">{saveStatus}</span>
      </div>
    </div>
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
