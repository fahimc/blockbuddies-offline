import { MessageSquare, Send, X } from 'lucide-react'
import { useState } from 'react'
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const messages = chat.slice(-8)
  const quickReplies = (
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
  )
  const messageList = (
    <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
      {messages.map((message) => (
        <div key={message.id} className="text-left text-xs font-bold leading-snug text-slate-700">
          <span className={message.kind === 'system' ? 'text-slate-500' : message.kind === 'player' ? 'text-blue-700' : 'text-emerald-700'}>
            {message.author}:
          </span>{' '}
          {message.text}
        </div>
      ))}
    </div>
  )

  return (
    <>
      <aside className="chat-panel-desktop absolute bottom-3 left-3 z-10 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-2 rounded-lg bg-white/90 p-3 shadow-xl backdrop-blur max-md:bottom-28">
        {messageList}
        {quickReplies}
      </aside>

      <button
        type="button"
        className="mobile-chat-button pointer-events-auto absolute left-[3.6rem] top-3 z-30 hidden h-10 w-10 place-items-center rounded-lg bg-slate-950/85 text-white shadow-lg"
        onClick={() => setMobileOpen((open) => !open)}
        title="Chat"
      >
        <MessageSquare size={18} aria-hidden />
      </button>

      {mobileOpen ? (
        <aside className="mobile-chat-drawer pointer-events-auto absolute left-3 top-[3.65rem] z-30 hidden w-72 max-w-[calc(100vw-1.5rem)] flex-col gap-2 rounded-lg bg-white/95 p-3 shadow-xl backdrop-blur">
          <button
            type="button"
            className="absolute right-2 top-2 rounded-md bg-slate-100 p-1 text-slate-900"
            onClick={() => setMobileOpen(false)}
            title="Close chat"
          >
            <X size={16} aria-hidden />
          </button>
          <div className="pr-7">{messageList}</div>
          {quickReplies}
        </aside>
      ) : null}
    </>
  )
}
