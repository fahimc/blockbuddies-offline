import { Play, ShieldCheck, WifiOff } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import splashPortrait from '../assets/splash/blockbuddies-splash-portrait.png'
import { BrandLogo } from './BrandLogo'

type MainMenuProps = {
  onStart: () => void
}

export function MainMenu({ onStart }: MainMenuProps) {
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
        <button type="button" onClick={onStart} aria-label="Start" className="bb-splash-play">
          <Play aria-hidden size={34} fill="currentColor" />
          START
        </button>

        <div className="bb-splash-feature-strip" aria-label="Game features">
          <Feature icon={<WifiOff size={18} />} label="Offline play" />
          <Feature icon={<ShieldCheck size={18} />} label="Safe for kids" />
          <Feature icon={<WifiOff size={18} />} label="No internet needed" />
        </div>
      </div>
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
