import { Gamepad2, Monitor, Music, RotateCcw, Shield } from 'lucide-react'
import type { ReactNode } from 'react'
import { clearGameSave } from '../save/storage'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

export function SettingsPanel() {
  const settings = useGameStore((state) => state.settings)
  const updateSettings = useGameStore((state) => state.updateSettings)
  const resetSave = useGameStore((state) => state.resetSave)

  return (
    <Panel title="Settings">
      <div className="grid gap-4 sm:grid-cols-[6.5rem_1fr]">
        <nav className="hidden flex-col gap-2 sm:flex">
          <SettingsTab icon={<Gamepad2 size={16} />} label="Game" active />
          <SettingsTab icon={<Monitor size={16} />} label="Graphics" />
          <SettingsTab icon={<Music size={16} />} label="Audio" />
          <SettingsTab icon={<Shield size={16} />} label="Safety" />
        </nav>
        <div className="space-y-3">
          <label className="bb-setting-row">
            <span>Graphics Quality</span>
            <select
              value={settings.quality}
              onChange={(event) => updateSettings({ quality: event.target.value as typeof settings.quality })}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 font-black"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <Toggle label="Sound Effects" checked={settings.audio} onChange={(audio) => updateSettings({ audio })} />
          <Toggle label="Music Volume" checked={settings.music} onChange={(music) => updateSettings({ music })} />
          <Toggle label="Reduced Motion" checked={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} />
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
            Offline Mode ON - you are playing offline. No internet required.
          </div>
          <button
            type="button"
            onClick={() => {
              resetSave()
              void clearGameSave()
            }}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-red-400 to-red-600 px-4 font-black text-white shadow"
          >
            <RotateCcw size={18} aria-hidden />
            Reset Save Data
          </button>
        </div>
      </div>
    </Panel>
  )
}

function SettingsTab({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <span className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-black ${active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
      {icon}
      {label}
    </span>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="bb-setting-row">
      <span>{label}</span>
      <span className={`bb-toggle ${checked ? 'on' : ''}`}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span />
      </span>
    </label>
  )
}
