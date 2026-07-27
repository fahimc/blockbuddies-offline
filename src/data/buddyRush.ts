import type {
  BuddyActivityStationId,
  BuddyGadgetId,
  BuddyPetId,
  BuddyRushMode,
  BuddyTalent,
  CollectableBuddyDefinition,
  Vec3,
} from '../game/types'

export const buddyRushConfig = {
  protectedMs: 4 * 60_000,
  newPlayerProtectedMs: 6 * 60_000,
  warningMs: 20_000,
  rushMs: 60_000,
  recoveryMs: 2 * 60_000,
  captureHoldMs: 2_000,
  aiApproachMs: 8_000,
  chaseMs: 24_000,
  visitorMs: 5 * 60_000,
  busVisitMs: 90_000,
  busIntervalMs: 4 * 60_000,
  passiveTickCapMs: 8 * 60 * 60_000,
} as const

export const buddyRushModeModifiers: Record<
  BuddyRushMode,
  {
    shieldMultiplier: number
    warningMultiplier: number
    chaseMultiplier: number
    captureMultiplier: number
    visitorMultiplier: number
    bonusLoss: boolean
  }
> = {
  friendly: {
    shieldMultiplier: 1,
    warningMultiplier: 1,
    chaseMultiplier: 1.2,
    captureMultiplier: 1,
    visitorMultiplier: 0,
    bonusLoss: false,
  },
  standard: {
    shieldMultiplier: 1,
    warningMultiplier: 1,
    chaseMultiplier: 1,
    captureMultiplier: 1,
    visitorMultiplier: 1,
    bonusLoss: true,
  },
  'reduced-tension': {
    shieldMultiplier: 1.5,
    warningMultiplier: 1.5,
    chaseMultiplier: 1.3,
    captureMultiplier: 0.65,
    visitorMultiplier: 0.5,
    bonusLoss: false,
  },
}

