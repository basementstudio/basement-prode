'use client'

import { useState, useCallback, useRef, useTransition, useEffect, useMemo } from 'react'
import {
  ALL_MATCHES,
  formatMatchDate,
  formatMatchDay,
  getMatchStatus,
  isMatchLocked,
  isMatchPlayed,
  sortMatchesBySchedule,
  type Match,
  type MatchStatus,
} from '@/lib/wc2026-data'
import { savePrediction } from '@/lib/actions'
import { FlagStripes } from './flag-stripes'

type Filter = 'por-jugar' | 'en-vivo' | 'concluidos' | 'todos'
type PredMap = Record<string, { home: number; away: number }>

interface Props {
  initialPredictions: PredMap
}

function calcPoints(pred: { home: number; away: number }, result: { home: number; away: number }) {
  if (pred.home === result.home && pred.away === result.away) return 6
  const predW = pred.home > pred.away ? 'h' : pred.home < pred.away ? 'a' : 'd'
  const realW = result.home > result.away ? 'h' : result.home < result.away ? 'a' : 'd'
  if (predW === realW) return 3
  return 0
}

function Stepper({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <button
        className="stepper-btn"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label="Aumentar"
        tabIndex={0}
      >
        +
      </button>
      <span className="stepper-value">{value}</span>
      <button
        className="stepper-btn"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value === 0}
        aria-label="Disminuir"
        tabIndex={0}
      >
        −
      </button>
    </div>
  )
}

function MatchStatusBadge({
  status,
  saved,
}: {
  status: MatchStatus
  saved: boolean
}) {
  if (status === 'live') {
    return (
      <span className="mono-label badge badge-live">
        <span className="badge-live-dot" aria-hidden />
        EN VIVO
      </span>
    )
  }

  if (status === 'finished') {
    return <span className="mono-label badge badge-finished">CONCLUIDO</span>
  }

  if (saved) {
    return <span className="mono-label badge badge-saved">GUARDADO ✓</span>
  }

  return <span className="mono-label badge badge-upcoming">POR JUGAR</span>
}

