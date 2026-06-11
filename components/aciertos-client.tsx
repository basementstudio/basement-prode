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
import { FlagStripes } from '@/components/flag-stripes'

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
        <span>GRUPO {match.group}</span>
        <span style={{ color: 'var(--fg-4)' }}>·</span>
        <span>{dateLabel}</span>
        <span style={{ color: 'var(--fg-4)' }}>·</span>
        <span>{dayLabel} {timeLabel}</span>
      </div>

      <div className="aciertos-row-body">
        <div className="aciertos-team aciertos-team--home">
          <FlagStripes colors={match.home.flag} />
          <span>{match.home.name}</span>
        </div>

        <div className="aciertos-scores">
          <div className="aciertos-score-block">
            <span className="mono-label aciertos-score-label">Tu pronóstico</span>
            <span className="aciertos-score-value">{prediction.home}:{prediction.away}</span>
          </div>
          <div className="aciertos-score-block aciertos-score-block--result">
            <span className="mono-label aciertos-score-label">Resultado</span>
            <span className="aciertos-score-value">{result.home}:{result.away}</span>
          </div>
          <span className={`badge ${points === 6 ? 'exact' : points === 3 ? 'winner' : 'pts'}`}>
            {scoreLabel(points)}
          </span>
        </div>

        <div className="aciertos-team aciertos-team--away">
          <FlagStripes colors={match.away.flag} />
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
        TUS RESULTADOS
      </div>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
        Aciertos y puntos.
      </h1>
      <p style={{ color: 'var(--fg-3)', fontSize: '15px', maxWidth: '520px', lineHeight: '1.5', marginBottom: '32px' }}>
        Partidos ya jugados con resultado oficial. 3 pts por ganador o empate correcto, 6 si clavaste el marcador.
      </p>

      <div className="aciertos-stats">
        <div className="aciertos-stat aciertos-stat--primary">
          <span className="aciertos-stat-value">{totalPoints}</span>
          <span className="mono-label aciertos-stat-label">PUNTOS TOTALES</span>
        </div>
        <div className="aciertos-stat">
          <span className="aciertos-stat-value">{hits}</span>
          <span className="mono-label aciertos-stat-label">ACIERTOS</span>
        </div>
        <div className="aciertos-stat">
          <span className="aciertos-stat-value">{exactCount}</span>
          <span className="mono-label aciertos-stat-label">EXACTOS (+6)</span>
        </div>
        <div className="aciertos-stat">
          <span className="aciertos-stat-value">{winnerCount}</span>
          <span className="mono-label aciertos-stat-label">GANADOR (+3)</span>
        </div>
        <div className="aciertos-stat">
          <span className="aciertos-stat-value">{missCount}</span>
          <span className="mono-label aciertos-stat-label">FALLADOS</span>
        </div>
      </div>

      {playedCount === 0 ? (
        <div style={{ border: '1px solid var(--fg-4)', padding: '48px 24px', textAlign: 'center' }}>
          <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
            Todavía no hay partidos con resultado para puntuar.
          </span>
          <div style={{ marginTop: '16px' }}>
            <Link href="/pronosticos" className="btn">IR A PRONÓSTICOS</Link>
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
