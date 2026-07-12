import { Canvas } from '@react-three/fiber'
import { Html, KeyboardControls, Sky } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { GameScene } from './GameScene'
import { HUD } from '../ui/HUD'
import { ChatPanel } from '../ui/ChatPanel'
import { TouchControls } from '../ui/TouchControls'
import { QuestPanel } from '../ui/QuestPanel'
import { ShopPanel } from '../ui/ShopPanel'
import { AvatarPanel } from '../ui/AvatarPanel'
import { SettingsPanel } from '../ui/SettingsPanel'
import { FriendshipPanel } from '../ui/FriendshipPanel'
import { LeaderboardPanel } from '../ui/LeaderboardPanel'
import { BadgesPanel } from '../ui/BadgesPanel'
import { BuildPanel } from '../ui/BuildPanel'
import { ServerPanel } from '../ui/ServerPanel'
import { EmotePanel } from '../ui/EmotePanel'
import { SaveManager } from '../save/SaveManager'
import { useGameStore } from '../state/gameStore'

const keyboardMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'interact', keys: ['KeyE'] },
  { name: 'menu', keys: ['Escape'] },
]

export function GameScreen() {
  const setScreen = useGameStore((state) => state.setScreen)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const openPanel = useGameStore((state) => state.openPanel)
  const settings = useGameStore((state) => state.settings)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPanel(openPanel ? undefined : 'settings')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openPanel, setOpenPanel])

  return (
    <KeyboardControls map={keyboardMap}>
      <section
        className="relative h-screen w-screen select-none overflow-hidden bg-sky-200"
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
      >
        <SaveManager />
        <Canvas
          shadows={settings.quality !== 'low'}
          camera={{ position: [0, 7, 12], fov: 48 }}
          className="absolute inset-0"
          data-testid="game-canvas"
        >
          <Suspense fallback={<CanvasLoading />}>
            <Sky sunPosition={[100, 25, 100]} />
            <ambientLight intensity={0.72} />
            <directionalLight position={[8, 14, 10]} intensity={1.4} castShadow />
            <Physics gravity={[0, -18, 0]}>
              <GameScene />
            </Physics>
          </Suspense>
        </Canvas>

        <button
          type="button"
          onClick={() => setScreen('menu')}
          className="game-menu-button absolute left-3 top-3 z-30 inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950/90 px-4 font-black text-white shadow-lg"
          title="Menu"
        >
          <ArrowLeft size={18} aria-hidden />
          <span className="game-menu-label">Menu</span>
        </button>

        <HUD />
        <ChatPanel />
        <TouchControls />
        {openPanel === 'quests' ? <QuestPanel /> : null}
        {openPanel === 'shop' ? <ShopPanel /> : null}
        {openPanel === 'avatar' ? <AvatarPanel /> : null}
        {openPanel === 'settings' ? <SettingsPanel /> : null}
        {openPanel === 'friends' ? <FriendshipPanel /> : null}
        {openPanel === 'leaderboard' ? <LeaderboardPanel /> : null}
        {openPanel === 'badges' ? <BadgesPanel /> : null}
        {openPanel === 'build' ? <BuildPanel /> : null}
        {openPanel === 'server' ? <ServerPanel /> : null}
        {openPanel === 'emotes' ? <EmotePanel /> : null}
      </section>
    </KeyboardControls>
  )
}

function CanvasLoading() {
  return (
    <Html center>
      <div className="rounded-2xl bg-slate-950/85 px-5 py-4 text-center font-black text-white shadow-2xl">
        <div className="text-lg">BlockBuddies</div>
        <div className="text-xs text-sky-200">Loading town...</div>
      </div>
    </Html>
  )
}