export const collectableBuddyDefinitions: CollectableBuddyDefinition[] = [
  buddy({
    id: 'bolt-bot',
    name: 'BoltBot',
    family: 'robot',
    rarity: 'everyday',
    color: '#38bdf8',
    accentColor: '#facc15',
    personality: 'Helpful builder',
    talent: 'clever',
    favouriteActivity: 'clubhouse-arcade',
    passiveCoinsPerMinute: 2,
    ability: 'Improves activity station upgrades.',
    recruitmentPrompt:
      'BoltBot has three loose wires. Which tool safely tightens a screw?',
    recruitmentOptions: ['Toy hammer', 'Screwdriver', 'Paint brush'],
    recruitmentAnswer: 'Screwdriver',
  }),
  buddy({
    id: 'momo-monkey',
    name: 'Momo Monkey',
    family: 'animal',
    rarity: 'unusual',
    color: '#a16207',
    accentColor: '#fef3c7',
    personality: 'Curious scout',
    talent: 'protective',
    favouriteActivity: 'clubhouse-garden',
    passiveCoinsPerMinute: 3,
    ability: 'Spots an approaching rival early.',
    recruitmentPrompt:
      'Momo lost a yellow suitcase. Where should you look first?',
    recruitmentOptions: ['Buddy Bus stop', 'Swimming pool', 'Rooftop'],
    recruitmentAnswer: 'Buddy Bus stop',
  }),
  buddy({
    id: 'bouncy-bunny',
    name: 'Bouncy Bunny',
    family: 'animal',
    rarity: 'everyday',
    color: '#f9a8d4',
    accentColor: '#ffffff',
    personality: 'Cheerful racer',
    talent: 'speedy',
    favouriteActivity: 'clubhouse-garden',
    passiveCoinsPerMinute: 2,
    ability: 'Extends escape and rescue chase time.',
    recruitmentPrompt:
      'Bouncy wants to race. Which action gives the best start?',
    recruitmentOptions: ['Run on green', 'Sit down', 'Wave at the finish'],
    recruitmentAnswer: 'Run on green',
  }),
  buddy({
    id: 'ember-dragon',
    name: 'Ember Dragon',
    family: 'fantasy',
    rarity: 'epic',
    color: '#f97316',
    accentColor: '#7c2d12',
    personality: 'Brave guardian',
    talent: 'protective',
    favouriteActivity: 'clubhouse-bakery',
    passiveCoinsPerMinute: 6,
    ability: 'Makes the recovery shield last longer.',
    recruitmentPrompt:
      'Ember is warming cupcakes. Which temperature is safest?',
    recruitmentOptions: ['Gentle warm glow', 'Maximum flames', 'Freezing cold'],
    recruitmentAnswer: 'Gentle warm glow',
  }),
  buddy({
    id: 'disco-duck',
    name: 'Disco Duck',
    family: 'performer',
    rarity: 'rare',
    color: '#facc15',
    accentColor: '#a855f7',
    personality: 'Musical performer',
    talent: 'musical',
    favouriteActivity: 'clubhouse-arcade',
    passiveCoinsPerMinute: 5,
    ability: 'Raises rewards from entertainment stations.',
    recruitmentPrompt:
      'Disco Duck starts a beat. Which emote matches the music?',
    recruitmentOptions: ['Dance', 'Sleep', 'Crouch'],
    recruitmentAnswer: 'Dance',
  }),
  buddy({
    id: 'pixel-pete-jr',
    name: 'PixelPete Jr',
    family: 'mini',
    rarity: 'unusual',
    color: '#22c55e',
    accentColor: '#1d4ed8',
    personality: 'Arcade expert',
    talent: 'clever',
    favouriteActivity: 'clubhouse-arcade',
    passiveCoinsPerMinute: 3,
    ability: 'Adds a combo bonus to arcade output.',
    recruitmentPrompt:
      'The arcade shows 4 stars, then 3 more. How many stars is that?',
    recruitmentOptions: ['6', '7', '8'],
    recruitmentAnswer: '7',
  }),
  buddy({
    id: 'frost-fox',
    name: 'Frost Fox',
    family: 'animal',
    rarity: 'rare',
    color: '#bae6fd',
    accentColor: '#2563eb',
    personality: 'Quick explorer',
    talent: 'speedy',
    favouriteActivity: 'clubhouse-garden',
    passiveCoinsPerMinute: 5,
    ability: 'Boosts movement after using Roller Skates.',
    recruitmentPrompt:
      'Frost Fox needs the shortest park route. Which path is quickest?',
    recruitmentOptions: ['Green shortcut', 'Long road loop', 'Wait for a bus'],
    recruitmentAnswer: 'Green shortcut',
  }),
  buddy({
    id: 'garden-pig',
    name: 'Garden Pig',
    family: 'animal',
    rarity: 'everyday',
    color: '#fb7185',
    accentColor: '#4ade80',
    personality: 'Patient gardener',
    talent: 'protective',
    favouriteActivity: 'clubhouse-garden',
    passiveCoinsPerMinute: 2,
    ability: 'Keeps assigned Buddies happier.',
    recruitmentPrompt: 'A seedling looks dry. What should Garden Pig do?',
    recruitmentOptions: [
      'Water the soil',
      'Hide it in a box',
      'Paint the leaves',
    ],
    recruitmentAnswer: 'Water the soil',
  }),
  buddy({
    id: 'crystal-unicorn',
    name: 'Crystal Unicorn',
    family: 'fantasy',
    rarity: 'superstar',
    color: '#c4b5fd',
    accentColor: '#f0abfc',
    personality: 'Sparkling singer',
    talent: 'musical',
    favouriteActivity: 'clubhouse-bakery',
    passiveCoinsPerMinute: 9,
    ability: 'Adds a friendship bonus to perfect activities.',
    recruitmentPrompt: 'Which notes complete the friendly clubhouse melody?',
    recruitmentOptions: ['High, low, high', 'Silence only', 'Random noise'],
    recruitmentAnswer: 'High, low, high',
  }),
  buddy({
    id: 'dino-dash',
    name: 'Dino Dash',
    family: 'fantasy',
    rarity: 'unusual',
    color: '#4ade80',
    accentColor: '#166534',
    personality: 'Playful sprinter',
    talent: 'speedy',
    favouriteActivity: 'clubhouse-bakery',
    passiveCoinsPerMinute: 3,
    ability: 'Reduces movement gadget cooldowns.',
    recruitmentPrompt: 'Dino Dash sees an obstacle. What is the safe move?',
    recruitmentOptions: ['Jump over it', 'Run into it', 'Close both eyes'],
    recruitmentAnswer: 'Jump over it',
  }),
  buddy({
    id: 'candy-panda',
    name: 'Candy Panda',
    family: 'animal',
    rarity: 'rare',
    color: '#f8fafc',
    accentColor: '#fb7185',
    personality: 'Inventive baker',
    talent: 'clever',
    favouriteActivity: 'clubhouse-bakery',
    passiveCoinsPerMinute: 5,
    ability: 'Improves bakery tips.',
    recruitmentPrompt:
      'Candy Panda needs 2 berries for each of 3 cakes. How many berries?',
    recruitmentOptions: ['5', '6', '8'],
    recruitmentAnswer: '6',
  }),
  buddy({
    id: 'nova-owl',
    name: 'Nova Owl',
    family: 'fantasy',
    rarity: 'secret',
    color: '#312e81',
    accentColor: '#fef08a',
    personality: 'Kind night guardian',
    talent: 'protective',
    favouriteActivity: 'clubhouse-arcade',
    passiveCoinsPerMinute: 12,
    ability: 'Reveals hidden route hints during a Buddy Rush.',
    recruitmentPrompt:
      'Nova Owl gives a clue: stars shine brightest in which sky?',
    recruitmentOptions: ['Night sky', 'Bakery floor', 'Under a desk'],
    recruitmentAnswer: 'Night sky',
  }),
]

