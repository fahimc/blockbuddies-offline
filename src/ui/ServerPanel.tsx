import { ClipboardPaste, Copy, Share2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { botProfiles } from '../data/botProfiles'
import type { BotState } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { extractPartyCode, useLocalPartyStore } from '../state/localPartyStore'
import { isLocalSignalSupported, roomLabel } from '../network/localSignal'
import { isHostedSignalSupported } from '../network/hostedSignal'
import { Panel } from './Panel'
import { copyPartyCode, pastePartyCode, sharePartyCode, type PartyCodeActionResult } from './partyCodeActions'

const stateLabels: Record<BotState, string> = {
  idle: 'hanging out',
  wander: 'exploring',
  go_to_location: 'heading over',
  greet_player: 'saying hi',
  do_activity: 'playing',
  leave_area: 'moving on',
}

export function ServerPanel() {
  const bots = useGameStore((state) => state.bots)
  const botReact = useGameStore((state) => state.botReact)
  const playerName = useLocalPartyStore((state) => state.playerName)
  const status = useLocalPartyStore((state) => state.status)
  const role = useLocalPartyStore((state) => state.role)
  const inviteCode = useLocalPartyStore((state) => state.inviteCode)
  const joinCodeInput = useLocalPartyStore((state) => state.joinCodeInput)
  const answerCode = useLocalPartyStore((state) => state.answerCode)
  const answerCodeInput = useLocalPartyStore((state) => state.answerCodeInput)
  const roomName = useLocalPartyStore((state) => state.roomName)
  const lanRooms = useLocalPartyStore((state) => state.lanRooms)
  const lanSearching = useLocalPartyStore((state) => state.lanSearching)
  const lanHost = useLocalPartyStore((state) => state.lanHost)
  const hostedRoom = useLocalPartyStore((state) => state.hostedRoom)
  const pendingLanAnswerName = useLocalPartyStore((state) => state.pendingLanAnswerName)
  const pendingHostedAnswerName = useLocalPartyStore((state) => state.pendingHostedAnswerName)
  const error = useLocalPartyStore((state) => state.error)
  const remotePlayerRecord = useLocalPartyStore((state) => state.remotePlayers)
  const lastEvent = useLocalPartyStore((state) => state.lastEvent)
  const setPlayerName = useLocalPartyStore((state) => state.setPlayerName)
  const setRoomName = useLocalPartyStore((state) => state.setRoomName)
  const setJoinCodeInput = useLocalPartyStore((state) => state.setJoinCodeInput)
  const setAnswerCodeInput = useLocalPartyStore((state) => state.setAnswerCodeInput)
  const discoverRooms = useLocalPartyStore((state) => state.discoverRooms)
  const startRoomHost = useLocalPartyStore((state) => state.startRoomHost)
  const joinRoom = useLocalPartyStore((state) => state.joinRoom)
  const startHostedRoom = useLocalPartyStore((state) => state.startHostedRoom)
  const joinHostedRoom = useLocalPartyStore((state) => state.joinHostedRoom)
  const startHost = useLocalPartyStore((state) => state.startHost)
  const startJoin = useLocalPartyStore((state) => state.startJoin)
  const acceptAnswer = useLocalPartyStore((state) => state.acceptAnswer)
  const disconnect = useLocalPartyStore((state) => state.disconnect)
  const [codeActionMessage, setCodeActionMessage] = useState('')
  const remotePlayers = useMemo(() => Object.values(remotePlayerRecord), [remotePlayerRecord])
  const nativeRoomsSupported = isLocalSignalSupported()
  const hostedRoomsSupported = isHostedSignalSupported()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return
    const params = new URLSearchParams(hash)
    const invite = params.get('partyInvite')
    const answer = params.get('partyAnswer')
    if (invite) {
      setJoinCodeInput(extractPartyCode(invite))
      setCodeActionMessage('Shared invite loaded. Tap Create Join Answer.')
    }
    if (answer) {
      setAnswerCodeInput(extractPartyCode(answer))
      setCodeActionMessage('Shared answer loaded. Host can tap Accept Join Answer.')
    }
  }, [setAnswerCodeInput, setJoinCodeInput])

  return (
    <Panel title="Local Server">
      <article className="bb-party-card mb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-black">Local Party</h3>
            <p className="text-xs font-black text-slate-500">{lastEvent}</p>
          </div>
          <span className={`bb-party-status ${status}`}>{status}</span>
        </div>

        <label className="mt-3 block text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="party-name">
          Name
        </label>
        <input
          id="party-name"
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-sky-100 bg-white px-3 py-2 text-sm font-black text-slate-900"
          maxLength={18}
        />

        <label className="mt-3 block text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="party-room-name">
          Room Name
        </label>
        <input
          id="party-room-name"
          value={roomName}
          onChange={(event) => setRoomName(event.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-sky-100 bg-white px-3 py-2 text-sm font-black text-slate-900"
          maxLength={18}
        />

        {hostedRoomsSupported ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void startHostedRoom()} className="bb-party-action host">
                Host Web Room
              </button>
              <button type="button" onClick={() => void joinHostedRoom()} className="bb-party-action join compact">
                Join Web Room
              </button>
            </div>
            <p className="mt-2 rounded-lg bg-sky-100 px-3 py-2 text-xs font-black text-sky-800">
              Web players join by typing the same room name. The host approves each join request.
            </p>
          </>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void startRoomHost()} className="bb-party-action host">
              Host Room
            </button>
            <button type="button" onClick={() => void discoverRooms()} className="bb-party-action join compact">
              {lanSearching ? 'Searching...' : 'Find Rooms'}
            </button>
          </div>
        )}

        <button type="button" onClick={disconnect} className="bb-party-action disconnect mt-2 w-full">
          Disconnect
        </button>

        {lanHost ? (
          <div className="bb-party-room-card">
            <strong>{lanHost.roomName}</strong>
            <span>Room open on this phone. Guests can find it on the same Wi-Fi.</span>
          </div>
        ) : null}

        {hostedRoom ? (
          <div className="bb-party-room-card">
            <strong>{hostedRoom.roomName}</strong>
            <span>
              {role === 'host'
                ? 'Web room is open. Share this room name with another web player.'
                : `Waiting for ${hostedRoom.hostName ?? 'the host'} to accept your join request.`}
            </span>
          </div>
        ) : null}

        {!nativeRoomsSupported ? (
          <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-black text-amber-800">
            Android LAN discovery needs the APK. Web/PWA can use hosted web rooms or manual codes below.
          </p>
        ) : null}

        {lanRooms.length > 0 ? (
          <div className="bb-party-room-list" aria-label="Available LAN rooms">
            {lanRooms.map((room) => (
              <button key={`${room.host}:${room.port}`} type="button" className="bb-party-room-button" onClick={() => void joinRoom(room)}>
                <span>{room.roomName}</span>
                <small>{roomLabel(room)}</small>
              </button>
            ))}
          </div>
        ) : null}

        {role === 'host' && answerCodeInput ? (
          <div className="bb-party-room-card pending">
            <strong>{pendingHostedAnswerName ?? pendingLanAnswerName ?? 'A player'} wants to join</strong>
            <span>Host approval is required before they enter the room.</span>
            <button type="button" onClick={() => void acceptAnswer()} className="bb-party-action accept mt-2 w-full">
              Accept Join Request
            </button>
          </div>
        ) : null}

        <details className="bb-party-manual">
          <summary>Manual code fallback</summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void startHost()} className="bb-party-action host">
              Host Local Party
            </button>
            <button type="button" onClick={disconnect} className="bb-party-action disconnect">
              Reset Codes
            </button>
          </div>

          {inviteCode ? (
            <CodeBox
              id="host-invite-code"
              label="Host invite code"
              value={inviteCode}
              placeholder="Host invite code"
              readOnly
              generated
              hint="Fallback only: send this to a player if room discovery is unavailable."
              actions={<CodeActions label="Host invite code" value={inviteCode} onMessage={setCodeActionMessage} />}
            />
          ) : null}

          <CodeBox
            id="join-invite-code"
            label="Join with invite code"
            value={joinCodeInput}
            placeholder="Paste host invite code"
            onChange={(value) => setJoinCodeInput(extractPartyCode(value))}
            actions={<PasteAction label="Paste Invite Code" onPaste={setJoinCodeInput} onMessage={setCodeActionMessage} />}
          />
          <button type="button" onClick={() => void startJoin()} className="bb-party-action join">
            Create Join Answer
          </button>

          {answerCode ? (
            <CodeBox
              id="guest-answer-code"
              label="Join answer code"
              value={answerCode}
              placeholder="Join answer code"
              readOnly
              generated
              hint="Fallback only: send this back to the host."
              actions={<CodeActions label="Join answer code" value={answerCode} onMessage={setCodeActionMessage} />}
            />
          ) : null}

          {role === 'host' ? (
            <>
              <CodeBox
                id="host-answer-code"
                label="Accept join answer"
                value={answerCodeInput}
                placeholder="Paste join answer code"
                onChange={(value) => setAnswerCodeInput(extractPartyCode(value))}
                actions={<PasteAction label="Paste Answer Code" onPaste={setAnswerCodeInput} onMessage={setCodeActionMessage} />}
              />
              <button type="button" onClick={() => void acceptAnswer()} className="bb-party-action accept">
                Accept Join Answer
              </button>
            </>
          ) : null}
        </details>

        {error ? <p className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-xs font-black text-red-700">{error}</p> : null}
        {codeActionMessage ? <p className="mt-2 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800" role="status">{codeActionMessage}</p> : null}

        <div className="mt-3 rounded-lg bg-slate-900/5 px-3 py-2 text-xs font-black text-slate-600">
          Local players connected: {remotePlayers.length}
        </div>
        {remotePlayers.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {remotePlayers.map((player) => (
              <span key={player.id} className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800">
                {player.name}
              </span>
            ))}
          </div>
        ) : null}
      </article>

      <div className="space-y-2">
        {bots.map((bot) => {
          const profile = botProfiles.find((entry) => entry.id === bot.id) ?? botProfiles[0]
          return (
            <article key={bot.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
              <div className="min-w-0">
                <h3 className="truncate font-black">{profile.username}</h3>
                <p className="text-xs font-bold text-slate-500">
                  {stateLabels[bot.state]} - {bot.goal}
                </p>
              </div>
              <button type="button" onClick={() => botReact(bot.id, 'quick-play')} className="min-h-10 rounded-lg bg-sky-500 px-3 text-sm font-black text-white">
                Invite
              </button>
            </article>
          )
        })}
      </div>
    </Panel>
  )
}

