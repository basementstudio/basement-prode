import { unstable_cache } from 'next/cache'
import type { Match } from '@/lib/wc2026/types'
import { WC2026_MATCH_CACHE_SECONDS, WC2026_MATCH_CACHE_TAG } from '@/lib/wc2026/cache'
import { mergeKnownResults } from '@/lib/wc2026/known-results'
import { STATIC_GROUP_MATCHES } from '@/lib/wc2026/static-matches'
import {
  countEnrichedMatches,
  enrichMatchesFromWorldCup26,
  fetchWorldCup26Games,
} from '@/lib/wc2026/worldcup26-api'

export type MatchDataSource = 'worldcup26' | 'static'

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
    const merged = mergeKnownResults(enriched)

    if (matched > 0) {
      if (games.length < MIN_GROUP_MATCHES || matched < MIN_GROUP_MATCHES) {
        console.warn(
          `[wc2026] worldcup26.ir partial: ${games.length} games, ${matched} matched with local schedule`,
        )
      }
      return { matches: merged, source: 'worldcup26' }
    }

    console.warn(
      `[wc2026] worldcup26.ir: ${games.length} games, 0 matched with local schedule`,
    )
  } catch (error) {
    console.error('[wc2026] Error al consultar worldcup26.ir:', error)
  }

  return { matches: mergeKnownResults(staticMatches), source: 'static' }
}

export const getGroupStageData = unstable_cache(
  loadGroupStageMatches,
  ['wc2026-group-stage-v7', String(WC2026_MATCH_CACHE_SECONDS)],
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
