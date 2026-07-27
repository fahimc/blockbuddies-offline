import {
  Blocks,
  BusFront,
  CarFront,
  Coins,
  Gamepad2,
  Home,
  Map,
  MessageCircle,
  MousePointerClick,
  Save,
  Server,
  ShieldCheck,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useGameStore, type GamePanel } from '../state/gameStore'
import { Panel } from './Panel'

type TutorialSection = {
  title: string
  icon: ReactNode
  steps: string[]
}

type FeaturedTutorialSection = TutorialSection & {
  description: string
  image: ReactNode
  action: {
    label: string
    panel: GamePanel
  }
  examples?: { label: string; detail: string }[]
}

const featuredTutorialSections: FeaturedTutorialSection[] = [
  {
    title: 'Your Club & Buddy Rush',
    icon: <Home size={19} aria-hidden />,
    description:
      'Recruit Buddies, give them clubhouse activities, protect your Friendship Badge, and visit rival clubs.',
    image: <ClubTutorialImage />,
    action: { label: 'Open Buddy Rush', panel: 'buddy-rush' },
    steps: [
      'Open Menu, then Buddy Rush. Start on the Buddy Bus tab when you need your first Buddy.',
      'Tap Visit, choose a visitor, and complete their Challenge. A successful challenge recruits that Buddy.',
      'Open the Clubhouse tab and assign recruited Buddies to activities. Clubhouse activities build up coins for you to collect.',
      'When the shield warning appears, follow the tracker and tag the rival before they escape. During your own Friendly Rush, visit a rival club and hold the badge action.',
    ],
  },
  {
    title: 'Buddy Bus & City Buses',
    icon: <BusFront size={19} aria-hidden />,
    description:
      'The Buddy Bus Stop brings recruitable visitors while red and blue double-deckers travel on the road beside it.',
    image: <BusTutorialImage />,
    action: { label: 'Find the bus stop', panel: 'map' },
    steps: [
      'Open Buddy Rush and tap Visit on the Buddy Bus tab, or open Town Map and travel to Buddy Bus Stop.',
      'At the shelter, tap Meet Buddy Bus visitors. Pick a visitor and finish their challenge before the offer timer changes.',
      'Wait on the pavement and use crossings carefully. The tall red and blue buses are moving city traffic and cannot be driven.',
      'Use Buddy Parking for normal cars and Go Kart Racing for vehicles you can control.',
    ],
  },
  {
    title: 'Work, Complete Tasks & Earn Coins',
    icon: <Store size={19} aria-hidden />,
    description:
      'Choose a workplace, start a timed shift, follow each task marker, and finish accurately for wages, tips, and mastery.',
    image: <JobsTutorialImage />,
    action: { label: 'Open Jobs & Work', panel: 'jobs' },
    examples: [
      { label: 'Shopkeeper', detail: 'Stock → scan → help' },
      { label: 'Restaurant', detail: 'Prepare → cook → serve' },
      { label: 'Delivery', detail: 'Collect → load → deliver' },
      { label: 'Farming', detail: 'Plant → water → harvest' },
    ],
    steps: [
      'Open Menu, then Jobs & Work. Choose Buddy Market, Sunny Bites, Buddy Delivery, or Sunshine Farm and tap Go to work.',
      'Walk to the manager outside the workplace and tap Start shift. The work HUD shows your timer, score, combo, and next task.',
      'Follow the coloured marker, tap the nearby task action, read the request, and choose the correct answer or interaction.',
      'Complete all three tasks before time runs out. Correct streaks add combo points, fast work earns tips, and the final result pays coins.',
      'Repeat shifts to gain mastery and unlock harder changing requests. Delivery Shift is a job; Delivery Dash is a separate Mini Game with its own coin rewards.',
    ],
  },
]

const coreTutorialSections: TutorialSection[] = [
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
      'Tap a buddy or a local player to show their Message button.',
      'Tap Message to open the thread for that selected person.',
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
      'Progress saves quietly in the background while you play.',
      'Use Settings only if you want to reset save data.',
    ],
  },
]

