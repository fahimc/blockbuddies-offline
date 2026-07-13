import { Copy, Share2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { botProfiles } from '../data/botProfiles'
import type { BotState } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { useLocalPartyStore } from '../state/localPartyStore'
import { Panel } from './Panel'
import { copyPartyCode, sharePartyCode, type PartyCodeActionResult } from './partyCodeActions'

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
  const error = useLocalPartyStore((state) => state.error)
  const remotePlayerRecord = useLocalPartyStore((state) => state.remotePlayers)
  const lastEvent = useLocalPartyStore((state) => state.lastEvent)
  const setPlayerName = useLocalPartyStore((state) => state.setPlayerName)
  const setJoinCodeInput = useLocalPartyStore((state) => state.setJoinCodeInput)
  const setAnswerCodeInput = useLocalPartyStore((state) => state.setAnswerCodeInput)
  const startHost = useLocalPartyStore((state) => state.startHost)
  const startJoin = useLocalPartyStore((state) => state.startJoin)
  const acceptAnswer = useLocalPartyStore((state) => state.acceptAnswer)
  const disconnect = useLocalPartyStore((state) => state.disconnect)
  const [codeActionMessage, setCodeActionMessage] = useState('')
  const remotePlayers = useMemo(() => Object.values(remotePlayerRecord), [remotePlayerRecord])

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

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => void startHost()} className="bb-party-action host">
            Host Local Party
          </button>
          <button type="button" onClick={disconnect} className="bb-party-action disconnect">
            Disconnect
          </button>
        </div>

        {inviteCode ? (
          <CodeBox
            id="host-invite-code"
            label="Host invite code"
            value={inviteCode}
            placeholder="Host invite code"
            readOnly
            actions={<CodeActions label="Host invite code" value={inviteCode} onMessage={setCodeActionMessage} />}
          />
        ) : null}

        <CodeBox
          id="join-invite-code"
          label="Join with invite code"
          value={joinCodeInput}
          placeholder="Paste host invite code"
          onChange={setJoinCodeInput}
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
              onChange={setAnswerCodeInput}
            />
            <button type="button" onClick={() => void acceptAnswer()} className="bb-party-action accept">
              Accept Join Answer
            </button>
          </>
        ) : null}

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
}: {
  id: string
  label: string
  value: string
  placeholder: string
  readOnly?: boolean
  onChange?: (value: string) => void
  actions?: ReactNode
}) {
  return (
    <div className="mt-3">
      <label className="block text-xs font-black uppercase tracking-wide text-slate-500" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onChange?.(event.target.value)}
        className="bb-party-code mt-1"
        rows={3}
      />
      {actions ? <div className="bb-party-code-actions">{actions}</div> : null}
    </div>
  )
}

function CodeActions({ label, value, onMessage }: { label: string; value: string; onMessage: (message: string) => void }) {
  const setMessage = (result: PartyCodeActionResult) => {
    if (result === 'copied') onMessage(`${label} copied.`)
    else if (result === 'shared') onMessage(`${label} shared.`)
    else if (result === 'dismissed') onMessage('Share cancelled.')
    else onMessage('Copy and share are unavailable on this device. Select the code manually.')
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
