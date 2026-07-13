import { botProfiles } from '../data/botProfiles'
import type { BotMemory, LeaderboardRow } from '../game/types'

export function createLocalLeaderboard(
  playerCoins: number,
  bestObbyTime: number | undefined,
  memories: Record<string, BotMemory>,
  playerName = 'You',
): LeaderboardRow[] {
  const botRows = botProfiles.map((bot, index) => {
    const memory = memories[bot.id]
    const friendshipBonus = (memory?.friendship ?? 0) * 12
    const activityBonus = bot.favoriteActivity === 'obby' ? 35 : bot.favoriteActivity === 'shop' ? 22 : 16
    return {
      username: bot.username,
      score: 75 + index * 9 + activityBonus + friendshipBonus,
      label: bot.favoriteActivity,
    }
  })
  const playerScore = playerCoins + (bestObbyTime ? Math.max(0, 200 - bestObbyTime) : 0)
  return [
    { username: playerName, score: playerScore, label: bestObbyTime ? `${bestObbyTime}s obby` : 'exploring', isPlayer: true },
    ...botRows,
  ].sort((a, b) => b.score - a.score)
}
