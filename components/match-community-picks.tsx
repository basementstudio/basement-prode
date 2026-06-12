import { UserAvatar } from '@/components/user-avatar'
import type { RevealedMatchPrediction } from '@/lib/match-predictions'
import { scoreLabel } from '@/lib/scoring'
import { cn } from '@/lib/utils'

interface Props {
  picks: RevealedMatchPrediction[]
  locked: boolean
  revealed: boolean
}

export function MatchCommunityPicks({ picks, locked, revealed }: Props) {
  if (!locked) {
    return null
  }

  if (!revealed || picks.length === 0) {
    return null
  }

  return (
    <div className="match-community-picks">
      <div className="match-community-picks-header mono-label">
        — PICKS ({picks.length})
      </div>
      <ul className="match-community-picks-list">
        {picks.map(pick => (
          <li
            key={pick.userId}
            className={cn('match-community-pick', pick.isMe && 'is-me')}
          >
            <UserAvatar name={pick.name} imageUrl={pick.avatarUrl} size="sm" />
            <div className="match-community-pick-body">
              <span className="match-community-pick-name">{pick.name}</span>
              {pick.isMe && (
                <span className="mono-label match-community-pick-you">YOU</span>
              )}
            </div>
            <span className="mono-label match-community-pick-score">
              {pick.homeScore}:{pick.awayScore}
            </span>
            {pick.points != null && (
              <span className={`badge ${pick.points === 6 ? 'exact' : pick.points === 3 ? 'winner' : 'pts'}`}>
                {scoreLabel(pick.points)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
