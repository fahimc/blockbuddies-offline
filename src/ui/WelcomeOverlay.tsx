import { Gamepad2, Hand, Server, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useGameStore } from '../state/gameStore'

const welcomeKey = 'blockbuddies-welcome-seen-session'

export function WelcomeOverlay() {
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const openPanel = useGameStore((state) => state.openPanel)
  const [open, setOpen] = useState(() => sessionStorage.getItem(welcomeKey) !== 'yes')

  useEffect(() => {
    if (!open) sessionStorage.setItem(welcomeKey, 'yes')
  }, [open])

  useEffect(() => {
    if (openPanel) setOpen(false)
  }, [openPanel])

  if (!open) return null

  return (
    <aside className="bb-welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <section className="bb-welcome-card">
        <button type="button" className="bb-welcome-close" onClick={() => setOpen(false)} aria-label="Close welcome">
          <X size={21} aria-hidden />
        </button>
        <h2 id="welcome-title">Welcome to BlockBuddies</h2>
        <p>Explore the town, meet buddies, complete quests, build, and join a local party with friends nearby.</p>
        <div className="bb-welcome-grid">
          <span>
            <Gamepad2 size={22} aria-hidden />
            Move with the joystick or WASD. Drag the screen to look around.
          </span>
          <span>
            <Hand size={22} aria-hidden />
            Tap action icons near beds, chairs, cars, buddies, and mini games.
          </span>
          <span>
            <Server size={22} aria-hidden />
            Use Local Party in the menu to host or join friends on the same network.
          </span>
        </div>
        <div className="bb-welcome-actions">
          <button type="button" onClick={() => setOpen(false)}>
            Start Playing
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setOpenPanel('tutorial')
            }}
          >
            Open Tutorial
          </button>
        </div>
      </section>
    </aside>
  )
}
