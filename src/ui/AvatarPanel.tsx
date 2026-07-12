import { shopItems } from '../data/shopItems'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

const swatches = ['#facc15', '#93c5fd', '#86efac', '#f9a8d4', '#fdba74', '#c4b5fd']

export function AvatarPanel() {
  const avatar = useGameStore((state) => state.avatar)
  const update = useGameStore((state) => state.loadFromSave)
  const unlocked = useGameStore((state) => state.unlockedItems)
  const applyOwnedItem = useGameStore((state) => state.applyOwnedItem)

  return (
    <Panel title="Avatar">
      <div className="mb-4 flex items-center gap-4 rounded-lg bg-sky-100 p-3">
        <div className="grid h-24 w-20 place-items-center rounded-lg bg-white">
          <div className="relative h-20 w-12">
            <span className="absolute left-3 top-0 h-8 w-8 rounded" style={{ background: avatar.bodyColor }} />
            <span className="absolute left-1 top-8 h-9 w-10 rounded" style={{ background: avatar.shirtColor }} />
          </div>
        </div>
        <div className="text-sm font-bold text-slate-600">
          Body, shirt, hat, and trail choices save locally.
        </div>
      </div>
      <h3 className="mb-2 font-black">Body colour</h3>
      <div className="mb-4 flex flex-wrap gap-2">
        {swatches.map((color) => (
          <button key={color} type="button" className="h-10 w-10 rounded-lg border-4 border-white shadow" style={{ background: color }} onClick={() => update({ avatar: { ...avatar, bodyColor: color } })} title={color} />
        ))}
      </div>
      <h3 className="mb-2 font-black">Owned items</h3>
      <div className="space-y-2">
        {shopItems.filter((item) => unlocked.includes(item.id)).map((item) => (
          <button key={item.id} type="button" onClick={() => applyOwnedItem(item.id)} className="min-h-10 w-full rounded-lg bg-slate-100 px-3 text-left font-black">
            Equip {item.name}
          </button>
        ))}
        {unlocked.length === 0 ? <p className="text-sm font-bold text-slate-500">Buy items from the shop to equip them here.</p> : null}
      </div>
    </Panel>
  )
}
