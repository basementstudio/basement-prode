import type { Match } from '@/lib/wc2026/types'

/** Resultados confirmados cuando la API no cubre WC 2026 (plan free). */
export interface KnownResult {
  result: { home: number; away: number }
  statusShort?: string
}

/** Fallback manual si todas las APIs fallan. */
export const KNOWN_RESULTS_BY_ID: Record<string, KnownResult> = {}

export const KNOWN_RESULTS_BY_FIXTURE: Record<string, KnownResult> = {}

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
