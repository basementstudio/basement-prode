import {
  getRankingBadge,
  getRankingBadgeEmoji,
  LEADERBOARD_BADGE_BURNED,
  type LeaderboardBadgeKind,
} from '@/lib/leaderboard-badges'
import { cn } from '@/lib/utils'

interface Props {
  name: string
  rank: number
  playerCount: number
  isBurned?: boolean
  showRankingBadges?: boolean
}

function badgeLabel(badge: LeaderboardBadgeKind): string {
  switch (badge) {
    case 'first':
      return 'Leaderboard first place'
    case 'last':
      return 'Leaderboard last place'
    default: {
      const _exhaustive: never = badge
      return _exhaustive
    }
  }
}

export function LeaderboardNameBadge({
  name,
  rank,
  playerCount,
  isBurned = false,
  showRankingBadges = true,
}: Props) {
  const rankingBadge =
    showRankingBadges && !isBurned
      ? getRankingBadge(rank, playerCount)
      : showRankingBadges && isBurned && rank === 1
        ? 'first'
        : null

  if (!rankingBadge && !isBurned) {
    return <span>{name}</span>
  }

  return (
    <span
      className={cn(
        'leaderboard-name-with-badge',
        isBurned && 'leaderboard-name-with-badge--burned',
      )}
    >
      {isBurned && (
        <span className="leaderboard-rank-badge" aria-hidden="true">
          {LEADERBOARD_BADGE_BURNED}
        </span>
      )}
      {rankingBadge && (
        <span className="leaderboard-rank-badge" aria-hidden="true">
          {getRankingBadgeEmoji(rankingBadge)}
        </span>
      )}
      <span
        className={cn(
          'leaderboard-name-text',
          isBurned && 'leaderboard-name-text--burned',
        )}
      >
        {name}
      </span>
      {rankingBadge && (
        <span className="sr-only">{`, ${badgeLabel(rankingBadge)}`}</span>
      )}
      {isBurned && <span className="sr-only">, burned account</span>}
    </span>
  )
}
