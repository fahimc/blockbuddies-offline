import { GameScreen } from './game/GameScreen'
import { MainMenu } from './ui/MainMenu'
import { useGameStore } from './state/gameStore'

export default function App() {
  const screen = useGameStore((state) => state.screen)
  const setScreen = useGameStore((state) => state.setScreen)

  return (
    <main className="min-h-screen bg-sky-100 text-slate-950">
      {screen === 'menu' ? (
        <MainMenu onPlay={() => setScreen('game')} />
      ) : (
        <GameScreen />
      )}
    </main>
  )
}
