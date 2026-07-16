export type MessageCategory =
  | 'greeting'
  | 'game'
  | 'quest'
  | 'build'
  | 'travel'
  | 'team'
  | 'thanks'
  | 'status'
  | 'safety'
  | 'fun'

export type PredefinedMessage = {
  id: string
  text: string
  category: MessageCategory
}

export const predefinedMessages: PredefinedMessage[] = [
  { id: 'greeting-001', category: 'greeting', text: 'Hi!' },
  { id: 'greeting-002', category: 'greeting', text: 'Hello buddy!' },
  { id: 'greeting-003', category: 'greeting', text: 'Good to see you!' },
  { id: 'greeting-004', category: 'greeting', text: 'Want to hang out?' },
  { id: 'greeting-005', category: 'greeting', text: 'Come over here!' },
  { id: 'greeting-006', category: 'greeting', text: 'I am nearby.' },
  { id: 'greeting-007', category: 'greeting', text: 'Let us meet at the plaza.' },
  { id: 'greeting-008', category: 'greeting', text: 'Welcome back!' },
  { id: 'greeting-009', category: 'greeting', text: 'Nice outfit!' },
  { id: 'greeting-010', category: 'greeting', text: 'That looks cool!' },
  { id: 'game-001', category: 'game', text: 'Want to play a mini game?' },
  { id: 'game-002', category: 'game', text: 'Start Coin Rush?' },
  { id: 'game-003', category: 'game', text: 'Start Delivery Dash?' },
  { id: 'game-004', category: 'game', text: 'Meet me at the obby.' },
  { id: 'game-005', category: 'game', text: 'Race you to the finish!' },
  { id: 'game-006', category: 'game', text: 'I found a coin path.' },
  { id: 'game-007', category: 'game', text: 'Try again?' },
  { id: 'game-008', category: 'game', text: 'Great score!' },
  { id: 'game-009', category: 'game', text: 'That was close!' },
  { id: 'game-010', category: 'game', text: 'Let us beat the timer.' },
  { id: 'quest-001', category: 'quest', text: 'Can you help with a quest?' },
  { id: 'quest-002', category: 'quest', text: 'I need a clue.' },
  { id: 'quest-003', category: 'quest', text: 'Where is the toy?' },
  { id: 'quest-004', category: 'quest', text: 'Let us visit the park.' },
  { id: 'quest-005', category: 'quest', text: 'I completed a quest!' },
  { id: 'quest-006', category: 'quest', text: 'Do you want to collect coins?' },
  { id: 'quest-007', category: 'quest', text: 'Follow the quest marker.' },
  { id: 'quest-008', category: 'quest', text: 'Check the school.' },
  { id: 'quest-009', category: 'quest', text: 'Check the shop.' },
  { id: 'quest-010', category: 'quest', text: 'Quest reward time!' },
  { id: 'build-001', category: 'build', text: 'Want to build something?' },
  { id: 'build-002', category: 'build', text: 'Place a house here.' },
  { id: 'build-003', category: 'build', text: 'Add a road tile.' },
  { id: 'build-004', category: 'build', text: 'This spot is clear.' },
  { id: 'build-005', category: 'build', text: 'Try rotating the piece.' },
  { id: 'build-006', category: 'build', text: 'Let us make a park.' },
  { id: 'build-007', category: 'build', text: 'Add lights near the path.' },
  { id: 'build-008', category: 'build', text: 'Cars need room to move.' },
  { id: 'build-009', category: 'build', text: 'Nice building!' },
  { id: 'build-010', category: 'build', text: 'Save this world?' },
  { id: 'travel-001', category: 'travel', text: 'Meet at the parking lot.' },
  { id: 'travel-002', category: 'travel', text: 'Meet at the shop.' },
  { id: 'travel-003', category: 'travel', text: 'Meet at the school.' },
  { id: 'travel-004', category: 'travel', text: 'Meet at the park.' },
  { id: 'travel-005', category: 'travel', text: 'Meet at the houses.' },
  { id: 'travel-006', category: 'travel', text: 'Open the map.' },
  { id: 'travel-007', category: 'travel', text: 'Use quick travel.' },
  { id: 'travel-008', category: 'travel', text: 'I am inside.' },
  { id: 'travel-009', category: 'travel', text: 'I am outside.' },
  { id: 'travel-010', category: 'travel', text: 'Wait for me there.' },
  { id: 'team-001', category: 'team', text: 'Follow me.' },
  { id: 'team-002', category: 'team', text: 'I will follow you.' },
  { id: 'team-003', category: 'team', text: 'Let us team up.' },
  { id: 'team-004', category: 'team', text: 'You go first.' },
  { id: 'team-005', category: 'team', text: 'I will wait here.' },
  { id: 'team-006', category: 'team', text: 'Stay together.' },
  { id: 'team-007', category: 'team', text: 'Great teamwork!' },
  { id: 'team-008', category: 'team', text: 'Need help?' },
  { id: 'team-009', category: 'team', text: 'Yes, please help.' },
  { id: 'team-010', category: 'team', text: 'No worries.' },
  { id: 'thanks-001', category: 'thanks', text: 'Thanks!' },
  { id: 'thanks-002', category: 'thanks', text: 'Thank you for helping.' },
  { id: 'thanks-003', category: 'thanks', text: 'You are awesome.' },
  { id: 'thanks-004', category: 'thanks', text: 'Good job!' },
  { id: 'thanks-005', category: 'thanks', text: 'Nice work!' },
  { id: 'thanks-006', category: 'thanks', text: 'That helped a lot.' },
  { id: 'thanks-007', category: 'thanks', text: 'I appreciate it.' },
  { id: 'thanks-008', category: 'thanks', text: 'High five!' },
  { id: 'thanks-009', category: 'thanks', text: 'You did it!' },
  { id: 'thanks-010', category: 'thanks', text: 'We did it!' },
  { id: 'status-001', category: 'status', text: 'I am ready.' },
  { id: 'status-002', category: 'status', text: 'One moment.' },
  { id: 'status-003', category: 'status', text: 'I need coins.' },
  { id: 'status-004', category: 'status', text: 'I am shopping.' },
  { id: 'status-005', category: 'status', text: 'I am customising.' },
  { id: 'status-006', category: 'status', text: 'I am driving.' },
  { id: 'status-007', category: 'status', text: 'I am building.' },
  { id: 'status-008', category: 'status', text: 'I am exploring.' },
  { id: 'status-009', category: 'status', text: 'I am stuck.' },
  { id: 'status-010', category: 'status', text: 'I am back.' },
  { id: 'safety-001', category: 'safety', text: 'Let us keep it friendly.' },
  { id: 'safety-002', category: 'safety', text: 'Please wait your turn.' },
  { id: 'safety-003', category: 'safety', text: 'Use safe paths.' },
  { id: 'safety-004', category: 'safety', text: 'Watch for cars.' },
  { id: 'safety-005', category: 'safety', text: 'Do not block the road.' },
  { id: 'safety-006', category: 'safety', text: 'Take a break soon?' },
  { id: 'safety-007', category: 'safety', text: 'That is okay.' },
  { id: 'safety-008', category: 'safety', text: 'Try a different way.' },
  { id: 'safety-009', category: 'safety', text: 'Let us be kind.' },
  { id: 'safety-010', category: 'safety', text: 'No problem.' },
  { id: 'fun-001', category: 'fun', text: 'Dance party!' },
  { id: 'fun-002', category: 'fun', text: 'Wave with me.' },
  { id: 'fun-003', category: 'fun', text: 'This town is fun.' },
  { id: 'fun-004', category: 'fun', text: 'Look at this view.' },
  { id: 'fun-005', category: 'fun', text: 'I found a secret spot.' },
  { id: 'fun-006', category: 'fun', text: 'Let us take a photo.' },
  { id: 'fun-007', category: 'fun', text: 'That jump was funny.' },
  { id: 'fun-008', category: 'fun', text: 'I like your style.' },
  { id: 'fun-009', category: 'fun', text: 'Best buddy server!' },
  { id: 'fun-010', category: 'fun', text: 'See you soon!' },
]

export const messageCategories: { id: MessageCategory; label: string }[] = [
  { id: 'greeting', label: 'Hello' },
  { id: 'game', label: 'Games' },
  { id: 'quest', label: 'Quests' },
  { id: 'build', label: 'Build' },
  { id: 'travel', label: 'Travel' },
  { id: 'team', label: 'Team' },
  { id: 'thanks', label: 'Thanks' },
  { id: 'status', label: 'Status' },
  { id: 'safety', label: 'Safe' },
  { id: 'fun', label: 'Fun' },
]

export function findPredefinedMessage(id: string) {
  return predefinedMessages.find((message) => message.id === id)
}

export function botReplyForPreset(presetId: string) {
  const [, numeric] = presetId.split('-')
  const index = Math.max(0, Number.parseInt(numeric ?? '1', 10) - 1)
  const safeReplies = predefinedMessages.filter((message) =>
    ['greeting', 'game', 'quest', 'team', 'thanks', 'fun'].includes(
      message.category,
    ),
  )
  return safeReplies[index % safeReplies.length]
}

