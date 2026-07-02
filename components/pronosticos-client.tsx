'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  getMatchStatus,
  isMatchLocked,
  compareMatchesForPicks,
  compareRoundKeys,
  matchRoundKey,
  type Match,
} from '@/lib/wc2026-data'
import type { TournamentData } from '@/lib/wc2026/get-matches'
import { formatTimezoneLabel, getUserTimezone } from '@/lib/wc2026/format-local'
import { savePrediction } from '@/lib/actions'
import type { RevealedMatchPrediction } from '@/lib/match-predictions'
import { GROUP_ADVANCE_MS, focusMatchInput } from '@/lib/prediction-flow'
import { cn } from '@/lib/utils'
import { MatchCard } from '@/components/match-card'
import { GroupMatchesCarousel } from '@/components/group-matches-carousel'
import type { CarouselApi } from '@/components/ui/carousel'

type ViewMode = 'todos' | 'por-grupo'
type PredMap = Record<string, { home: number; away: number }>

interface Props {
  initialPredictions: PredMap
  matches: Match[]
  dataSource: TournamentData['source']
  communityPicksByMatch: Record<string, RevealedMatchPrediction[]>
}

function firstEditableMatchId(list: Match[], now: Date): string | null {
  const match = list.find(m => !isMatchLocked(m, now))
  return match?.id ?? null
}

function firstUnsavedIndexInGroup(matches: Match[], predictions: PredMap): number {
  const idx = matches.findIndex(m => !predictions[m.id])
  return idx >= 0 ? idx : 0
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ border: '1px solid var(--fg-4)', padding: '48px 24px', textAlign: 'center' }}>
      <span className="mono-label" style={{ color: 'var(--fg-3)' }}>{message}</span>
    </div>
  )
}

