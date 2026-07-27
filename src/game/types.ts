export type Vec3 = [number, number, number]

export type LocationId =
  | 'spawn'
  | 'park'
  | 'shop'
  | 'school'
  | 'obby'
  | 'houses'
  | 'parking'
  | 'football'
  | 'kart'
  | 'hall'
  | 'builder'
  | 'market'
  | 'restaurant'
  | 'delivery'
  | 'farm'

export type InteriorKind = 'house' | 'shop' | 'school' | 'building'

export type InteriorVisit = {
  id: string
  title: string
  kind: InteriorKind
  returnPosition: Vec3
  returnYaw: number
}

export type BotMood = 'happy' | 'curious' | 'focused' | 'playful'

export type BotState =
  | 'idle'
  | 'wander'
  | 'go_to_location'
  | 'greet_player'
  | 'do_activity'
  | 'leave_area'

export type BotProfile = {
  id: string
  username: string
  color: string
  shirtColor: string
  personality: 'friendly' | 'builder' | 'racer' | 'helper' | 'silly'
  mood: BotMood
  favoriteActivity: LocationId
  schedule: LocationId[]
}

export type BotRuntime = {
  id: string
  state: BotState
  position: Vec3
  target: Vec3
  targetLocation: LocationId
  mood: BotMood
  goal: string
  action: 'idle' | 'walk' | 'run' | 'jump' | 'wave' | 'cheer'
  nextDecisionAt: number
  speech?: string
  speechUntil: number
}

export type PlayerEmote =
  'none' | 'wave' | 'cheer' | 'dance' | 'sit' | 'kickups'

export type ChatMessage = {
  id: string
  author: string
  text: string
  kind: 'system' | 'bot' | 'player'
  createdAt: number
}

export type DirectMessage = {
  id: string
  presetId: string
  text: string
  from: 'player' | 'bot'
  createdAt: number
  read: boolean
}

export type MessageThread = {
  id: string
  botId: string
  botName: string
  messages: DirectMessage[]
  updatedAt: number
}

export type QuestId =
  | 'meet-three-buddies'
  | 'visit-park'
  | 'visit-school'
  | 'visit-shop'
  | 'use-town-map'
  | 'message-a-buddy'
  | 'beginner-obby'
  | 'collect-10-coins'
  | 'find-toy'
  | 'build-first-piece'
  | 'drive-a-car'
  | 'take-a-seat'
  | 'sleep-in-bed'
  | 'try-an-emote'
  | 'play-coin-rush'
  | 'deliver-a-package'
  | 'find-hidden-buddies'
  | 'work-shopkeeper-shift'
  | 'work-restaurant-shift'
  | 'work-delivery-shift'
  | 'work-farm-shift'
  | 'recruit-first-buddy'
  | 'defend-buddy-rush'
  | 'rescue-visiting-buddy'

export type QuestProgress = {
  id: QuestId
  started: boolean
  completed: boolean
  progress: number
}

export type QuestDefinition = {
  id: QuestId
  title: string
  description: string
  howTo: string
  tip: string
  category: 'starter' | 'daily' | 'adventure'
  target: number
  reward: number
}

export type JobId = 'shopkeeper' | 'restaurant' | 'delivery' | 'farming'

export type JobTask = {
  id: string
  label: string
  mechanic: string
  instruction: string
  position: Vec3
  npcLine: string
  variants: JobTaskVariant[]
}

export type JobTaskOption = {
  id: string
  label: string
}

export type JobTaskVariant = {
  id: string
  orderLabel: string
  prompt: string
  options: JobTaskOption[]
  correctOptionId: string
  successLine: string
  customerName?: string
  position?: Vec3
}

export type JobDefinition = {
  id: JobId
  title: string
  employer: string
  description: string
  locationId: LocationId
  reward: number
  shiftDurationSeconds: number
  color: string
  managerName: string
  managerPosition: Vec3
  tasks: JobTask[]
}

export type JobRecord = {
  shiftsCompleted: number
  coinsEarned: number
  xp: number
  level: number
  bestScore: number
  bestStars: number
  perfectShifts: number
}

export type JobStatus = 'idle' | 'running' | 'completed'

