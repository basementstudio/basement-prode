export interface Team {
  code: string
  name: string
  flag: string
}

export type MatchStatus = 'upcoming' | 'live' | 'finished'

export interface Match {
  id: string
  group: string
  /** @deprecated Usar kickoffUtc + format-local en el cliente */
  date: string
  /** @deprecated Usar kickoffUtc + format-local en el cliente */
  time: string
  venue: string
  timezone: string
  kickoffUtc: string
  home: Team
  away: Team
  result?: { home: number; away: number }
  /** Marcador parcial mientras el partido está en curso (API goals). */
  liveScore?: { home: number; away: number }
  /** Código corto de API-Football: NS, 1H, HT, FT, etc. */
  statusShort?: string
  elapsed?: number | null
}

export interface Group {
  letter: string
  teams: Team[]
  matches: Match[]
}

/** Duración estimada del partido para fallback sin API (~105 min). */
export const MATCH_PLAY_MS = 105 * 60 * 1000

/** @deprecated Ya no se usa ventana de 3h */
export const MATCH_POST_BUFFER_MS = 0
/** @deprecated Ya no se usa ventana de 3h */
export const MATCH_LIVE_WINDOW_MS = MATCH_PLAY_MS
/** @deprecated Usar MATCH_PLAY_MS */
export const MATCH_DURATION_MS = MATCH_PLAY_MS
