'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  getMatchDisplayScore,
} from '@/lib/wc2026-data'
import {
  formatKickoffDate,
  formatKickoffDay,
  formatKickoffTime,
} from '@/lib/wc2026/format-local'
import { calcPoints, scoreLabel } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import { TeamFlag } from '@/components/team-flag'
import { MatchCommunityPicks } from '@/components/match-community-picks'
import type { MatchCardProps } from '@/components/match-card'

type Props = Omit<MatchCardProps, 'collapsible'> & {
  defaultExpanded?: boolean
}

export function CollapsibleFinishedMatch({ defaultExpanded = false, ...props }: Props) {
  const { match, prediction, userTz, communityPicks = [] } = props
  const [expanded, setExpanded] = useState(defaultExpanded)
  const finalScore = getMatchDisplayScore(match, 'finished')
  const officialResult = match.result
  const hasPred = !!prediction
  const points = hasPred && officialResult
    ? calcPoints({ home: prediction.home, away: prediction.away }, officialResult)
    : null

  const dateLabel = formatKickoffDate(match.kickoffUtc, userTz)
  const dayLabel = formatKickoffDay(match.kickoffUtc, userTz)
  const timeLabel = formatKickoffTime(match.kickoffUtc, userTz)

  return (
    <div className={cn('finished-match-accordion', expanded && 'finished-match-accordion--expanded')}>
      <button
        type="button"
        className="finished-match-summary"
        onClick={() => setExpanded(value => !value)}
        aria-expanded={expanded}
      >
        <div className="finished-match-summary-teams">
          <div className="finished-match-summary-team">
            <TeamFlag code={match.home.code} fallbackColors={match.home.flag} />
            <span className="finished-match-summary-name">{match.home.code}</span>
          </div>
          <div className="finished-match-summary-score">
            <span>{finalScore?.home ?? '—'}</span>
            <span className="finished-match-summary-sep">:</span>
            <span>{finalScore?.away ?? '—'}</span>
          </div>
          <div className="finished-match-summary-team finished-match-summary-team--away">
            <TeamFlag code={match.away.code} fallbackColors={match.away.flag} />
            <span className="finished-match-summary-name">{match.away.code}</span>
          </div>
        </div>

        <div className="finished-match-summary-meta">
          <span className="mono-label finished-match-summary-group">GROUP {match.group}</span>
          {hasPred ? (
            <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
              Your pick: {prediction.home}:{prediction.away}
            </span>
          ) : (
            <span className="mono-label" style={{ color: 'var(--fg-4)' }}>No pick</span>
          )}
          {points !== null && (
            <span className={`badge ${points === 6 ? 'exact' : points === 3 ? 'winner' : 'pts'}`}>
              {scoreLabel(points)}
            </span>
          )}
          <ChevronDown className="finished-match-summary-chevron" aria-hidden />
        </div>
      </button>

      {expanded && (
        <div className="finished-match-details">
          <div className="finished-match-details-meta mono-label">
            <span>{dateLabel}</span>
            <span className="finished-match-meta-sep">·</span>
            <span>{dayLabel}</span>
            <span className="finished-match-meta-sep">·</span>
            <span>{timeLabel}</span>
            <span className="finished-match-meta-sep finished-match-meta-venue">·</span>
            <span className="finished-match-meta-venue">{match.venue}</span>
          </div>
          <MatchCommunityPicks
            picks={communityPicks}
            locked
            revealed={communityPicks.length > 0}
          />
        </div>
      )}
    </div>
  )
}
