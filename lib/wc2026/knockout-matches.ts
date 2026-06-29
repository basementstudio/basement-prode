import type { Match, MatchStage, Team } from '@/lib/wc2026/types'
import { formatKickoffDate, formatKickoffDay, formatKickoffTime } from '@/lib/wc2026/format-local'
import { resolveTeam } from '@/lib/wc2026/teams'
import {
  isKnockoutGameType,
  mapGameStatus,
  type WorldCup26Game,
} from '@/lib/wc2026/worldcup26-api'

const KNOCKOUT_TIMEZONE = 'America/New_York'

const GAME_TYPE_TO_STAGE: Record<string, MatchStage> = {
  r32: 'r32',
  r16: 'r16',
  qf: 'qf',
  sf: 'sf',
  third: 'third',
  final: 'final',
}

const STAGE_ORDER: Record<MatchStage, number> = {
  r32: 0,
  r16: 1,
  qf: 2,
  sf: 3,
  third: 4,
  final: 5,
  group: 10,
}

export function knockoutMatchId(apiGameId: string): string {
  return `KO${apiGameId}`
}

/** Convierte `MM/DD/YYYY HH:mm` (hora local del estadio) a ISO UTC. */
export function parseApiLocalDate(
  localDate: string,
  timeZone = KNOCKOUT_TIMEZONE,
): string {
  const match = localDate.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/)
  if (!match) return new Date().toISOString()

  const year = Number(match[3])
  const month = Number(match[1])
  const day = Number(match[2])
  const hour = Number(match[4])
  const minute = Number(match[5])

  let utcMs = Date.UTC(year, month - 1, day, hour, minute)

  for (let attempt = 0; attempt < 4; attempt++) {
    const probe = new Date(utcMs)
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(probe)

    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find(part => part.type === type)?.value ?? '0')

    const actualLocalMs = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour') === 24 ? 0 : get('hour'),
      get('minute'),
    )
    const targetLocalMs = Date.UTC(year, month - 1, day, hour, minute)
    const delta = targetLocalMs - actualLocalMs
    if (delta === 0) break
    utcMs += delta
  }

  return new Date(utcMs).toISOString()
}

function resolveKnockoutSide(
  game: WorldCup26Game,
  side: 'home' | 'away',
): Team {
  const name = side === 'home' ? game.home_team_name_en : game.away_team_name_en
  const label = side === 'home' ? game.home_team_label : game.away_team_label
  const trimmed = name?.trim()

  if (trimmed) return resolveTeam(null, trimmed)

  const fallback = label?.trim() || 'TBD'
  return {
    code: `TBD${game.id}${side === 'home' ? 'H' : 'A'}`,
    name: fallback,
    flag: '#333333,#666666,#999999',
  }
}

export function mapKnockoutGameToMatch(game: WorldCup26Game): Match | null {
  if (!isKnockoutGameType(game.type)) return null

  const stage = GAME_TYPE_TO_STAGE[game.type]
  if (!stage) return null

  const kickoffUtc = parseApiLocalDate(game.local_date)
  const status = mapGameStatus(game)
  const home = resolveKnockoutSide(game, 'home')
  const away = resolveKnockoutSide(game, 'away')

  return {
    id: knockoutMatchId(game.id),
    stage,
    group: game.group,
    date: formatKickoffDate(kickoffUtc, KNOCKOUT_TIMEZONE),
    time: formatKickoffTime(kickoffUtc, KNOCKOUT_TIMEZONE),
    venue: `Stadium ${game.stadium_id}`,
    timezone: KNOCKOUT_TIMEZONE,
    kickoffUtc,
    home,
    away,
    result: status.result,
    liveScore: status.result ? undefined : status.liveScore,
    statusShort: status.statusShort,
    elapsed: status.elapsed,
  }
}

export function buildKnockoutMatchesFromGames(games: WorldCup26Game[]): Match[] {
  return games
    .map(mapKnockoutGameToMatch)
    .filter((match): match is Match => match != null)
    .sort((a, b) => {
      const stageDelta = STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]
      if (stageDelta !== 0) return stageDelta
      return new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime()
    })
}
