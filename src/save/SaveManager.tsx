import { useEffect, useRef } from 'react'
import { loadGameSave, saveGame } from './storage'
import { makeSaveSnapshot, useGameStore } from '../state/gameStore'

export function SaveManager() {
  const state = useGameStore()
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const loadFromSave = useGameStore((store) => store.loadFromSave)
  const markSaveLoaded = useGameStore((store) => store.markSaveLoaded)
  const markSaving = useGameStore((store) => store.markSaving)
  const markSaved = useGameStore((store) => store.markSaved)

  useEffect(() => {
    void loadGameSave()
      .then((save) => {
        if (save) loadFromSave(save)
      })
      .catch(() => {
        // Storage can be unavailable in restricted browsers/tests; gameplay should still run.
      })
      .finally(markSaveLoaded)
  }, [loadFromSave, markSaveLoaded])

  useEffect(() => {
    if (!state.saveLoaded) return undefined
    const timeout = window.setTimeout(() => {
      markSaving()
      const snapshot = makeSaveSnapshot(useGameStore.getState())
      const queuedSave = saveQueue.current
        .catch(() => undefined)
        .then(() => saveGame(snapshot))
      const settledSave = queuedSave.catch(() => undefined)
      saveQueue.current = settledSave
      void settledSave.then(() => {
        if (saveQueue.current === settledSave) markSaved()
      })
    }, 700)
    return () => window.clearTimeout(timeout)
  }, [
    state.saveLoaded,
    state.profileComplete,
    state.playerName,
    state.coins,
    state.avatar,
    state.savedAvatars,
    state.savedFriends,
    state.unlockedItems,
    state.earnedBadges,
    state.placedBlocks,
    state.questProgress,
    state.botMemory,
    state.messageThreads,
    state.settings,
    state.obby.bestTime,
    state.miniGame.records,
    markSaving,
    markSaved,
  ])

  return null
}
