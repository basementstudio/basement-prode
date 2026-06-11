import { unstable_cache } from 'next/cache'
import type { Match } from '@/lib/wc2026/types'
import { fetchGroupStageFromApi } from '@/lib/wc2026/api-football'
import { STATIC_GROUP_MATCHES } from '@/lib/wc2026/static-matches'

export type MatchDataSource = 'api' | 'static'

export interface GroupStageData {
  matches: Match[]
  source: MatchDataSource
}

const CACHE_REVALIDATE_SECONDS = 15 * 60

async function loadGroupStageMatches(): Promise<GroupStageData> {
  const apiKey = process.env.API_FOOTBALL_KEY?.trim()

  if (!apiKey) {
    return { matches: STATIC_GROUP_MATCHES, source: 'static' }
  }

  try {
    const apiMatches = await fetchGroupStageFromApi(apiKey)
    if (apiMatches.length >= 60) {
      return { matches: apiMatches, source: 'api' }
    }
    console.warn(`[wc2026] API devolvió ${apiMatches.length} partidos, usando fallback estático`)
  } catch (error) {
    console.error('[wc2026] Error al consultar API-Football:', error)
  }

  return { matches: STATIC_GROUP_MATCHES, source: 'static' }
}

export const getGroupStageData = unstable_cache(
  loadGroupStageMatches,
  ['wc2026-group-stage-v1'],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: ['wc2026-matches'] },
)

export async function getGroupStageMatches(): Promise<Match[]> {
  const data = await getGroupStageData()
  return data.matches
}

export async function getMatchByIdAsync(id: string): Promise<Match | undefined> {
  const matches = await getGroupStageMatches()
  return matches.find(m => m.id === id)
}