export const buddyActivityStationDefinitions: {
  id: BuddyActivityStationId
  name: string
  preferredTalent: BuddyTalent
  rewardLabel: string
  position: Vec3
  color: string
}[] = [
  {
    id: 'clubhouse-bakery',
    name: 'Sunny Bakery',
    preferredTalent: 'clever',
    rewardLabel: 'Cupcake coins',
    position: [-16, 0, -4],
    color: '#fb7185',
  },
  {
    id: 'clubhouse-garden',
    name: 'Friendship Garden',
    preferredTalent: 'protective',
    rewardLabel: 'Garden coins',
    position: [-12, 0, -3.5],
    color: '#22c55e',
  },
  {
    id: 'clubhouse-arcade',
    name: 'Pixel Arcade',
    preferredTalent: 'musical',
    rewardLabel: 'Arcade coins',
    position: [-8, 0, -4],
    color: '#8b5cf6',
  },
]

export const buddyRushGadgets: {
  id: BuddyGadgetId
  name: string
  description: string
  cooldownMs: number
  color: string
}[] = [
  {
    id: 'bubble-blaster',
    name: 'Bubble Blaster',
    description: 'Pauses an escaping rival and adds chase time.',
    cooldownMs: 30_000,
    color: '#38bdf8',
  },
  {
    id: 'buddy-whistle',
    name: 'Buddy Whistle',
    description: 'Calls a captured Buddy closer for an easier rescue.',
    cooldownMs: 35_000,
    color: '#facc15',
  },
  {
    id: 'roller-skates',
    name: 'Roller Skates',
    description: 'Grants a short movement speed boost.',
    cooldownMs: 25_000,
    color: '#f43f5e',
  },
]

export const buddyRushPets: {
  id: BuddyPetId
  name: string
  role: 'guard' | 'tracker'
  description: string
  color: string
}[] = [
  {
    id: 'guard-bot',
    name: 'Guard Bot',
    role: 'guard',
    description: 'Warns early and extends Clubhouse Shield warnings.',
    color: '#38bdf8',
  },
  {
    id: 'tracker-pup',
    name: 'Tracker Pup',
    role: 'tracker',
    description: 'Shows the rival route and gives more rescue time.',
    color: '#f59e0b',
  },
]

export type BuddyRushRival = {
  id: string
  name: string
  archetype: 'friendly' | 'competitive' | 'builder' | 'prankster'
  clubhouseName: string
  clubhousePosition?: Vec3
  color: string
  buddyDefinitionIds: string[]
  chatLines: {
    warning: string
    defended: string
    escaped: string
    rescued: string
  }
}

