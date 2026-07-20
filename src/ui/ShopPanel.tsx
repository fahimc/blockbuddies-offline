import { Check, Coins, Power, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { shopItems } from '../data/shopItems'
import type { ShopItem } from '../game/types'
import {
  isLightSaberId,
  lightSaberColors,
  useEquipmentStore,
} from '../state/equipmentStore'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

const previewColors = ['#60a5fa', '#e879f9', '#facc15', '#34d399']
type ShopTab = 'all' | 'weapon' | 'pet' | 'outfit' | 'style'

const tabs: { id: ShopTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'weapon', label: 'Sabers' },
  { id: 'pet', label: 'Pets' },
  { id: 'outfit', label: 'Outfits' },
  { id: 'style', label: 'Style' },
]

export function ShopPanel() {
  const coins = useGameStore((state) => state.coins)
  const unlocked = useGameStore((state) => state.unlockedItems)
  const buyItem = useGameStore((state) => state.buyItem)
  const applyOwnedItem = useGameStore((state) => state.applyOwnedItem)
  const selectedSaber = useEquipmentStore((state) => state.selectedSaber)
  const saberActive = useEquipmentStore((state) => state.saberActive)
  const equipSaber = useEquipmentStore((state) => state.equipSaber)
  const setSaberActive = useEquipmentStore((state) => state.setSaberActive)
  const [tab, setTab] = useState<ShopTab>('all')

  const visibleItems = shopItems.filter((item) => {
    if (tab === 'all') return true
    if (tab === 'style') {
      return !['weapon', 'pet', 'outfit'].includes(item.category)
    }
    return item.category === tab
  })

  const activateItem = (item: ShopItem) => {
    if (isLightSaberId(item.id)) {
      equipSaber(item.id)
      setSaberActive(true)
      return
    }
    applyOwnedItem(item.id)
  }

  const purchase = (item: ShopItem) => {
    buyItem(item.id)
    if (isLightSaberId(item.id)) {
      equipSaber(item.id)
      setSaberActive(true)
    }
  }

  return (
    <Panel title="Shop">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-2 font-black shadow">
          <Coins size={18} /> {coins}
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-black uppercase text-violet-800">
          New gear
        </span>
      </div>

      <div className="bb-tabs mb-3 flex gap-1 overflow-x-auto rounded-xl bg-sky-950/10 p-1">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`min-h-8 shrink-0 rounded-lg px-3 text-xs font-black ${
              tab === entry.id
                ? 'bg-white text-slate-950 shadow'
                : 'text-slate-600 hover:bg-white/60'
            }`}
            aria-pressed={tab === entry.id}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {visibleItems.map((item, index) => {
          const owned = unlocked.includes(item.id)
          const selected = isLightSaberId(item.id) && selectedSaber === item.id
          const actionLabel = selected
            ? saberActive
              ? 'On'
              : 'Turn on'
            : item.category === 'weapon'
              ? 'Equip'
              : 'Use'

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
                <ShopPreviewArt item={item} />
              </div>
              <h3 className="mt-2 text-sm font-black leading-tight text-slate-950">
                {item.name}
              </h3>
              <p className="text-xs font-bold uppercase text-slate-500">
                {item.category}
              </p>
              {owned ? (
                <button
                  type="button"
                  onClick={() => activateItem(item)}
                  className={`mt-2 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-lg px-2 text-sm font-black shadow ${
                    selected && saberActive
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-950 text-white hover:bg-slate-800'
                  }`}
                >
                  {item.category === 'weapon' ? <Power size={14} aria-hidden /> : null}
                  {actionLabel}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={coins < item.cost}
                  onClick={() => purchase(item)}
                  className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-amber-300 to-orange-400 px-2 text-sm font-black text-slate-950 shadow disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500"
                >
                  <Coins size={14} aria-hidden /> {item.cost}
                </button>
              )}
            </article>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs font-black text-slate-500">
        Bought gear is saved with your local game.
      </p>
    </Panel>
  )
}

function ShopPreviewArt({ item }: { item: ShopItem }) {
  if (isLightSaberId(item.id)) {
    const color = lightSaberColors[item.id]
    return (
      <span className="relative block h-20 w-12 rotate-[28deg]" aria-hidden>
        <span
          className="absolute left-1/2 top-0 h-14 w-3 -translate-x-1/2 rounded-full opacity-50 blur-[2px]"
          style={{ backgroundColor: color }}
        />
        <span
          className="absolute left-1/2 top-0 h-14 w-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_14px_currentColor]"
          style={{ color }}
        />
        <span className="absolute bottom-0 left-1/2 h-7 w-3 -translate-x-1/2 rounded bg-slate-800" />
      </span>
    )
  }

  if (item.id === 'pet-void-orb') {
    return (
      <span className="relative block h-20 w-20" aria-hidden>
        <span className="absolute left-1/2 top-2 h-12 w-12 -translate-x-1/2 rounded-full bg-slate-950 shadow-[0_0_20px_#8b5cf6]" />
        <span className="absolute left-1/2 top-6 h-2 w-2 -translate-x-1/2 rounded-full bg-violet-100 shadow-[0_0_10px_#ddd6fe]" />
        {[15, 28, 41, 54].map((left, index) => (
          <span
            key={left}
            className="absolute top-12 h-7 w-1.5 origin-top rounded-full bg-slate-950"
            style={{ left, rotate: `${(index - 1.5) * 16}deg` }}
          />
        ))}
      </span>
    )
  }

  if (item.id === 'outfit-shadow-oracle') {
    return (
      <span className="relative block h-20 w-16" aria-hidden>
        <span className="absolute left-1/2 top-0 h-8 w-9 -translate-x-1/2 rounded-t-full bg-slate-950" />
        <span className="absolute left-1/2 top-5 h-2 w-10 -translate-x-1/2 rounded bg-slate-950" />
        <span className="absolute left-1/2 top-8 h-8 w-12 -translate-x-1/2 rounded bg-violet-950" />
        <span className="absolute left-1/2 top-[3.65rem] h-4 w-14 -translate-x-1/2 rounded-b-xl bg-violet-900" />
      </span>
    )
  }

  return <Sparkles size={34} aria-hidden />
}
