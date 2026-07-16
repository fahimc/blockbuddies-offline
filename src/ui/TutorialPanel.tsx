import {
  Blocks,
  CarFront,
  Gamepad2,
  Map,
  MessageCircle,
  MousePointerClick,
  Save,
  Server,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Panel } from './Panel'

type TutorialSection = {
  title: string
  icon: ReactNode
  steps: string[]
}

const tutorialSections: TutorialSection[] = [
  {
    title: 'Move Around',
    icon: <MousePointerClick size={18} aria-hidden />,
    steps: [
      'Drag the left joystick to walk. Hold Run to move faster.',
      'Drag anywhere on the world to orbit the camera.',
      'Tap Jump to hop and tap the hand button when a nearby action appears.',
    ],
  },
  {
    title: 'Local Party',
    icon: <Server size={18} aria-hidden />,
    steps: [
      'Open Menu, then Local Party.',
      'One player taps Host Room. Other players tap Find Rooms and choose the room.',
      'The host accepts the join request. Connected players appear in the same town.',
      'Built objects and player movement sync while the party stays connected.',
    ],
  },
  {
    title: 'Messages',
    icon: <MessageCircle size={18} aria-hidden />,
    steps: [
      'Tap a buddy or a local player to open their message thread.',
      'Choose one of the safe preset messages. There is no free-text chat.',
      'Unread replies show on the Messages icon and inside the inbox.',
    ],
  },
  {
    title: 'Build Mode',
    icon: <Blocks size={18} aria-hidden />,
    steps: [
      'Open Menu, then Build Mode.',
      'Turn Build mode on, pick a piece, choose a colour, and tap Place.',
      'Use Rotate before placing houses, shops, roads, and props.',
      'Build outside interiors and use Auto Street for a quick starter layout.',
    ],
  },
  {
    title: 'Map Travel',
    icon: <Map size={18} aria-hidden />,
    steps: [
      'Open Menu, then Town Map.',
      'Tap a marker to see the place name.',
      'Tap Travel to teleport to the selected safe arrival spot.',
    ],
  },
  {
    title: 'Mini Games',
    icon: <Gamepad2 size={18} aria-hidden />,
    steps: [
      'Open Menu, then Mini Games, or walk to a game marker.',
      'When a game starts, follow the bold timer and objective banner.',
      'Collect points before time runs out to earn coins and badges.',
    ],
  },
  {
    title: 'Cars',
    icon: <CarFront size={18} aria-hidden />,
    steps: [
      'Travel to Buddy Parking or walk near a car.',
      'Tap Drive when the car action appears.',
      'Use the driving controls, brake near people, and tap Exit to get out safely.',
    ],
  },
  {
    title: 'Save Progress',
    icon: <Save size={18} aria-hidden />,
    steps: [
      'Your character, coins, quests, messages, and custom world save locally.',
      'The saved pill at the top means your latest progress is stored.',
      'Use Settings only if you want to reset save data.',
    ],
  },
]

export function TutorialPanel() {
  return (
    <Panel title="Tutorial">
      <div className="space-y-3">
        <section className="rounded-2xl bg-sky-50 p-3 shadow-sm ring-1 ring-sky-100">
          <div className="flex items-center gap-2 text-sky-900">
            <Sparkles size={18} aria-hidden />
            <h3 className="text-base font-black">How to play</h3>
          </div>
          <p className="mt-1 text-sm font-bold leading-snug text-slate-700">
            Learn the core controls, local multiplayer, building, travel, and rewards.
          </p>
        </section>

        <div className="grid gap-3">
          {tutorialSections.map((section) => (
            <section key={section.title} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <div className="mb-2 flex items-center gap-2 text-blue-700">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100">
                  {section.icon}
                </span>
                <h3 className="text-base font-black text-slate-950">{section.title}</h3>
              </div>
              <ol className="space-y-1.5">
                {section.steps.map((step, index) => (
                  <li key={step} className="grid grid-cols-[1.65rem_1fr] gap-2 text-sm font-bold leading-snug text-slate-700">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </Panel>
  )
}
