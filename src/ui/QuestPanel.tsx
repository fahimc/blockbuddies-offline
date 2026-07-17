import { CheckCircle2, ChevronDown, ChevronUp, Clock, Gift } from 'lucide-react'
import { useMemo, useState } from 'react'
import { questDefinitions } from '../data/quests'
import type { QuestId } from '../game/types'
import { useGameStore } from '../state/gameStore'
import { Panel } from './Panel'

type QuestTab = 'active' | 'daily' | 'completed'

const questTabs: { id: QuestTab; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'daily', label: 'Daily' },
  { id: 'completed', label: 'Completed' },
]

export function QuestPanel() {
  const progress = useGameStore((state) => state.questProgress)
  const startQuest = useGameStore((state) => state.startQuest)
  const [activeTab, setActiveTab] = useState<QuestTab>('active')
  const [expandedQuestId, setExpandedQuestId] =
    useState<QuestId>('meet-three-buddies')

  const quests = useMemo(
    () =>
      questDefinitions.map((quest) => {
        const item = progress.find((entry) => entry.id === quest.id)
        const current = Math.min(quest.target, item?.progress ?? 0)
        return {
          quest,
          item,
          current,
          percent: Math.round((current / quest.target) * 100),
          started: Boolean(item?.started),
          completed: Boolean(item?.completed),
        }
      }),
    [progress],
  )

  const visibleQuests = quests.filter((entry) => {
    if (activeTab === 'completed') return entry.completed
    if (activeTab === 'daily')
      return entry.quest.category === 'daily' && !entry.completed
    return entry.quest.category !== 'daily' && !entry.completed
  })
  const completedCount = quests.filter((entry) => entry.completed).length

  return (
    <Panel title="Quest Log">
      <div className="bb-tabs bb-quest-tabs mb-3">
        {questTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'bb-tab-active' : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bb-quest-list">
        {visibleQuests.length > 0 ? (
          visibleQuests.map(
            ({ quest, current, percent, started, completed }) => {
              const expanded = expandedQuestId === quest.id
              return (
                <article
                  key={quest.id}
                  className={`bb-quest-card ${expanded ? 'expanded' : ''}`}
                >
                  <button
                    type="button"
                    className="bb-quest-summary"
                    onClick={() => setExpandedQuestId(quest.id)}
                    aria-expanded={expanded}
                    aria-controls={`quest-details-${quest.id}`}
                  >
                    <span className="bb-quest-icon">
                      {completed ? (
                        <CheckCircle2 size={23} aria-hidden />
                      ) : (
                        <Clock size={23} aria-hidden />
                      )}
                    </span>
                    <span className="bb-quest-copy">
                      <span className="bb-quest-title">{quest.title}</span>
                      <span className="bb-quest-description">
                        {quest.description}
                      </span>
                    </span>
                    <span className="bb-quest-reward">
                      <Gift size={14} aria-hidden /> {quest.reward}
                    </span>
                    {expanded ? (
                      <ChevronUp
                        className="bb-quest-chevron"
                        size={20}
                        aria-hidden
                      />
                    ) : (
                      <ChevronDown
                        className="bb-quest-chevron"
                        size={20}
                        aria-hidden
                      />
                    )}
                  </button>

                  <div className="bb-quest-progress-row">
                    <div className="bb-quest-progress">
                      <span style={{ width: `${Math.min(100, percent)}%` }} />
                    </div>
                    <strong>
                      {current}/{quest.target}
                    </strong>
                  </div>

                  {expanded ? (
                    <div
                      id={`quest-details-${quest.id}`}
                      className="bb-quest-details"
                    >
                      <p>{quest.howTo}</p>
                      <small>{quest.tip}</small>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="bb-small-action bb-quest-action"
                    disabled={completed}
                    onClick={() => {
                      if (!started && !completed) startQuest(quest.id)
                      setExpandedQuestId(quest.id)
                    }}
                  >
                    {completed ? 'Done' : started ? 'Details' : 'Start'}
                  </button>
                </article>
              )
            },
          )
        ) : (
          <div className="bb-quest-empty" role="status">
            {activeTab === 'completed'
              ? 'Complete quests to see them here.'
              : 'No quests in this tab right now.'}
          </div>
        )}
      </div>

      <p className="bb-quest-footer">
        {completedCount}/{quests.length} quests complete - more town tasks unlock
        as you play.
      </p>
    </Panel>
  )
}