function MatchCard({
  match,
  prediction,
  onSave,
  highlighted,
  now,
}: {
  match: Match
  prediction?: { home: number; away: number }
  onSave: (matchId: string, home: number, away: number) => void
  highlighted: boolean
  now: Date
}) {
  const status = getMatchStatus(match, now)
  const locked = isMatchLocked(match, now)
  const played = isMatchPlayed(match, now)
  const [homeScore, setHomeScore] = useState(prediction?.home ?? 0)
  const [awayScore, setAwayScore] = useState(prediction?.away ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!prediction)

  const hasPred = !!prediction
  const points = played && hasPred && match.result
    ? calcPoints({ home: prediction!.home, away: prediction!.away }, match.result)
    : null

  const dateLabel = formatMatchDate(match.date)
  const dayLabel = formatMatchDay(match.date)

  async function handleSave(h: number, a: number) {
    if (locked) return
    setSaving(true)
    try {
      await onSave(match.id, h, a)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  function handleHomeChange(v: number) {
    if (locked) return
    setHomeScore(v)
    setSaved(false)
  }

  function handleAwayChange(v: number) {
    if (locked) return
    setAwayScore(v)
    setSaved(false)
  }

  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!locked && !saving) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
      if (homeScore !== (prediction?.home ?? 0) || awayScore !== (prediction?.away ?? 0)) {
        autoSaveRef.current = setTimeout(() => {
          handleSave(homeScore, awayScore)
        }, 600)
      }
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [homeScore, awayScore, locked, saving])

  const cardClass = [
    'match-card scroll-target',
    highlighted ? 'highlighted' : '',
    played ? 'played' : '',
    status === 'live' ? 'live' : '',
    locked && !played ? 'locked' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      id={`match-${match.id}`}
      className={cardClass}
      style={{ marginBottom: '-1px' }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--fg-4)',
        background: played ? 'rgba(235,235,235,0.02)' : status === 'live' ? 'rgba(255,77,0,0.03)' : 'transparent',
      }}>
        <div className="mono-label" style={{ color: 'var(--fg-3)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>GRUPO {match.group}</span>
          <span style={{ color: 'var(--fg-4)' }}>·</span>
          <span>{dateLabel}</span>
          <span style={{ color: 'var(--fg-4)' }}>·</span>
          <span>{dayLabel}</span>
          <span style={{ color: 'var(--fg-4)' }}>·</span>
          <span>{match.time}</span>
          <span style={{ color: 'var(--fg-4)' }}>·</span>
          <span style={{ color: 'var(--fg-4)' }}>{match.venue}</span>
        </div>
        <MatchStatusBadge status={status} saved={saved && !locked} />
      </div>

      <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--fg-1)' }}>{match.home.name}</div>
            <div className="mono-label" style={{ color: 'var(--fg-3)' }}>{match.home.code}</div>
          </div>
          <FlagStripes colors={match.home.flag} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0', padding: '0 20px' }}>
          {locked ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              {match.result ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--fg-1)' }}>
                    {match.result.home}
                  </span>
                  <span style={{ fontSize: '24px', color: 'var(--fg-4)' }}>:</span>
                  <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--fg-1)' }}>
                    {match.result.away}
                  </span>
                </div>
              ) : status === 'live' ? (
                <span className="mono-label" style={{ color: 'var(--color-contrast)' }}>Partido en curso</span>
              ) : (
                <span className="mono-label" style={{ color: 'var(--fg-3)' }}>Pronósticos cerrados</span>
              )}
              {hasPred && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
                    Tu pronóstico: {prediction!.home}:{prediction!.away}
                  </span>
                  {points !== null && (
                    <span
                      className={`badge ${points === 6 ? 'exact' : points === 3 ? 'winner' : 'pts'}`}
                      style={{ marginLeft: '4px' }}
                    >
                      {points === 0 ? '0 pts' : points === 3 ? '+3' : '+6 exacto'}
                    </span>
                  )}
                </div>
              )}
              {!hasPred && played && (
                <span className="mono-label" style={{ color: 'var(--fg-4)' }}>Sin pronóstico</span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Stepper value={homeScore} onChange={handleHomeChange} disabled={saving} />
              <span style={{ fontSize: '28px', color: 'var(--fg-4)', fontWeight: 300, lineHeight: 1 }}>:</span>
              <Stepper value={awayScore} onChange={handleAwayChange} disabled={saving} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FlagStripes colors={match.away.flag} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--fg-1)' }}>{match.away.name}</div>
            <div className="mono-label" style={{ color: 'var(--fg-3)' }}>{match.away.code}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DateHeader({ date }: { date: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderBottom: '1px solid var(--fg-4)',
      borderTop: '1px solid var(--fg-4)',
      marginTop: '32px',
      background: 'rgba(235,235,235,0.02)',
    }}>
      <span className="mono-label" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>
        {formatMatchDay(date)}
      </span>
      <span style={{ color: 'var(--fg-4)' }}>·</span>
      <span className="mono-label" style={{ color: 'var(--fg-3)' }}>{formatMatchDate(date)}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--fg-4)' }} />
    </div>
  )
}

