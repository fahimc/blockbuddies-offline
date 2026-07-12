import { Check, Coins, Sparkles } from 'lucide-react'
import { shopItems } from '../data/shopItems'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

const previewColors = ['#60a5fa', '#e879f9', '#facc15', '#34d399']

export function ShopPanel() {
  const coins = useGameStore((state) => state.coins)
  const unlocked = useGameStore((state) => state.unlockedItems)
  const buyItem = useGameStore((state) => state.buyItem)

  return (
    <Panel title="Shop">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-2 font-black shadow">
          <Coins size={18} /> {coins}
        </div>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-sky-500 font-black text-white">+</button>
      </div>
      <div className="bb-tabs mb-3 grid grid-cols-4 gap-1 rounded-xl bg-sky-950/10 p-1">
        <span className="bb-tab-active">Featured</span>
        <span>Hats</span>
        <span>Shirts</span>
        <span>Trails</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {shopItems.map((item, index) => {
          const owned = unlocked.includes(item.id)
          return (
            <article key={item.id} className="bb-shop-card">
              <div
                className="bb-shop-preview"
                style={{ background: item.color ?? previewColors[index % previewColors.length] }}
              >
                {owned ? (
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white">
                    <Check size={15} aria-hidden />
                  </span>
                ) : null}
                <Sparkles size={34} aria-hidden />
              </div>
              <h3 className="mt-2 truncate text-sm font-black text-slate-950">{item.name}</h3>
              <p className="text-xs font-bold uppercase text-slate-500">{item.category}</p>
              <button
                type="button"
                disabled={owned || coins < item.cost}
                onClick={() => buyItem(item.id)}
                className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-amber-300 to-orange-400 px-2 text-sm font-black text-slate-950 shadow disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500"
              >
                {owned ? (
                  'Owned'
                ) : (
                  <>
                    <Coins size={14} aria-hidden /> {item.cost}
                  </>
                )}
              </button>
            </article>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs font-black text-slate-500">New items in 03h 27m</p>
    </Panel>
  )
}
