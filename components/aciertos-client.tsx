'use client'

import Link from 'next/link'
import {
  formatKickoffDate,
  formatKickoffDay,
  formatKickoffTime,
  getUserTimezone,
} from '@/lib/wc2026/format-local'
import { scoreLabel } from '@/lib/scoring'
import type { ScoredPrediction } from '@/lib/actions'
import { TeamFlag } from '@/components/team-flag'

interface Props {
  totalPoints: number
  exactCount: number
  winnerCount: number
  missCount: number
  playedCount: number
  items: ScoredPrediction[]
}

function ResultRow({ item, userTz }: { item: ScoredPrediction; userTz: string }) {
  const { match, prediction, result, points, outcome } = item
  const dateLabel = formatKickoffDate(match.kickoffUtc, userTz)
  const dayLabel = formatKickoffDay(match.kickoffUtc, userTz)
  const timeLabel = formatKickoffTime(match.kickoffUtc, userTz)

  return (
    <div
      className={`aciertos-row aciertos-row--${outcome}`}
      style={{ marginBottom: '-1px' }}
    >
      <div className="aciertos-row-meta mono-label">
        <span>GROUP {match.group}</span>
        <span style={{ color: 'var(--fg-4)' }}>·</span>
        <span>{dateLabel}</span>
        <span style={{ color: 'var(--fg-4)' }}>·</span>
        <span>{dayLabel} {timeLabel}</span>
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
          <div className="aciertos-score-block aciertos-score-block--result">
            <span className="mono-label aciertos-score-label">Result</span>
            <span className="aciertos-score-value">{result.home}:{result.away}</span>
          </div>
          <span className={`badge ${points === 6 ? 'exact' : points === 3 ? 'winner' : 'pts'}`}>
            {scoreLabel(points)}
          </span>
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
  items,
}: Props) {
  const userTz = getUserTimezone()
  const hits = exactCount + winnerCount

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' }}>
      <div className="eyebrow" style={{ marginBottom: '8px' }}>
        <span className="num">02</span>
        <span className="sep"> — </span>
        YOUR RESULTS
      </div>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
        Hits and points.
      </h1>
      <p style={{ color: 'var(--fg-3)', fontSize: '15px', maxWidth: '520px', lineHeight: '1.5', marginBottom: '32px' }}>
        Played matches with official results. 6 pts for exact score (including 0-0); 3 for correct winner or draw.
      </p>

      <div className="aciertos-stats">
        <div className="aciertos-stat aciertos-stat--primary">
          <span className="aciertos-stat-value">{totalPoints}</span>
          <span className="mono-label aciertos-stat-label">TOTAL POINTS</span>
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

      {playedCount === 0 ? (
        <div style={{ border: '1px solid var(--fg-4)', padding: '48px 24px', textAlign: 'center' }}>
          <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
            No scored matches yet.
          </span>
          <div style={{ marginTop: '16px' }}>
            <Link href="/pronosticos" className="btn">GO TO PICKS</Link>
          </div>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--fg-4)' }}>
          {items.map(item => (
            <ResultRow key={item.match.id} item={item} userTz={userTz} />
          ))}
        </div>
      )}
    </div>
  )
}
