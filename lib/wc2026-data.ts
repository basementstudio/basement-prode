// Tipos y utilidades de partidos — datos vivos vía lib/wc2026/get-matches.ts

export type { Team, Match, Group, MatchStatus, MatchStage } from '@/lib/wc2026/types'
export { MATCH_PLAY_MS, MATCH_POST_BUFFER_MS, MATCH_LIVE_WINDOW_MS, MATCH_DURATION_MS } from '@/lib/wc2026/types'

import type { Match, MatchStatus, MatchStage } from '@/lib/wc2026/types'
import { MATCH_PLAY_MS } from '@/lib/wc2026/types'

const STAGE_SORT_ORDER: Record<MatchStage, number> = {
  r32: 0,
  r16: 1,
  qf: 2,
  sf: 3,
  third: 4,
  final: 5,
  group: 10,
}

export function formatMatchRoundLabel(match: Match): string {
  switch (match.stage) {
    case 'group':
      return `GROUP ${match.group}`
    case 'r32':
      return 'ROUND OF 32'
    case 'r16':
      return 'ROUND OF 16'
    case 'qf':
      return 'QUARTER-FINAL'
    case 'sf':
      return 'SEMI-FINAL'
    case 'third':
      return '3RD PLACE'
    case 'final':
      return 'FINAL'
    default: {
      const _exhaustive: never = match.stage
      return _exhaustive
    }
  }
}

export function matchRoundKey(match: Match): string {
  return match.stage === 'group' ? match.group : match.stage
}

export function sortTournamentMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const stageDelta = STAGE_SORT_ORDER[a.stage] - STAGE_SORT_ORDER[b.stage]
    if (stageDelta !== 0) return stageDelta
    return getMatchKickoffMs(a) - getMatchKickoffMs(b)
  })
}

/** Eliminatorias primero, luego grupos; dentro de cada fase por horario. */
export function compareMatchesForPicks(a: Match, b: Match, now: Date = new Date()): number {
  const stageDelta = STAGE_SORT_ORDER[a.stage] - STAGE_SORT_ORDER[b.stage]
  if (stageDelta !== 0) return stageDelta
  return compareMatchesBySchedule(a, b, now)
}

export function formatRoundKeyLabel(roundKey: string): string {
  switch (roundKey) {
    case 'r32':
      return 'Round of 32'
    case 'r16':
      return 'Round of 16'
    case 'qf':
      return 'Quarter-finals'
    case 'sf':
      return 'Semi-finals'
    case 'third':
      return '3rd place'
    case 'final':
      return 'Final'
    default:
      return `Group ${roundKey}`
  }
}

export function formatRoundKeyShort(roundKey: string): string {
  switch (roundKey) {
    case 'r32':
      return 'R32'
    case 'r16':
      return 'R16'
    case 'qf':
      return 'QF'
    case 'sf':
      return 'SF'
    case 'third':
      return '3RD'
    case 'final':
      return 'FINAL'
    default:
      return roundKey
  }
}

export function compareRoundKeys(a: string, b: string): number {
  const order = (key: string): number => {
    if (key in STAGE_SORT_ORDER) return STAGE_SORT_ORDER[key as MatchStage]
    return STAGE_SORT_ORDER.group
  }

  const stageDelta = order(a) - order(b)
  if (stageDelta !== 0) return stageDelta
  return a.localeCompare(b)
}

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

/** true solo antes del pitido y sin resultado ni estado live/finished de la API. */
export function canPickMatch(match: Match, now: Date = new Date()): boolean {
  const kickoff = getMatchKickoffMs(match)
  if (!Number.isFinite(kickoff)) return false
  if (now.getTime() >= kickoff) return false
  if (match.result) return false
  if (match.statusShort) {
    if (FINISHED_STATUSES.has(match.statusShort)) return false
    if (LIVE_STATUSES.has(match.statusShort)) return false
  }
  return true
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

export function getMatchLiveScore(match: Match): { home: number; away: number } | undefined {
  return match.liveScore
}

export function getMatchFinalScore(match: Match): { home: number; away: number } | undefined {
  return match.result ?? match.liveScore
}

/** Official final only — use for scoring, never liveScore. */
export function getMatchOfficialResult(match: Match): { home: number; away: number } | undefined {
  return match.result
}

/** Live → API score, or 0-0 until the feed updates. */
export function getMatchDisplayScore(
  match: Match,
  status: MatchStatus,
): { home: number; away: number } | undefined {
  switch (status) {
    case 'live':
      return match.liveScore ?? { home: 0, away: 0 }
    case 'finished':
      return getMatchFinalScore(match)
    default:
      return getMatchFinalScore(match) ?? match.liveScore
  }
}

export function isMatchLocked(match: Match, now: Date = new Date()): boolean {
  return !canPickMatch(match, now)
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

/** Finalizados: del más reciente al inaugural (kickoff descendente). */
export function sortFinishedMatchesNewestFirst(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => getMatchKickoffMs(b) - getMatchKickoffMs(a))
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
