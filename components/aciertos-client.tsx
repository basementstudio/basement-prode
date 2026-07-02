'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  formatKickoffDate,
  formatKickoffDay,
  formatKickoffTime,
  getUserTimezone,
} from '@/lib/wc2026/format-local'
import { scoreLabel } from '@/lib/scoring'
import type { ScoredPrediction } from '@/lib/actions'
import {
  formatMatchStageLabel,
  matchesStageFilter,
  matchesTeamSearch,
  PREDICTION_STAGE_FILTERS,
  type PredictionStageFilter,
} from '@/lib/my-predictions'
import { TeamFlag } from '@/components/team-flag'
import { cn } from '@/lib/utils'

interface Props {
  totalPoints: number
  exactCount: number
  winnerCount: number
  missCount: number
  playedCount: number
  totalPicks: number
  items: ScoredPrediction[]
}

function formatPickedAt(iso: string, userTz: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: userTz,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function ResultRow({ item, userTz }: { item: ScoredPrediction; userTz: string }) {
  const { match, prediction, result, points, outcome, pickedAt } = item
  const dateLabel = formatKickoffDate(match.kickoffUtc, userTz)
  const dayLabel = formatKickoffDay(match.kickoffUtc, userTz)
  const timeLabel = formatKickoffTime(match.kickoffUtc, userTz)
  const isPending = outcome === 'pending'

  return (
    <div
      className={cn('aciertos-row', !isPending && `aciertos-row--${outcome}`)}
      style={{ marginBottom: '-1px' }}
    >
      <div className="aciertos-row-meta mono-label">
        <span>{formatMatchStageLabel(match)}</span>
        <span style={{ color: 'var(--fg-4)' }}>·</span>
        <span>{dateLabel}</span>
        <span style={{ color: 'var(--fg-4)' }}>·</span>
        <span>{dayLabel} {timeLabel}</span>
        <span style={{ color: 'var(--fg-4)' }}>·</span>
        <span>PICK {formatPickedAt(pickedAt, userTz)}</span>
      </div>

      <div className="aciertos-row-body">
        <div className="aciertos-team aciertos-team--home">
          <TeamFlag code={match.home.code} fallbackColors={match.home.flag} />
          <span>{match.home.name}</span>
        </div>

        <div className="aciertos-scores">
          <div className="aciertos-score-block">
            <span className="mono-label aciertos-score-label">Your pick</span>
            <span className="aciertos-score-value">{prediction.home}:{prediction.away}</span>
          </div>
          {result ? (
            <div className="aciertos-score-block aciertos-score-block--result">
              <span className="mono-label aciertos-score-label">Result</span>
              <span className="aciertos-score-value">{result.home}:{result.away}</span>
            </div>
          ) : (
            <div className="aciertos-score-block aciertos-score-block--result">
              <span className="mono-label aciertos-score-label">Status</span>
              <span className="aciertos-score-value">PENDING</span>
            </div>
          )}
          {points != null ? (
            <span className={`badge ${points === 6 ? 'exact' : points === 3 ? 'winner' : 'pts'}`}>
              {scoreLabel(points)}
            </span>
          ) : (
            <span className="badge pts">AWAITING</span>
          )}
        </div>

        <div className="aciertos-team aciertos-team--away">
          <TeamFlag code={match.away.code} fallbackColors={match.away.flag} />
          <span>{match.away.name}</span>
        </div>
      </div>
    </div>
  )
}

export function AciertosClient({
  totalPoints,
  exactCount,
  winnerCount,
  missCount,
  playedCount,
  totalPicks,
  items,
}: Props) {
  const userTz = getUserTimezone()
  const hits = exactCount + winnerCount
  const [stageFilter, setStageFilter] = useState<PredictionStageFilter>('all')
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    const query = search.trim()
    return items.filter(
      item =>
        matchesStageFilter(item.match, stageFilter) &&
        matchesTeamSearch(item.match, query),
    )
  }, [items, search, stageFilter])

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' }}>
      <div className="eyebrow" style={{ marginBottom: '8px' }}>
        <span className="num">02</span>
        <span className="sep"> — </span>
        YOUR PICKS
      </div>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
        Hits and points.
      </h1>
      <p style={{ color: 'var(--fg-3)', fontSize: '15px', maxWidth: '520px', lineHeight: '1.5', marginBottom: '24px' }}>
        All your picks, newest first. Filter by stage or search teams (e.g. &quot;arg vs mex&quot;).
      </p>

      <div className="aciertos-toolbar">
        <label className="aciertos-search mono-label">
          <span className="sr-only">Search teams</span>
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search: arg vs mex, germany..."
            className="aciertos-search-input"
          />
        </label>
        <div className="aciertos-stage-filters" role="tablist" aria-label="Filter by stage">
          {PREDICTION_STAGE_FILTERS.map(option => {
            const active = stageFilter === option.id
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn('aciertos-stage-btn', active && 'is-active')}
                onClick={() => setStageFilter(option.id)}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="aciertos-stats">
        <div className="aciertos-stat aciertos-stat--primary">
          <span className="aciertos-stat-value">{totalPoints}</span>
          <span className="mono-label aciertos-stat-label">TOTAL POINTS</span>
        </div>
        <div className="aciertos-stat">
          <span className="aciertos-stat-value">{totalPicks}</span>
          <span className="mono-label aciertos-stat-label">PICKS</span>
        </div>
        <div className="aciertos-stat">
          <span className="aciertos-stat-value">{hits}</span>
          <span className="mono-label aciertos-stat-label">HITS</span>
        </div>
        <div className="aciertos-stat">
          <span className="aciertos-stat-value">{exactCount}</span>
          <span className="mono-label aciertos-stat-label">EXACT (+6)</span>
        </div>
        <div className="aciertos-stat">
          <span className="aciertos-stat-value">{winnerCount}</span>
          <span className="mono-label aciertos-stat-label">WINNER (+3)</span>
        </div>
        <div className="aciertos-stat">
          <span className="aciertos-stat-value">{missCount}</span>
          <span className="mono-label aciertos-stat-label">MISSED</span>
        </div>
      </div>

      {totalPicks === 0 ? (
        <div style={{ border: '1px solid var(--fg-4)', padding: '48px 24px', textAlign: 'center' }}>
          <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
            No picks yet.
          </span>
          <div style={{ marginTop: '16px' }}>
            <Link href="/pronosticos" className="btn">GO TO PICKS</Link>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ border: '1px solid var(--fg-4)', padding: '48px 24px', textAlign: 'center' }}>
          <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
            No picks match this filter.
          </span>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--fg-4)' }}>
          {filteredItems.map(item => (
            <ResultRow key={item.match.id} item={item} userTz={userTz} />
          ))}
        </div>
      )}
    </div>
  )
}
