import { unstable_cache } from 'next/cache'
import type { Match } from '@/lib/wc2026/types'
import { WC2026_MATCH_CACHE_SECONDS, WC2026_MATCH_CACHE_TAG } from '@/lib/wc2026/cache'
import { fetchGroupStageFromApi } from '@/lib/wc2026/api-football'
import { mergeKnownResults } from '@/lib/wc2026/known-results'
import { STATIC_GROUP_MATCHES } from '@/lib/wc2026/static-matches'
import {
  countEnrichedMatches,
  enrichMatchesFromWorldCup26,
  fetchWorldCup26Games,
} from '@/lib/wc2026/worldcup26-api'

export type MatchDataSource = 'worldcup26' | 'api-football' | 'static'

export interface GroupStageData {
  matches: Match[]
  source: MatchDataSource
}

const MIN_GROUP_MATCHES = 60

async function loadGroupStageMatches(): Promise<GroupStageData> {
  const staticMatches = STATIC_GROUP_MATCHES

  try {
    const games = await fetchWorldCup26Games()
    const enriched = enrichMatchesFromWorldCup26(staticMatches, games)
    const matched = countEnrichedMatches(staticMatches, games)

    if (games.length >= MIN_GROUP_MATCHES && matched >= MIN_GROUP_MATCHES) {
      return { matches: mergeKnownResults(enriched), source: 'worldcup26' }
    }

    console.warn(
      `[wc2026] worldcup26.ir: ${games.length} partidos, ${matched} emparejados con calendario local`,
    )
  } catch (error) {
    console.error('[wc2026] Error al consultar worldcup26.ir:', error)
  }

  const apiKey = process.env.API_FOOTBALL_KEY?.trim()
  if (apiKey) {
    try {
      const apiMatches = await fetchGroupStageFromApi(apiKey)
      if (apiMatches.length >= MIN_GROUP_MATCHES) {
        return { matches: mergeKnownResults(apiMatches), source: 'api-football' }
      }
      console.warn(`[wc2026] API-Football devolvió ${apiMatches.length} partidos`)
    } catch (error) {
      console.error('[wc2026] Error al consultar API-Football:', error)
    }
  }

  return { matches: mergeKnownResults(staticMatches), source: 'static' }
}

export const getGroupStageData = unstable_cache(
  loadGroupStageMatches,
  ['wc2026-group-stage-v5', String(WC2026_MATCH_CACHE_SECONDS)],
  { revalidate: WC2026_MATCH_CACHE_SECONDS, tags: [WC2026_MATCH_CACHE_TAG] },
)

export async function getGroupStageMatches(): Promise<Match[]> {
  const data = await getGroupStageData()
  return data.matches
}

export async function getMatchByIdAsync(id: string): Promise<Match | undefined> {
  const matches = await getGroupStageMatches()
  return matches.find(m => m.id === id)
}
