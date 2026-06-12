/** Swap these for custom workspace emojis without touching UI components. */
export const LEADERBOARD_BADGE_FIRST = '🧙'
export const LEADERBOARD_BADGE_LAST = '🥄'
export const LEADERBOARD_BADGE_BURNED = '🥄'

export type LeaderboardBadgeKind = 'first' | 'last'

export function getRankingBadge(
  rank: number,
  playerCount: number,
): LeaderboardBadgeKind | null {
  if (playerCount === 0) return null
  if (rank === 1) return 'first'
  if (playerCount > 1 && rank === playerCount) return 'last'
  return null
}

export function getRankingBadgeEmoji(badge: LeaderboardBadgeKind): string {
  switch (badge) {
    case 'first':
      return LEADERBOARD_BADGE_FIRST
    case 'last':
      return LEADERBOARD_BADGE_LAST
    default: {
      const _exhaustive: never = badge
      return _exhaustive
    }
  }
}