export function PronosticosClient({ initialPredictions }: Props) {
  const [predictions, setPredictions] = useState<PredMap>(initialPredictions)
  const [filter, setFilter] = useState<Filter>('por-jugar')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(interval)
  }, [])

  const sortedMatches = useMemo(
    () => sortMatchesBySchedule(ALL_MATCHES, now),
    [now],
  )

  const upcoming = useMemo(
    () => sortedMatches.filter(m => getMatchStatus(m, now) === 'upcoming'),
    [sortedMatches, now],
  )
  const live = useMemo(
    () => sortedMatches.filter(m => getMatchStatus(m, now) === 'live'),
    [sortedMatches, now],
  )
  const finished = useMemo(
    () => sortedMatches.filter(m => getMatchStatus(m, now) === 'finished'),
    [sortedMatches, now],
  )

  const savedCount = upcoming.filter(m => predictions[m.id]).length

  const filteredMatches = useMemo(() => {
    switch (filter) {
      case 'por-jugar':
        return upcoming
      case 'en-vivo':
        return live
      case 'concluidos':
        return finished
      case 'todos':
        return sortedMatches
      default: {
        const _exhaustive: never = filter
        return _exhaustive
      }
    }
  }, [filter, upcoming, live, finished, sortedMatches])

  const matchesByDate = useMemo(() => {
    const groups: { date: string; matches: Match[] }[] = []
    for (const match of filteredMatches) {
      const last = groups[groups.length - 1]
      if (last?.date === match.date) {
        last.matches.push(match)
      } else {
        groups.push({ date: match.date, matches: [match] })
      }
    }
    return groups
  }, [filteredMatches])

  const handleSave = useCallback(async (matchId: string, home: number, away: number) => {
    startTransition(async () => {
      await savePrediction(matchId, home, away)
      setPredictions(prev => ({ ...prev, [matchId]: { home, away } }))

      const nextMatch = upcoming.find(m => m.id !== matchId && !predictions[m.id])
      if (nextMatch) {
        setHighlightedId(nextMatch.id)
        setTimeout(() => {
          const el = document.getElementById(`match-${nextMatch.id}`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setTimeout(() => setHighlightedId(null), 1200)
        }, 100)
      }
    })
  }, [upcoming, predictions])

  const progress = upcoming.length > 0 ? (savedCount / upcoming.length) * 100 : 100

  const filterOptions: { key: Filter; label: string; count: number }[] = [
    { key: 'por-jugar', label: 'Por jugar', count: upcoming.length },
    { key: 'en-vivo', label: 'En vivo', count: live.length },
    { key: 'concluidos', label: 'Concluidos', count: finished.length },
    { key: 'todos', label: 'Todos', count: ALL_MATCHES.length },
  ]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>
            <span className="num">01</span>
            <span className="sep"> — </span>
            FASE DE GRUPOS
            <span style={{ color: 'var(--fg-4)', margin: '0 8px' }}>·</span>
            <span>{ALL_MATCHES.length} PARTIDOS</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Cargá tus pronósticos.
          </h1>
          <p style={{ color: 'var(--fg-3)', fontSize: '15px', maxWidth: '520px', lineHeight: '1.5' }}>
            Poné el marcador de cada partido antes del pitido inicial. Al completar uno, saltás solo al siguiente. 3 puntos si acertás el ganador, ×2 si clavás el resultado exacto.
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '24px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
            {savedCount}
            <span style={{ fontSize: '16px', color: 'var(--fg-3)', fontWeight: 400 }}> / {upcoming.length} por jugar</span>
          </div>
          <div className="mono-label" style={{ color: 'var(--fg-3)', marginTop: '4px' }}>
            {live.length > 0 ? `${live.length} en vivo · ` : ''}{finished.length}/{ALL_MATCHES.length} concluidos
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '4px', marginTop: '16px' }}>
        <span className="mono-label" style={{ color: 'var(--fg-3)' }}>CARGADOS</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div className="progress-bar" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="mono-label" style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
          {savedCount} DE {upcoming.length}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0', marginBottom: '32px', flexWrap: 'wrap' }}>
        {filterOptions.map(({ key, label, count }) => (
          <button
            key={key}
            className={`chip${filter === key ? ' active' : ''}`}
            style={{ marginRight: '-1px', marginBottom: '-1px' }}
            onClick={() => setFilter(key)}
          >
            {label} <span className="chip-count">{count}</span>
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div style={{
          border: '1px solid var(--fg-4)',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
            {filter === 'en-vivo' ? 'No hay partidos en vivo ahora' : 'No hay partidos en esta categoría'}
          </span>
        </div>
      ) : (
        matchesByDate.map(({ date, matches }) => (
          <div key={date}>
            <DateHeader date={date} />
            <div style={{ border: '1px solid var(--fg-4)', borderTop: 'none' }}>
              {matches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  onSave={handleSave}
                  highlighted={highlightedId === match.id}
                  now={now}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
