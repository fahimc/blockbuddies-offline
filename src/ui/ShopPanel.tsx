import { Coins } from 'lucide-react'
import { shopItems } from '../data/shopItems'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

export function ShopPanel() {
  const coins = useGameStore((state) => state.coins)
  const unlocked = useGameStore((state) => state.unlockedItems)
  const buyItem = useGameStore((state) => state.buyItem)

  return (
    <Panel title="Coin Shop">
      <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-amber-300 px-3 py-2 font-black">
        <Coins size={18} /> {coins}
      </div>
      <div className="grid gap-3">
        {shopItems.map((item) => (
          <article key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-lg border-2 border-white shadow" style={{ background: item.color ?? '#fde047' }} />
              <div>
                <h3 className="font-black">{item.name}</h3>
                <p className="text-sm font-bold text-slate-500">{item.category}</p>
              </div>
            </div>
            <button
              type="button"
              disabled={unlocked.includes(item.id) || coins < item.cost}
              onClick={() => buyItem(item.id)}
              className="min-h-10 rounded-lg bg-sky-500 px-3 text-sm font-black text-white disabled:bg-slate-300"
            >
              {unlocked.includes(item.id) ? 'Owned' : item.cost}
            </button>
          </article>
        ))}
      </div>
    </Panel>
  )
}