export type JobShiftMode = 'standard' | 'rush'

export type JobTaskFeedback = {
  kind: 'correct' | 'wrong'
  message: string
  optionId: string
}

export type JobShiftSummary = {
  baseReward: number
  tip: number
  masteryBonus: number
  totalReward: number
  score: number
  stars: 1 | 2 | 3
  xpGained: number
  levelBefore: number
  levelAfter: number
  levelledUp: boolean
  perfect: boolean
  overtime: boolean
}

export type JobRuntime = {
  activeId?: JobId
  status: JobStatus
  taskIndex: number
  completedTaskIds: string[]
  challengeIds: string[]
  selectedTaskId?: string
  startedAt: number
  endsAt: number
  shiftNumber: number
  mode: JobShiftMode
  score: number
  combo: number
  bestCombo: number
  mistakes: number
  feedback?: JobTaskFeedback
  summary?: JobShiftSummary
  eventSequence: number
  records: Partial<Record<JobId, JobRecord>>
}

export type BuddyRarity =
  'everyday' | 'unusual' | 'rare' | 'epic' | 'superstar' | 'secret'

export type BuddyTalent = 'speedy' | 'clever' | 'musical' | 'protective'

export type BuddyStyleId = 'galaxy'

export type BuddyActivityStationId =
  'clubhouse-bakery' | 'clubhouse-garden' | 'clubhouse-arcade'

export type CollectableBuddyDefinition = {
  id: string
  name: string
  family: 'animal' | 'fantasy' | 'robot' | 'performer' | 'mini'
  rarity: BuddyRarity
  color: string
  accentColor: string
  personality: string
  talent: BuddyTalent
  favouriteActivity: BuddyActivityStationId
  passiveCoinsPerMinute: number
  ability: string
  recruitmentPrompt: string
  recruitmentOptions: string[]
  recruitmentAnswer: string
}

export type BuddyVisitState = {
  hostPlayerId: string
  sourcePlayerId: string
  startedAtGameTime: number
  endsAtGameTime: number
  rescueProgress: number
}

export type CollectableBuddyInstance = {
  id: string
  definitionId: string
  ownerId: 'player'
  rarity: BuddyRarity
  styleId: BuddyStyleId | null
  talent: BuddyTalent
  friendshipLevel: number
  friendshipXp: number
  happiness: number
  isFavourite: boolean
  activityStationId: BuddyActivityStationId | null
  visitState: BuddyVisitState | null
  rescues: number
}

export type BuddyActivityStationState = {
  id: BuddyActivityStationId
  level: number
  assignedBuddyIds: string[]
}

export type ClubhouseShieldPhase = 'protected' | 'warning' | 'rush' | 'recovery'

export type ClubhouseShieldState = {
  phase: ClubhouseShieldPhase
  phaseEndsAtGameTime: number
  lastRaiderId: string | null
}

export type BuddyRushMode = 'friendly' | 'standard' | 'reduced-tension'

export type BuddyRaidDirection = 'defend' | 'raid'

export type BuddyRaidPhase = 'approach' | 'capture' | 'chase'

export type BuddyRushRaid = {
  id: string
  direction: BuddyRaidDirection
  phase: BuddyRaidPhase
  rivalId: string
  buddyInstanceId?: string
  buddyDefinitionId: string
  startedAt: number
  phaseEndsAt: number
  routeIndex: number
}

export type BuddyRushVisitor = {
  id: string
  definitionId: string
  sourceRivalId: string
  startedAt: number
  endsAt: number
}

export type BuddyRecruitmentFeedback = {
  kind: 'success' | 'wrong'
  message: string
}

export type BuddyBusState = {
  cycle: number
  arrivedAt: number
  departsAt: number
  nextArrivalAt: number
  offerDefinitionIds: string[]
  selectedDefinitionId?: string
  feedback?: BuddyRecruitmentFeedback
}

export type BuddyGadgetId = 'bubble-blaster' | 'buddy-whistle' | 'roller-skates'

export type BuddyPetId = 'guard-bot' | 'tracker-pup'

export type BuddyPetLoadout = {
  adventurePetId: BuddyPetId
  guardPetId: BuddyPetId
}

