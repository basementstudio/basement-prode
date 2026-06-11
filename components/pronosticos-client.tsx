'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMatchStatus,
  isMatchLocked,
  sortMatchesBySchedule,
  type Match,
} from '@/lib/wc2026-data'
import type { MatchDataSource } from '@/lib/wc2026/get-matches'
import { formatTimezoneLabel, getUserTimezone } from '@/lib/wc2026/format-local'
import { savePrediction } from '@/lib/actions'
import { GROUP_ADVANCE_MS, focusMatchInput } from '@/lib/prediction-flow'
import { MatchCard } from '@/components/match-card'
import { GroupMatchesCarousel } from '@/components/group-matches-carousel'
import type { CarouselApi } from '@/components/ui/carousel'

type ViewMode = 'todos' | 'por-grupo'
type PredMap = Record<string, { home: number; away: number }>

interface Props {
  initialPredictions: PredMap
  matches: Match[]
  dataSource: MatchDataSource
}

function findNextEditableMatch(list: Match[], afterId: string, now: Date): Match | undefined {
  const start = list.findIndex(m => m.id === afterId)
  if (start < 0) return undefined
  for (let i = start + 1; i < list.length; i++) {
    if (!isMatchLocked(list[i], now)) return list[i]
  }
  return undefined
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

export function PronosticosClient({ initialPredictions, matches, dataSource }: Props) {
  const router = useRouter()
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

  useEffect(() => {
    const refresh = setInterval(() => router.refresh(), 60_000)
    return () => clearInterval(refresh)
  }, [router])

  const sortedMatches = useMemo(
    () => sortMatchesBySchedule(matches, now),
    [matches, now],
  )

  const upcoming = useMemo(
    () => sortedMatches.filter(m => getMatchStatus(m, now) === 'upcoming'),
    [sortedMatches, now],
  )

  const groupsUpcoming = useMemo(() => {
    const groups: { group: string; matches: Match[] }[] = []
    for (const match of upcoming) {
      const existing = groups.find(g => g.group === match.group)
      if (existing) existing.matches.push(match)
      else groups.push({ group: match.group, matches: [match] })
    }
    return groups.sort((a, b) => a.group.localeCompare(b.group))
  }, [upcoming])

  groupsUpcomingRef.current = groupsUpcoming

  const savedCount = upcoming.filter(m => predictions[m.id]).length
  const progress = upcoming.length > 0 ? (savedCount / upcoming.length) * 100 : 100
  const tzLabel = formatTimezoneLabel(userTz)
  const currentGroup = groupsUpcoming[currentGroupIndex]

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    setActiveMatchId(firstEditableMatchId(sortedMatches, now))
    const firstGroup = groupsUpcoming.findIndex(g =>
      g.matches.some(m => !predictions[m.id]),
    )
    if (firstGroup >= 0) setCurrentGroupIndex(firstGroup)
  }, [sortedMatches, groupsUpcoming, predictions, now])

  useEffect(() => {
    if (viewMode === 'todos') {
      setActiveMatchId(prev => {
        if (prev && sortedMatches.some(m => m.id === prev && !isMatchLocked(m, now))) {
          return prev
        }
        return firstEditableMatchId(sortedMatches, now)
      })
    }
  }, [viewMode, sortedMatches, now])

  useEffect(() => {
    const enteringPorGrupo = viewMode === 'por-grupo' && prevViewModeRef.current !== 'por-grupo'
    prevViewModeRef.current = viewMode
    if (!enteringPorGrupo) return

    const firstGroup = groupsUpcoming.findIndex(g =>
      g.matches.some(m => !predictionsRef.current[m.id]),
    )
    const groupIndex = firstGroup >= 0 ? firstGroup : 0
    const group = groupsUpcoming[groupIndex]
    setCurrentGroupIndex(groupIndex)
    if (group) {
      setActiveGroupMatchIndex(
        firstUnsavedIndexInGroup(group.matches, predictionsRef.current),
      )
    }
  }, [viewMode, groupsUpcoming])

  const handleGroupIndexChange = useCallback((index: number) => {
    setCurrentGroupIndex(index)
    const group = groupsUpcomingRef.current[index]
    if (!group) return
    const matchIndex = firstUnsavedIndexInGroup(group.matches, predictionsRef.current)
    setActiveGroupMatchIndex(matchIndex)
    const match = group.matches[matchIndex]
    if (match) bumpFocus(match.id)
  }, [bumpFocus])

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
    const next = findNextEditableMatch(sortedMatches, matchId, now)
    if (next) {
      setActiveMatchId(next.id)
      bumpFocus(next.id)
    } else {
      setActiveMatchId(null)
    }
  }, [sortedMatches, now, bumpFocus])

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
    { key: 'todos', label: 'Todos', count: matches.length },
    { key: 'por-grupo', label: 'Por grupo', count: groupsUpcoming.length },
  ]

  return (
    <div className="page-shell">
      <div className="page-shell-hero">
        <div className="page-shell-intro">
          <div className="eyebrow" style={{ marginBottom: '8px' }}>
            <span className="num">01</span>
            <span className="sep"> — </span>
            FASE DE GRUPOS
            <span style={{ color: 'var(--fg-4)', margin: '0 8px' }}>·</span>
            <span>{matches.length} PARTIDOS</span>
            <span style={{ color: 'var(--fg-4)', margin: '0 8px' }}>·</span>
            <span style={{ color: dataSource === 'worldcup26' ? 'var(--color-contrast)' : 'var(--fg-3)' }}>
              {dataSource === 'worldcup26' ? 'DATOS EN VIVO' : dataSource === 'api-football' ? 'API-FOOTBALL' : 'DATOS LOCALES'}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Cargá tus pronósticos.
          </h1>
          <p style={{ color: 'var(--fg-3)', fontSize: '15px', maxWidth: '520px', lineHeight: '1.5' }}>
            Local → visitante → siguiente partido, al instante. En Por grupo, al terminar el último partido pasás al siguiente grupo. Horarios en {tzLabel}.
          </p>
        </div>
        <div className="page-shell-stat">
          <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
            {savedCount}
            <span style={{ fontSize: '16px', color: 'var(--fg-3)', fontWeight: 400 }}> / {upcoming.length}</span>
          </div>
          <div className="mono-label" style={{ color: 'var(--fg-3)', marginTop: '4px' }}>
            por cargar
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '4px', marginTop: '16px' }}>
        <span className="mono-label" style={{ color: 'var(--fg-3)' }}>PROGRESO</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div className="progress-bar" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="mono-label" style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
          {savedCount} DE {upcoming.length}
        </span>
      </div>

      <div className="view-mode-tabs">
        {viewOptions.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            className={`view-mode-tab${viewMode === key ? ' active' : ''}`}
            onClick={() => setViewMode(key)}
          >
            {label}
            <span className="view-mode-tab-count">{count}</span>
          </button>
        ))}
      </div>

      {viewMode === 'todos' && (
        sortedMatches.length === 0 ? (
          <EmptyState message="No hay partidos" />
        ) : (
          <div style={{ border: '1px solid var(--fg-4)' }}>
            {sortedMatches.map(match => {
              const editable = !isMatchLocked(match, now)
              const isActive = activeMatchId === match.id
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  onSave={handleSave}
                  now={now}
                  userTz={userTz}
                  focused={editable && isActive}
                  highlighted={isActive}
                  focusToken={isActive ? focusToken : 0}
                  saveWhenComplete={editable && isActive}
                  onActivate={() => {
                    if (!editable) return
                    setActiveMatchId(match.id)
                    setFocusToken(t => t + 1)
                  }}
                  onSaved={() => handleTodosMatchComplete(match.id)}
                />
              )
            })}
          </div>
        )
      )}

      {viewMode === 'por-grupo' && (
        groupsUpcoming.length === 0 ? (
          <EmptyState message="No quedan grupos con partidos por jugar" />
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
          />
        )
      )}
    </div>
  )
}
