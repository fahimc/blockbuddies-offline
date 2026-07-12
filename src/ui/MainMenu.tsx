import { Bot, Play, Settings, ShieldCheck, ShoppingBag, UserRound, Users, WifiOff } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useGameStore } from '../state/gameStore'
import { BrandLogo } from './BrandLogo'

type MainMenuProps = {
  onPlay: () => void
}

export function MainMenu({ onPlay }: MainMenuProps) {
  const setScreen = useGameStore((state) => state.setScreen)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const openGamePanel = (panel: Parameters<typeof setOpenPanel>[0]) => {
    setScreen('game')
    setOpenPanel(panel)
  }

  return (
    <section className="bb-splash min-h-screen overflow-hidden p-3 text-white md:p-5">
      <h1 className="sr-only">BlockBuddies Offline</h1>
      <header className="bb-top-banner mx-auto mb-3 flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 py-3 shadow-2xl md:px-6">
        <BrandLogo />
        <div className="hidden flex-1 text-center md:block">
          <p className="text-2xl font-black leading-tight text-white drop-shadow">Build. Explore. Play Together.</p>
          <p className="text-lg font-black text-sky-100">Anytime, Anywhere.</p>
        </div>
        <div className="hidden items-center gap-2 text-xs font-black md:flex">
          <FeatureChip icon={<WifiOff size={15} />} label="Offline Play" />
          <FeatureChip icon={<Bot size={15} />} label="AI Buddies" />
          <FeatureChip icon={<ShieldCheck size={15} />} label="Safe & Fun" />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-3 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="bb-hero-card relative min-h-[32rem] overflow-hidden rounded-2xl border-4 border-white/80 shadow-2xl">
          <div className="bb-cloud c1" />
          <div className="bb-cloud c2" />
          <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-emerald-400 via-lime-300 to-transparent" />
          <TownBackdrop />
          <div className="relative z-10 flex h-full min-h-[32rem] flex-col items-center justify-between p-5">
            <BrandLogo compact />
            <div className="bb-character-line" aria-hidden>
              <MenuBuddy hair="brown" shirt="bg-blue-600" />
              <MenuBuddy hair="amber" shirt="bg-emerald-500" />
              <MenuBuddy hair="pink" shirt="bg-fuchsia-400" />
              <MenuBuddy hair="slate" shirt="bg-amber-400" />
            </div>
            <button
              type="button"
              onClick={onPlay}
              aria-label="Play"
              className="bb-play-button mb-2 inline-flex min-h-16 items-center gap-3 rounded-2xl px-10 text-3xl font-black text-white shadow-2xl"
            >
              <Play aria-hidden size={32} fill="currentColor" />
              PLAY
            </button>
          </div>
        </section>

        <section className="bb-menu-card grid min-h-[32rem] gap-4 rounded-2xl border-4 border-white/70 p-4 shadow-2xl lg:grid-cols-[16rem_1fr]">
          <nav className="flex flex-col gap-3">
            <MenuButton icon={<Play size={24} fill="currentColor" />} label="PLAY" ariaLabel="Open game" tone="from-emerald-400 to-green-600" onClick={onPlay} />
            <MenuButton icon={<UserRound size={23} />} label="AVATAR" tone="from-sky-400 to-blue-600" onClick={() => openGamePanel('avatar')} />
            <MenuButton icon={<ShoppingBag size={23} />} label="SHOP" tone="from-amber-300 to-orange-500" onClick={() => openGamePanel('shop')} />
            <MenuButton icon={<Users size={23} />} label="FRIENDS" tone="from-violet-400 to-purple-600" onClick={() => openGamePanel('friends')} />
            <MenuButton icon={<Settings size={23} />} label="SETTINGS" tone="from-slate-400 to-slate-700" onClick={() => openGamePanel('settings')} />
          </nav>

          <div className="relative min-h-[26rem] overflow-hidden rounded-2xl bg-sky-200">
            <div className="absolute inset-0 bg-[linear-gradient(#7dd3fc_0%,#bae6fd_54%,#86efac_55%,#22c55e_100%)]" />
            <TownBackdrop dense />
            <div className="absolute bottom-7 right-8">
              <div className="bb-robot-helper" aria-hidden>
                <span className="bb-robot-head">
                  <span className="bb-robot-eye left" />
                  <span className="bb-robot-eye right" />
                  <span className="bb-robot-mouth" />
                </span>
                <span className="bb-robot-body" />
              </div>
            </div>
            <div className="absolute bottom-8 left-8 max-w-52 rounded-2xl border-2 border-slate-900/10 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-xl">
              Hey buddy!<br />
              Ready for fun?
            </div>
            <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-black text-slate-900 shadow">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-400">C</span>
              1,250
              <span className="rounded-full bg-sky-500 px-2 py-1 text-white">Lv. 4</span>
            </div>
          </div>
        </section>
      </div>

      <footer className="mx-auto mt-3 flex max-w-7xl flex-wrap items-center justify-center gap-3 rounded-2xl bg-slate-950/85 px-4 py-3 text-sm font-black text-sky-100 shadow-xl">
        <span>BlockBuddies Offline - Your world, your buddies, your adventure.</span>
        <span>Play offline</span>
        <span>Safe for kids</span>
        <span>No internet needed</span>
      </footer>
    </section>
  )
}

function FeatureChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-2 text-sky-100">
      {icon}
      {label}
    </span>
  )
}

function MenuButton({ icon, label, tone, onClick, ariaLabel }: { icon: ReactNode; label: string; tone: string; onClick: () => void; ariaLabel?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`bb-menu-button inline-flex min-h-14 items-center gap-3 rounded-xl bg-gradient-to-b ${tone} px-5 text-left text-xl font-black text-white shadow-lg`}
    >
      {icon}
      {label}
    </button>
  )
}

function MenuBuddy({ hair, shirt }: { hair: string; shirt: string }) {
  return (
    <span className="bb-menu-buddy">
      <span className="bb-menu-buddy-head" style={{ '--hair': hair } as CSSProperties & Record<'--hair', string>} />
      <span className={`bb-menu-buddy-body ${shirt}`} />
    </span>
  )
}

function TownBackdrop({ dense = false }: { dense?: boolean }) {
  return (
    <div className="bb-town-backdrop" aria-hidden>
      <span className="bb-building tower" />
      <span className="bb-building school" />
      <span className="bb-building house left" />
      <span className="bb-building house right" />
      <span className="bb-tree t1" />
      <span className="bb-tree t2" />
      <span className="bb-tree t3" />
      {dense ? <span className="bb-building shop" /> : null}
    </div>
  )
}
