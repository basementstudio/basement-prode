import type { Match } from '@/lib/wc2026/types'
import { WC2026_MATCH_CACHE_SECONDS, WC2026_MATCH_CACHE_TAG } from '@/lib/wc2026/cache'
import { normalizeTeamCode, resolveGroup, resolveTeam } from '@/lib/wc2026/teams'

const API_BASE = 'https://v3.football.api-sports.io'
const WC_LEAGUE_ID = 1
const WC_SEASON = 2026

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'])
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO'])

interface ApiFixtureResponse {
  response: ApiFixtureItem[]
  errors?: Record<string, string>
}

interface ApiScoreLine {
  home: number | null
  away: number | null
}

interface ApiFixtureItem {
  fixture: {
    id: number
    date: string
    timestamp: number
    timezone: string
    status: { short: string; elapsed: number | null }
    venue: { name: string | null; city: string | null }
  }
  league: { round: string | null }
  teams: {
    home: { name: string; code: string | null }
    away: { name: string; code: string | null }
  }
  goals: ApiScoreLine
  score?: {
    halftime?: ApiScoreLine
    fulltime?: ApiScoreLine
    extratime?: ApiScoreLine
    penalty?: ApiScoreLine
  }
}

function isGroupStageRound(round: string | null): boolean {
  if (!round) return false
  return round.toLowerCase().includes('group stage')
}

function utcDateTimeParts(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const date = d.toISOString().slice(0, 10)
  const time = d.toISOString().slice(11, 16)
  return { date, time }
}

function parseScoreLine(line?: ApiScoreLine | null): { home: number; away: number } | undefined {
  if (!line || line.home == null || line.away == null) return undefined
  return { home: line.home, away: line.away }
}

function extractFinalResult(item: ApiFixtureItem): { home: number; away: number } | undefined {
  const statusShort = item.fixture.status.short
  if (!FINISHED_STATUSES.has(statusShort)) return undefined

  return (
    parseScoreLine(item.score?.fulltime)
    ?? parseScoreLine(item.goals)
    ?? parseScoreLine(item.score?.extratime)
    ?? parseScoreLine(item.score?.penalty)
  )
}

function extractLiveScore(item: ApiFixtureItem): { home: number; away: number } | undefined {
  const statusShort = item.fixture.status.short
  if (!LIVE_STATUSES.has(statusShort)) return undefined
  return parseScoreLine(item.goals)
}

function transformFixture(item: ApiFixtureItem): Match | null {
  if (!isGroupStageRound(item.league.round)) return null

  const home = resolveTeam(item.teams.home.code, item.teams.home.name)
  const away = resolveTeam(item.teams.away.code, item.teams.away.name)
  const homeCode = normalizeTeamCode(item.teams.home.code, item.teams.home.name)
  const awayCode = normalizeTeamCode(item.teams.away.code, item.teams.away.name)
  const group = resolveGroup(homeCode, awayCode)
  const { date, time } = utcDateTimeParts(item.fixture.date)
  const statusShort = item.fixture.status.short
  const result = extractFinalResult(item)
  const liveScore = result ? undefined : extractLiveScore(item)

  const venue = [item.fixture.venue.name, item.fixture.venue.city]
    .filter(Boolean)
    .join(', ') || 'Por confirmar'

  return {
    id: String(item.fixture.id),
    group,
    date,
    time,
    venue,
    timezone: 'UTC',
    kickoffUtc: item.fixture.date,
    home,
    away,
    result,
    liveScore,
    statusShort,
    elapsed: item.fixture.status.elapsed,
  }
}

export async function fetchGroupStageFromApi(apiKey: string): Promise<Match[]> {
  const url = `${API_BASE}/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`

  const res = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
    },
    next: {
      revalidate: WC2026_MATCH_CACHE_SECONDS,
      tags: [WC2026_MATCH_CACHE_TAG],
    },
  })

  if (!res.ok) {
    throw new Error(`API-Football HTTP ${res.status}`)
  }

  const data = (await res.json()) as ApiFixtureResponse

  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football: ${JSON.stringify(data.errors)}`)
  }

  const matches = data.response
    .map(transformFixture)
    .filter((m): m is Match => m !== null)

  return matches.sort(
    (a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime(),
  )
}

export function hasLiveMatches(matches: Match[]): boolean {
  return matches.some(m => m.statusShort && LIVE_STATUSES.has(m.statusShort))
}
