import localforage from 'localforage'
import type { GameSave } from '../state/gameStore'

const saveKey = 'blockbuddies-offline-save-v1'
const backupSaveKey = 'blockbuddies-offline-save-v1-backup'

localforage.config({
  name: 'BlockBuddies',
  storeName: 'game_saves',
  description: 'Offline save data for BlockBuddies',
})

export async function loadGameSave(): Promise<Partial<GameSave> | undefined> {
  const primary = await localforage.getItem<GameSave>(saveKey)
  if (primary && typeof primary === 'object') return primary
  return (await localforage.getItem<GameSave>(backupSaveKey)) ?? undefined
}

export async function saveGame(snapshot: GameSave): Promise<void> {
  const current = await localforage.getItem<GameSave>(saveKey)
  if (current && typeof current === 'object') {
    await localforage.setItem(backupSaveKey, current)
  }
  await localforage.setItem(saveKey, snapshot)
}

export async function clearGameSave(): Promise<void> {
  await Promise.all([
    localforage.removeItem(saveKey),
    localforage.removeItem(backupSaveKey),
  ])
}
