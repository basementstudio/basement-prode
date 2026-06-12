'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserAvatar } from '@/components/user-avatar'
import { togglePredictionDownvote } from '@/lib/actions'
import type { RevealedMatchPrediction } from '@/lib/match-predictions'
import { scoreLabel } from '@/lib/scoring'
import { cn } from '@/lib/utils'

interface Props {
  picks: RevealedMatchPrediction[]
  locked: boolean
  revealed: boolean
}

export function MatchCommunityPicks({ picks, locked, revealed }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localPicks, setLocalPicks] = useState(picks)
  const [voteError, setVoteError] = useState<string | null>(null)

  useEffect(() => {
    setLocalPicks(picks)
  }, [picks])

  if (!locked || !revealed || localPicks.length === 0) {
    return null
  }

  function handleToggleDownvote(pick: RevealedMatchPrediction) {
    setVoteError(null)
    startTransition(async () => {
      const previous = localPicks
      setLocalPicks(current =>
        current.map(row => {
          if (row.predictionId !== pick.predictionId) return row
          const viewerHasDownvoted = !row.viewerHasDownvoted
          return {
            ...row,
            viewerHasDownvoted,
            downvoteCount: row.downvoteCount + (viewerHasDownvoted ? 1 : -1),
          }
        }),
      )

      try {
        await togglePredictionDownvote(pick.predictionId)
        router.refresh()
      } catch (err) {
        setLocalPicks(previous)
        setVoteError(err instanceof Error ? err.message : 'Could not update downvote')
      }
    })
  }

  return (
    <div className="match-community-picks">
      <div className="match-community-picks-header mono-label">
        — PICKS ({localPicks.length})
      </div>
      <ul className="match-community-picks-list">
        {localPicks.map(pick => (
          <li
            key={pick.predictionId}
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
            <button
              type="button"
              className={cn(
                'match-downvote-btn',
                pick.viewerHasDownvoted && 'is-active',
              )}
              aria-pressed={pick.viewerHasDownvoted}
              aria-label={`Downvote ${pick.name}'s pick`}
              disabled={isPending}
              onClick={() => handleToggleDownvote(pick)}
            >
              <span aria-hidden="true">👎</span>
              <span className="mono-label">{pick.downvoteCount}</span>
            </button>
          </li>
        ))}
      </ul>
      {voteError && (
        <p className="mono-label match-community-picks-error">{voteError}</p>
      )}
    </div>
  )
}