export type BuddyRivalMemory = {
  rivalId: string
  targetCount: number
  lastTargetedAt: number
  lastOutcome: 'none' | 'defended' | 'escaped' | 'rescued'
}

export type BuddyRescueQuest = {
  buddyInstanceId: string
  rivalId: string
  startedAt: number
}

export type BuddyRushNotice = {
  sequence: number
  kind: 'info' | 'warning' | 'success'
  text: string
}

export type BuddyRushRuntime = {
  ownedBuddies: CollectableBuddyInstance[]
  discoveredDefinitionIds: string[]
  discoveredStyleIds: BuddyStyleId[]
  stations: BuddyActivityStationState[]
  unclaimedCoins: number
  passiveCoinRemainder: number
  lastPassiveAt: number
  shield: ClubhouseShieldState
  bus: BuddyBusState
  activeRaid?: BuddyRushRaid
  visitors: BuddyRushVisitor[]
  rescueQuest?: BuddyRescueQuest
  gadgetLoadout: BuddyGadgetId[]
  gadgetCooldownEndsAt: Partial<Record<BuddyGadgetId, number>>
  boostEndsAt: number
  rivalPauseStartedAt: number
  rivalPausedUntil: number
  routeHintEndsAt: number
  whistlePullEndsAt: number
  petLoadout: BuddyPetLoadout
  rivalMemories: Record<string, BuddyRivalMemory>
  raidSequence: number
  recentRescueStreak: number
  neighbourhoodRank: number
  eventSequence: number
  notice?: BuddyRushNotice
}

export type ShopItemId =
  | 'shirt-sunrise'
  | 'body-mint'
  | 'hat-star'
  | 'trail-spark'
  | 'top-blue-hoodie'
  | 'top-green-hoodie'
  | 'top-red-hoodie'
  | 'top-fire-hoodie'
  | 'top-yellow-hoodie'
  | 'top-raglan'
  | 'top-star-tee'
  | 'top-purple-hoodie'
  | 'top-stripe-shirt'
  | 'top-orange-hoodie'
  | 'pants-black'
  | 'pants-blue'
  | 'shoes-white'
  | 'hat-red-cap'
  | 'hat-blue-beanie'
  | 'glasses-star'
  | 'headphones-blue'
  | 'backpack-blue'
  | 'pet-puppy'
  | 'pet-kitten'
  | 'pet-bunny'
  | 'pet-panda'
  | 'pet-fox'
  | 'pet-duck'
  | 'pet-pig'
  | 'pet-monkey'
  | 'pet-dragon'
  | 'pet-dino'
  | 'pet-unicorn'
  | 'pet-bot'
  | 'pet-void-orb'
  | 'wings-night'
  | 'halo-gold'
  | 'visor-neon'
  | 'rocket-trail'
  | 'wing-pack'
  | 'trail-rainbow'
  | 'trail-neon'
  | 'trail-galaxy'
  | 'trail-stars'
  | 'hero-skin-sky-guardian'
  | 'hero-skin-solar-sprinter'
  | 'hero-skin-neon-knight'
  | 'hero-skin-forest-defender'
  | 'hero-skin-moon-rescuer'
  | 'hero-cape-sky'
  | 'hero-cape-solar'
  | 'hero-cape-neon'
  | 'hero-cape-forest'
  | 'hero-cape-moon'
  | 'outfit-shadow-oracle'
  | 'weapon-light-saber-blue'
  | 'weapon-light-saber-purple'
  | 'weapon-light-saber-red'

export type ShopItem = {
  id: ShopItemId
  name: string
  category:
    | 'body'
    | 'shirt'
    | 'hat'
    | 'trail'
    | 'pants'
    | 'accessory'
    | 'pet'
    | 'outfit'
    | 'weapon'
  cost: number
  color?: string
  avatarPatch?: Partial<AvatarSettings>
  weaponColor?: string
}

export type AvatarHairStyle =
  | 'short'
  | 'spiky'
  | 'side'
  | 'curly'
  | 'curls'
  | 'bob'
  | 'long'
  | 'flat'
  | 'mohawk'
  | 'beanie'
  | 'none'

