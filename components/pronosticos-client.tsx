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
import { MatchCard } from '@/components/match-card'

type ViewMode = 'todos' | 'por-grupo'
type SlideState = 'enter' | 'exit' | 'entering'
type PredMap = Record<string, { home: number; away: number }>

interface Props {
  initialPredictions: PredMap
  matches: Match[]
  dataSource: MatchDataSource
}

function GroupHeader({ group }: { group: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      borderBottom: '1px solid var(--fg-4)',
      borderTop: '1px solid var(--fg-4)',
      background: 'rgba(235,235,235,0.02)',
    }}>
      <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.02em' }}>
        GRUPO {group}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--fg-4)' }} />
    </div>
  )
}

function useSlideAdvance() {
  const [slideState, setSlideState] = useState<SlideState>('enter')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const advance = useCallback((onStep: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setSlideState('exit')
      setTimeout(() => {
        onStep()
        setSlideState('entering')
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setSlideState('enter'))
        })
      }, 400)
    }, 650)
  }, [])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { slideState, advance }
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
  const { slideState, advance } = useSlideAdvance()
  const initializedRef = useRef(false)
  const prevGroupSavedRef = useRef<number | null>(null)

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

  const savedCount = upcoming.filter(m => predictions[m.id]).length
  const progress = upcoming.length > 0 ? (savedCount / upcoming.length) * 100 : 100
  const tzLabel = formatTimezoneLabel(userTz)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const firstGroup = groupsUpcoming.findIndex(g =>
      g.matches.some(m => !predictions[m.id]),
    )
    if (firstGroup >= 0) setCurrentGroupIndex(firstGroup)
  }, [groupsUpcoming, predictions])

  useEffect(() => {
    if (viewMode !== 'por-grupo') return
    const firstGroup = groupsUpcoming.findIndex(g =>
      g.matches.some(m => !predictions[m.id]),
    )
    setCurrentGroupIndex(firstGroup >= 0 ? firstGroup : 0)
  }, [viewMode, groupsUpcoming, predictions])

  const handleSave = useCallback(async (matchId: string, home: number, away: number) => {
    await savePrediction(matchId, home, away, Date.now())
    setPredictions(prev => ({ ...prev, [matchId]: { home, away } }))
  }, [])

  useEffect(() => {
    if (viewMode !== 'por-grupo' || groupsUpcoming.length === 0) return
    const group = groupsUpcoming[currentGroupIndex]
    if (!group) return

    const savedInGroup = group.matches.filter(m => predictions[m.id]).length
    const prevSaved = prevGroupSavedRef.current
    prevGroupSavedRef.current = savedInGroup

    if (prevSaved == null) return

    const allSaved = savedInGroup === group.matches.length
    const justCompleted = allSaved && savedInGroup > prevSaved

    if (justCompleted && currentGroupIndex < groupsUpcoming.length - 1) {
      advance(() => setCurrentGroupIndex(prev => prev + 1))
    }
  }, [predictions, groupsUpcoming, currentGroupIndex, viewMode, advance])

  useEffect(() => {
    prevGroupSavedRef.current = null
  }, [currentGroupIndex, viewMode])

  const viewOptions: { key: ViewMode; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: matches.length },
    { key: 'por-grupo', label: 'Por grupo', count: groupsUpcoming.length },
  ]

  const currentGroup = groupsUpcoming[currentGroupIndex]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
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
            En Por grupo cargás partido a partido y avanzás al siguiente grupo al terminar. Horarios en {tzLabel}.
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '24px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
            {savedCount}
            <span style={{ fontSize: '16px', color: 'var(--fg-3)', fontWeight: 400 }}> / {upcoming.length}</span>
          </div>
          <div className="mono-label" style={{ color: 'var(--fg-3)', marginTop: '4px' }}>
            por jugar
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

      <div style={{ display: 'flex', gap: '0', marginBottom: '32px', flexWrap: 'wrap' }}>
        {viewOptions.map(({ key, label, count }) => (
          <button
            key={key}
            className={`chip${viewMode === key ? ' active' : ''}`}
            style={{ marginRight: '-1px', marginBottom: '-1px' }}
            onClick={() => setViewMode(key)}
          >
            {label} <span className="chip-count">{count}</span>
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
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  onSave={handleSave}
                  now={now}
                  userTz={userTz}
                  saveWhenComplete={editable}
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
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
                GRUPO {currentGroup?.group ?? '—'}
              </span>
              <span className="mono-label" style={{ color: 'var(--fg-2)' }}>
                {currentGroupIndex + 1} / {groupsUpcoming.length}
              </span>
            </div>
            <div className="group-carousel">
              <div className={`group-slide ${slideState === 'exit' ? 'exit' : slideState === 'entering' ? 'enter-from-right' : 'enter'}`}>
                {currentGroup && (
                  <>
                    <GroupHeader group={currentGroup.group} />
                    <div style={{ border: '1px solid var(--fg-4)', borderTop: 'none' }}>
                      {currentGroup.matches.map((match, i) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          prediction={predictions[match.id]}
                          onSave={handleSave}
                          now={now}
                          userTz={userTz}
                          focused={i === 0}
                          saveWhenComplete
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="group-dots">
              {groupsUpcoming.map((g, i) => (
                <button
                  key={g.group}
                  className={`group-dot${i === currentGroupIndex ? ' active' : ''}`}
                  onClick={() => {
                    if (i === currentGroupIndex || slideState !== 'enter') return
                    advance(() => setCurrentGroupIndex(i))
                  }}
                  aria-label={`Grupo ${g.group}`}
                />
              ))}
            </div>
          </>
        )
      )}
    </div>
  )
}
