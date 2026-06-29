import { unstable_cache } from 'next/cache'
import type { Match } from '@/lib/wc2026/types'
import { WC2026_MATCH_CACHE_SECONDS, WC2026_MATCH_CACHE_TAG } from '@/lib/wc2026/cache'
import { mergeKnownResults } from '@/lib/wc2026/known-results'
import { buildKnockoutMatchesFromGames } from '@/lib/wc2026/knockout-matches'
import {
  getStoredMatchResults,
  mergeStoredResultsIntoMatches,
} from '@/lib/match-results/sync'
import { STATIC_GROUP_MATCHES } from '@/lib/wc2026/static-matches'
import {
  countEnrichedMatches,
  enrichMatchesFromWorldCup26,
  fetchWorldCup26AllGames,
} from '@/lib/wc2026/worldcup26-api'
import { sortTournamentMatches } from '@/lib/wc2026-data'

export type MatchDataSource = 'worldcup26' | 'static'

export interface TournamentData {
  matches: Match[]
  source: MatchDataSource
}

/** @deprecated Usar TournamentData */
export type GroupStageData = TournamentData

const MIN_GROUP_MATCHES = 60

async function loadTournamentMatches(): Promise<TournamentData> {
  const staticMatches = STATIC_GROUP_MATCHES

  try {
    const games = await fetchWorldCup26AllGames()
    const groupGames = games.filter(g => g.type === 'group')
    const enriched = enrichMatchesFromWorldCup26(staticMatches, groupGames)
    const mergedGroup = mergeKnownResults(enriched)
    const knockouts = buildKnockoutMatchesFromGames(games)
    const matches = sortTournamentMatches([...mergedGroup, ...knockouts])
    const matched = countEnrichedMatches(staticMatches, groupGames)

    if (matched > 0) {
      if (groupGames.length < MIN_GROUP_MATCHES || matched < MIN_GROUP_MATCHES) {
        console.warn(
          `[wc2026] worldcup26.ir partial: ${groupGames.length} group games, ${matched} matched with local schedule`,
        )
      }
      return { matches, source: 'worldcup26' }
    }

    console.warn(
      `[wc2026] worldcup26.ir: ${groupGames.length} group games, 0 matched with local schedule`,
    )
  } catch (error) {
    console.error('[wc2026] Error al consultar worldcup26.ir:', error)
  }

  return { matches: mergeKnownResults(staticMatches), source: 'static' }
}

export const getTournamentData = unstable_cache(
  loadTournamentMatches,
  ['wc2026-tournament-v1', String(WC2026_MATCH_CACHE_SECONDS)],
  { revalidate: WC2026_MATCH_CACHE_SECONDS, tags: [WC2026_MATCH_CACHE_TAG] },
)

/** @deprecated Usar getTournamentData */
export const getGroupStageData = getTournamentData

export async function getTournamentMatches(): Promise<Match[]> {
  const data = await getTournamentData()
  const stored = await getStoredMatchResults()
  return mergeStoredResultsIntoMatches(data.matches, stored)
}

/** @deprecated Usar getTournamentMatches */
export async function getGroupStageMatches(): Promise<Match[]> {
  return getTournamentMatches()
}

export async function getMatchByIdAsync(id: string): Promise<Match | undefined> {
  const matches = await getTournamentMatches()
  return matches.find(m => m.id === id)
}
