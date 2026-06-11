'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMatchStatus,
  sortMatchesBySchedule,
  type Match,
} from '@/lib/wc2026-data'
import type { MatchDataSource } from '@/lib/wc2026/get-matches'
import { formatTimezoneLabel, getUserTimezone } from '@/lib/wc2026/format-local'
import { savePrediction } from '@/lib/actions'
import { MatchCard } from '@/components/match-card'

type StatusFilter = 'live' | 'finished'
type PredMap = Record<string, { home: number; away: number }>

interface Props {
  initialPredictions: PredMap
  matches: Match[]
  dataSource: MatchDataSource
  filter: StatusFilter
}

const PAGE_COPY: Record<StatusFilter, { num: string; title: string; description: string; empty: string }> = {
  live: {
    num: '03',
    title: 'Partidos en vivo.',
    description: 'Seguí los partidos que se están jugando ahora con marcador en tiempo real.',
    empty: 'No hay partidos en vivo ahora',
  },
  finished: {
    num: '04',
    title: 'Partidos concluidos.',
    description: 'Resultados finales y cómo te fue con tus pronósticos.',
    empty: 'Todavía no hay partidos concluidos',
  },
}

export function MatchesStatusClient({ initialPredictions, matches, dataSource, filter }: Props) {
  const router = useRouter()
  const [predictions, setPredictions] = useState<PredMap>(initialPredictions)
  const [now, setNow] = useState(() => new Date())
  const [userTz] = useState(getUserTimezone)
  const copy = PAGE_COPY[filter]

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const refresh = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(refresh)
  }, [router])

  const filteredMatches = useMemo(() => {
    const sorted = sortMatchesBySchedule(matches, now)
    return sorted.filter(m => getMatchStatus(m, now) === filter)
  }, [matches, now, filter])

  const handleSave = useCallback(async (matchId: string, home: number, away: number) => {
    await savePrediction(matchId, home, away, Date.now())
    setPredictions(prev => ({ ...prev, [matchId]: { home, away } }))
  }, [])

  const tzLabel = formatTimezoneLabel(userTz)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' }}>
      <div className="eyebrow" style={{ marginBottom: '8px' }}>
        <span className="num">{copy.num}</span>
        <span className="sep"> — </span>
        FASE DE GRUPOS
        <span style={{ color: 'var(--fg-4)', margin: '0 8px' }}>·</span>
        <span>{filteredMatches.length} PARTIDOS</span>
        <span style={{ color: 'var(--fg-4)', margin: '0 8px' }}>·</span>
        <span style={{ color: dataSource === 'worldcup26' ? 'var(--color-contrast)' : 'var(--fg-3)' }}>
          {dataSource === 'worldcup26' ? 'DATOS EN VIVO' : dataSource === 'api-football' ? 'API-FOOTBALL' : 'DATOS LOCALES'}
        </span>
      </div>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
        {copy.title}
      </h1>
      <p style={{ color: 'var(--fg-3)', fontSize: '15px', maxWidth: '520px', lineHeight: '1.5', marginBottom: '32px' }}>
        {copy.description} Horarios en {tzLabel}.
      </p>

      {filteredMatches.length === 0 ? (
        <div style={{ border: '1px solid var(--fg-4)', padding: '48px 24px', textAlign: 'center' }}>
          <span className="mono-label" style={{ color: 'var(--fg-3)' }}>{copy.empty}</span>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--fg-4)' }}>
          {filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictions[match.id]}
              onSave={handleSave}
              now={now}
              userTz={userTz}
            />
          ))}
        </div>
      )}
    </div>
  )
}
