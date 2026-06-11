'use client'

import { useState, useCallback, useRef, useTransition, useEffect } from 'react'
import { GROUPS, ALL_MATCHES, formatMatchDate, formatMatchDay, isMatchPlayed, type Match } from '@/lib/wc2026-data'
import { savePrediction } from '@/lib/actions'
import { FlagStripes } from './flag-stripes'

type Filter = 'por-jugar' | 'jugados' | 'todos'
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

// ---- Stepper ----
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

// ---- Match Card ----
function MatchCard({
  match,
  prediction,
  onSave,
  highlighted,
}: {
  match: Match
  prediction?: { home: number; away: number }
  onSave: (matchId: string, home: number, away: number) => void
  highlighted: boolean
}) {
  const played = isMatchPlayed(match)
  const [homeScore, setHomeScore] = useState(prediction?.home ?? 0)
  const [awayScore, setAwayScore] = useState(prediction?.away ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!prediction)
  const bothSet = homeScore !== undefined && awayScore !== undefined

  const hasPred = !!prediction
  const points = played && hasPred
    ? calcPoints({ home: prediction!.home, away: prediction!.away }, match.result!)
    : null

  const statusLabel = played
    ? 'JUGADO'
    : saved
    ? 'GUARDADO ✓'
    : 'POR JUGAR'

  const dateLabel = formatMatchDate(match.date)
  const dayLabel = formatMatchDay(match.date)

  async function handleSave(h: number, a: number) {
    setSaving(true)
    try {
      await onSave(match.id, h, a)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  function handleHomeChange(v: number) {
    setHomeScore(v)
    setSaved(false)
  }
  function handleAwayChange(v: number) {
    setAwayScore(v)
    setSaved(false)
  }

  // Auto-save when both are touched
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!played && !saving) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
      if (homeScore !== (prediction?.home ?? 0) || awayScore !== (prediction?.away ?? 0)) {
        autoSaveRef.current = setTimeout(() => {
          handleSave(homeScore, awayScore)
        }, 600)
      }
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [homeScore, awayScore])

  return (
    <div
      id={`match-${match.id}`}
      className={`match-card scroll-target${highlighted ? ' highlighted' : ''}${played ? ' played' : ''}`}
      style={{ marginBottom: '-1px' }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--fg-4)',
        background: played ? 'rgba(235,235,235,0.02)' : 'transparent',
      }}>
        <div className="mono-label" style={{ color: 'var(--fg-3)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span>GRUPO {match.group}</span>
          <span style={{ color: 'var(--fg-4)' }}>·</span>
          <span>FECHA {dateLabel}</span>
          <span style={{ color: 'var(--fg-4)' }}>·</span>
          <span>{dayLabel}</span>
          <span style={{ color: 'var(--fg-4)' }}>·</span>
          <span>{match.time}</span>
        </div>
        <div
          className="mono-label badge"
          style={{
            color: played ? 'var(--fg-3)' :
                   saved ? 'var(--color-contrast)' :
                   'var(--fg-3)',
            borderColor: played ? 'var(--fg-4)' :
                        saved ? 'var(--color-contrast)' :
                        'var(--fg-4)',
            background: saved && !played ? 'rgba(255,77,0,0.05)' : 'transparent',
          }}
        >
          {statusLabel}
        </div>
      </div>

      {/* Match body */}
      <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0', alignItems: 'center' }}>
        {/* Home team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--fg-1)' }}>{match.home.name}</div>
            <div className="mono-label" style={{ color: 'var(--fg-3)' }}>{match.home.code}</div>
          </div>
          <FlagStripes colors={match.home.flag} />
        </div>

        {/* Score controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', padding: '0 20px' }}>
          {played ? (
            /* Played: show real result large, prediction below */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--fg-1)' }}>
                  {match.result!.home}
                </span>
                <span style={{ fontSize: '24px', color: 'var(--fg-4)' }}>:</span>
                <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--fg-1)' }}>
                  {match.result!.away}
                </span>
              </div>
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
              {!hasPred && (
                <span className="mono-label" style={{ color: 'var(--fg-4)' }}>Sin pronóstico</span>
              )}
            </div>
          ) : (
            /* Not played: steppers */
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Stepper value={homeScore} onChange={handleHomeChange} disabled={saving} />
              <span style={{ fontSize: '28px', color: 'var(--fg-4)', fontWeight: 300, lineHeight: 1 }}>:</span>
              <Stepper value={awayScore} onChange={handleAwayChange} disabled={saving} />
            </div>
          )}
        </div>

        {/* Away team */}
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

