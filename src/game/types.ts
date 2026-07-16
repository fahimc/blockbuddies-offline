export type Vec3 = [number, number, number]

export type LocationId = 'spawn' | 'park' | 'shop' | 'school' | 'obby' | 'houses' | 'parking'

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

export type PlayerEmote = 'none' | 'wave' | 'cheer' | 'dance' | 'sit'

export type ChatMessage = {
  id: string
  author: string
  text: string
  kind: 'system' | 'bot' | 'player'
  createdAt: number
}

export type QuestId =
  | 'meet-three-buddies'
  | 'visit-park'
  | 'beginner-obby'
  | 'collect-10-coins'
  | 'find-toy'

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
  target: number
  reward: number
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
  | 'pet-bot'
  | 'wings-night'
  | 'halo-gold'
  | 'pet-puppy'
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

export type ShopItem = {
  id: ShopItemId
  name: string
  category: 'body' | 'shirt' | 'hat' | 'trail' | 'pants' | 'accessory'
  cost: number
  color?: string
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
  | 'jeans'
  | 'shorts'
  | 'joggers'
  | 'cargo'
  | 'skirt'
  | 'leggings'
  | 'none'

export type AvatarShoeStyle = 'sneakers' | 'boots' | 'highTops' | 'sandals' | 'none'

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

export type BadgeDefinition = {
  id: BadgeId
  title: string
  description: string
  icon: string
}

export type BuildPieceId = 'block' | 'road' | 'house' | 'building' | 'shop' | 'car' | 'tree' | 'lamp'

export type BuildBlock = {
  id: string
  kind?: BuildPieceId
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