export const buddyRushRivals: BuddyRushRival[] = [
  {
    id: 'luna-club',
    name: 'LunaBlocks',
    archetype: 'friendly',
    clubhouseName: 'Moonlight Club',
    clubhousePosition: [36, 0, -16],
    color: '#60a5fa',
    buddyDefinitionIds: ['frost-fox', 'pixel-pete-jr'],
    chatLines: {
      warning: 'Friendly tag game! Your shield is nearly down.',
      defended: 'Great rescue! Your shortcut was clever.',
      escaped: 'Your Buddy is only visiting. I will keep them happy!',
      rescued: 'Welcome home, Buddy! That was a fun chase.',
    },
  },
  {
    id: 'nori-club',
    name: 'NoriBuilds',
    archetype: 'builder',
    clubhouseName: 'Builder Base',
    clubhousePosition: [40, 0, 0],
    color: '#22c55e',
    buddyDefinitionIds: ['bolt-bot', 'garden-pig'],
    chatLines: {
      warning: 'I found a new route past the park. Rush incoming!',
      defended: 'Solid defence. Your clubhouse plan worked.',
      escaped: 'Your Buddy is helping at my workshop for a little while.',
      rescued: 'Nice rebuild of the rescue route!',
    },
  },
  {
    id: 'pip-club',
    name: 'PipPop',
    archetype: 'prankster',
    clubhouseName: 'Pop Party House',
    clubhousePosition: [36, 0, 16],
    color: '#f472b6',
    buddyDefinitionIds: ['disco-duck', 'candy-panda'],
    chatLines: {
      warning: 'Ding dong! A silly Buddy Rush is starting!',
      defended: 'Pop! You caught me fair and square.',
      escaped: 'Party visit unlocked. No Buddies were lost!',
      rescued: 'Best chase ever. Your Buddy missed the clubhouse.',
    },
  },
  {
    id: 'ace-scout',
    name: 'AceDash',
    archetype: 'competitive',
    clubhouseName: 'Dash Training Crew',
    color: '#f97316',
    buddyDefinitionIds: ['bouncy-bunny', 'dino-dash'],
    chatLines: {
      warning: 'Race you to the Friendship Badge!',
      defended: 'Fast tag! You earned that save.',
      escaped: 'Close race. Your Buddy will return automatically.',
      rescued: 'Great comeback. Ready for the next race?',
    },
  },
]

export const playerClubhousePosition: Vec3 = [-12, 0, -8]
export const playerClubhouseEntrance: Vec3 = [-12, 0, -2.8]
export const buddyBusStopPosition: Vec3 = [7, 0, 3]

export const buddyRushRoutes: Vec3[][] = [
  // Moonlight Club: park path.
  [
    playerClubhousePosition,
    [-6, 0, -3],
    [2, 0, -3],
    [12, 0, -9],
    [24, 0, -12],
    [36, 0, -16],
  ],
  // Moonlight Club: north alley shortcut.
  [
    playerClubhousePosition,
    [-15, 0, -16],
    [-4, 0, -20],
    [10, 0, -20],
    [24, 0, -18],
    [36, 0, -16],
  ],
  // Builder Base: market path.
  [
    playerClubhousePosition,
    [-18, 0, 1],
    [-8, 0, 10],
    [4, 0, 10],
    [18, 0, 5],
    [40, 0, 0],
  ],
  // Builder Base: clocktower shortcut.
  [
    playerClubhousePosition,
    [-4, 0, -8],
    [6, 0, -2],
    [16, 0, 2],
    [29, 0, 4],
    [40, 0, 0],
  ],
  // Pop Party House: garden path.
  [
    playerClubhousePosition,
    [-19, 0, -1],
    [-11, 0, 12],
    [2, 0, 18],
    [20, 0, 18],
    [36, 0, 16],
  ],
  // Pop Party House: east alley shortcut.
  [
    playerClubhousePosition,
    [-7, 0, 0],
    [3, 0, 7],
    [14, 0, 12],
    [26, 0, 11],
    [36, 0, 16],
  ],
]

export const neighbourhoodRanks = [
  'Starter Street',
  'Playtime Park',
  'Sunshine Square',
  'Adventure Avenue',
  'Superstar City',
  'Dream District',
  'Cosmic Community',
] as const

export function findCollectableBuddy(id: string) {
  return collectableBuddyDefinitions.find((entry) => entry.id === id)
}

export function findBuddyRival(id: string) {
  return buddyRushRivals.find((entry) => entry.id === id)
}

export function findBuddyStation(id: BuddyActivityStationId) {
  return buddyActivityStationDefinitions.find((entry) => entry.id === id)
}

export function findBuddyGadget(id: BuddyGadgetId) {
  return buddyRushGadgets.find((entry) => entry.id === id)
}

export function buddyRarityRank(rarity: CollectableBuddyDefinition['rarity']) {
  return ['everyday', 'unusual', 'rare', 'epic', 'superstar', 'secret'].indexOf(
    rarity,
  )
}

export function dailyBuddyEvent(now: number) {
  const day = new Date(now).getDay()
  return [
    'Pet Parade',
    'Mini-game Mayhem',
    'Gadget Workshop',
    'Friendship Festival',
    'Rare Buddy Hunt',
    'Clubhouse Party',
    'Town Takeover',
  ][day]
}

function buddy(
  definition: CollectableBuddyDefinition,
): CollectableBuddyDefinition {
  return definition
}
