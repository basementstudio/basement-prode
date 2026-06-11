// Tipos y utilidades de partidos — datos vivos vía lib/wc2026/get-matches.ts

export type { Team, Match, Group, MatchStatus } from '@/lib/wc2026/types'
export { MATCH_PLAY_MS, MATCH_POST_BUFFER_MS, MATCH_LIVE_WINDOW_MS, MATCH_DURATION_MS } from '@/lib/wc2026/types'

import type { Match, MatchStatus } from '@/lib/wc2026/types'
import { MATCH_PLAY_MS } from '@/lib/wc2026/types'

export { STATIC_GROUP_MATCHES as ALL_MATCHES } from '@/lib/wc2026/static-matches'
export { TEAMS } from '@/lib/wc2026/teams'

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'])
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'ABD'])
const UPCOMING_STATUSES = new Set(['NS', 'TBD', 'PST'])

export function getMatchKickoffMs(match: Match): number {
  const raw = match.kickoffUtc.trim()
  const normalized =
    raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw) ? raw : `${raw}Z`
  return new Date(normalized).getTime()
}

/**
 * Estado del partido (badge / filtros).
 * Prioriza la API: FT → CONCLUIDO, 1H/HT/2H → EN VIVO.
 * Sin API: estima EN VIVO hasta ~105 min post-pitido.
 */
export function getMatchStatus(match: Match, now: Date = new Date()): MatchStatus {
  const kickoff = getMatchKickoffMs(match)
  const nowMs = now.getTime()

  if (match.statusShort) {
    if (LIVE_STATUSES.has(match.statusShort)) return 'live'
    if (FINISHED_STATUSES.has(match.statusShort)) return 'finished'
    if (UPCOMING_STATUSES.has(match.statusShort) && nowMs < kickoff) return 'upcoming'
  }

  if (match.result) return 'finished'

  if (nowMs < kickoff) return 'upcoming'
  if (nowMs < kickoff + MATCH_PLAY_MS) return 'live'
  return 'finished'
}

export function getMatchDisplayScore(
  match: Match,
  status: MatchStatus,
): { home: number; away: number } | undefined {
  if (match.result) return match.result
  if (match.liveScore && (status === 'live' || status === 'finished')) return match.liveScore
  return undefined
}

export function isMatchLocked(match: Match, now: Date = new Date()): boolean {
  return getMatchStatus(match, now) !== 'upcoming'
}

export function isMatchPlayed(match: Match, now: Date = new Date()): boolean {
  return getMatchStatus(match, now) === 'finished'
}

export function canEditPrediction(match: Match, now: Date = new Date()): boolean {
  return !isMatchLocked(match, now)
}

const STATUS_SORT_ORDER: Record<MatchStatus, number> = {
  upcoming: 0,
  live: 1,
  finished: 2,
}

export function compareMatchesBySchedule(a: Match, b: Match, now: Date = new Date()): number {
  const statusA = getMatchStatus(a, now)
  const statusB = getMatchStatus(b, now)
  if (STATUS_SORT_ORDER[statusA] !== STATUS_SORT_ORDER[statusB]) {
    return STATUS_SORT_ORDER[statusA] - STATUS_SORT_ORDER[statusB]
  }
  return getMatchKickoffMs(a) - getMatchKickoffMs(b)
}

export function sortMatchesBySchedule(matches: Match[], now: Date = new Date()): Match[] {
  return [...matches].sort((a, b) => compareMatchesBySchedule(a, b, now))
}

/** @deprecated Preferir formatKickoffDate desde lib/wc2026/format-local */
export function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).toUpperCase()
}

/** @deprecated Preferir formatKickoffDay desde lib/wc2026/format-local */
export function formatMatchDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase()
}

export function buildGroupsFromMatches(matches: Match[]) {
  const letters = [...new Set(matches.map(m => m.group))].sort()
  return letters.map(letter => {
    const groupMatches = matches.filter(m => m.group === letter)
    const teamCodes = new Set<string>()
    for (const m of groupMatches) {
      teamCodes.add(m.home.code)
      teamCodes.add(m.away.code)
    }
    const teams = [...teamCodes].map(code => {
      const fromMatch = groupMatches.find(m => m.home.code === code || m.away.code === code)
      return fromMatch?.home.code === code ? fromMatch.home : fromMatch!.away
    })
    return { letter, teams, matches: groupMatches }
  })
}
