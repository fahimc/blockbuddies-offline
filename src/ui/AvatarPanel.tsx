import { Check, Laugh, Shirt, Sparkles, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { shopItems } from '../data/shopItems'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

const swatches = ['#9a5b43', '#facc15', '#f9a8d4', '#5eead4', '#60a5fa', '#a78bfa', '#111827', '#ffffff']

export function AvatarPanel() {
  const avatar = useGameStore((state) => state.avatar)
  const update = useGameStore((state) => state.loadFromSave)
  const unlocked = useGameStore((state) => state.unlockedItems)
  const applyOwnedItem = useGameStore((state) => state.applyOwnedItem)

  return (
    <Panel title="Avatar">
      <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
        <nav className="hidden flex-col gap-2 sm:flex">
          <AvatarTab icon={<UserRound size={17} />} label="Skin" active />
          <AvatarTab icon={<Shirt size={17} />} label="Shirts" />
          <AvatarTab icon={<Sparkles size={17} />} label="Hats" />
          <AvatarTab icon={<Laugh size={17} />} label="Emotes" />
        </nav>
        <div>
          <div className="mb-3 grid gap-3 rounded-2xl bg-gradient-to-b from-sky-100 to-blue-100 p-3 sm:grid-cols-[8rem_1fr]">
            <div className="bb-avatar-preview">
              <span className="bb-avatar-head" style={{ background: avatar.bodyColor }} />
              <span className="bb-avatar-shirt" style={{ background: avatar.shirtColor }} />
              <span className="bb-avatar-leg left" />
              <span className="bb-avatar-leg right" />
            </div>
            <div>
              <h3 className="mb-2 font-black text-slate-950">Body colour</h3>
              <div className="flex flex-wrap gap-2">
                {swatches.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-9 w-9 rounded-lg border-4 shadow ${avatar.bodyColor === color ? 'border-slate-950' : 'border-white'}`}
                    style={{ background: color }}
                    onClick={() => update({ avatar: { ...avatar, bodyColor: color } })}
                    title={color}
                  />
                ))}
              </div>
              <h3 className="mb-2 mt-3 font-black text-slate-950">Shirt colour</h3>
              <div className="flex flex-wrap gap-2">
                {swatches.map((color) => (
                  <button
                    key={`shirt-${color}`}
                    type="button"
                    className={`h-9 w-9 rounded-lg border-4 shadow ${avatar.shirtColor === color ? 'border-slate-950' : 'border-white'}`}
                    style={{ background: color }}
                    onClick={() => update({ avatar: { ...avatar, shirtColor: color } })}
                    title={`shirt ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <h3 className="mb-2 font-black text-slate-950">Owned items</h3>
          <div className="grid grid-cols-2 gap-2">
            {shopItems
              .filter((item) => unlocked.includes(item.id))
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyOwnedItem(item.id)}
                  className="bb-inventory-tile"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-100 text-sky-700">
                    <Check size={20} aria-hidden />
                  </span>
                  <span className="truncate text-xs font-black">{item.name}</span>
                </button>
              ))}
            {unlocked.length === 0 ? (
              <p className="col-span-2 rounded-xl bg-slate-100 px-3 py-4 text-center text-sm font-bold text-slate-500">
                Buy items from the shop to equip them here.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Panel>
  )
}

function AvatarTab({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <span className={`grid min-h-12 place-items-center rounded-xl text-[10px] font-black ${active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
      {icon}
      {label}
    </span>
  )
}