export function PronosticosClient({
  initialPredictions,
  matches,
  dataSource,
  communityPicksByMatch,
}: Props) {
  const [predictions, setPredictions] = useState<PredMap>(initialPredictions)
  const [viewMode, setViewMode] = useState<ViewMode>('todos')
  const [now, setNow] = useState(() => new Date())
  const [userTz] = useState(getUserTimezone)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null)
  const [activeGroupMatchIndex, setActiveGroupMatchIndex] = useState(0)
  const [focusToken, setFocusToken] = useState(0)
  const carouselApiRef = useRef<CarouselApi | null>(null)
  const groupAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)
  const prevViewModeRef = useRef<ViewMode>(viewMode)
  const predictionsRef = useRef(predictions)
  const groupsUpcomingRef = useRef<{ group: string; matches: Match[] }[]>([])
  predictionsRef.current = predictions

  const bumpFocus = useCallback((matchId: string) => {
    setFocusToken(t => t + 1)
    focusMatchInput(matchId)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(interval)
  }, [])

  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => compareMatchesForPicks(a, b, now)),
    [matches, now],
  )

  const upcoming = useMemo(
    () => sortedMatches.filter(m => getMatchStatus(m, now) === 'upcoming'),
    [sortedMatches, now],
  )

  const upcomingKnockouts = useMemo(
    () => upcoming.filter(m => m.stage !== 'group'),
    [upcoming],
  )

  const isKnockoutPhase = upcomingKnockouts.length > 0

  const pendingMatches = useMemo(
    () =>
      [...upcoming.filter(m => !predictions[m.id])].sort((a, b) =>
        compareMatchesForPicks(a, b, now),
      ),
    [upcoming, predictions, now],
  )

  const groupsUpcoming = useMemo(() => {
    const groups: { group: string; matches: Match[] }[] = []
    for (const match of upcoming) {
      const roundKey = matchRoundKey(match)
      const existing = groups.find(g => g.group === roundKey)
      if (existing) existing.matches.push(match)
      else groups.push({ group: roundKey, matches: [match] })
    }
    return groups.sort((a, b) => compareRoundKeys(a.group, b.group))
  }, [upcoming])

  groupsUpcomingRef.current = groupsUpcoming

  const savedCount = upcoming.filter(m => predictions[m.id]).length
  const progress = upcoming.length > 0 ? (savedCount / upcoming.length) * 100 : 100
  const tzLabel = formatTimezoneLabel(userTz)
  const currentGroup = groupsUpcoming[currentGroupIndex]

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    setActiveMatchId(firstEditableMatchId(pendingMatches, now))
  }, [pendingMatches, now])

  useEffect(() => {
    if (viewMode === 'todos') {
      setActiveMatchId(prev => {
        if (prev && pendingMatches.some(m => m.id === prev)) {
          return prev
        }
        return firstEditableMatchId(pendingMatches, now)
      })
    }
  }, [viewMode, pendingMatches, now])

  useEffect(() => {
    const enteringPorGrupo = viewMode === 'por-grupo' && prevViewModeRef.current !== 'por-grupo'
    prevViewModeRef.current = viewMode
    if (!enteringPorGrupo) return

    setCurrentGroupIndex(0)
    const group = groupsUpcoming[0]
    if (group) {
      setActiveGroupMatchIndex(
        firstUnsavedIndexInGroup(group.matches, predictionsRef.current),
      )
    }
    carouselApiRef.current?.scrollTo(0, false)
  }, [viewMode, groupsUpcoming])

  const handleGroupIndexChange = useCallback((index: number) => {
    setCurrentGroupIndex(index)
    const group = groupsUpcomingRef.current[index]
    if (!group) return
    setActiveGroupMatchIndex(
      firstUnsavedIndexInGroup(group.matches, predictionsRef.current),
    )
  }, [])

  const handleGroupMatchActivate = useCallback((groupIndex: number, matchIndex: number) => {
    if (groupIndex !== currentGroupIndex) {
      setCurrentGroupIndex(groupIndex)
      carouselApiRef.current?.scrollTo(groupIndex)
    }
    setActiveGroupMatchIndex(matchIndex)
    setFocusToken(t => t + 1)
  }, [currentGroupIndex])

  useEffect(() => () => {
    if (groupAdvanceTimerRef.current) clearTimeout(groupAdvanceTimerRef.current)
  }, [])

  const handleCarouselApiReady = useCallback((api: CarouselApi) => {
    carouselApiRef.current = api
  }, [])

  const handleSave = useCallback(async (matchId: string, home: number, away: number) => {
    await savePrediction(matchId, home, away, Date.now())
    setPredictions(prev => ({ ...prev, [matchId]: { home, away } }))
  }, [])

  const handleTodosMatchComplete = useCallback((matchId: string) => {
    const remaining = pendingMatches.filter(m => m.id !== matchId)
    const next = remaining.find(m => !isMatchLocked(m, now))
    if (next) {
      setActiveMatchId(next.id)
      bumpFocus(next.id)
    } else {
      setActiveMatchId(null)
    }
  }, [pendingMatches, now, bumpFocus])

  const handleGroupMatchComplete = useCallback((matchId: string) => {
    const group = groupsUpcomingRef.current[currentGroupIndex]
    if (!group) return
    const idx = group.matches.findIndex(m => m.id === matchId)
    if (idx < 0) return

    if (idx < group.matches.length - 1) {
      const nextMatch = group.matches[idx + 1]
      setActiveGroupMatchIndex(idx + 1)
      bumpFocus(nextMatch.id)
      return
    }

    if (currentGroupIndex < groupsUpcomingRef.current.length - 1) {
      if (groupAdvanceTimerRef.current) clearTimeout(groupAdvanceTimerRef.current)
      const fromIndex = currentGroupIndex
      groupAdvanceTimerRef.current = setTimeout(() => {
        const nextGroupIndex = fromIndex + 1
        const nextGroup = groupsUpcomingRef.current[nextGroupIndex]
        if (!nextGroup) return
        const nextMatchIndex = firstUnsavedIndexInGroup(
          nextGroup.matches,
          predictionsRef.current,
        )
        const nextMatch = nextGroup.matches[nextMatchIndex]
        setCurrentGroupIndex(nextGroupIndex)
        setActiveGroupMatchIndex(nextMatchIndex)
        carouselApiRef.current?.scrollTo(nextGroupIndex)
        if (nextMatch) {
          setTimeout(() => bumpFocus(nextMatch.id), 150)
        }
      }, GROUP_ADVANCE_MS)
    }
  }, [currentGroupIndex, bumpFocus])

  const viewOptions: { key: ViewMode; label: string; count: number }[] = [
    { key: 'todos', label: 'All', count: pendingMatches.length },
    { key: 'por-grupo', label: isKnockoutPhase ? 'By round' : 'By group', count: groupsUpcoming.length },
  ]

  return (
    <div className="page-shell">
      <div className="page-shell-hero">
        <div className="page-shell-intro">
          <div className="eyebrow" style={{ marginBottom: '8px' }}>
            <span className="num">01</span>
            <span className="sep"> — </span>
            {isKnockoutPhase ? 'KNOCKOUT STAGE' : 'GROUP STAGE'}
            <span style={{ color: 'var(--fg-4)', margin: '0 8px' }}>·</span>
            <span>{pendingMatches.length} LEFT TO PICK</span>
            <span style={{ color: 'var(--fg-4)', margin: '0 8px' }}>·</span>
            <span style={{ color: dataSource === 'worldcup26' ? 'var(--color-contrast)' : 'var(--fg-3)' }}>
              {dataSource === 'worldcup26' ? 'LIVE DATA' : 'LOCAL DATA'}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            {isKnockoutPhase ? 'Knockout picks first.' : 'Enter your picks.'}
          </h1>
          <p style={{ color: 'var(--fg-3)', fontSize: '15px', maxWidth: '520px', lineHeight: '1.5' }}>
            {isKnockoutPhase
              ? `Round of 32 and beyond are listed first. Home → away → flip Save to lock in your pick. Times in ${tzLabel}.`
              : `Home → away → flip Save to lock in your pick and jump to the next match. In By group, the last match in a group moves you to the next one. Times in ${tzLabel}.`}
          </p>
        </div>
        <div className="page-shell-stat">
          <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
            {savedCount}
            <span style={{ fontSize: '16px', color: 'var(--fg-3)', fontWeight: 400 }}> / {upcoming.length}</span>
          </div>
          <div className="mono-label" style={{ color: 'var(--fg-3)', marginTop: '4px' }}>
            left to pick
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '4px', marginTop: '16px' }}>
        <span className="mono-label" style={{ color: 'var(--fg-3)' }}>PROGRESS</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div className="progress-bar" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="mono-label" style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
          {savedCount} OF {upcoming.length}
        </span>
      </div>

      <div className="view-mode-tabs">
        {viewOptions.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            className={cn('view-mode-tab', viewMode === key && 'is-active')}
            aria-pressed={viewMode === key}
            onClick={() => setViewMode(key)}
          >
            {label}
            <span className="view-mode-tab-count">{count}</span>
          </button>
        ))}
      </div>

      {viewMode === 'todos' && (
        pendingMatches.length === 0 ? (
          <EmptyState message="No matches left to pick" />
        ) : (
          <div style={{ border: '1px solid var(--fg-4)' }}>
            {pendingMatches.map(match => {
              const isActive = activeMatchId === match.id
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  onSave={handleSave}
                  now={now}
                  userTz={userTz}
                  focused={isActive}
                  highlighted={isActive}
                  focusToken={isActive ? focusToken : 0}
                  onActivate={() => {
                    setActiveMatchId(match.id)
                    setFocusToken(t => t + 1)
                  }}
                  onSaved={() => handleTodosMatchComplete(match.id)}
                  communityPicks={communityPicksByMatch[match.id] ?? []}
                />
              )
            })}
          </div>
        )
      )}

      {viewMode === 'por-grupo' && (
        groupsUpcoming.length === 0 ? (
          <EmptyState message="No groups left with upcoming matches" />
        ) : (
          <GroupMatchesCarousel
            groups={groupsUpcoming}
            currentGroupIndex={currentGroupIndex}
            onGroupIndexChange={handleGroupIndexChange}
            activeGroupMatchIndex={activeGroupMatchIndex}
            focusToken={focusToken}
            predictions={predictions}
            onSave={handleSave}
            now={now}
            userTz={userTz}
            onGroupMatchComplete={handleGroupMatchComplete}
            onGroupMatchActivate={handleGroupMatchActivate}
            onApiReady={handleCarouselApiReady}
            communityPicksByMatch={communityPicksByMatch}
          />
        )
      )}
    </div>
  )
}
