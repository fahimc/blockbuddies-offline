import { Play, Settings, ShieldCheck, ShoppingBag, UserRound, WifiOff } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import splashPortrait from '../assets/splash/blockbuddies-splash-portrait.png'
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
    <section
      className="bb-splash bb-splash-poster"
      style={{ '--splash-image': `url(${splashPortrait})` } as CSSProperties & Record<'--splash-image', string>}
    >
      <div className="bb-splash-art" aria-hidden />
      <div className="bb-splash-vignette" aria-hidden />
      <h1 className="sr-only">BlockBuddies Offline</h1>

      <header className="bb-splash-brand" aria-label="BlockBuddies Offline">
        <BrandLogo compact />
      </header>

      <div className="bb-splash-main-copy">
        <p>
          Your world.
          <br />
          <span>Your buddies.</span>
          <br />
          Your adventure.
        </p>
      </div>

      <div className="bb-splash-controls">
        <button type="button" onClick={onPlay} aria-label="Play" className="bb-splash-play">
          <Play aria-hidden size={34} fill="currentColor" />
          PLAY
        </button>

        <div className="bb-splash-quick-actions" aria-label="Quick actions">
          <IconButton icon={<UserRound size={20} />} label="Avatar" onClick={() => openGamePanel('avatar')} />
          <IconButton icon={<ShoppingBag size={20} />} label="Shop" onClick={() => openGamePanel('shop')} />
          <IconButton icon={<Settings size={20} />} label="Settings" onClick={() => openGamePanel('settings')} />
        </div>

        <div className="bb-splash-feature-strip" aria-label="Game features">
          <Feature icon={<WifiOff size={18} />} label="Offline play" />
          <Feature icon={<ShieldCheck size={18} />} label="Safe for kids" />
          <Feature icon={<WifiOff size={18} />} label="No internet needed" />
        </div>
      </div>
    </section>
  )
}

function IconButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="bb-splash-icon-button" aria-label={label} title={label}>
      {icon}
    </button>
  )
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span>
      {icon}
      {label}
    </span>
  )
}
