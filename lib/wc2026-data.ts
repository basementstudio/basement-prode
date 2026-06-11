// World Cup 2026 — Fase de grupos (datos oficiales FIFA)
// Fuente: fifa.com/scores-fixtures (sorteo dic 2025, horarios UTC oficiales)
// 12 grupos (A–L), 4 equipos c/u, 72 partidos

export interface Team {
  code: string
  name: string
  flag: string
}

export type MatchStatus = 'upcoming' | 'live' | 'finished'

export interface Match {
  id: string
  group: string
  date: string
  time: string
  venue: string
  timezone: string
  kickoffUtc: string
  home: Team
  away: Team
  result?: { home: number; away: number }
}

export interface Group {
  letter: string
  teams: Team[]
  matches: Match[]
}

/** Duración estimada del partido para detectar "en vivo" (90' + descanso). */
export const MATCH_DURATION_MS = 105 * 60 * 1000

const T: Record<string, Team> = {
  MEX: { code: 'MEX', name: 'México', flag: '#006847,#FFFFFF,#CE1126' },
  RSA: { code: 'RSA', name: 'Sudáfrica', flag: '#007A4D,#FFB81C,#001489' },
  KOR: { code: 'KOR', name: 'Corea del Sur', flag: '#CD2E3A,#FFFFFF,#003478' },
  CZE: { code: 'CZE', name: 'Rep. Checa', flag: '#11457E,#FFFFFF,#D7141A' },
  CAN: { code: 'CAN', name: 'Canadá', flag: '#FF0000,#FFFFFF,#FF0000' },
  BIH: { code: 'BIH', name: 'Bosnia y Herzegovina', flag: '#002395,#FECB00,#002395' },
  QAT: { code: 'QAT', name: 'Catar', flag: '#8D1B3D,#FFFFFF,#8D1B3D' },
  SUI: { code: 'SUI', name: 'Suiza', flag: '#D52B1E,#FFFFFF,#D52B1E' },
  BRA: { code: 'BRA', name: 'Brasil', flag: '#009C3B,#FFDF00,#002776' },
  MAR: { code: 'MAR', name: 'Marruecos', flag: '#006233,#C1272D,#006233' },
  HAI: { code: 'HAI', name: 'Haití', flag: '#00209F,#D21034,#00209F' },
  SCO: { code: 'SCO', name: 'Escocia', flag: '#005EB8,#FFFFFF,#005EB8' },
  USA: { code: 'USA', name: 'Estados Unidos', flag: '#B22234,#FFFFFF,#3C3B6E' },
  PAR: { code: 'PAR', name: 'Paraguay', flag: '#D52B1E,#FFFFFF,#0038A8' },
  AUS: { code: 'AUS', name: 'Australia', flag: '#00008B,#FFFFFF,#FF0000' },
  TUR: { code: 'TUR', name: 'Turquía', flag: '#E30A17,#FFFFFF,#E30A17' },
  GER: { code: 'GER', name: 'Alemania', flag: '#000000,#DD0000,#FFCE00' },
  CUW: { code: 'CUW', name: 'Curazao', flag: '#002B7F,#F7D417,#002B7F' },
  CIV: { code: 'CIV', name: 'Costa de Marfil', flag: '#F77F00,#FFFFFF,#009E60' },
  ECU: { code: 'ECU', name: 'Ecuador', flag: '#FCD116,#003087,#CE1126' },
  NED: { code: 'NED', name: 'Países Bajos', flag: '#AE1C28,#FFFFFF,#21468B' },
  JPN: { code: 'JPN', name: 'Japón', flag: '#FFFFFF,#BC002D,#FFFFFF' },
  SWE: { code: 'SWE', name: 'Suecia', flag: '#006AA7,#FECC00,#006AA7' },
  TUN: { code: 'TUN', name: 'Túnez', flag: '#E70013,#FFFFFF,#E70013' },
  BEL: { code: 'BEL', name: 'Bélgica', flag: '#000000,#FFDD00,#FF0000' },
  EGY: { code: 'EGY', name: 'Egipto', flag: '#CE1126,#FFFFFF,#000000' },
  IRN: { code: 'IRN', name: 'Irán', flag: '#239F40,#FFFFFF,#DA0000' },
  NZL: { code: 'NZL', name: 'Nueva Zelanda', flag: '#00247D,#FFFFFF,#CC0000' },
  ESP: { code: 'ESP', name: 'España', flag: '#AA151B,#F1BF00,#AA151B' },
  CPV: { code: 'CPV', name: 'Cabo Verde', flag: '#003893,#FFFFFF,#003893' },
  KSA: { code: 'KSA', name: 'Arabia Saudita', flag: '#006C35,#FFFFFF,#006C35' },
  URU: { code: 'URU', name: 'Uruguay', flag: '#75AADB,#FFFFFF,#75AADB' },
  FRA: { code: 'FRA', name: 'Francia', flag: '#002395,#FFFFFF,#ED2939' },
  SEN: { code: 'SEN', name: 'Senegal', flag: '#00853F,#FDEF42,#E31B23' },
  IRQ: { code: 'IRQ', name: 'Irak', flag: '#CE1126,#FFFFFF,#007A3D' },
  NOR: { code: 'NOR', name: 'Noruega', flag: '#BA0C2F,#FFFFFF,#00205B' },
  ARG: { code: 'ARG', name: 'Argentina', flag: '#74ACDF,#FFFFFF,#74ACDF' },
  ALG: { code: 'ALG', name: 'Argelia', flag: '#006233,#FFFFFF,#D21034' },
  AUT: { code: 'AUT', name: 'Austria', flag: '#ED2939,#FFFFFF,#ED2939' },
  JOR: { code: 'JOR', name: 'Jordania', flag: '#007A3D,#FFFFFF,#000000' },
  POR: { code: 'POR', name: 'Portugal', flag: '#006600,#FF0000,#006600' },
  COD: { code: 'COD', name: 'RD Congo', flag: '#007FFF,#F7D618,#CE1021' },
  UZB: { code: 'UZB', name: 'Uzbekistán', flag: '#1EB53A,#FFFFFF,#0099B5' },
  COL: { code: 'COL', name: 'Colombia', flag: '#FCD116,#003087,#CE1126' },
  ENG: { code: 'ENG', name: 'Inglaterra', flag: '#CF142B,#FFFFFF,#CF142B' },
  CRO: { code: 'CRO', name: 'Croacia', flag: '#FF0000,#FFFFFF,#0000CC' },
  GHA: { code: 'GHA', name: 'Ghana', flag: '#006B3F,#FCD116,#CE1126' },
  PAN: { code: 'PAN', name: 'Panamá', flag: '#005293,#FFFFFF,#DA121A' },
}

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
    group: raw.group,
    date,
    time,
    venue: raw.venue,
    timezone: raw.timezone,
    kickoffUtc: raw.kickoffUtc,
    home: T[raw.home],
    away: T[raw.away],
    result: raw.result,
  }
}

