import {
  getRankingBadge,
  getRankingBadgeEmoji,
  type LeaderboardBadgeKind,
} from '@/lib/leaderboard-badges'

interface Props {
  name: string
  rank: number
  playerCount: number
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

export function LeaderboardNameBadge({ name, rank, playerCount }: Props) {
  const badge = getRankingBadge(rank, playerCount)

  if (!badge) {
    return <span>{name}</span>
  }

  const emoji = getRankingBadgeEmoji(badge)

  return (
    <span className="leaderboard-name-with-badge">
      <span className="leaderboard-rank-badge" aria-hidden="true">
        {emoji}
      </span>
      <span className="leaderboard-name-text">{name}</span>
      <span className="sr-only">{`, ${badgeLabel(badge)}`}</span>
    </span>
  )
}
