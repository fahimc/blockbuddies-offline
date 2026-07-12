import { useEffect } from 'react'
import { loadGameSave, saveGame } from './storage'
import { makeSaveSnapshot, useGameStore } from '../state/gameStore'

export function SaveManager() {
  const state = useGameStore()
  const loadFromSave = useGameStore((store) => store.loadFromSave)
  const markSaving = useGameStore((store) => store.markSaving)
  const markSaved = useGameStore((store) => store.markSaved)

  useEffect(() => {
    void loadGameSave().then((save) => {
      if (save) loadFromSave(save)
    })
  }, [loadFromSave])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      markSaving()
      void saveGame(makeSaveSnapshot(useGameStore.getState())).then(markSaved)
    }, 700)
    return () => window.clearTimeout(timeout)
  }, [
    state.coins,
    state.avatar,
    state.unlockedItems,
    state.questProgress,
    state.botMemory,
    state.settings,
    state.obby.bestTime,
    markSaving,
    markSaved,
  ])

  return null
}
