import { Power, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { useGameStore } from '../state/gameStore'
import {
  lightSaberColors,
  lightSaberIds,
  useEquipmentStore,
  type LightSaberId,
} from '../state/equipmentStore'

const saberNames: Record<LightSaberId, string> = {
  'weapon-light-saber-blue': 'Blue',
  'weapon-light-saber-purple': 'Purple',
  'weapon-light-saber-red': 'Red',
}

export function EquipmentHud() {
  const unlockedItems = useGameStore((state) => state.unlockedItems)
  const selectedSaber = useEquipmentStore((state) => state.selectedSaber)
  const saberActive = useEquipmentStore((state) => state.saberActive)
  const equipSaber = useEquipmentStore((state) => state.equipSaber)
  const toggleSaber = useEquipmentStore((state) => state.toggleSaber)
  const setSaberActive = useEquipmentStore((state) => state.setSaberActive)

  const ownedSabers = lightSaberIds.filter((id) => unlockedItems.includes(id))
  const effectiveSaber =
    selectedSaber && ownedSabers.includes(selectedSaber)
      ? selectedSaber
      : ownedSabers[0]

  useEffect(() => {
    if (!effectiveSaber) {
      if (saberActive) setSaberActive(false)
      return
    }
    if (selectedSaber !== effectiveSaber) equipSaber(effectiveSaber)
  }, [
    effectiveSaber,
    equipSaber,
    saberActive,
    selectedSaber,
    setSaberActive,
  ])

  if (!effectiveSaber) return null

  return (
    <aside
      className="pointer-events-auto absolute bottom-5 right-5 z-30 w-56 rounded-2xl border-2 border-white/70 bg-slate-950/88 p-3 text-white shadow-2xl backdrop-blur max-md:bottom-28 max-md:right-3 max-md:w-48"
      data-testid="light-saber-hud"
      aria-label="Light saber controls"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-violet-200">
          <Sparkles size={15} aria-hidden /> Light Saber
        </span>
        <span className="text-[10px] font-bold uppercase text-slate-400">
          {saberActive ? 'On' : 'Off'}
        </span>
      </div>

      <div className="mb-2 flex gap-1.5" aria-label="Select light saber colour">
        {ownedSabers.map((id) => {
          const selected = id === effectiveSaber
          return (
            <button
              key={id}
              type="button"
              className={`flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border px-2 text-[11px] font-black transition ${
                selected
                  ? 'border-white bg-white/20'
                  : 'border-white/15 bg-white/5 hover:bg-white/10'
              }`}
              aria-pressed={selected}
              onClick={() => equipSaber(id)}
            >
              <span
                className="h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]"
                style={{ backgroundColor: lightSaberColors[id], color: lightSaberColors[id] }}
                aria-hidden
              />
              {saberNames[id]}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-black shadow-lg transition active:scale-95 ${
          saberActive
            ? 'bg-rose-500 text-white hover:bg-rose-400'
            : 'bg-gradient-to-b from-violet-300 to-fuchsia-500 text-slate-950 hover:brightness-110'
        }`}
        aria-pressed={saberActive}
        onClick={toggleSaber}
      >
        <Power size={18} aria-hidden />
        {saberActive ? 'Turn off' : 'Turn on'}
      </button>
    </aside>
  )
}
