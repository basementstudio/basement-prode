import type { Match } from '@/lib/wc2026/types'

/** Resultados confirmados cuando la API no cubre WC 2026 (plan free). */
export interface KnownResult {
  result: { home: number; away: number }
  statusShort?: string
}

/** Por id estático (GAM1) o clave kickoff+equipos para partidos de la API. */
export const KNOWN_RESULTS_BY_ID: Record<string, KnownResult> = {
  GAM1: { result: { home: 2, away: 0 }, statusShort: 'FT' },
}

export const KNOWN_RESULTS_BY_FIXTURE: Record<string, KnownResult> = {
  '2026-06-11T19:00:00Z:MEX:RSA': { result: { home: 2, away: 0 }, statusShort: 'FT' },
}

function fixtureKey(match: Match): string {
  const kickoff = match.kickoffUtc.endsWith('Z') ? match.kickoffUtc : `${match.kickoffUtc}Z`
  return `${kickoff}:${match.home.code}:${match.away.code}`
}

export function mergeKnownResults(matches: Match[]): Match[] {
  return matches.map(match => {
    const known =
      KNOWN_RESULTS_BY_ID[match.id]
      ?? KNOWN_RESULTS_BY_FIXTURE[fixtureKey(match)]

    if (!known) return match

    return {
      ...match,
      result: known.result,
      statusShort: known.statusShort ?? match.statusShort ?? 'FT',
      liveScore: undefined,
    }
  })
}
