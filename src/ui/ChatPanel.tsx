import { ArrowLeft, Inbox, MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  messageCategories,
  predefinedMessages,
  type MessageCategory,
} from '../data/predefinedMessages'
import type { DirectMessage, MessageThread } from '../game/types'
import { useGameStore } from '../state/gameStore'

export function ChatPanel() {
  const messageThreads = useGameStore((state) => state.messageThreads)
  const selectedMessageThreadId = useGameStore(
    (state) => state.selectedMessageThreadId,
  )
  const openPanel = useGameStore((state) => state.openPanel)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const openMessageThread = useGameStore((state) => state.openMessageThread)
  const closeMessageThread = useGameStore((state) => state.closeMessageThread)
  const sendPredefinedMessage = useGameStore(
    (state) => state.sendPredefinedMessage,
  )
  const [category, setCategory] = useState<MessageCategory>('greeting')

  const sortedThreads = useMemo(
    () =>
      [...messageThreads].sort((a, b) => {
        const unreadDelta = unreadCount(b) - unreadCount(a)
        return unreadDelta || b.updatedAt - a.updatedAt
      }),
    [messageThreads],
  )
  const totalUnread = sortedThreads.reduce(
    (sum, thread) => sum + unreadCount(thread),
    0,
  )
  const selectedThread =
    sortedThreads.find((thread) => thread.botId === selectedMessageThreadId) ??
    sortedThreads[0]
  const open = openPanel === 'messages'
  const visiblePresets = predefinedMessages.filter(
    (message) => message.category === category,
  )

  const close = () => {
    closeMessageThread()
    setOpenPanel(undefined)
  }

  return (
    <>
      <button
        type="button"
        className="pointer-events-auto absolute left-[3.7rem] top-3 z-40 grid h-11 w-11 place-items-center rounded-xl bg-slate-950/90 text-white shadow-xl ring-2 ring-white/70"
        onClick={() => setOpenPanel(open ? undefined : 'messages')}
        title="Messages"
        aria-label={`Messages${totalUnread ? `, ${totalUnread} unread` : ''}`}
      >
        <Inbox size={20} aria-hidden />
        {totalUnread > 0 ? (
          <span className="absolute -right-2 -top-2 grid min-h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1 text-xs font-black text-white ring-2 ring-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        ) : null}
      </button>

      {open ? (
        <aside className="pointer-events-auto absolute left-3 top-[4.25rem] z-40 flex max-h-[min(72vh,34rem)] w-[25rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-2 ring-white/80 backdrop-blur">
          <header className="flex min-h-14 items-center gap-2 bg-blue-600 px-3 text-white">
            {selectedMessageThreadId ? (
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"
                onClick={closeMessageThread}
                title="Back to inbox"
                aria-label="Back to inbox"
              >
                <ArrowLeft size={19} aria-hidden />
              </button>
            ) : (
              <MessageCircle size={22} aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-black leading-none">
                {selectedMessageThreadId
                  ? selectedThread.botName
                  : 'Messages'}
              </h2>
              <p className="mt-1 text-xs font-bold text-blue-100">
                {selectedMessageThreadId
                  ? 'Pick a safe reply'
                  : `${totalUnread} unread message${totalUnread === 1 ? '' : 's'}`}
              </p>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-700 shadow"
              onClick={close}
              title="Close messages"
              aria-label="Close messages"
            >
              <X size={19} aria-hidden />
            </button>
          </header>

          {selectedMessageThreadId ? (
            <ThreadView
              botId={selectedThread.botId}
              messages={selectedThread.messages}
              category={category}
              visiblePresets={visiblePresets}
              onCategory={setCategory}
              onSend={(presetId) =>
                sendPredefinedMessage(selectedThread.botId, presetId)
              }
            />
          ) : (
            <ThreadList
              threads={sortedThreads}
              onOpen={(botId) => openMessageThread(botId)}
            />
          )}
        </aside>
      ) : null}
    </>
  )
}

function ThreadList({
  threads,
  onOpen,
}: {
  threads: MessageThread[]
  onOpen: (botId: string) => void
}) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto p-3">
      {threads.map((thread) => {
        const unread = unreadCount(thread)
        const latest = thread.messages.at(-1)
        return (
          <button
            key={thread.botId}
            type="button"
            onClick={() => onOpen(thread.botId)}
            className="grid min-h-16 grid-cols-[2.75rem_1fr_auto] items-center gap-3 rounded-xl bg-slate-100 p-2 text-left shadow-sm hover:bg-sky-100"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500 text-lg font-black text-white">
              {thread.botName.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm font-black text-slate-950">
                {thread.botName}
              </strong>
              <span className="block truncate text-xs font-bold text-slate-600">
                {latest ? latest.text : 'Tap to start a chat'}
              </span>
            </span>
            {unread > 0 ? (
              <span className="grid min-h-7 min-w-7 place-items-center rounded-full bg-rose-500 px-1.5 text-xs font-black text-white">
                {unread}
              </span>
            ) : (
              <Send size={18} className="text-slate-400" aria-hidden />
            )}
          </button>
        )
      })}
    </div>
  )
}

function ThreadView({
  botId,
  messages,
  category,
  visiblePresets,
  onCategory,
  onSend,
}: {
  botId: string
  messages: DirectMessage[]
  category: MessageCategory
  visiblePresets: typeof predefinedMessages
  onCategory: (category: MessageCategory) => void
  onSend: (presetId: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    if (typeof node.scrollTo === 'function') {
      node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
    } else {
      node.scrollTop = node.scrollHeight
    }
  }, [botId, messages.length])

  return (
    <>
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-slate-50 p-3">
        {messages.length === 0 ? (
          <div className="rounded-xl bg-white p-4 text-center text-sm font-bold text-slate-600 shadow-sm">
            Choose a message below to start.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm font-bold shadow-sm ${
                message.from === 'player'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'mr-auto bg-white text-slate-900'
              }`}
            >
              {message.text}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-2">
        <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
          {messageCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onCategory(item.id)}
              className={`min-h-9 shrink-0 rounded-xl px-3 text-xs font-black ${
                item.id === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto">
          {visiblePresets.map((message) => (
            <button
              key={`${botId}-${message.id}`}
              type="button"
              onClick={() => onSend(message.id)}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-sky-100 px-2 text-xs font-black text-slate-950 hover:bg-sky-200"
            >
              <Send size={13} aria-hidden />
              <span>{message.text}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function unreadCount(thread: { messages: { from: string; read: boolean }[] }) {
  return thread.messages.filter((message) => message.from === 'bot' && !message.read)
    .length
}
