'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import {
  getMatchDisplayScore,
  getMatchStatus,
  isMatchLocked,
  formatMatchRoundLabel,
  type Match,
  type MatchStatus,
} from '@/lib/wc2026-data'
import {
  formatKickoffDate,
  formatKickoffDay,
  formatKickoffTime,
} from '@/lib/wc2026/format-local'
import { calcPoints, scoreLabel } from '@/lib/scoring'
import { isValidScore } from '@/lib/score'
import { useIsMobile } from '@/lib/use-mobile'
import { ScoreInput } from '@/components/score-input'
import { TeamFlag } from '@/components/team-flag'
import { MatchCommunityPicks } from '@/components/match-community-picks'
import { PredictionSaveSwitch } from '@/components/prediction-save-switch'
import type { RevealedMatchPrediction } from '@/lib/match-predictions'

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

function formatLiveLabel(elapsed?: number | null, statusShort?: string): string {
  if (elapsed != null) return `Live · ${elapsed}'`
  if (statusShort === 'HT') return 'Half-time'
  return 'Live'
}

function LockedScores({
  status,
  concluded,
  displayScore,
  hasPred,
  prediction,
  points,
  elapsed,
  statusShort,
  compact = false,
}: {
  status: MatchStatus
  concluded: boolean
  displayScore: { home: number; away: number } | null | undefined
  hasPred: boolean
  prediction?: { home: number; away: number }
  points: number | null
  elapsed?: number | null
  statusShort?: string
  compact?: boolean
}) {
  const liveLabel = formatLiveLabel(elapsed, statusShort)

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
        <>
          <div className="match-card-score-row">
            <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--fg-1)' }}>{displayScore.home}</span>
            <span className="match-card-score-sep">:</span>
            <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--fg-1)' }}>{displayScore.away}</span>
          </div>
          {status === 'live' ? (
            <span className="mono-label" style={{ color: 'var(--color-contrast)' }}>{liveLabel}</span>
          ) : (
            <span className="mono-label" style={{ color: 'var(--fg-3)' }}>Final</span>
          )}
        </>
      ) : !compact && status === 'live' ? (
        <span className="mono-label" style={{ color: 'var(--color-contrast)' }}>
          {liveLabel}
        </span>
      ) : !compact && concluded ? (
        <span className="mono-label" style={{ color: 'var(--fg-3)' }}>Result pending</span>
      ) : !compact ? (
        <span className="mono-label" style={{ color: 'var(--fg-3)' }}>Picks locked</span>
      ) : null}

      {compact && status === 'live' && (
        <span className="mono-label" style={{ color: 'var(--color-contrast)' }}>
          {displayScore ? liveLabel : 'Match in progress'}
        </span>
      )}

      {compact && status === 'finished' && displayScore && (
        <span className="mono-label" style={{ color: 'var(--fg-3)' }}>Final</span>
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
  communityPicks?: RevealedMatchPrediction[]
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
  communityPicks = [],
}: MatchCardProps) {
  const isMobile = useIsMobile()
  const status = getMatchStatus(match, now)
  const locked = isMatchLocked(match, now)
  const concluded = status === 'finished'
  const [homeScore, setHomeScore] = useState(prediction?.home ?? 0)
  const [awayScore, setAwayScore] = useState(prediction?.away ?? 0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(!!prediction)
  const homeRef = useRef<HTMLInputElement>(null)
  const awayRef = useRef<HTMLInputElement>(null)
  const savedCallbackRef = useRef(onSaved)
  savedCallbackRef.current = onSaved

  useEffect(() => {
    setHomeScore(prediction?.home ?? 0)
    setAwayScore(prediction?.away ?? 0)
    setSaved(!!prediction)
  }, [prediction?.home, prediction?.away, prediction, match.id])

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

  const dirty = !prediction || homeScore !== prediction.home || awayScore !== prediction.away
  const canSave = !locked && isValidScore(homeScore) && isValidScore(awayScore) && dirty

  const dateLabel = formatKickoffDate(match.kickoffUtc, userTz)
  const dayLabel = formatKickoffDay(match.kickoffUtc, userTz)
  const timeLabel = formatKickoffTime(match.kickoffUtc, userTz)

  async function handleSave(h: number, a: number): Promise<boolean> {
    if (locked || !isValidScore(h) || !isValidScore(a)) return false
    setSaving(true)
    setSaveError('')
    try {
      await onSave(match.id, h, a)
      setSaved(true)
      homeRef.current?.blur()
      awayRef.current?.blur()
      queueMicrotask(() => savedCallbackRef.current?.())
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save pick'
      setSaveError(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  function handleSaveSwitch() {
    if (!canSave || saving) return
    void handleSave(homeScore, awayScore)
  }

  function SaveErrorMessage() {
    if (!saveError) return null
    return (
      <p
        className="mono-label"
        role="alert"
        style={{ color: 'var(--color-contrast)', marginTop: '8px', textAlign: 'center' }}
      >
        {saveError}
      </p>
    )
  }

  function SaveControls() {
    return (
      <div className="match-card-save-controls">
        <PredictionSaveSwitch
          saved={saved}
          dirty={dirty}
          saving={saving}
          disabled={locked || !isValidScore(homeScore) || !isValidScore(awayScore)}
          onSave={handleSaveSwitch}
        />
        <SaveErrorMessage />
      </div>
    )
  }

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
          <span>{formatMatchRoundLabel(match)}</span>
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
          <MatchStatusBadge status={status} saved={saved && !dirty && !locked} />
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
              />
            )}
          </div>

          {locked ? (
            <div className="match-card-mobile-footer">
              <LockedScores
                status={status}
                concluded={concluded}
                displayScore={displayScore}
                hasPred={hasPred}
                prediction={prediction}
                points={points}
                elapsed={match.elapsed}
                statusShort={match.statusShort}
                compact
              />
            </div>
          ) : (
            <div className="match-card-mobile-footer">
              <SaveControls />
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
                statusShort={match.statusShort}
              />
            ) : (
              <div className="match-card-score-column">
                <div className="match-card-score-row">
                  <ScoreInput
                    value={homeScore}
                    onChange={setHomeScore}
                    disabled={saving}
                    inputRef={homeRef}
                    aria-label={`Goals ${match.home.name}`}
                    onActivate={onActivate}
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
                  />
                </div>
                <SaveControls />
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

      <MatchCommunityPicks
        picks={communityPicks}
        locked={locked}
        revealed={locked && communityPicks.length > 0}
      />
    </div>
  )
}
