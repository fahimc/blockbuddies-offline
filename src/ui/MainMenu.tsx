import { Play, ShieldCheck, WifiOff } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import splashPortrait from '../assets/splash/blockbuddies-splash-portrait.png'
import { BrandLogo } from './BrandLogo'

type MainMenuProps = {
  onStart: () => void
  ready?: boolean
}

export function MainMenu({ onStart, ready = true }: MainMenuProps) {
  return (
    <section
      className="bb-splash bb-splash-poster"
      style={
        { '--splash-image': `url(${splashPortrait})` } as CSSProperties &
          Record<'--splash-image', string>
      }
    >
      <div className="bb-splash-art" aria-hidden />
      <div className="bb-splash-vignette" aria-hidden />
      <h1 className="sr-only">BlockBuddies</h1>

      <div className="bb-splash-start-card">
        <header className="bb-splash-brand" aria-label="BlockBuddies">
          <BrandLogo compact />
        </header>
        <button
          type="button"
          onClick={onStart}
          aria-label="Start"
          className="bb-splash-play"
          disabled={!ready}
        >
          <Play aria-hidden size={34} fill="currentColor" />
          {ready ? 'START' : 'LOADING'}
        </button>

        <div className="bb-splash-feature-strip" aria-label="Game features">
          <Feature icon={<WifiOff size={18} />} label="Offline play" />
          <Feature icon={<ShieldCheck size={18} />} label="Safe for kids" />
        </div>
      </div>

      <div className="bb-splash-main-copy">
        <p>
          Your world.
          <br />
          <span>Your buddies.</span>
          <br />
          Your adventure.
        </p>
      </div>

      <footer className="bb-splash-studio">Remetheia Games</footer>
    </section>
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