function CodeBox({
  id,
  label,
  value,
  placeholder,
  readOnly,
  onChange,
  actions,
  generated,
  hint,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  readOnly?: boolean
  onChange?: (value: string) => void
  actions?: ReactNode
  generated?: boolean
  hint?: string
}) {
  const preview = value ? `${value.slice(0, 20)}...${value.slice(-10)}` : ''

  return (
    <div className="mt-3">
      <label className="block text-xs font-black uppercase tracking-wide text-slate-500" htmlFor={id}>
        {label}
      </label>
      {generated ? (
        <>
          <div className="bb-party-code-summary" aria-label={`${label} preview`}>
            <span className="truncate">{preview}</span>
            <strong>{value.length} chars</strong>
          </div>
          {hint ? <p className="mt-1 text-[0.68rem] font-black leading-snug text-slate-500">{hint}</p> : null}
          {actions ? <div className="bb-party-code-actions">{actions}</div> : null}
          <details className="bb-party-code-details">
            <summary>Show full code</summary>
            <textarea
              id={id}
              value={value}
              placeholder={placeholder}
              readOnly={readOnly}
              onFocus={(event) => event.currentTarget.select()}
              className="bb-party-code mt-1"
              rows={3}
            />
          </details>
        </>
      ) : (
        <>
          <textarea
            id={id}
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => onChange?.(event.target.value)}
            className="bb-party-code mt-1"
            rows={2}
          />
          {actions ? <div className="bb-party-code-actions">{actions}</div> : null}
        </>
      )}
    </div>
  )
}