export type AvatarFaceStyle =
  | 'smile'
  | 'happy'
  | 'wink'
  | 'wow'
  | 'cool'
  | 'sleepy'
  | 'surprised'
  | 'robot'
  | 'plain'

export type AvatarOutfitStyle =
  | 'tee'
  | 'hoodie'
  | 'jacket'
  | 'suit'
  | 'sport'
  | 'armour'
  | 'hero-suit'
  | 'hero-armour'
  | 'hero-cape'
  | 'pajamas'
  | 'tank'
  | 'none'

export type AvatarBottomStyle =
  'jeans' | 'shorts' | 'joggers' | 'cargo' | 'skirt' | 'leggings' | 'none'

export type AvatarShoeStyle =
  'sneakers' | 'boots' | 'highTops' | 'sandals' | 'none'

export type AvatarSettings = {
  bodyColor: string
  shirtColor: string
  hairColor?: string
  hairStyle?: AvatarHairStyle
  face?: AvatarFaceStyle
  eyeColor?: string
  accentColor?: string
  secondaryColor?: string
  pantsColor?: string
  topStyle?: ShopItemId | 'none'
  outfitStyle?: AvatarOutfitStyle
  bottomStyle?: AvatarBottomStyle
  shoeStyle?: AvatarShoeStyle
  shoeColor?: string
  avatarSource?: string
  hat: ShopItemId | 'none'
  accessory?: ShopItemId | 'none'
  trail: ShopItemId | 'none'
}

export type SavedAvatarStyle = {
  id: string
  name: string
  avatar: AvatarSettings
  createdAt: number
}

export type SavedFriendMovement = {
  mode: 'walk'
  startedAt: number
  speed: number
  waypoints: Vec3[]
  destination: Vec3
}

export type SavedFriend = {
  id: string
  name: string
  avatar: AvatarSettings
  inWorld: boolean
  route: LocationId[]
  position?: Vec3
  movement?: SavedFriendMovement
  createdAt: number
}

export type BotMemory = {
  botId: string
  timesMet: number
  questsCompletedTogether: number
  lastInteraction: number
  friendship: number
}

export type GameSettings = {
  quality: 'low' | 'medium' | 'high'
  audio: boolean
  music: boolean
  reducedMotion: boolean
  proceduralWorld: boolean
  worldSeed: string
  worldViewDistance: 1 | 2 | 3
  nightMode: boolean
  interiorCameraZoom: number
  buddyRushEnabled: boolean
  buddyRushMode: BuddyRushMode
}

export type ObbyState = {
  active: boolean
  checkpoint: Vec3
  startedAt: number
  bestTime?: number
  finished: boolean
}

export type MiniGameId = 'coin-rush' | 'delivery-dash' | 'hide-and-seek'

export type MiniGameStatus = 'idle' | 'running' | 'completed' | 'failed'

export type MiniGameRecord = {
  plays: number
  bestScore: number
  bestPoints?: number
  bestTime?: number
}

export type MiniGameAnnouncement = {
  sequence: number
  title: string
  objective: string
  message: string
  startedAt: number
  endsAt: number
}

export type MiniGameRuntime = {
  activeId?: MiniGameId
  status: MiniGameStatus
  startedAt: number
  endsAt: number
  score: number
  points: number
  target: number
  collected: string[]
  records: Partial<Record<MiniGameId, MiniGameRecord>>
  eventSequence: number
  announcement?: MiniGameAnnouncement
}

export type BadgeId =
  | 'welcome'
  | 'social-buddy'
  | 'coin-starter'
  | 'obby-rookie'
  | 'shopper'
  | 'builder'
  | 'friend-maker'
  | 'mini-game-star'
  | 'first-paycheck'
  | 'job-specialist'
  | 'buddy-recruiter'
  | 'rush-rescuer'

export type BadgeDefinition = {
  id: BadgeId
  title: string
  description: string
  icon: string
}

export type BuildPieceId =
  'block' | 'road' | 'house' | 'building' | 'shop' | 'car' | 'tree' | 'lamp'

export type BuildBlock = {
  id: string
  kind?: BuildPieceId
  name?: string
  position: Vec3
  color: string
  rotation?: number
}

export type LeaderboardRow = {
  username: string
  score: number
  label: string
  isPlayer?: boolean
}
