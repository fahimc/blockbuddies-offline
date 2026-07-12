import { Hand, Music2, PartyPopper, Smile, UserRoundCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PlayerEmote } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

const emotes: { id: PlayerEmote; label: string; icon: ReactNode }[] = [
  { id: 'wave', label: 'Wave', icon: <Hand size={20} aria-hidden /> },
  { id: 'cheer', label: 'Cheer', icon: <PartyPopper size={20} aria-hidden /> },
  { id: 'dance', label: 'Dance', icon: <Music2 size={20} aria-hidden /> },
  { id: 'sit', label: 'Sit', icon: <UserRoundCheck size={20} aria-hidden /> },
]

export function EmotePanel() {
  const setPlayerEmote = useGameStore((state) => state.setPlayerEmote)
  const playerEmote = useGameStore((state) => state.playerEmote)

  return (
    <Panel title="Emotes">
      <div className="grid grid-cols-2 gap-3">
        {emotes.map((emote) => (
          <button
            key={emote.id}
            type="button"
            onClick={() => setPlayerEmote(emote.id)}
            className={`inline-flex min-h-16 items-center justify-center gap-2 rounded-lg px-3 font-black ${
              playerEmote === emote.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            {emote.icon}
            {emote.label}
          </button>
        ))}
        <button type="button" onClick={() => setPlayerEmote('none')} className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 font-black text-white">
          <Smile size={20} aria-hidden />
          Clear
        </button>
      </div>
    </Panel>
  )
}
