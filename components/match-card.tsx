'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
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
import { INPUT_PAUSE_MS } from '@/lib/prediction-flow'
import { isValidScore } from '@/lib/score'
import { useIsMobile } from '@/lib/use-mobile'
import { ScoreInput } from '@/components/score-input'
import { TeamFlag } from '@/components/team-flag'

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
        LIVE
      </span>
    )
  }

  if (status === 'finished') {
    return <span className="mono-label badge badge-finished">FINISHED</span>
  }

  if (saved) {
    return <span className="mono-label badge badge-saved">SAVED ✓</span>
  }

  return <span className="mono-label badge badge-upcoming">UPCOMING</span>
}

function LockedScores({
  status,
  concluded,
  displayScore,
  hasPred,
  prediction,
  points,
  elapsed,
  compact = false,
}: {
  status: MatchStatus
  concluded: boolean
  displayScore: { home: number; away: number } | null | undefined
  hasPred: boolean
  prediction?: { home: number; away: number }
  points: number | null
  elapsed?: number | null
  compact?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? '6px' : '8px',
      }}
    >
      {!compact && displayScore ? (
        <div className="match-card-score-row">
          <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--fg-1)' }}>{displayScore.home}</span>
          <span className="match-card-score-sep">:</span>
          <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--fg-1)' }}>{displayScore.away}</span>
        </div>
      ) : !compact && status === 'live' ? (
        <span className="mono-label" style={{ color: 'var(--color-contrast)' }}>
          Match in progress{elapsed != null ? ` · ${elapsed}'` : ''}
        </span>
      ) : !compact && concluded ? (
        <span className="mono-label" style={{ color: 'var(--fg-3)' }}>Result pending</span>
      ) : !compact ? (
        <span className="mono-label" style={{ color: 'var(--fg-3)' }}>Picks locked</span>
      ) : null}

      {compact && status === 'live' && (
        <span className="mono-label" style={{ color: 'var(--color-contrast)' }}>
          Match in progress{elapsed != null ? ` · ${elapsed}'` : ''}
        </span>
      )}

      {hasPred && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
            Your pick: {prediction!.home}:{prediction!.away}
          </span>
          {points !== null && (
            <span className={`badge ${points === 6 ? 'exact' : points === 3 ? 'winner' : 'pts'}`}>
              {scoreLabel(points)}
            </span>
          )}
        </div>
      )}

      {!hasPred && concluded && (
        <span className="mono-label" style={{ color: 'var(--fg-4)' }}>No pick</span>
      )}
    </div>
  )
}

