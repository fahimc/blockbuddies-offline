import { Sword } from 'lucide-react'
import { useEffect } from 'react'
import { lightSaberPreviewFromSearch } from '../game/lightSaber'
import { useGameStore } from '../state/gameStore'
import {
  lightSaberColors,
  lightSaberIds,
  useEquipmentStore,
} from '../state/equipmentStore'

export function EquipmentHud() {
  const unlockedItems = useGameStore((state) => state.unlockedItems)
  const selectedSaber = useEquipmentStore((state) => state.selectedSaber)
  const saberActive = useEquipmentStore((state) => state.saberActive)
  const equipSaber = useEquipmentStore((state) => state.equipSaber)
  const toggleSaber = useEquipmentStore((state) => state.toggleSaber)
  const setSaberActive = useEquipmentStore((state) => state.setSaberActive)
  const previewSaber = import.meta.env.DEV
    ? lightSaberPreviewFromSearch(window.location.search)
    : undefined

  const ownedSabers = lightSaberIds.filter((id) => unlockedItems.includes(id))
  const effectiveSaber =
    previewSaber ?? (selectedSaber && ownedSabers.includes(selectedSaber)
      ? selectedSaber
      : ownedSabers[0])

  useEffect(() => {
    if (previewSaber) return
    if (!effectiveSaber) {
      if (saberActive) setSaberActive(false)
      return
    }
    if (selectedSaber !== effectiveSaber) equipSaber(effectiveSaber)
  }, [
    effectiveSaber,
    equipSaber,
    previewSaber,
    saberActive,
    selectedSaber,
    setSaberActive,
  ])

  if (!effectiveSaber) return null

  return (
    <button
      type="button"
      className={`mobile-saber-button ${saberActive ? 'active' : ''}`}
      data-testid="light-saber-hud"
      aria-label={saberActive ? 'Turn off light saber' : 'Turn on light saber'}
      aria-pressed={saberActive}
      title={saberActive ? 'Turn off light saber' : 'Turn on light saber'}
      onClick={toggleSaber}
      style={{ color: lightSaberColors[effectiveSaber] }}
    >
      <Sword size={23} aria-hidden />
    </button>
  )
}