export function TutorialPanel() {
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)

  return (
    <Panel title="Tutorial">
      <div className="space-y-3">
        <section className="rounded-2xl bg-sky-50 p-3 shadow-sm ring-1 ring-sky-100">
          <div className="flex items-center gap-2 text-sky-900">
            <Sparkles size={18} aria-hidden />
            <h3 className="text-base font-black">How to play</h3>
          </div>
          <p className="mt-1 text-sm font-bold leading-snug text-slate-700">
            Follow the illustrated guides for clubs, buses, work, controls,
            multiplayer, building, travel, and rewards.
          </p>
        </section>

        <section
          aria-labelledby="tutorial-featured-title"
          className="space-y-3"
        >
          <div className="flex items-center gap-2 px-1 text-slate-950">
            <ShieldCheck size={18} className="text-fuchsia-600" aria-hidden />
            <h3 id="tutorial-featured-title" className="text-base font-black">
              Club, bus & work guide
            </h3>
          </div>
          {featuredTutorialSections.map((section) => (
            <article
              key={section.title}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
            >
              {section.image}
              <div className="p-3">
                <div className="mb-1.5 flex items-center gap-2 text-fuchsia-700">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-fuchsia-100">
                    {section.icon}
                  </span>
                  <h3 className="text-base font-black text-slate-950">
                    {section.title}
                  </h3>
                </div>
                <p className="mb-3 text-xs font-bold leading-snug text-slate-600">
                  {section.description}
                </p>
                {section.examples ? (
                  <div
                    className="mb-3 grid grid-cols-2 gap-2"
                    aria-label="Job task examples"
                  >
                    {section.examples.map((example) => (
                      <div
                        key={example.label}
                        className="rounded-xl bg-slate-100 px-2 py-2"
                      >
                        <strong className="block text-[11px] font-black text-slate-900">
                          {example.label}
                        </strong>
                        <span className="text-[10px] font-bold text-slate-600">
                          {example.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <TutorialSteps steps={section.steps} />
                <button
                  type="button"
                  className="bb-small-action mt-3 w-full"
                  onClick={() => setOpenPanel(section.action.panel)}
                >
                  {section.action.label}
                </button>
              </div>
            </article>
          ))}
        </section>

        <div className="flex items-center gap-2 px-1 pt-1 text-slate-950">
          <Gamepad2 size={18} className="text-blue-700" aria-hidden />
          <h3 className="text-base font-black">More ways to play</h3>
        </div>
        <div className="grid gap-3">
          {coreTutorialSections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-2 flex items-center gap-2 text-blue-700">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100">
                  {section.icon}
                </span>
                <h3 className="text-base font-black text-slate-950">
                  {section.title}
                </h3>
              </div>
              <TutorialSteps steps={section.steps} />
            </section>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function TutorialSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-1.5">
      {steps.map((step, index) => (
        <li
          key={step}
          className="grid grid-cols-[1.65rem_1fr] gap-2 text-sm font-bold leading-snug text-slate-700"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  )
}

function ClubTutorialImage() {
  return (
    <figure className="bg-gradient-to-br from-indigo-100 via-sky-100 to-emerald-100 p-2">
      <svg
        viewBox="0 0 360 168"
        className="h-auto w-full rounded-xl"
        role="img"
        aria-label="Illustration of a purple Buddy Rush clubhouse with Buddies, a Friendship Badge, and a route to a rival club"
      >
        <rect width="360" height="168" rx="18" fill="#bae6fd" />
        <rect y="108" width="360" height="60" fill="#65c466" />
        <path d="M0 142H360" stroke="#64748b" strokeWidth="24" />
        <path
          d="M0 142H360"
          stroke="#fde047"
          strokeWidth="2"
          strokeDasharray="13 10"
        />
        <rect x="44" y="66" width="128" height="70" rx="5" fill="#a855f7" />
        <path d="M34 69L108 29L183 69Z" fill="#312e81" />
        <rect x="92" y="94" width="32" height="42" rx="3" fill="#fef3c7" />
        <rect x="57" y="82" width="24" height="20" rx="4" fill="#bfdbfe" />
        <rect x="136" y="82" width="24" height="20" rx="4" fill="#bfdbfe" />
        <circle cx="108" cy="48" r="13" fill="#facc15" />
        <path
          d="M108 39L111 45L118 46L113 51L114 58L108 55L102 58L103 51L98 46L105 45Z"
          fill="#fff"
        />
        <circle cx="220" cy="111" r="19" fill="#0ea5e9" />
        <rect x="208" y="103" width="24" height="16" rx="7" fill="#fef08a" />
        <circle cx="267" cy="118" r="18" fill="#f472b6" />
        <rect x="255" y="110" width="24" height="15" rx="7" fill="#fff" />
        <path
          d="M174 82C216 44 267 46 315 75"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="5"
          strokeDasharray="7 8"
          strokeLinecap="round"
        />
        <circle cx="318" cy="76" r="17" fill="#f97316" />
        <path d="M311 75H325M318 68V82" stroke="#fff" strokeWidth="4" />
        <rect x="13" y="13" width="112" height="27" rx="13.5" fill="#0f172a" />
        <text
          x="69"
          y="31"
          textAnchor="middle"
          fill="#fff"
          fontSize="12"
          fontWeight="900"
        >
          CLUBHOUSE
        </text>
      </svg>
      <figcaption className="sr-only">
        Recruit at the bus, assign activities at your clubhouse, and follow the
        route to rival clubs.
      </figcaption>
    </figure>
  )
}

function BusTutorialImage() {
  return (
    <figure className="bg-gradient-to-br from-sky-100 to-blue-200 p-2">
      <svg
        viewBox="0 0 360 168"
        className="h-auto w-full rounded-xl"
        role="img"
        aria-label="Illustration of the Buddy Bus Stop facing a road with tall red and blue double-decker buses"
      >
        <rect width="360" height="168" rx="18" fill="#86efac" />
        <rect x="0" y="69" width="360" height="84" fill="#64748b" />
        <path
          d="M0 111H360"
          stroke="#fde047"
          strokeWidth="3"
          strokeDasharray="17 12"
        />
        <rect x="0" y="63" width="360" height="9" fill="#e2e8f0" />
        <rect x="0" y="150" width="360" height="9" fill="#e2e8f0" />
        <g transform="translate(15 18)">
          <rect x="0" y="18" width="102" height="46" rx="5" fill="#0284c7" />
          <rect x="7" y="26" width="88" height="25" rx="3" fill="#bae6fd" />
          <rect x="0" y="10" width="106" height="10" rx="4" fill="#075985" />
          <rect x="8" y="63" width="8" height="31" fill="#0f172a" />
          <rect x="88" y="63" width="8" height="31" fill="#0f172a" />
          <rect x="22" y="55" width="62" height="10" rx="4" fill="#facc15" />
          <rect x="8" y="0" width="92" height="17" rx="8" fill="#0ea5e9" />
          <text
            x="54"
            y="12"
            textAnchor="middle"
            fill="#fff"
            fontSize="9"
            fontWeight="900"
          >
            BUDDY BUS STOP
          </text>
        </g>
        <g transform="translate(145 75)">
          <rect width="95" height="62" rx="6" fill="#dc2626" />
          {[8, 29, 50, 71].map((x) => (
            <g key={x}>
              <rect x={x} y="8" width="16" height="14" rx="2" fill="#bae6fd" />
              <rect x={x} y="29" width="16" height="14" rx="2" fill="#dbeafe" />
            </g>
          ))}
          <circle cx="20" cy="62" r="8" fill="#111827" />
          <circle cx="75" cy="62" r="8" fill="#111827" />
        </g>
        <g transform="translate(251 32)">
          <rect width="91" height="62" rx="6" fill="#2563eb" />
          {[7, 27, 47, 67].map((x) => (
            <g key={x}>
              <rect x={x} y="8" width="15" height="14" rx="2" fill="#bae6fd" />
              <rect x={x} y="29" width="15" height="14" rx="2" fill="#dbeafe" />
            </g>
          ))}
          <circle cx="19" cy="62" r="8" fill="#111827" />
          <circle cx="72" cy="62" r="8" fill="#111827" />
        </g>
        <rect x="12" y="132" width="115" height="25" rx="12.5" fill="#0f172a" />
        <text
          x="69.5"
          y="149"
          textAnchor="middle"
          fill="#fff"
          fontSize="10"
          fontWeight="900"
        >
          WAIT ON PAVEMENT
        </text>
      </svg>
      <figcaption className="sr-only">
        Meet visitors at the roadside shelter and stay on the pavement while
        city buses pass.
      </figcaption>
    </figure>
  )
}

function JobsTutorialImage() {
  const workplaces = [
    {
      x: 13,
      color: '#0ea5e9',
      label: 'MARKET',
      icon: <Store size={16} aria-hidden />,
    },
    {
      x: 99,
      color: '#f97316',
      label: 'BITES',
      icon: <UtensilsCrossed size={16} aria-hidden />,
    },
    {
      x: 185,
      color: '#8b5cf6',
      label: 'DELIVERY',
      icon: <BusFront size={16} aria-hidden />,
    },
    {
      x: 271,
      color: '#16a34a',
      label: 'FARM',
      icon: <Wheat size={16} aria-hidden />,
    },
  ]

  return (
    <figure className="bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-100 p-2">
      <div
        className="relative overflow-hidden rounded-xl bg-amber-50"
        role="img"
        aria-label="Illustration of the four workplaces and a three-task route that pays coins"
      >
        <svg viewBox="0 0 360 168" className="h-auto w-full">
          <rect width="360" height="168" rx="18" fill="#fef3c7" />
          <rect y="106" width="360" height="62" fill="#86efac" />
          <path d="M0 137H360" stroke="#94a3b8" strokeWidth="26" />
          <path
            d="M0 137H360"
            stroke="#fff"
            strokeWidth="3"
            strokeDasharray="9 9"
          />
          {workplaces.map((workplace) => (
            <g key={workplace.label} transform={`translate(${workplace.x} 29)`}>
              <rect width="76" height="67" rx="7" fill={workplace.color} />
              <path d="M-3 17H79L71 0H5Z" fill="#0f172a" />
              <rect x="27" y="46" width="22" height="21" fill="#f8fafc" />
              <rect x="7" y="27" width="18" height="13" rx="2" fill="#dbeafe" />
              <rect x="51" y="27" width="18" height="13" rx="2" fill="#dbeafe" />
              <rect x="5" y="-1" width="66" height="17" rx="8" fill="#fff" />
              <text
                x="38"
                y="11"
                textAnchor="middle"
                fill="#0f172a"
                fontSize="8"
                fontWeight="900"
              >
                {workplace.label}
              </text>
            </g>
          ))}
          {[102, 157, 212].map((x, index) => (
            <g key={x}>
              <circle cx={x} cy="137" r="15" fill="#0f172a" />
              <text
                x={x}
                y="142"
                textAnchor="middle"
                fill="#fff"
                fontSize="13"
                fontWeight="900"
              >
                {index + 1}
              </text>
            </g>
          ))}
          <path
            d="M119 137H140M174 137H195M229 137H270"
            stroke="#facc15"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="293" cy="137" r="19" fill="#facc15" />
          <text
            x="293"
            y="143"
            textAnchor="middle"
            fill="#78350f"
            fontSize="18"
            fontWeight="900"
          >
            +
          </text>
          <rect x="307" y="124" width="43" height="26" rx="13" fill="#0f172a" />
          <text
            x="328.5"
            y="141"
            textAnchor="middle"
            fill="#fff"
            fontSize="9"
            fontWeight="900"
          >
            COINS
          </text>
        </svg>
        <div className="pointer-events-none absolute left-[7%] top-[31%] text-white">
          {workplaces[0].icon}
        </div>
        <div className="pointer-events-none absolute left-[31%] top-[31%] text-white">
          {workplaces[1].icon}
        </div>
        <div className="pointer-events-none absolute left-[55%] top-[31%] text-white">
          {workplaces[2].icon}
        </div>
        <div className="pointer-events-none absolute left-[79%] top-[31%] text-white">
          {workplaces[3].icon}
        </div>
        <div className="pointer-events-none absolute right-3 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black text-amber-950">
          <Coins size={12} aria-hidden />
          WAGE + TIPS
        </div>
      </div>
      <figcaption className="sr-only">
        Pick a workplace, complete tasks one through three, and receive coins.
      </figcaption>
    </figure>
  )
}
