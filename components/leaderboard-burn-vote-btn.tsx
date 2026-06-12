'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleAccountBurnVote } from '@/lib/actions'
import { formatBurnVoteProgress } from '@/lib/account-burn'
import { cn } from '@/lib/utils'

interface Props {
  targetUserId: string
  initialVoteCount: number
  initialViewerHasVoted: boolean
  isBurned: boolean
}

export function LeaderboardBurnVoteBtn({
  targetUserId,
  initialVoteCount,
  initialViewerHasVoted,
  isBurned,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [viewerHasVoted, setViewerHasVoted] = useState(initialViewerHasVoted)
  const [burned, setBurned] = useState(isBurned)

  if (burned) return null

  function handleToggle() {
    startTransition(async () => {
      const previous = { voteCount, viewerHasVoted, burned }
      const nextViewerHasVoted = !viewerHasVoted
      setViewerHasVoted(nextViewerHasVoted)
      setVoteCount(current => current + (nextViewerHasVoted ? 1 : -1))

      try {
        const result = await toggleAccountBurnVote(targetUserId)
        setVoteCount(result.burnVoteCount)
        setViewerHasVoted(result.viewerHasBurnVoted)
        setBurned(result.isBurned)
        router.refresh()
      } catch {
        setVoteCount(previous.voteCount)
        setViewerHasVoted(previous.viewerHasVoted)
        setBurned(previous.burned)
      }
    })
  }

  return (
    <button
      type="button"
      className={cn('leaderboard-burn-vote-btn', viewerHasVoted && 'is-active')}
      aria-pressed={viewerHasVoted}
      aria-label="Vote to burn account"
      disabled={isPending}
      onClick={handleToggle}
    >
      <span aria-hidden="true">🥄</span>
      <span className="mono-label">{formatBurnVoteProgress(voteCount)}</span>
    </button>
  )
}
