import { useState } from 'react'
import { PlaceholderGameScreen } from './ui/PlaceholderGameScreen'
import { MainMenu } from './ui/MainMenu'

export type AppScreen = 'menu' | 'game'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('menu')

  return (
    <main className="min-h-screen bg-sky-100 text-slate-950">
      {screen === 'menu' ? (
        <MainMenu onPlay={() => setScreen('game')} />
      ) : (
        <PlaceholderGameScreen onExit={() => setScreen('menu')} />
      )}
    </main>
  )
}
