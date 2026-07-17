import { useMemo, useState, type ReactNode } from 'react'
import {
  accessoryItems,
  accentColors,
  clothingItems,
  eyeColors,
  faceStyles,
  hairColors,
  hairStyles,
  heroSkinItems,
  pantsItems,
  skinTones,
  trailItems,
} from '../data/avatarCustomization'
import { botProfiles } from '../data/botProfiles'
import { friendshipLabel } from '../ai/relationship'
import { useGameStore } from '../state/gameStore'
import { GameAvatarPreview } from './GameAvatarPreview'
import { Panel } from './Panel'

export function FriendshipPanel() {
  const memories = useGameStore((state) => state.botMemory)
  const avatar = useGameStore((state) => state.avatar)
  const savedAvatars = useGameStore((state) => state.savedAvatars)
  const savedFriends = useGameStore((state) => state.savedFriends)
  const createSavedFriend = useGameStore((state) => state.createSavedFriend)
  const toggleSavedFriendInWorld = useGameStore((state) => state.toggleSavedFriendInWorld)
  const deleteSavedFriend = useGameStore((state) => state.deleteSavedFriend)
  const openMessageThread = useGameStore((state) => state.openMessageThread)
  const [npcName, setNpcName] = useState('')
  const [selectedStyleId, setSelectedStyleId] = useState('current')
  const [draftAvatar, setDraftAvatar] = useState(avatar)
  const styleOptions = useMemo(
    () => [
      { id: 'current', name: 'Current Character', avatar },
      ...savedAvatars.map((style) => ({
        id: style.id,
        name: style.name,
        avatar: style.avatar,
      })),
    ],
    [avatar, savedAvatars],
  )
  const selectTemplate = (id: string) => {
    const style = styleOptions.find((entry) => entry.id === id) ?? styleOptions[0]
    setSelectedStyleId(style.id)
    setDraftAvatar(style.avatar)
  }
  const updateDraft = (patch: Partial<typeof draftAvatar>) => {
    setSelectedStyleId('custom')
    setDraftAvatar((current) => ({ ...current, ...patch }))
  }
  const createNpc = () => {
    createSavedFriend(npcName, draftAvatar)
    setNpcName('')
  }

  return (
    <Panel title="Buddies & NPCs">
      <section className="mb-4 rounded-2xl bg-sky-50 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-slate-950">Create NPC Character</h3>
            <p className="text-xs font-bold text-slate-500">Name them, customise their full look, and add them to the town.</p>
          </div>
        </div>
        <div className="bb-npc-creator">
          <label>
            <span>NPC name</span>
            <input
              value={npcName}
              onChange={(event) => setNpcName(event.target.value)}
              placeholder="Sunny Builder"
              aria-label="NPC name"
            />
          </label>
          <div className="bb-npc-editor">
            <div className="bb-npc-preview" aria-label="NPC look preview">
              <GameAvatarPreview avatar={draftAvatar} yaw={-0.2} />
            </div>
            <div className="bb-npc-controls">
              <NpcOptionGroup title="Templates">
                {styleOptions.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    className={selectedStyleId === style.id ? 'selected' : ''}
                    onClick={() => selectTemplate(style.id)}
                  >
                    <span className="bb-buddy-avatar mini" style={{ background: style.avatar.shirtColor }} />
                    <span>{style.name}</span>
                  </button>
                ))}
              </NpcOptionGroup>
              <NpcSwatches title="Skin" selected={draftAvatar.bodyColor} colors={skinTones} onPick={(bodyColor) => updateDraft({ bodyColor })} />
              <NpcSwatches title="Shirt" selected={draftAvatar.shirtColor} colors={['#0b74ff', '#16a34a', '#dc2626', '#7c3aed', '#f97316', '#facc15', '#14b8a6', '#111827']} onPick={(shirtColor) => updateDraft({ shirtColor })} />
              <NpcSwatches title="Pants" selected={draftAvatar.pantsColor ?? '#111827'} colors={['#111827', '#1d4ed8', '#14532d', '#7c2d12', '#334155']} onPick={(pantsColor) => updateDraft({ pantsColor })} />
              <NpcSwatches title="Hair" selected={draftAvatar.hairColor ?? '#5a2f16'} colors={hairColors} onPick={(hairColor) => updateDraft({ hairColor })} />
              <NpcSwatches title="Eyes" selected={draftAvatar.eyeColor ?? '#111827'} colors={eyeColors} onPick={(eyeColor) => updateDraft({ eyeColor })} />
              <NpcSwatches title="Accent" selected={draftAvatar.accentColor ?? '#0b74ff'} colors={accentColors} onPick={(accentColor) => updateDraft({ accentColor })} />
              <NpcOptionGroup title="Hero skins">
                {heroSkinItems.map((item) => (
                  <button key={item.id} type="button" onClick={() => updateDraft(item.patch)}>
                    <span className="bb-npc-color-chip" style={{ background: item.color }} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </NpcOptionGroup>
              <NpcOptionGroup title="Hair style">
                {hairStyles.map((item) => (
                  <button key={item.id} type="button" className={draftAvatar.hairStyle === item.patch.hairStyle ? 'selected' : ''} onClick={() => updateDraft(item.patch)}>
                    {item.name}
                  </button>
                ))}
              </NpcOptionGroup>
              <NpcOptionGroup title="Face">
                {faceStyles.map((item) => (
                  <button key={item.id} type="button" className={draftAvatar.face === item.patch.face ? 'selected' : ''} onClick={() => updateDraft(item.patch)}>
                    {item.name}
                  </button>
                ))}
              </NpcOptionGroup>
              <NpcOptionGroup title="Clothes">
                {[...clothingItems, ...pantsItems].map((item) => (
                  <button key={item.id} type="button" onClick={() => updateDraft(item.patch)}>
                    <span className="bb-npc-color-chip" style={{ background: item.color }} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </NpcOptionGroup>
              <NpcOptionGroup title="Accessories">
                <button type="button" className={draftAvatar.hat === 'none' && draftAvatar.accessory === 'none' ? 'selected' : ''} onClick={() => updateDraft({ hat: 'none', accessory: 'none' })}>
                  None
                </button>
                {accessoryItems.map((item) => (
                  <button key={item.id} type="button" onClick={() => updateDraft(item.patch)}>
                    <span className="bb-npc-color-chip" style={{ background: item.color }} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </NpcOptionGroup>
              <NpcOptionGroup title="Trails">
                <button type="button" className={draftAvatar.trail === 'none' ? 'selected' : ''} onClick={() => updateDraft({ trail: 'none' })}>
                  None
                </button>
                {trailItems.map((item) => (
                  <button key={item.id} type="button" className={draftAvatar.trail === item.patch.trail ? 'selected' : ''} onClick={() => updateDraft(item.patch)}>
                    <span className="bb-npc-color-chip" style={{ background: item.color }} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </NpcOptionGroup>
            </div>
          </div>
          <div className="bb-npc-style-strip" role="listbox" aria-label="NPC avatar style">
            {styleOptions.map((style) => (
              <button
                key={style.id}
                type="button"
                role="option"
                aria-selected={selectedStyleId === style.id}
                className={selectedStyleId === style.id ? 'selected' : ''}
                onClick={() => selectTemplate(style.id)}
              >
                <span className="bb-buddy-avatar mini" style={{ background: style.avatar.shirtColor }} />
                <span>{style.name}</span>
              </button>
            ))}
          </div>
          <button type="button" className="bb-friend-action primary" onClick={createNpc}>
            Create NPC
          </button>
        </div>
      </section>

      <section className="mb-4 rounded-2xl bg-slate-50 p-3">
        <div className="mb-2">
          <h3 className="font-black text-slate-950">Custom NPCs</h3>
          <p className="text-xs font-bold text-slate-500">Message them or choose who appears in your town.</p>
        </div>
        {savedFriends.length === 0 ? (
          <p className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm">
            No custom NPCs yet.
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

function NpcOptionGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="bb-npc-option-group">
      <h4>{title}</h4>
      <div>{children}</div>
    </section>
  )
}

function NpcSwatches({
  title,
  selected,
  colors,
  onPick,
}: {
  title: string
  selected: string
  colors: string[]
  onPick: (color: string) => void
}) {
  return (
    <section className="bb-npc-option-group">
      <h4>{title}</h4>
      <div className="bb-npc-swatches">
        {colors.map((color) => (
          <button
            key={`${title}-${color}`}
            type="button"
            className={selected === color ? 'selected' : ''}
            style={{ background: color }}
            onClick={() => onPick(color)}
            aria-label={`${title} ${color}`}
          />
        ))}
      </div>
    </section>
  )
}