export interface MatchCardProps {
  match: Match
  prediction?: { home: number; away: number }
  onSave: (matchId: string, home: number, away: number) => Promise<void>
  now: Date
  userTz: string
  highlighted?: boolean
  focused?: boolean
  /** Incrementar para forzar foco al input local (p. ej. al avanzar de partido). */
  focusToken?: number
  onActivate?: () => void
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
  focusToken = 0,
  onActivate,
  onSaved,
  saveWhenComplete = false,
}: MatchCardProps) {
  const isMobile = useIsMobile()
  const status = getMatchStatus(match, now)
  const locked = isMatchLocked(match, now)
  const concluded = status === 'finished'
  const [homeScore, setHomeScore] = useState(prediction?.home ?? 0)
  const [awayScore, setAwayScore] = useState(prediction?.away ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!prediction)
  const [editEpoch, setEditEpoch] = useState(0)
  const homeRef = useRef<HTMLInputElement>(null)
  const awayRef = useRef<HTMLInputElement>(null)
  const savedCallbackRef = useRef(onSaved)
  const homeEditedRef = useRef(false)
  const awayEditedRef = useRef(false)
  const awayConfirmedRef = useRef(false)
  const committingRef = useRef(false)
  const prevFocusedRef = useRef(focused)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusAwayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  savedCallbackRef.current = onSaved

  const markHomeEdited = useCallback(() => {
    homeEditedRef.current = true
    setEditEpoch(n => n + 1)
  }, [])

  const markAwayEdited = useCallback(() => {
    awayEditedRef.current = true
    setEditEpoch(n => n + 1)
  }, [])

  const markAwayConfirmed = useCallback(() => {
    awayConfirmedRef.current = true
    setEditEpoch(n => n + 1)
  }, [])

  useEffect(() => {
    setHomeScore(prediction?.home ?? 0)
    setAwayScore(prediction?.away ?? 0)
    setSaved(!!prediction)
    if (!focused) {
      homeEditedRef.current = false
      awayEditedRef.current = false
      awayConfirmedRef.current = false
    }
  }, [prediction?.home, prediction?.away, prediction, match.id, focused])

  useEffect(() => {
    const wasFocused = prevFocusedRef.current
    prevFocusedRef.current = focused

    if (focused && !locked && !wasFocused) {
      homeEditedRef.current = false
      awayEditedRef.current = false
      awayConfirmedRef.current = false
    }

    if (wasFocused && !focused && !locked) {
      const active = document.activeElement
      if (active === homeRef.current || active === awayRef.current) {
        ;(active as HTMLElement).blur()
      }
    }
  }, [focused, locked])

  useLayoutEffect(() => {
    if (!focused || locked) return
    const active = document.activeElement
    if (active === homeRef.current || active === awayRef.current) return
    const frame = requestAnimationFrame(() => {
      homeRef.current?.focus({ preventScroll: true })
      homeRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [focused, locked, match.id, focusToken])

  const hasPred = !!prediction
  const displayScore = getMatchDisplayScore(match, status)
  const points = hasPred && match.result
    ? calcPoints({ home: prediction!.home, away: prediction!.away }, match.result)
    : null

  const dateLabel = formatKickoffDate(match.kickoffUtc, userTz)
  const dayLabel = formatKickoffDay(match.kickoffUtc, userTz)
  const timeLabel = formatKickoffTime(match.kickoffUtc, userTz)

  async function handleSave(h: number, a: number) {
    if (locked || !isValidScore(h) || !isValidScore(a)) return
    setSaving(true)
    try {
      await onSave(match.id, h, a)
      setSaved(true)
    } finally {
      setSaving(false)
      queueMicrotask(() => savedCallbackRef.current?.())
    }
  }

  type CommitPhase = 'idle' | 'need-away' | 'ready'

  function getCommitPhase(): CommitPhase {
    if (!homeEditedRef.current && !awayEditedRef.current) return 'idle'

    const predHome = prediction?.home ?? 0
    const predAway = prediction?.away ?? 0
    const homeChanged = homeScore !== predHome
    const awayChanged = awayScore !== predAway

    if (!prediction) {
      if (homeEditedRef.current && awayEditedRef.current) return 'ready'
      if (homeEditedRef.current) return 'need-away'
      return 'idle'
    }

    if (!homeChanged && !awayChanged) {
      return homeEditedRef.current && awayEditedRef.current ? 'ready' : 'idle'
    }

    if (!homeChanged && awayChanged) {
      return awayEditedRef.current ? 'ready' : 'idle'
    }

    if (homeChanged && !awayChanged) {
      if (!homeEditedRef.current) return 'idle'
      return awayConfirmedRef.current || awayEditedRef.current ? 'ready' : 'need-away'
    }

    if (homeEditedRef.current && awayEditedRef.current) return 'ready'
    if (homeEditedRef.current && !awayEditedRef.current) return 'need-away'
    if (!homeEditedRef.current && awayEditedRef.current) return 'ready'
    return 'idle'
  }

  function confirmAwayIfUnchanged() {
    if (!prediction) return
    const awayChanged = awayScore !== prediction.away
    if (!awayChanged && homeEditedRef.current && !awayEditedRef.current) {
      markAwayConfirmed()
    }
  }

  function handleAwayComplete() {
    if (saveWhenComplete) {
      confirmAwayIfUnchanged()
      if (getCommitPhase() === 'ready') {
        void commitSave()
      }
      return
    }
    void commitSave()
  }

  async function commitSave() {
    if (locked || saving || committingRef.current || getCommitPhase() !== 'ready') return

    committingRef.current = true
    try {
      const unchanged =
        homeScore === (prediction?.home ?? 0) && awayScore === (prediction?.away ?? 0)

      if (unchanged) {
        if (prediction) {
          queueMicrotask(() => savedCallbackRef.current?.())
        }
        return
      }

      await handleSave(homeScore, awayScore)
    } finally {
      committingRef.current = false
    }
  }

  useEffect(() => () => {
    if (focusAwayTimerRef.current) clearTimeout(focusAwayTimerRef.current)
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
  }, [])

  useEffect(() => {
    if (locked || saving || !saveWhenComplete || !focused) return
    if (getCommitPhase() !== 'need-away') return

    if (focusAwayTimerRef.current) clearTimeout(focusAwayTimerRef.current)
    focusAwayTimerRef.current = setTimeout(() => {
      awayRef.current?.focus({ preventScroll: true })
      awayRef.current?.select()
    }, INPUT_PAUSE_MS)

    return () => {
      if (focusAwayTimerRef.current) clearTimeout(focusAwayTimerRef.current)
    }
  }, [homeScore, awayScore, locked, saving, saveWhenComplete, focused, editEpoch])

  useEffect(() => {
    if (locked || saving) return

    if (saveWhenComplete) {
      if (getCommitPhase() !== 'ready') return
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)

      autoSaveRef.current = setTimeout(() => {
        void commitSave()
      }, INPUT_PAUSE_MS)
      return () => {
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
      }
    }

    if (!focused) return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    if (homeScore !== (prediction?.home ?? 0) || awayScore !== (prediction?.away ?? 0)) {
      autoSaveRef.current = setTimeout(() => {
        void handleSave(homeScore, awayScore)
      }, INPUT_PAUSE_MS)
    }
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    }
  }, [homeScore, awayScore, locked, saving, prediction?.home, prediction?.away, saveWhenComplete, focused, editEpoch])

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
      <div
        className="match-card-header"
        style={{
          background: concluded ? 'rgba(235,235,235,0.02)' : status === 'live' ? 'rgba(255,77,0,0.03)' : 'transparent',
        }}
      >
        <div className="match-card-meta">
          <span>GROUP {match.group}</span>
          <span className="match-card-meta-sep">·</span>
          <span>{dateLabel}</span>
          <span className="match-card-meta-sep">·</span>
          <span>{dayLabel}</span>
          <span className="match-card-meta-sep">·</span>
          <span>{timeLabel}</span>
          <span className="match-card-meta-sep match-card-meta-venue">·</span>
          <span className="match-card-meta-venue">{match.venue}</span>
        </div>
        <div className="match-card-header-badge">
          <MatchStatusBadge status={status} saved={saved && !locked} />
        </div>
      </div>

      {isMobile ? (
        <div className="match-card-body-mobile">
          <div className="match-card-row">
            <TeamFlag code={match.home.code} fallbackColors={match.home.flag} />
            <div className="match-card-row-info">
              <div className="match-card-team-name" title={match.home.name}>{match.home.name}</div>
              <div className="match-card-team-code">{match.home.code}</div>
            </div>
            {locked ? (
              <span className="match-card-score-value">{displayScore?.home ?? '—'}</span>
            ) : (
              <ScoreInput
                value={homeScore}
                onChange={setHomeScore}
                disabled={saving}
                inputRef={homeRef}
                className="score-input-inline"
                aria-label={`Goals ${match.home.name}`}
                onActivate={onActivate}
                onEdited={markHomeEdited}
                onTabNext={() => {
                  awayRef.current?.focus({ preventScroll: true })
                  awayRef.current?.select()
                }}
              />
            )}
          </div>

          <div className="match-card-row">
            <TeamFlag code={match.away.code} fallbackColors={match.away.flag} />
            <div className="match-card-row-info">
              <div className="match-card-team-name" title={match.away.name}>{match.away.name}</div>
              <div className="match-card-team-code">{match.away.code}</div>
            </div>
            {locked ? (
              <span className="match-card-score-value">{displayScore?.away ?? '—'}</span>
            ) : (
              <ScoreInput
                value={awayScore}
                onChange={setAwayScore}
                disabled={saving}
                inputRef={awayRef}
                className="score-input-inline"
                aria-label={`Goals ${match.away.name}`}
                onActivate={onActivate}
                onEdited={markAwayEdited}
                onTabNext={handleAwayComplete}
                onBlurComplete={handleAwayComplete}
              />
            )}
          </div>

          {locked && (
            <div className="match-card-mobile-footer">
              <LockedScores
                status={status}
                concluded={concluded}
                displayScore={displayScore}
                hasPred={hasPred}
                prediction={prediction}
                points={points}
                elapsed={match.elapsed}
                compact
              />
            </div>
          )}
        </div>
      ) : (
        <div className="match-card-body-desktop">
          <div className="match-card-team match-card-team--home">
            <div className="match-card-team-info match-card-team-info--home">
              <div className="match-card-team-name match-card-team-name--desktop">{match.home.name}</div>
              <div className="match-card-team-code">{match.home.code}</div>
            </div>
            <TeamFlag code={match.home.code} fallbackColors={match.home.flag} />
          </div>

          <div className="match-card-scores">
            {locked ? (
              <LockedScores
                status={status}
                concluded={concluded}
                displayScore={displayScore}
                hasPred={hasPred}
                prediction={prediction}
                points={points}
                elapsed={match.elapsed}
              />
            ) : (
              <div className="match-card-score-row">
              <ScoreInput
                value={homeScore}
                onChange={setHomeScore}
                disabled={saving}
                inputRef={homeRef}
                aria-label={`Goals ${match.home.name}`}
                onActivate={onActivate}
                onEdited={markHomeEdited}
                onTabNext={() => {
                  awayRef.current?.focus({ preventScroll: true })
                  awayRef.current?.select()
                }}
              />
              <span className="match-card-score-sep">:</span>
              <ScoreInput
                value={awayScore}
                onChange={setAwayScore}
                disabled={saving}
                inputRef={awayRef}
                aria-label={`Goals ${match.away.name}`}
                onActivate={onActivate}
                onEdited={markAwayEdited}
                onTabNext={handleAwayComplete}
                onBlurComplete={handleAwayComplete}
              />
              </div>
            )}
          </div>

          <div className="match-card-team match-card-team--away">
            <TeamFlag code={match.away.code} fallbackColors={match.away.flag} />
            <div className="match-card-team-info">
              <div className="match-card-team-name match-card-team-name--desktop">{match.away.name}</div>
              <div className="match-card-team-code">{match.away.code}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
