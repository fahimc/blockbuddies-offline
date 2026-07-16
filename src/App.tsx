import { GameScreen } from './game/GameScreen'
import { SaveManager } from './save/SaveManager'
import { MainMenu } from './ui/MainMenu'
import { AvatarPanel } from './ui/AvatarPanel'
import { NameSetupScreen } from './ui/NameSetupScreen'
import { GameAudio } from './ui/GameAudio'
import { useGameStore } from './state/gameStore'

export default function App() {
  const screen = useGameStore((state) => state.screen)
  const setScreen = useGameStore((state) => state.setScreen)
  const profileComplete = useGameStore((state) => state.profileComplete)
  const saveLoaded = useGameStore((state) => state.saveLoaded)

  return (
    <main className="min-h-screen bg-sky-100 text-slate-950">
      <SaveManager />
      <GameAudio />
      {screen === 'menu' ? (
        <MainMenu
          ready={saveLoaded}
          onStart={() => setScreen(profileComplete ? 'game' : 'setup-avatar')}
        />
      ) : null}
      {screen === 'setup-avatar' ? (
        <AvatarPanel
          onBack={() => setScreen('menu')}
          onComplete={() => setScreen('setup-name')}
        />
      ) : null}
      {screen === 'setup-name' ? (
        <NameSetupScreen
          onBack={() => setScreen('setup-avatar')}
          onStart={() => setScreen('game')}
        />
      ) : null}
      {screen === 'game' ? <GameScreen /> : null}
    </main>
  )
}
