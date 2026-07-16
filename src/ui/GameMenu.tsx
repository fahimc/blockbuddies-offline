import {
  ArrowLeft,
  Blocks,
  Gamepad2,
  HeartHandshake,
  ListChecks,
  Map,
  Medal,
  Menu,
  MessageCircle,
  Palette,
  RotateCcw,
  Server,
  Settings,
  ShoppingBag,
  Smile,
  Trophy,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useGameStore, type GamePanel } from '../state/gameStore'

const menuItems: {
  panel: GamePanel
  label: string
  icon: ReactNode
}[] = [
  { panel: 'map', label: 'Town Map', icon: <Map size={21} aria-hidden /> },
  { panel: 'messages', label: 'Messages', icon: <MessageCircle size={21} aria-hidden /> },
  { panel: 'avatar', label: 'Customise Character', icon: <Palette size={21} aria-hidden /> },
  { panel: 'quests', label: 'Quests', icon: <ListChecks size={21} aria-hidden /> },
  { panel: 'minigames', label: 'Mini Games', icon: <Gamepad2 size={21} aria-hidden /> },
  { panel: 'build', label: 'Build Mode', icon: <Blocks size={21} aria-hidden /> },
  { panel: 'shop', label: 'Shop', icon: <ShoppingBag size={21} aria-hidden /> },
  { panel: 'friends', label: 'Buddies', icon: <HeartHandshake size={21} aria-hidden /> },
  { panel: 'server', label: 'Local Party', icon: <Server size={21} aria-hidden /> },
  { panel: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={21} aria-hidden /> },
  { panel: 'badges', label: 'Badges', icon: <Medal size={21} aria-hidden /> },
  { panel: 'emotes', label: 'Emotes', icon: <Smile size={21} aria-hidden /> },
  { panel: 'settings', label: 'Settings', icon: <Settings size={21} aria-hidden /> },
]

export function GameMenu() {
  const [open, setOpen] = useState(false)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const setScreen = useGameStore((state) => state.setScreen)
  const openPanel = useGameStore((state) => state.openPanel)
  const resetToSquare = useGameStore((state) => state.resetToSquare)

  const openMenuPanel = (panel: GamePanel) => {
    setOpen(false)
    setOpenPanel(panel)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="game-hamburger-button absolute left-3 top-3 z-40"
        title="Menu"
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? <X size={22} aria-hidden /> : <Menu size={24} aria-hidden />}
      </button>

      {open ? (
        <aside className="bb-game-menu-drawer absolute left-3 top-[3.75rem] z-40">
          <header>
            <strong>Menu</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={18} aria-hidden />
            </button>
          </header>
          <nav aria-label="Game menu">
            {menuItems.map((item) => (
              <button
                key={item.panel}
                type="button"
                onClick={() => openMenuPanel(item.panel)}
                className={openPanel === item.panel ? 'active' : ''}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="bb-game-menu-main"
            onClick={() => {
              setOpen(false)
              resetToSquare()
            }}
          >
            <RotateCcw size={21} aria-hidden />
            Reset to Square
          </button>
          <button
            type="button"
            className="bb-game-menu-main"
            onClick={() => {
              setOpen(false)
              setOpenPanel(undefined)
              setScreen('menu')
            }}
          >
            <ArrowLeft size={21} aria-hidden />
            Main Menu
          </button>
        </aside>
      ) : null}
    </>
  )
}
