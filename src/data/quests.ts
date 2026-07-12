import type { QuestDefinition } from '../game/types'

export const questDefinitions: QuestDefinition[] = [
  {
    id: 'meet-three-buddies',
    title: 'Meet three buddies',
    description: 'Walk near three simulated buddies and say hi.',
    target: 3,
    reward: 25,
  },
  {
    id: 'visit-park',
    title: 'Visit the park',
    description: 'Reach Buddy Park with your new friends.',
    target: 1,
    reward: 15,
  },
  {
    id: 'beginner-obby',
    title: 'Complete the beginner obby',
    description: 'Finish the starter obstacle course.',
    target: 1,
    reward: 60,
  },
  {
    id: 'collect-10-coins',
    title: 'Collect 10 coins',
    description: 'Pick up coins around town.',
    target: 10,
    reward: 30,
  },
  {
    id: 'find-toy',
    title: 'Help a bot find their toy',
    description: 'Find the missing star toy near the houses.',
    target: 1,
    reward: 35,
  },
]
