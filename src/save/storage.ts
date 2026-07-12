import localforage from 'localforage'
import type { GameSave } from '../state/gameStore'

const saveKey = 'blockbuddies-offline-save-v1'

localforage.config({
  name: 'BlockBuddies Offline',
  storeName: 'game_saves',
  description: 'Offline save data for BlockBuddies Offline',
})

export async function loadGameSave(): Promise<Partial<GameSave> | undefined> {
  return (await localforage.getItem<GameSave>(saveKey)) ?? undefined
}

export async function saveGame(snapshot: GameSave): Promise<void> {
  await localforage.setItem(saveKey, snapshot)
}

export async function clearGameSave(): Promise<void> {
  await localforage.removeItem(saveKey)
}
