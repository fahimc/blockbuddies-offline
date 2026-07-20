import { create } from 'zustand'
import type { ShopItemId } from '../game/types'

export const lightSaberIds = [
  'weapon-light-saber-blue',
  'weapon-light-saber-purple',
  'weapon-light-saber-red',
] as const satisfies readonly ShopItemId[]

export type LightSaberId = (typeof lightSaberIds)[number]

export const lightSaberColors: Record<LightSaberId, string> = {
  'weapon-light-saber-blue': '#60a5fa',
  'weapon-light-saber-purple': '#c084fc',
  'weapon-light-saber-red': '#fb7185',
}

export function isLightSaberId(value: string): value is LightSaberId {
  return lightSaberIds.includes(value as LightSaberId)
}

type EquipmentState = {
  selectedSaber?: LightSaberId
  saberActive: boolean
  equipSaber: (id: LightSaberId) => void
  toggleSaber: () => void
  setSaberActive: (active: boolean) => void
  resetEquipment: () => void
}

export const useEquipmentStore = create<EquipmentState>((set) => ({
  selectedSaber: undefined,
  saberActive: false,
  equipSaber: (selectedSaber) => set({ selectedSaber }),
  toggleSaber: () => set((state) => ({ saberActive: !state.saberActive })),
  setSaberActive: (saberActive) => set({ saberActive }),
  resetEquipment: () => set({ selectedSaber: undefined, saberActive: false }),
}))
