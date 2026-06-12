import type { Match } from '@/lib/wc2026/types'
import { WC2026_MATCH_CACHE_SECONDS, WC2026_MATCH_CACHE_TAG } from '@/lib/wc2026/cache'
import { normalizeTeamCode } from '@/lib/wc2026/teams'

const DEFAULT_BASE = 'https://worldcup26.ir'

export interface WorldCup26Game {
  id: string
  home_team_name_en: string
  away_team_name_en: string
  home_score: string
  away_score: string
  group: string
  local_date: string
  stadium_id: string
  finished: string
  time_elapsed: string
  type: string
}

interface WorldCup26GamesResponse {
  games: WorldCup26Game[]
}

function parseScore(value: string): number | null {
  if (!value || value === 'null') return null
  const n = Number.parseInt(value, 10)
  return Number.isNaN(n) ? null : n
}

function gameLookupKey(group: string, homeCode: string, awayCode: string): string {
  return `${group}:${homeCode}:${awayCode}`
}

function mapGameStatus(game: WorldCup26Game): {
  statusShort: string
  elapsed?: number | null
  result?: { home: number; away: number }
  liveScore?: { home: number; away: number }
} {
  const home = parseScore(game.home_score)
  const away = parseScore(game.away_score)
  const hasScore = home != null && away != null

  if (game.finished === 'TRUE' || game.time_elapsed === 'finished') {
    return {
      statusShort: 'FT',
      result: hasScore ? { home, away } : undefined,
    }
  }

  if (game.time_elapsed === 'notstarted') {
    return { statusShort: 'NS' }
  }

  const elapsed = Number.parseInt(game.time_elapsed, 10)
  if (!Number.isNaN(elapsed)) {
    return {
      statusShort: 'LIVE',
      elapsed,
      liveScore: hasScore ? { home, away } : undefined,
    }
  }

  return {
    statusShort: game.time_elapsed.toUpperCase(),
    liveScore: hasScore ? { home, away } : undefined,
  }
}

export async function fetchWorldCup26Games(
  baseUrl = process.env.WC2026_API_BASE?.trim() || DEFAULT_BASE,
): Promise<WorldCup26Game[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/get/games`

  const res = await fetch(url, {
    next: {
      revalidate: WC2026_MATCH_CACHE_SECONDS,
      tags: [WC2026_MATCH_CACHE_TAG],
    },
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`worldcup26.ir HTTP ${res.status}`)
  }

  const data = (await res.json()) as WorldCup26GamesResponse
  return data.games.filter(g => g.type === 'group')
}

/** Aplica marcadores y estado de worldcup26.ir sobre el calendario estático (conserva ids GAM1). */
export function enrichMatchesFromWorldCup26(
  matches: Match[],
  games: WorldCup26Game[],
): Match[] {
  const byTeams = new Map<string, WorldCup26Game>()
  for (const game of games) {
    const homeCode = normalizeTeamCode(null, game.home_team_name_en)
    const awayCode = normalizeTeamCode(null, game.away_team_name_en)
    byTeams.set(gameLookupKey(game.group, homeCode, awayCode), game)
  }

  return matches.map(match => {
    const key = gameLookupKey(match.group, match.home.code, match.away.code)
    const game = byTeams.get(key)
    if (!game) return match

    const status = mapGameStatus(game)

    return {
      ...match,
      result: status.result ?? match.result,
      liveScore: status.result ? undefined : status.liveScore ?? match.liveScore,
      statusShort: status.statusShort,
      elapsed: status.elapsed ?? match.elapsed,
    }
  })
}

export function countEnrichedMatches(matches: Match[], games: WorldCup26Game[]): number {
  const keys = new Set(
    games.map(g => gameLookupKey(
      g.group,
      normalizeTeamCode(null, g.home_team_name_en),
      normalizeTeamCode(null, g.away_team_name_en),
    )),
  )
  return matches.filter(m => keys.has(gameLookupKey(m.group, m.home.code, m.away.code))).length
}
