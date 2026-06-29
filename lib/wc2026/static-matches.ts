import type { Match } from '@/lib/wc2026/types'
import { TEAMS } from '@/lib/wc2026/teams'

const TZ = {
  MEX: 'America/Mexico_City',
  TOR: 'America/Toronto',
  VAN: 'America/Vancouver',
  LA: 'America/Los_Angeles',
  NY: 'America/New_York',
  HOU: 'America/Chicago',
  DAL: 'America/Chicago',
  KC: 'America/Chicago',
} as const

interface RawMatch {
  group: string
  n: number
  kickoffUtc: string
  timezone: string
  venue: string
  home: string
  away: string
  result?: { home: number; away: number }
}

const mid = (g: string, n: number) => `G${g}M${n}`

function localDateTime(kickoffUtc: string, timezone: string): { date: string; time: string } {
  const d = new Date(kickoffUtc)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? ''

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

function buildMatch(raw: RawMatch): Match {
  const { date, time } = localDateTime(raw.kickoffUtc, raw.timezone)
  return {
    id: mid(raw.group, raw.n),
    stage: 'group',
    group: raw.group,
    date,
    time,
    venue: raw.venue,
    timezone: raw.timezone,
    kickoffUtc: raw.kickoffUtc,
    home: TEAMS[raw.home],
    away: TEAMS[raw.away],
    result: raw.result,
    statusShort: raw.result != null ? 'FT' : undefined,
  }
}

const RAW_MATCHES: RawMatch[] = [
  { group: 'A', n: 1, kickoffUtc: '2026-06-11T19:00:00Z', timezone: TZ.MEX, venue: 'Estadio Ciudad de México', home: 'MEX', away: 'RSA' },
  { group: 'A', n: 2, kickoffUtc: '2026-06-12T02:00:00Z', timezone: TZ.MEX, venue: 'Estadio Guadalajara', home: 'KOR', away: 'CZE' },
  { group: 'A', n: 3, kickoffUtc: '2026-06-18T16:00:00Z', timezone: TZ.NY, venue: 'Mercedes-Benz Stadium', home: 'CZE', away: 'RSA' },
  { group: 'A', n: 4, kickoffUtc: '2026-06-19T01:00:00Z', timezone: TZ.MEX, venue: 'Estadio Guadalajara', home: 'MEX', away: 'KOR' },
  { group: 'A', n: 5, kickoffUtc: '2026-06-25T01:00:00Z', timezone: TZ.MEX, venue: 'Estadio Ciudad de México', home: 'CZE', away: 'MEX' },
  { group: 'A', n: 6, kickoffUtc: '2026-06-25T01:00:00Z', timezone: TZ.MEX, venue: 'Estadio Monterrey', home: 'RSA', away: 'KOR' },
  { group: 'B', n: 1, kickoffUtc: '2026-06-12T19:00:00Z', timezone: TZ.TOR, venue: 'BMO Field', home: 'CAN', away: 'BIH' },
  { group: 'B', n: 2, kickoffUtc: '2026-06-13T19:00:00Z', timezone: TZ.LA, venue: "Levi's Stadium", home: 'QAT', away: 'SUI' },
  { group: 'B', n: 3, kickoffUtc: '2026-06-18T19:00:00Z', timezone: TZ.LA, venue: 'SoFi Stadium', home: 'SUI', away: 'BIH' },
  { group: 'B', n: 4, kickoffUtc: '2026-06-18T22:00:00Z', timezone: TZ.VAN, venue: 'BC Place', home: 'CAN', away: 'QAT' },
  { group: 'B', n: 5, kickoffUtc: '2026-06-24T19:00:00Z', timezone: TZ.VAN, venue: 'BC Place', home: 'SUI', away: 'CAN' },
  { group: 'B', n: 6, kickoffUtc: '2026-06-24T19:00:00Z', timezone: TZ.LA, venue: 'Lumen Field', home: 'BIH', away: 'QAT' },
  { group: 'C', n: 1, kickoffUtc: '2026-06-13T22:00:00Z', timezone: TZ.NY, venue: 'MetLife Stadium', home: 'BRA', away: 'MAR' },
  { group: 'C', n: 2, kickoffUtc: '2026-06-14T01:00:00Z', timezone: TZ.NY, venue: 'Gillette Stadium', home: 'HAI', away: 'SCO' },
  { group: 'C', n: 3, kickoffUtc: '2026-06-19T22:00:00Z', timezone: TZ.NY, venue: 'Gillette Stadium', home: 'SCO', away: 'MAR' },
  { group: 'C', n: 4, kickoffUtc: '2026-06-20T00:30:00Z', timezone: TZ.NY, venue: 'Lincoln Financial Field', home: 'BRA', away: 'HAI' },
  { group: 'C', n: 5, kickoffUtc: '2026-06-24T22:00:00Z', timezone: TZ.NY, venue: 'Hard Rock Stadium', home: 'SCO', away: 'BRA' },
  { group: 'C', n: 6, kickoffUtc: '2026-06-24T22:00:00Z', timezone: TZ.NY, venue: 'Mercedes-Benz Stadium', home: 'MAR', away: 'HAI' },
  { group: 'D', n: 1, kickoffUtc: '2026-06-13T01:00:00Z', timezone: TZ.LA, venue: 'SoFi Stadium', home: 'USA', away: 'PAR' },
  { group: 'D', n: 2, kickoffUtc: '2026-06-14T04:00:00Z', timezone: TZ.VAN, venue: 'BC Place', home: 'AUS', away: 'TUR' },
  { group: 'D', n: 3, kickoffUtc: '2026-06-19T19:00:00Z', timezone: TZ.LA, venue: 'Lumen Field', home: 'USA', away: 'AUS' },
  { group: 'D', n: 4, kickoffUtc: '2026-06-20T03:00:00Z', timezone: TZ.LA, venue: "Levi's Stadium", home: 'TUR', away: 'PAR' },
  { group: 'D', n: 5, kickoffUtc: '2026-06-26T02:00:00Z', timezone: TZ.LA, venue: 'SoFi Stadium', home: 'TUR', away: 'USA' },
  { group: 'D', n: 6, kickoffUtc: '2026-06-26T02:00:00Z', timezone: TZ.LA, venue: "Levi's Stadium", home: 'PAR', away: 'AUS' },
  { group: 'E', n: 1, kickoffUtc: '2026-06-14T17:00:00Z', timezone: TZ.HOU, venue: 'NRG Stadium', home: 'GER', away: 'CUW' },
  { group: 'E', n: 2, kickoffUtc: '2026-06-14T23:00:00Z', timezone: TZ.NY, venue: 'Lincoln Financial Field', home: 'CIV', away: 'ECU' },
  { group: 'E', n: 3, kickoffUtc: '2026-06-20T20:00:00Z', timezone: TZ.TOR, venue: 'BMO Field', home: 'GER', away: 'CIV' },
  { group: 'E', n: 4, kickoffUtc: '2026-06-21T00:00:00Z', timezone: TZ.KC, venue: 'Arrowhead Stadium', home: 'ECU', away: 'CUW' },
  { group: 'E', n: 5, kickoffUtc: '2026-06-25T20:00:00Z', timezone: TZ.NY, venue: 'Lincoln Financial Field', home: 'CUW', away: 'CIV' },
  { group: 'E', n: 6, kickoffUtc: '2026-06-25T20:00:00Z', timezone: TZ.NY, venue: 'MetLife Stadium', home: 'ECU', away: 'GER' },
  { group: 'F', n: 1, kickoffUtc: '2026-06-14T20:00:00Z', timezone: TZ.DAL, venue: 'AT&T Stadium', home: 'NED', away: 'JPN' },
  { group: 'F', n: 2, kickoffUtc: '2026-06-15T02:00:00Z', timezone: TZ.MEX, venue: 'Estadio BBVA', home: 'SWE', away: 'TUN' },
  { group: 'F', n: 3, kickoffUtc: '2026-06-20T17:00:00Z', timezone: TZ.HOU, venue: 'NRG Stadium', home: 'NED', away: 'SWE' },
  { group: 'F', n: 4, kickoffUtc: '2026-06-21T04:00:00Z', timezone: TZ.MEX, venue: 'Estadio BBVA', home: 'TUN', away: 'JPN' },
  { group: 'F', n: 5, kickoffUtc: '2026-06-25T23:00:00Z', timezone: TZ.DAL, venue: 'AT&T Stadium', home: 'JPN', away: 'SWE' },
  { group: 'F', n: 6, kickoffUtc: '2026-06-25T23:00:00Z', timezone: TZ.KC, venue: 'Arrowhead Stadium', home: 'TUN', away: 'NED' },
  { group: 'G', n: 1, kickoffUtc: '2026-06-15T19:00:00Z', timezone: TZ.LA, venue: 'Lumen Field', home: 'BEL', away: 'EGY' },
  { group: 'G', n: 2, kickoffUtc: '2026-06-16T01:00:00Z', timezone: TZ.LA, venue: 'SoFi Stadium', home: 'IRN', away: 'NZL' },
  { group: 'G', n: 3, kickoffUtc: '2026-06-21T19:00:00Z', timezone: TZ.LA, venue: 'SoFi Stadium', home: 'BEL', away: 'IRN' },
  { group: 'G', n: 4, kickoffUtc: '2026-06-22T01:00:00Z', timezone: TZ.VAN, venue: 'BC Place', home: 'NZL', away: 'EGY' },
  { group: 'G', n: 5, kickoffUtc: '2026-06-27T03:00:00Z', timezone: TZ.LA, venue: 'Lumen Field', home: 'EGY', away: 'IRN' },
  { group: 'G', n: 6, kickoffUtc: '2026-06-27T03:00:00Z', timezone: TZ.VAN, venue: 'BC Place', home: 'NZL', away: 'BEL' },
  { group: 'H', n: 1, kickoffUtc: '2026-06-15T16:00:00Z', timezone: TZ.NY, venue: 'Mercedes-Benz Stadium', home: 'ESP', away: 'CPV' },
  { group: 'H', n: 2, kickoffUtc: '2026-06-15T22:00:00Z', timezone: TZ.NY, venue: 'Hard Rock Stadium', home: 'KSA', away: 'URU' },
  { group: 'H', n: 3, kickoffUtc: '2026-06-21T16:00:00Z', timezone: TZ.NY, venue: 'Mercedes-Benz Stadium', home: 'ESP', away: 'KSA' },
  { group: 'H', n: 4, kickoffUtc: '2026-06-21T22:00:00Z', timezone: TZ.NY, venue: 'Hard Rock Stadium', home: 'URU', away: 'CPV' },
  { group: 'H', n: 5, kickoffUtc: '2026-06-27T00:00:00Z', timezone: TZ.HOU, venue: 'NRG Stadium', home: 'CPV', away: 'KSA' },
  { group: 'H', n: 6, kickoffUtc: '2026-06-27T00:00:00Z', timezone: TZ.MEX, venue: 'Estadio Akron', home: 'URU', away: 'ESP' },
  { group: 'I', n: 1, kickoffUtc: '2026-06-16T19:00:00Z', timezone: TZ.NY, venue: 'MetLife Stadium', home: 'FRA', away: 'SEN' },
  { group: 'I', n: 2, kickoffUtc: '2026-06-16T22:00:00Z', timezone: TZ.NY, venue: 'Gillette Stadium', home: 'IRQ', away: 'NOR' },
  { group: 'I', n: 3, kickoffUtc: '2026-06-22T21:00:00Z', timezone: TZ.NY, venue: 'Lincoln Financial Field', home: 'FRA', away: 'IRQ' },
  { group: 'I', n: 4, kickoffUtc: '2026-06-23T00:00:00Z', timezone: TZ.NY, venue: 'MetLife Stadium', home: 'NOR', away: 'SEN' },
  { group: 'I', n: 5, kickoffUtc: '2026-06-26T19:00:00Z', timezone: TZ.NY, venue: 'Gillette Stadium', home: 'NOR', away: 'FRA' },
  { group: 'I', n: 6, kickoffUtc: '2026-06-26T19:00:00Z', timezone: TZ.TOR, venue: 'BMO Field', home: 'SEN', away: 'IRQ' },
  { group: 'J', n: 1, kickoffUtc: '2026-06-17T01:00:00Z', timezone: TZ.KC, venue: 'Arrowhead Stadium', home: 'ARG', away: 'ALG' },
  { group: 'J', n: 2, kickoffUtc: '2026-06-17T04:00:00Z', timezone: TZ.LA, venue: "Levi's Stadium", home: 'AUT', away: 'JOR' },
  { group: 'J', n: 3, kickoffUtc: '2026-06-22T17:00:00Z', timezone: TZ.DAL, venue: 'AT&T Stadium', home: 'ARG', away: 'AUT' },
  { group: 'J', n: 4, kickoffUtc: '2026-06-23T03:00:00Z', timezone: TZ.LA, venue: "Levi's Stadium", home: 'JOR', away: 'ALG' },
  { group: 'J', n: 5, kickoffUtc: '2026-06-28T02:00:00Z', timezone: TZ.KC, venue: 'Arrowhead Stadium', home: 'ALG', away: 'AUT' },
  { group: 'J', n: 6, kickoffUtc: '2026-06-28T02:00:00Z', timezone: TZ.DAL, venue: 'AT&T Stadium', home: 'JOR', away: 'ARG' },
  { group: 'K', n: 1, kickoffUtc: '2026-06-17T17:00:00Z', timezone: TZ.HOU, venue: 'NRG Stadium', home: 'POR', away: 'COD' },
  { group: 'K', n: 2, kickoffUtc: '2026-06-18T02:00:00Z', timezone: TZ.MEX, venue: 'Estadio Ciudad de México', home: 'UZB', away: 'COL' },
  { group: 'K', n: 3, kickoffUtc: '2026-06-23T17:00:00Z', timezone: TZ.HOU, venue: 'NRG Stadium', home: 'POR', away: 'UZB' },
  { group: 'K', n: 4, kickoffUtc: '2026-06-24T02:00:00Z', timezone: TZ.MEX, venue: 'Estadio Guadalajara', home: 'COL', away: 'COD' },
  { group: 'K', n: 5, kickoffUtc: '2026-06-27T23:30:00Z', timezone: TZ.NY, venue: 'Hard Rock Stadium', home: 'COL', away: 'POR' },
  { group: 'K', n: 6, kickoffUtc: '2026-06-27T23:30:00Z', timezone: TZ.NY, venue: 'Mercedes-Benz Stadium', home: 'COD', away: 'UZB' },
  { group: 'L', n: 1, kickoffUtc: '2026-06-17T20:00:00Z', timezone: TZ.DAL, venue: 'AT&T Stadium', home: 'ENG', away: 'CRO' },
  { group: 'L', n: 2, kickoffUtc: '2026-06-17T23:00:00Z', timezone: TZ.TOR, venue: 'BMO Field', home: 'GHA', away: 'PAN' },
  { group: 'L', n: 3, kickoffUtc: '2026-06-23T20:00:00Z', timezone: TZ.NY, venue: 'Gillette Stadium', home: 'ENG', away: 'GHA' },
  { group: 'L', n: 4, kickoffUtc: '2026-06-23T23:00:00Z', timezone: TZ.TOR, venue: 'BMO Field', home: 'PAN', away: 'CRO' },
  { group: 'L', n: 5, kickoffUtc: '2026-06-27T21:00:00Z', timezone: TZ.NY, venue: 'MetLife Stadium', home: 'PAN', away: 'ENG' },
  { group: 'L', n: 6, kickoffUtc: '2026-06-27T21:00:00Z', timezone: TZ.NY, venue: 'Lincoln Financial Field', home: 'CRO', away: 'GHA' },
]

export const STATIC_GROUP_MATCHES: Match[] = RAW_MATCHES.map(buildMatch)
