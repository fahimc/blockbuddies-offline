import { clearGameSave } from '../save/storage'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

export function SettingsPanel() {
  const settings = useGameStore((state) => state.settings)
  const updateSettings = useGameStore((state) => state.updateSettings)
  const resetSave = useGameStore((state) => state.resetSave)

  return (
    <Panel title="Settings">
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-black">Graphics quality</span>
        <select
          value={settings.quality}
          onChange={(event) => updateSettings({ quality: event.target.value as typeof settings.quality })}
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-bold"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <Toggle label="Audio" checked={settings.audio} onChange={(audio) => updateSettings({ audio })} />
      <Toggle label="Music" checked={settings.music} onChange={(music) => updateSettings({ music })} />
      <Toggle label="Reduced motion" checked={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} />
      <button
        type="button"
        onClick={() => {
          resetSave()
          void clearGameSave()
        }}
        className="mt-4 min-h-11 rounded-lg bg-red-500 px-4 font-black text-white"
      >
        Reset Save
      </button>
    </Panel>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="mb-2 flex min-h-11 items-center justify-between rounded-lg bg-slate-100 px-3 font-black">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-6 w-6" />
    </label>
  )
}
