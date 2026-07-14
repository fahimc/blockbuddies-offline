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
    description: 'Send a quick chat reply.',
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
]

export function findBadge(id: BadgeDefinition['id']) {
  return badgeDefinitions.find((badge) => badge.id === id)
}
