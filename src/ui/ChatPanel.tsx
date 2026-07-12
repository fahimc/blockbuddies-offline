import { Send } from 'lucide-react'
import { useGameStore } from '../state/gameStore'
import type { DialogueContext } from '../ai/dialogue'

const replies: { text: string; context: DialogueContext }[] = [
  { text: 'Hi!', context: 'quick-hi' },
  { text: 'Want to play?', context: 'quick-play' },
  { text: 'Follow me', context: 'quick-follow' },
  { text: 'Nice!', context: 'quick-nice' },
  { text: 'Bye', context: 'quick-bye' },
]

export function ChatPanel() {
  const chat = useGameStore((state) => state.chat)
  const sendQuickReply = useGameStore((state) => state.sendQuickReply)

  return (
    <aside className="absolute bottom-3 left-3 z-10 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-2 rounded-lg bg-white/90 p-3 shadow-xl backdrop-blur max-md:bottom-28">
      <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
        {chat.slice(-8).map((message) => (
          <div key={message.id} className="text-left text-xs font-bold leading-snug text-slate-700">
            <span className={message.kind === 'system' ? 'text-slate-500' : message.kind === 'player' ? 'text-blue-700' : 'text-emerald-700'}>
              {message.author}:
            </span>{' '}
            {message.text}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {replies.map((reply) => (
          <button
            key={reply.text}
            type="button"
            onClick={() => sendQuickReply(reply.text, reply.context)}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-sky-100 px-2 text-xs font-black text-slate-900 hover:bg-sky-200"
          >
            <Send size={13} aria-hidden />
            {reply.text}
          </button>
        ))}
      </div>
    </aside>
  )
}
