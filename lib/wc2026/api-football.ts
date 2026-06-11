import type { Match } from '@/lib/wc2026/types'
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
  goals: { home: number | null; away: number | null }
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

function transformFixture(item: ApiFixtureItem): Match | null {
  if (!isGroupStageRound(item.league.round)) return null

  const home = resolveTeam(item.teams.home.code, item.teams.home.name)
  const away = resolveTeam(item.teams.away.code, item.teams.away.name)
  const homeCode = normalizeTeamCode(item.teams.home.code, item.teams.home.name)
  const awayCode = normalizeTeamCode(item.teams.away.code, item.teams.away.name)
  const group = resolveGroup(homeCode, awayCode)
  const { date, time } = utcDateTimeParts(item.fixture.date)
  const statusShort = item.fixture.status.short

  let result: { home: number; away: number } | undefined
  if (
    FINISHED_STATUSES.has(statusShort) &&
    item.goals.home !== null &&
    item.goals.away !== null
  ) {
    result = { home: item.goals.home, away: item.goals.away }
  }

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
    next: { revalidate: 0 },
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