const RAW_MATCHES: RawMatch[] = [
  // Grupo A
  { group: 'A', n: 1, kickoffUtc: '2026-06-11T19:00:00Z', timezone: TZ.MEX, venue: 'Estadio Ciudad de México', home: 'MEX', away: 'RSA' },
  { group: 'A', n: 2, kickoffUtc: '2026-06-12T02:00:00Z', timezone: TZ.MEX, venue: 'Estadio Guadalajara', home: 'KOR', away: 'CZE' },
  { group: 'A', n: 3, kickoffUtc: '2026-06-18T16:00:00Z', timezone: TZ.NY, venue: 'Mercedes-Benz Stadium', home: 'CZE', away: 'RSA' },
  { group: 'A', n: 4, kickoffUtc: '2026-06-19T01:00:00Z', timezone: TZ.MEX, venue: 'Estadio Guadalajara', home: 'MEX', away: 'KOR' },
  { group: 'A', n: 5, kickoffUtc: '2026-06-25T01:00:00Z', timezone: TZ.MEX, venue: 'Estadio Ciudad de México', home: 'CZE', away: 'MEX' },
  { group: 'A', n: 6, kickoffUtc: '2026-06-25T01:00:00Z', timezone: TZ.MEX, venue: 'Estadio Monterrey', home: 'RSA', away: 'KOR' },
  // Grupo B
  { group: 'B', n: 1, kickoffUtc: '2026-06-12T19:00:00Z', timezone: TZ.TOR, venue: 'BMO Field', home: 'CAN', away: 'BIH' },
  { group: 'B', n: 2, kickoffUtc: '2026-06-13T19:00:00Z', timezone: TZ.LA, venue: "Levi's Stadium", home: 'QAT', away: 'SUI' },
  { group: 'B', n: 3, kickoffUtc: '2026-06-18T19:00:00Z', timezone: TZ.LA, venue: 'SoFi Stadium', home: 'SUI', away: 'BIH' },
  { group: 'B', n: 4, kickoffUtc: '2026-06-18T22:00:00Z', timezone: TZ.VAN, venue: 'BC Place', home: 'CAN', away: 'QAT' },
  { group: 'B', n: 5, kickoffUtc: '2026-06-24T19:00:00Z', timezone: TZ.VAN, venue: 'BC Place', home: 'SUI', away: 'CAN' },
  { group: 'B', n: 6, kickoffUtc: '2026-06-24T19:00:00Z', timezone: TZ.LA, venue: 'Lumen Field', home: 'BIH', away: 'QAT' },
  // Grupo C
  { group: 'C', n: 1, kickoffUtc: '2026-06-13T22:00:00Z', timezone: TZ.NY, venue: 'MetLife Stadium', home: 'BRA', away: 'MAR' },
  { group: 'C', n: 2, kickoffUtc: '2026-06-14T01:00:00Z', timezone: TZ.NY, venue: 'Gillette Stadium', home: 'HAI', away: 'SCO' },
  { group: 'C', n: 3, kickoffUtc: '2026-06-19T22:00:00Z', timezone: TZ.NY, venue: 'Gillette Stadium', home: 'SCO', away: 'MAR' },
  { group: 'C', n: 4, kickoffUtc: '2026-06-20T00:30:00Z', timezone: TZ.NY, venue: 'Lincoln Financial Field', home: 'BRA', away: 'HAI' },
  { group: 'C', n: 5, kickoffUtc: '2026-06-24T22:00:00Z', timezone: TZ.NY, venue: 'Hard Rock Stadium', home: 'SCO', away: 'BRA' },
  { group: 'C', n: 6, kickoffUtc: '2026-06-24T22:00:00Z', timezone: TZ.NY, venue: 'Mercedes-Benz Stadium', home: 'MAR', away: 'HAI' },
  // Grupo D
  { group: 'D', n: 1, kickoffUtc: '2026-06-13T01:00:00Z', timezone: TZ.LA, venue: 'SoFi Stadium', home: 'USA', away: 'PAR' },
  { group: 'D', n: 2, kickoffUtc: '2026-06-14T04:00:00Z', timezone: TZ.VAN, venue: 'BC Place', home: 'AUS', away: 'TUR' },
  { group: 'D', n: 3, kickoffUtc: '2026-06-19T19:00:00Z', timezone: TZ.LA, venue: 'Lumen Field', home: 'USA', away: 'AUS' },
  { group: 'D', n: 4, kickoffUtc: '2026-06-20T03:00:00Z', timezone: TZ.LA, venue: "Levi's Stadium", home: 'TUR', away: 'PAR' },
  { group: 'D', n: 5, kickoffUtc: '2026-06-26T02:00:00Z', timezone: TZ.LA, venue: 'SoFi Stadium', home: 'TUR', away: 'USA' },
  { group: 'D', n: 6, kickoffUtc: '2026-06-26T02:00:00Z', timezone: TZ.LA, venue: "Levi's Stadium", home: 'PAR', away: 'AUS' },
  // Grupo E
  { group: 'E', n: 1, kickoffUtc: '2026-06-14T17:00:00Z', timezone: TZ.HOU, venue: 'NRG Stadium', home: 'GER', away: 'CUW' },
  { group: 'E', n: 2, kickoffUtc: '2026-06-14T23:00:00Z', timezone: TZ.NY, venue: 'Lincoln Financial Field', home: 'CIV', away: 'ECU' },
  { group: 'E', n: 3, kickoffUtc: '2026-06-20T20:00:00Z', timezone: TZ.TOR, venue: 'BMO Field', home: 'GER', away: 'CIV' },
  { group: 'E', n: 4, kickoffUtc: '2026-06-21T00:00:00Z', timezone: TZ.KC, venue: 'Arrowhead Stadium', home: 'ECU', away: 'CUW' },
  { group: 'E', n: 5, kickoffUtc: '2026-06-25T20:00:00Z', timezone: TZ.NY, venue: 'Lincoln Financial Field', home: 'CUW', away: 'CIV' },
  { group: 'E', n: 6, kickoffUtc: '2026-06-25T20:00:00Z', timezone: TZ.NY, venue: 'MetLife Stadium', home: 'ECU', away: 'GER' },
  // Grupo F
  { group: 'F', n: 1, kickoffUtc: '2026-06-14T20:00:00Z', timezone: TZ.DAL, venue: 'AT&T Stadium', home: 'NED', away: 'JPN' },
  { group: 'F', n: 2, kickoffUtc: '2026-06-15T02:00:00Z', timezone: TZ.MEX, venue: 'Estadio BBVA', home: 'SWE', away: 'TUN' },
  { group: 'F', n: 3, kickoffUtc: '2026-06-20T17:00:00Z', timezone: TZ.HOU, venue: 'NRG Stadium', home: 'NED', away: 'SWE' },
  { group: 'F', n: 4, kickoffUtc: '2026-06-21T04:00:00Z', timezone: TZ.MEX, venue: 'Estadio BBVA', home: 'TUN', away: 'JPN' },
  { group: 'F', n: 5, kickoffUtc: '2026-06-25T23:00:00Z', timezone: TZ.DAL, venue: 'AT&T Stadium', home: 'JPN', away: 'SWE' },
  { group: 'F', n: 6, kickoffUtc: '2026-06-25T23:00:00Z', timezone: TZ.KC, venue: 'Arrowhead Stadium', home: 'TUN', away: 'NED' },
  // Grupo G
  { group: 'G', n: 1, kickoffUtc: '2026-06-15T19:00:00Z', timezone: TZ.LA, venue: 'Lumen Field', home: 'BEL', away: 'EGY' },
  { group: 'G', n: 2, kickoffUtc: '2026-06-16T01:00:00Z', timezone: TZ.LA, venue: 'SoFi Stadium', home: 'IRN', away: 'NZL' },
  { group: 'G', n: 3, kickoffUtc: '2026-06-21T19:00:00Z', timezone: TZ.LA, venue: 'SoFi Stadium', home: 'BEL', away: 'IRN' },
  { group: 'G', n: 4, kickoffUtc: '2026-06-22T01:00:00Z', timezone: TZ.VAN, venue: 'BC Place', home: 'NZL', away: 'EGY' },
  { group: 'G', n: 5, kickoffUtc: '2026-06-27T03:00:00Z', timezone: TZ.LA, venue: 'Lumen Field', home: 'EGY', away: 'IRN' },
  { group: 'G', n: 6, kickoffUtc: '2026-06-27T03:00:00Z', timezone: TZ.VAN, venue: 'BC Place', home: 'NZL', away: 'BEL' },
  // Grupo H
  { group: 'H', n: 1, kickoffUtc: '2026-06-15T16:00:00Z', timezone: TZ.NY, venue: 'Mercedes-Benz Stadium', home: 'ESP', away: 'CPV' },
  { group: 'H', n: 2, kickoffUtc: '2026-06-15T22:00:00Z', timezone: TZ.NY, venue: 'Hard Rock Stadium', home: 'KSA', away: 'URU' },
  { group: 'H', n: 3, kickoffUtc: '2026-06-21T16:00:00Z', timezone: TZ.NY, venue: 'Mercedes-Benz Stadium', home: 'ESP', away: 'KSA' },
  { group: 'H', n: 4, kickoffUtc: '2026-06-21T22:00:00Z', timezone: TZ.NY, venue: 'Hard Rock Stadium', home: 'URU', away: 'CPV' },
  { group: 'H', n: 5, kickoffUtc: '2026-06-27T00:00:00Z', timezone: TZ.HOU, venue: 'NRG Stadium', home: 'CPV', away: 'KSA' },
  { group: 'H', n: 6, kickoffUtc: '2026-06-27T00:00:00Z', timezone: TZ.MEX, venue: 'Estadio Akron', home: 'URU', away: 'ESP' },
  // Grupo I
  { group: 'I', n: 1, kickoffUtc: '2026-06-16T19:00:00Z', timezone: TZ.NY, venue: 'MetLife Stadium', home: 'FRA', away: 'SEN' },
  { group: 'I', n: 2, kickoffUtc: '2026-06-16T22:00:00Z', timezone: TZ.NY, venue: 'Gillette Stadium', home: 'IRQ', away: 'NOR' },
  { group: 'I', n: 3, kickoffUtc: '2026-06-22T21:00:00Z', timezone: TZ.NY, venue: 'Lincoln Financial Field', home: 'FRA', away: 'IRQ' },
  { group: 'I', n: 4, kickoffUtc: '2026-06-23T00:00:00Z', timezone: TZ.NY, venue: 'MetLife Stadium', home: 'NOR', away: 'SEN' },
  { group: 'I', n: 5, kickoffUtc: '2026-06-26T19:00:00Z', timezone: TZ.NY, venue: 'Gillette Stadium', home: 'NOR', away: 'FRA' },
  { group: 'I', n: 6, kickoffUtc: '2026-06-26T19:00:00Z', timezone: TZ.TOR, venue: 'BMO Field', home: 'SEN', away: 'IRQ' },
  // Grupo J
  { group: 'J', n: 1, kickoffUtc: '2026-06-17T01:00:00Z', timezone: TZ.KC, venue: 'Arrowhead Stadium', home: 'ARG', away: 'ALG' },
  { group: 'J', n: 2, kickoffUtc: '2026-06-17T04:00:00Z', timezone: TZ.LA, venue: "Levi's Stadium", home: 'AUT', away: 'JOR' },
  { group: 'J', n: 3, kickoffUtc: '2026-06-22T17:00:00Z', timezone: TZ.DAL, venue: 'AT&T Stadium', home: 'ARG', away: 'AUT' },
  { group: 'J', n: 4, kickoffUtc: '2026-06-23T03:00:00Z', timezone: TZ.LA, venue: "Levi's Stadium", home: 'JOR', away: 'ALG' },
  { group: 'J', n: 5, kickoffUtc: '2026-06-28T02:00:00Z', timezone: TZ.KC, venue: 'Arrowhead Stadium', home: 'ALG', away: 'AUT' },
  { group: 'J', n: 6, kickoffUtc: '2026-06-28T02:00:00Z', timezone: TZ.DAL, venue: 'AT&T Stadium', home: 'JOR', away: 'ARG' },
  // Grupo K
  { group: 'K', n: 1, kickoffUtc: '2026-06-17T17:00:00Z', timezone: TZ.HOU, venue: 'NRG Stadium', home: 'POR', away: 'COD' },
  { group: 'K', n: 2, kickoffUtc: '2026-06-18T02:00:00Z', timezone: TZ.MEX, venue: 'Estadio Ciudad de México', home: 'UZB', away: 'COL' },
  { group: 'K', n: 3, kickoffUtc: '2026-06-23T17:00:00Z', timezone: TZ.HOU, venue: 'NRG Stadium', home: 'POR', away: 'UZB' },
  { group: 'K', n: 4, kickoffUtc: '2026-06-24T02:00:00Z', timezone: TZ.MEX, venue: 'Estadio Guadalajara', home: 'COL', away: 'COD' },
  { group: 'K', n: 5, kickoffUtc: '2026-06-27T23:30:00Z', timezone: TZ.NY, venue: 'Hard Rock Stadium', home: 'COL', away: 'POR' },
  { group: 'K', n: 6, kickoffUtc: '2026-06-27T23:30:00Z', timezone: TZ.NY, venue: 'Mercedes-Benz Stadium', home: 'COD', away: 'UZB' },
  // Grupo L
  { group: 'L', n: 1, kickoffUtc: '2026-06-17T20:00:00Z', timezone: TZ.DAL, venue: 'AT&T Stadium', home: 'ENG', away: 'CRO' },
  { group: 'L', n: 2, kickoffUtc: '2026-06-17T23:00:00Z', timezone: TZ.TOR, venue: 'BMO Field', home: 'GHA', away: 'PAN' },
  { group: 'L', n: 3, kickoffUtc: '2026-06-23T20:00:00Z', timezone: TZ.NY, venue: 'Gillette Stadium', home: 'ENG', away: 'GHA' },
  { group: 'L', n: 4, kickoffUtc: '2026-06-23T23:00:00Z', timezone: TZ.TOR, venue: 'BMO Field', home: 'PAN', away: 'CRO' },
  { group: 'L', n: 5, kickoffUtc: '2026-06-27T21:00:00Z', timezone: TZ.NY, venue: 'MetLife Stadium', home: 'PAN', away: 'ENG' },
  { group: 'L', n: 6, kickoffUtc: '2026-06-27T21:00:00Z', timezone: TZ.NY, venue: 'Lincoln Financial Field', home: 'CRO', away: 'GHA' },
]

