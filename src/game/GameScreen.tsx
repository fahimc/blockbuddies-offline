import { Canvas } from '@react-three/fiber'
import { Html, KeyboardControls, Sky } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, useEffect, useRef } from 'react'
import { GameScene } from './GameScene'
import { HUD } from '../ui/HUD'
import { GameMenu } from '../ui/GameMenu'
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
import { BuildHudPalette } from '../ui/BuildHudPalette'
import { ServerPanel } from '../ui/ServerPanel'
import { EmotePanel } from '../ui/EmotePanel'
import { MiniGamesPanel } from '../ui/MiniGamesPanel'
import { MiniGameAnnouncement } from '../ui/MiniGameAnnouncement'
import { MiniMap } from '../ui/MiniMap'
import { MapPanel } from '../ui/MapPanel'
import { TutorialPanel } from '../ui/TutorialPanel'
import { KartPanel } from '../ui/KartPanel'
import { RoomCameraZoom } from '../ui/RoomCameraZoom'
import { WelcomeOverlay } from '../ui/WelcomeOverlay'
import { useGameStore } from '../state/gameStore'
import { useLocalPartyStore } from '../state/localPartyStore'

const keyboardMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
  { name: 'interact', keys: ['KeyE'] },
  { name: 'menu', keys: ['Escape'] },
]

export function GameScreen() {
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const openPanel = useGameStore((state) => state.openPanel)
  const settings = useGameStore((state) => state.settings)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape')
        setOpenPanel(openPanel ? undefined : 'settings')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openPanel, setOpenPanel])

  return (
    <KeyboardControls map={keyboardMap}>
      <section
        className={`relative h-screen w-screen select-none overflow-hidden ${settings.nightMode ? 'bg-slate-950' : 'bg-sky-200'}`}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
      >
        <Canvas
          shadows={settings.quality !== 'low'}
          camera={{ position: [0, 7, 12], fov: 48 }}
          className="absolute inset-0 cursor-grab"
          data-testid="game-canvas"
        >
          <Suspense fallback={<CanvasLoading />}>
            <color
              attach="background"
              args={[settings.nightMode ? '#101827' : '#bae6fd']}
            />
            {settings.nightMode ? null : <Sky sunPosition={[100, 25, 100]} />}
            <ambientLight intensity={settings.nightMode ? 0.42 : 0.72} />
            <directionalLight
              position={[8, 14, 10]}
              intensity={settings.nightMode ? 0.68 : 1.4}
              castShadow
            />
            {settings.nightMode ? (
              <pointLight
                position={[0, 7, -8]}
                intensity={1.25}
                color="#93c5fd"
              />
            ) : null}
            <Physics gravity={[0, -18, 0]}>
              <GameScene />
            </Physics>
          </Suspense>
        </Canvas>

        <GameMenu />
        <HUD />
        <BuildHudPalette />
        <MiniGameAnnouncement />
        <MiniMap />
        <ChatPanel />
        <TouchControls />
        <RoomCameraZoom />
        <WelcomeOverlay />
        <LocalPartyRuntimeBridge />
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
        {openPanel === 'minigames' ? <MiniGamesPanel /> : null}
        {openPanel === 'karts' ? <KartPanel /> : null}
        {openPanel === 'map' ? <MapPanel /> : null}
        {openPanel === 'tutorial' ? <TutorialPanel /> : null}
      </section>
    </KeyboardControls>
  )
}

function LocalPartyRuntimeBridge() {
  const processedMessageIds = useRef(new Set<string>())
  const incomingMessages = useLocalPartyStore(
    (state) => state.incomingDirectMessages,
  )
  const remotePlayers = useLocalPartyStore((state) => state.remotePlayers)
  const receiveLocalPartyMessage = useGameStore(
    (state) => state.receiveLocalPartyMessage,
  )
  const mergeSharedBuildBlocks = useGameStore(
    (state) => state.mergeSharedBuildBlocks,
  )

  useEffect(() => {
    incomingMessages.forEach((message) => {
      if (processedMessageIds.current.has(message.id)) return
      processedMessageIds.current.add(message.id)
      receiveLocalPartyMessage(message)
    })
  }, [incomingMessages, receiveLocalPartyMessage])

  useEffect(() => {
    const blocks = Object.values(remotePlayers).flatMap(
      (player) => player.placedBlocks ?? [],
    )
    if (blocks.length > 0) mergeSharedBuildBlocks(blocks)
  }, [mergeSharedBuildBlocks, remotePlayers])

  return null
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
