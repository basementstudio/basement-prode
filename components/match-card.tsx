'use client'

import { useState, useEffect, useRef } from 'react'
import {
  getMatchDisplayScore,
  getMatchStatus,
  isMatchLocked,
  type Match,
  type MatchStatus,
} from '@/lib/wc2026-data'
import {
  formatKickoffDate,
  formatKickoffDay,
  formatKickoffTime,
} from '@/lib/wc2026/format-local'
import { calcPoints, scoreLabel } from '@/lib/scoring'
import { ScoreInput } from '@/components/score-input'
import { FlagStripes } from '@/components/flag-stripes'

const INPUT_PAUSE_MS = 2000

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

export interface MatchCardProps {
  match: Match
  prediction?: { home: number; away: number }
  onSave: (matchId: string, home: number, away: number) => Promise<void>
  now: Date
  userTz: string
  highlighted?: boolean
  focused?: boolean
  onSaved?: () => void
  /** Guarda y notifica solo cuando el usuario editó local y visitante. */
  saveWhenComplete?: boolean
}

export function MatchCard({
  match,
  prediction,
  onSave,
  now,
  userTz,
  highlighted = false,
  focused = false,
  onSaved,
  saveWhenComplete = false,
}: MatchCardProps) {
  const status = getMatchStatus(match, now)
  const locked = isMatchLocked(match, now)
  const concluded = status === 'finished'
  const [homeScore, setHomeScore] = useState(prediction?.home ?? 0)
  const [awayScore, setAwayScore] = useState(prediction?.away ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!prediction)
  const homeRef = useRef<HTMLInputElement>(null)
  const awayRef = useRef<HTMLInputElement>(null)
  const savedCallbackRef = useRef(onSaved)
  const homeEditedRef = useRef(false)
  const awayEditedRef = useRef(false)
  const committingRef = useRef(false)
  savedCallbackRef.current = onSaved

  useEffect(() => {
    setHomeScore(prediction?.home ?? 0)
    setAwayScore(prediction?.away ?? 0)
    setSaved(!!prediction)
    homeEditedRef.current = false
    awayEditedRef.current = false
  }, [prediction?.home, prediction?.away, prediction, match.id])

  useEffect(() => {
    if (focused && !locked) {
      homeRef.current?.focus()
    }
  }, [focused, locked, match.id])

  const hasPred = !!prediction
  const displayScore = getMatchDisplayScore(match, status)
  const points = hasPred && match.result
    ? calcPoints({ home: prediction!.home, away: prediction!.away }, match.result)
    : null

  const dateLabel = formatKickoffDate(match.kickoffUtc, userTz)
  const dayLabel = formatKickoffDay(match.kickoffUtc, userTz)
  const timeLabel = formatKickoffTime(match.kickoffUtc, userTz)

  async function handleSave(h: number, a: number) {
    if (locked) return
    setSaving(true)
    try {
      await onSave(match.id, h, a)
      setSaved(true)
      savedCallbackRef.current?.()
    } finally {
      setSaving(false)
    }
  }

  function bothEdited() {
    return homeEditedRef.current && awayEditedRef.current
  }

  async function commitSave() {
    if (locked || saving || committingRef.current || !bothEdited()) return

    committingRef.current = true
    try {
      const unchanged =
        homeScore === (prediction?.home ?? 0) && awayScore === (prediction?.away ?? 0)

      if (unchanged) {
        savedCallbackRef.current?.()
        return
      }

      await handleSave(homeScore, awayScore)
    } finally {
      committingRef.current = false
    }
  }

  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusAwayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (locked || saving) return
    if (!homeEditedRef.current) return

    if (focusAwayTimerRef.current) clearTimeout(focusAwayTimerRef.current)
    focusAwayTimerRef.current = setTimeout(() => {
      if (document.activeElement === homeRef.current) {
        awayRef.current?.focus()
      }
    }, INPUT_PAUSE_MS)

    return () => {
      if (focusAwayTimerRef.current) clearTimeout(focusAwayTimerRef.current)
    }
  }, [homeScore, locked, saving])

  useEffect(() => {
    if (locked || saving) return

    if (saveWhenComplete) {
      if (!bothEdited()) return
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
      const unchanged =
        homeScore === (prediction?.home ?? 0) && awayScore === (prediction?.away ?? 0)

      autoSaveRef.current = setTimeout(() => {
        if (unchanged) {
          savedCallbackRef.current?.()
        } else {
          void commitSave()
        }
      }, INPUT_PAUSE_MS)
      return () => {
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
      }
    }

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    if (homeScore !== (prediction?.home ?? 0) || awayScore !== (prediction?.away ?? 0)) {
      autoSaveRef.current = setTimeout(() => {
        void handleSave(homeScore, awayScore)
      }, INPUT_PAUSE_MS)
    }
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    }
  }, [homeScore, awayScore, locked, saving, prediction?.home, prediction?.away, saveWhenComplete])

  const cardClass = [
    'match-card scroll-target',
    highlighted ? 'highlighted' : '',
    focused ? 'focused' : '',
    concluded ? 'played' : '',
    status === 'live' ? 'live' : '',
    locked && !concluded ? 'locked' : '',
  ].filter(Boolean).join(' ')

  return (
    <div id={`match-${match.id}`} className={cardClass} style={{ marginBottom: '-1px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--fg-4)',
        background: concluded ? 'rgba(235,235,235,0.02)' : status === 'live' ? 'rgba(255,77,0,0.03)' : 'transparent',
      }}>
        <div className="mono-label" style={{ color: 'var(--fg-3)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>GRUPO {match.group}</span>
          <span style={{ color: 'var(--fg-4)' }}>·</span>
          <span>{dateLabel}</span>
          <span style={{ color: 'var(--fg-4)' }}>·</span>
          <span>{dayLabel}</span>
          <span style={{ color: 'var(--fg-4)' }}>·</span>
          <span>{timeLabel}</span>
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
              {displayScore ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--fg-1)' }}>{displayScore.home}</span>
                  <span style={{ fontSize: '24px', color: 'var(--fg-4)' }}>:</span>
                  <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--fg-1)' }}>{displayScore.away}</span>
                </div>
              ) : status === 'live' ? (
                <span className="mono-label" style={{ color: 'var(--color-contrast)' }}>
                  Partido en curso{match.elapsed != null ? ` · ${match.elapsed}'` : ''}
                </span>
              ) : concluded ? (
                <span className="mono-label" style={{ color: 'var(--fg-3)' }}>Resultado pendiente</span>
              ) : (
                <span className="mono-label" style={{ color: 'var(--fg-3)' }}>Pronósticos cerrados</span>
              )}
              {hasPred && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
                    Tu pronóstico: {prediction!.home}:{prediction!.away}
                  </span>
                  {points !== null && (
                    <span className={`badge ${points === 6 ? 'exact' : points === 3 ? 'winner' : 'pts'}`} style={{ marginLeft: '4px' }}>
                      {scoreLabel(points)}
                    </span>
                  )}
                </div>
              )}
              {!hasPred && concluded && (
                <span className="mono-label" style={{ color: 'var(--fg-4)' }}>Sin pronóstico</span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ScoreInput
                value={homeScore}
                onChange={setHomeScore}
                disabled={saving}
                inputRef={homeRef}
                aria-label={`Goles ${match.home.name}`}
                onEdited={() => { homeEditedRef.current = true }}
                onTabNext={() => awayRef.current?.focus()}
              />
              <span style={{ fontSize: '28px', color: 'var(--fg-4)', fontWeight: 300, lineHeight: 1 }}>:</span>
              <ScoreInput
                value={awayScore}
                onChange={setAwayScore}
                disabled={saving}
                inputRef={awayRef}
                aria-label={`Goles ${match.away.name}`}
                onEdited={() => { awayEditedRef.current = true }}
                onTabNext={() => { void commitSave() }}
                onBlurComplete={saveWhenComplete ? undefined : () => { void commitSave() }}
              />
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
