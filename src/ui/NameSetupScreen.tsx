import { ArrowLeft, ChevronRight, CircleDollarSign, Sparkles } from 'lucide-react'
import type { CSSProperties, FormEvent } from 'react'
import { useState } from 'react'
import { useGameStore } from '../state/gameStore'

type NameSetupScreenProps = {
  onBack: () => void
  onStart: () => void
}

export function NameSetupScreen({ onBack, onStart }: NameSetupScreenProps) {
  const avatar = useGameStore((state) => state.avatar)
  const coins = useGameStore((state) => state.coins)
  const playerName = useGameStore((state) => state.playerName)
  const setPlayerName = useGameStore((state) => state.setPlayerName)
  const [draftName, setDraftName] = useState(playerName)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setPlayerName(draftName)
    onStart()
  }

  return (
    <section className="bb-name-setup absolute inset-0 z-50 overflow-hidden text-white">
      <div className="bb-customizer-bg" aria-hidden>
        <div className="bb-town-skyline" />
      </div>
      <header className="bb-customizer-topbar">
        <button type="button" className="bb-customizer-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={30} aria-hidden />
        </button>
        <h2>Name Your Buddy</h2>
        <div className="bb-customizer-wallet">
          <span className="bb-coin-pill">
            <CircleDollarSign size={19} aria-hidden />
            {coins.toLocaleString()}
          </span>
          <span className="bb-level-badge">Lv. 4</span>
        </div>
      </header>

      <form className="bb-name-card" onSubmit={submit}>
        <div className="bb-name-avatar-card" aria-hidden>
          <span
            className={`bb-mini-avatar pose-wave hair-${avatar.hairStyle ?? 'spiky'} face-${avatar.face ?? 'smile'}`}
            style={
              {
                '--skin': avatar.bodyColor,
                '--shirt': avatar.shirtColor,
                '--hair': avatar.hairColor ?? '#5a2f16',
                '--pants': avatar.pantsColor ?? '#111827',
                '--accent': avatar.accentColor ?? '#0b74ff',
                '--eyes': avatar.eyeColor ?? '#111827',
              } as CSSProperties
            }
          >
            <span className="hair" />
            <span className="head">
              <span className="eye left" />
              <span className="eye right" />
              <span className="mouth" />
            </span>
            <span className="body" />
            <span className="arm left" />
            <span className="arm right" />
            <span className="leg left" />
            <span className="leg right" />
            {avatar.hat !== 'none' ? <span className="hat" /> : null}
            {avatar.accessory && avatar.accessory !== 'none' ? <span className="glasses" /> : null}
          </span>
        </div>

        <label className="bb-name-field">
          <span>Character Name</span>
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            maxLength={18}
            autoComplete="off"
            autoFocus
            aria-label="Character name"
            placeholder="BlockBuddy"
          />
        </label>

        <p className="bb-name-helper">
          This name appears above your character and in local-only chat.
        </p>

        <button type="submit" className="bb-name-start">
          <Sparkles size={30} aria-hidden />
          Start Game
          <ChevronRight size={38} aria-hidden />
        </button>
      </form>
    </section>
  )
}
