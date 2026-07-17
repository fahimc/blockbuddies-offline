import { botProfiles } from '../data/botProfiles'
import { friendshipLabel } from '../ai/relationship'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

export function FriendshipPanel() {
  const memories = useGameStore((state) => state.botMemory)
  const savedFriends = useGameStore((state) => state.savedFriends)
  const createSavedFriend = useGameStore((state) => state.createSavedFriend)
  const toggleSavedFriendInWorld = useGameStore((state) => state.toggleSavedFriendInWorld)
  const deleteSavedFriend = useGameStore((state) => state.deleteSavedFriend)
  const openMessageThread = useGameStore((state) => state.openMessageThread)
  return (
    <Panel title="Buddy Profiles">
      <section className="mb-4 rounded-2xl bg-sky-50 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-slate-950">Saved Friends</h3>
            <p className="text-xs font-bold text-slate-500">Create friends, message them, and add them to the town.</p>
          </div>
          <button type="button" className="bb-friend-action primary" onClick={() => createSavedFriend()}>
            Make Friend
          </button>
        </div>
        {savedFriends.length === 0 ? (
          <p className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm">
            No custom friends yet.
          </p>
        ) : (
          <div className="space-y-2">
            {savedFriends.map((friend) => (
              <article key={friend.id} className="bb-buddy-card">
                <div className="flex items-center gap-3">
                  <span className="bb-buddy-avatar" style={{ background: friend.avatar.shirtColor }} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-black text-slate-950">{friend.name}</h3>
                    <p className="text-xs font-bold text-slate-500">
                      {friend.inWorld ? 'In the town' : 'Saved for later'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button type="button" className="bb-friend-action" onClick={() => openMessageThread(friend.id, friend.name)}>
                    Message
                  </button>
                  <button type="button" className="bb-friend-action" onClick={() => toggleSavedFriendInWorld(friend.id)}>
                    {friend.inWorld ? 'Remove' : 'Add'}
                  </button>
                  <button type="button" className="bb-friend-action danger" onClick={() => deleteSavedFriend(friend.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="space-y-3">
        {botProfiles.map((bot) => {
          const memory = memories[bot.id]
          const friendship = memory?.friendship ?? 0
          return (
            <article key={bot.id} className="bb-buddy-card">
              <div className="flex items-center gap-3">
                <span className="bb-buddy-avatar" style={{ background: bot.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-black text-slate-950">{bot.username}</h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">
                      {friendshipLabel(friendship)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500">Mood: {bot.mood} · Favorite: {bot.favoriteActivity}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-500" style={{ width: `${Math.min(100, friendship * 20)}%` }} />
                    </div>
                    <span className="text-xs font-black text-slate-500">Lv. {Math.max(1, friendship)}</span>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </Panel>
  )
}