// ---- Group Header ----
function GroupHeader({ letter, count }: { letter: string; count: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderBottom: '1px solid var(--fg-4)',
      borderTop: '1px solid var(--fg-4)',
      marginTop: '32px',
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        border: '1px solid var(--fg-1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: '13px',
        color: 'var(--fg-1)',
        flexShrink: 0,
      }}>
        {letter}
      </div>
      <span className="mono-label" style={{ color: 'var(--fg-3)' }}>GRUPO {letter}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--fg-4)' }} />
      <span className="mono-label" style={{ color: 'var(--fg-3)' }}>{count} PARTIDOS</span>
    </div>
  )
}

// ---- Main component ----
export function PronosticosClient({ initialPredictions }: Props) {
  const [predictions, setPredictions] = useState<PredMap>(initialPredictions)
  const [filter, setFilter] = useState<Filter>('todos')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const played = ALL_MATCHES.filter(m => isMatchPlayed(m))
  const pending = ALL_MATCHES.filter(m => !isMatchPlayed(m))
  const savedCount = pending.filter(m => predictions[m.id]).length

  const handleSave = useCallback(async (matchId: string, home: number, away: number) => {
    startTransition(async () => {
      await savePrediction(matchId, home, away)
      setPredictions(prev => ({ ...prev, [matchId]: { home, away } }))

      // Find next unpredicted non-played match and scroll to it
      const nextMatch = pending.find(m => m.id !== matchId && !predictions[m.id] && m.id !== matchId)
      if (nextMatch) {
        setHighlightedId(nextMatch.id)
        setTimeout(() => {
          const el = document.getElementById(`match-${nextMatch.id}`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setTimeout(() => setHighlightedId(null), 1200)
        }, 100)
      }
    })
  }, [pending, predictions])

  const progress = pending.length > 0 ? (savedCount / pending.length) * 100 : 0

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Page header */}
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
            Poné el marcador de cada partido. Al completar uno, saltás solo al siguiente. 3 puntos si acertás el ganador, ×2 si clavás el resultado exacto.
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '24px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
            {savedCount}
            <span style={{ fontSize: '16px', color: 'var(--fg-3)', fontWeight: 400 }}> / {pending.length} por jugar</span>
          </div>
          <div className="mono-label" style={{ color: 'var(--fg-3)', marginTop: '4px' }}>
            MD1 · {played.length}/{ALL_MATCHES.length} jugados
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '4px', marginTop: '16px' }}>
        <span className="mono-label" style={{ color: 'var(--fg-3)' }}>CARGADOS</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div className="progress-bar" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="mono-label" style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
          {savedCount} DE {pending.length}
        </span>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '32px' }}>
        {(['por-jugar', 'jugados', 'todos'] as Filter[]).map(f => {
          const count = f === 'por-jugar' ? pending.length : f === 'jugados' ? played.length : ALL_MATCHES.length
          const label = f === 'por-jugar' ? 'Por jugar' : f === 'jugados' ? 'Jugados' : 'Todos'
          return (
            <button
              key={f}
              className={`chip${filter === f ? ' active' : ''}`}
              style={{ marginRight: '-1px' }}
              onClick={() => setFilter(f)}
            >
              {label} <span className="chip-count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Groups */}
      {GROUPS.map(group => {
        const filteredMatches = group.matches.filter(m => {
          if (filter === 'por-jugar') return !isMatchPlayed(m)
          if (filter === 'jugados') return isMatchPlayed(m)
          return true
        })
        if (filteredMatches.length === 0) return null

        return (
          <div key={group.letter}>
            <GroupHeader letter={group.letter} count={filteredMatches.length} />
            <div style={{ border: '1px solid var(--fg-4)', borderTop: 'none' }}>
              {filteredMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  onSave={handleSave}
                  highlighted={highlightedId === match.id}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