export const ALL_MATCHES: Match[] = RAW_MATCHES.map(buildMatch)

const GROUP_LETTERS = 'ABCDEFGHIJKL'.split('')

export const GROUPS: Group[] = GROUP_LETTERS.map(letter => {
  const matches = ALL_MATCHES.filter(m => m.group === letter)
  const teamCodes = new Set<string>()
  for (const m of matches) {
    teamCodes.add(m.home.code)
    teamCodes.add(m.away.code)
  }
  return {
    letter,
    teams: [...teamCodes].map(code => T[code]),
    matches,
  }
})

export function getMatchById(id: string): Match | undefined {
  return ALL_MATCHES.find(m => m.id === id)
}

export function getMatchKickoffMs(match: Match): number {
  return new Date(match.kickoffUtc).getTime()
}

export function getMatchStatus(match: Match, now: Date = new Date()): MatchStatus {
  if (match.result) return 'finished'

  const kickoff = getMatchKickoffMs(match)
  const nowMs = now.getTime()

  if (nowMs < kickoff) return 'upcoming'
  if (nowMs < kickoff + MATCH_DURATION_MS) return 'live'
  return 'finished'
}

/** Bloquea pronósticos desde el pitido inicial, sin depender de la zona horaria del usuario. */
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

/** Próximos primero (asc), en vivo al medio, concluidos al final. */
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

export function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).toUpperCase()
}

export function formatMatchDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase()
}