function CodeActions({ label, value, onMessage }: { label: string; value: string; onMessage: (message: string) => void }) {
  const setMessage = (result: PartyCodeActionResult) => {
    if (result === 'copied') onMessage(`${label} copied.`)
    else if (result === 'shared') onMessage(`${label} shared.`)
    else if (result === 'pasted') onMessage(`${label} pasted.`)
    else if (result === 'dismissed') onMessage('Share cancelled.')
    else onMessage('Clipboard is unavailable. Open Show full code and select it manually.')
  }

  return (
    <>
      <button
        type="button"
        className="bb-party-code-button"
        onClick={() => void copyPartyCode(value).then(setMessage)}
        aria-label={`Copy ${label}`}
      >
        <Copy size={16} aria-hidden />
        Copy
      </button>
      <button
        type="button"
        className="bb-party-code-button"
        onClick={() => void sharePartyCode(value, label).then(setMessage)}
        aria-label={`Share ${label}`}
      >
        <Share2 size={16} aria-hidden />
        Share
      </button>
    </>
  )
}

function PasteAction({ label, onPaste, onMessage }: { label: string; onPaste: (value: string) => void; onMessage: (message: string) => void }) {
  return (
    <button
      type="button"
      className="bb-party-code-button"
      onClick={() =>
        void pastePartyCode()
          .then((value) => {
            if (!value) {
              onMessage('Clipboard is empty or unavailable.')
              return
            }
            onPaste(extractPartyCode(value))
            onMessage(`${label.replace('Paste ', '')} pasted.`)
          })
          .catch(() => onMessage('Clipboard permission was blocked. Paste manually.'))
      }
      aria-label={label}
    >
      <ClipboardPaste size={16} aria-hidden />
      {label.replace(' Code', '')}
    </button>
  )
}
