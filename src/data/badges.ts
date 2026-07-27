import type { BadgeDefinition } from '../game/types'

export const badgeDefinitions: BadgeDefinition[] = [
  {
    id: 'welcome',
    title: 'Welcome In',
    description: 'Join the offline local server.',
    icon: 'W',
  },
  {
    id: 'social-buddy',
    title: 'Social Buddy',
    description: 'Send a predefined buddy message.',
    icon: 'S',
  },
  {
    id: 'coin-starter',
    title: 'Coin Starter',
    description: 'Collect at least 10 coins.',
    icon: 'C',
  },
  {
    id: 'obby-rookie',
    title: 'Obby Rookie',
    description: 'Finish the beginner obby.',
    icon: 'O',
  },
  {
    id: 'shopper',
    title: 'Shopper',
    description: 'Buy your first avatar item.',
    icon: '$',
  },
  {
    id: 'builder',
    title: 'Builder',
    description: 'Place your first sandbox block.',
    icon: 'B',
  },
  {
    id: 'friend-maker',
    title: 'Friend Maker',
    description: 'Meet three buddies.',
    icon: 'F',
  },
  {
    id: 'mini-game-star',
    title: 'Mini Game Star',
    description: 'Complete any town mini game.',
    icon: '*',
  },
  {
    id: 'first-paycheck',
    title: 'First Paycheck',
    description: 'Complete your first paid workplace shift.',
    icon: '$',
  },
  {
    id: 'job-specialist',
    title: 'Job Specialist',
    description: 'Reach mastery level 4 in any town job.',
    icon: 'J',
  },
  {
    id: 'buddy-recruiter',
    title: 'Buddy Recruiter',
    description: 'Recruit your first collectable Buddy from the Buddy Bus.',
    icon: 'R',
  },
  {
    id: 'rush-rescuer',
    title: 'Rush Rescuer',
    description: 'Protect or rescue a Buddy during a Buddy Rush.',
    icon: 'H',
  },
]

export function findBadge(id: BadgeDefinition['id']) {
  return badgeDefinitions.find((badge) => badge.id === id)
}
