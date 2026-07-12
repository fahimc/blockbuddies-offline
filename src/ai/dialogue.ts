import type { BotMemory, BotProfile, LocationId } from '../game/types'

export type DialogueContext =
  | 'nearby'
  | 'jump'
  | 'obby'
  | 'questComplete'
  | 'coins'
  | 'quick-hi'
  | 'quick-play'
  | 'quick-follow'
  | 'quick-nice'
  | 'quick-bye'
  | 'memory'

const safeLines: Record<DialogueContext, string[]> = {
  nearby: ['Hi friend!', 'This town is busy today!', 'Want to explore?'],
  jump: ['Nice jump!', 'That was bouncy!', 'You are getting good at hops!'],
  obby: ['Race you to the next block!', 'Watch the gaps!', 'I will cheer from here!'],
  questComplete: ['Quest complete! Great teamwork!', 'We did it!', 'That was helpful!'],
  coins: ['Shiny coin!', 'Save some for the shop!', 'Coins make upgrades fun!'],
  'quick-hi': ['Hi!', 'Hello buddy!', 'Good to see you!'],
  'quick-play': ['Yes! Let us play!', 'Meet me near the obby!', 'Park game?'],
  'quick-follow': ['I will follow for a bit!', 'Lead the way!', 'Going with you!'],
  'quick-nice': ['Thanks!', 'You are kind!', 'Nice back at you!'],
  'quick-bye': ['Bye!', 'See you soon!', 'I will be around town!'],
  memory: ['I remember you!', 'Back again! That is fun!', 'Our friendship is growing!'],
}

const bannedFragments = ['badword', 'hate', 'stupid', 'kill']

export function sanitizeDialogue(line: string) {
  return bannedFragments.some((fragment) => line.toLowerCase().includes(fragment))
    ? 'Let us keep it friendly!'
    : line
}

export function selectDialogue(
  profile: BotProfile,
  context: DialogueContext,
  seed: number,
  memory?: BotMemory,
) {
  if (memory && memory.friendship >= 3 && context === 'nearby') {
    context = 'memory'
  }
  const lines = safeLines[context]
  const personalityOffset = profile.username.length + profile.personality.length
  const index = Math.abs(Math.floor(seed + personalityOffset)) % lines.length
  return sanitizeDialogue(lines[index])
}

export function joinLeaveMessage(username: string, joined: boolean) {
  return `${username} ${joined ? 'joined' : 'left'} the local server`
}

export function locationInvite(username: string, location: LocationId) {
  const label = location === 'obby' ? 'the beginner obby' : `the ${location}`
  return `${username}: Want to visit ${label}?`
}
