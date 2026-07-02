import { unstable_cache } from 'next/cache'
import { and, eq, isNull } from 'drizzle-orm'
import type { Match } from '@/lib/wc2026/types'
import { matchResults, predictions } from '@/lib/db/schema'
import { db } from '@/lib/db/pool'
import {
  DB_READ_CACHE_SECONDS,
  MATCH_RESULTS_CACHE_TAG,
} from '@/lib/server-cache'
import { WC2026_MATCH_CACHE_TAG } from '@/lib/wc2026/cache'
import { calcPoints } from '@/lib/scoring'
import { STATIC_GROUP_MATCHES } from '@/lib/wc2026/static-matches'
import {
  enrichMatchesFromWorldCup26,
  fetchWorldCup26AllGamesPlain,
} from '@/lib/wc2026/worldcup26-api'
import { buildKnockoutMatchesFromGames } from '@/lib/wc2026/knockout-matches'

export type MatchResultRow = {
  matchId: string
  homeScore: number
  awayScore: number
  statusShort: string
}

export type SyncMatchResultsReport = {
  apiFinishedCount: number
  newlySynced: number
  updated: number
  skippedStatic: number
  newlyScored: number
  totalStoredResults: number
}

async function fetchStoredMatchResults(): Promise<MatchResultRow[]> {
  const rows = await db
    .select({
      matchId: matchResults.matchId,
      homeScore: matchResults.homeScore,
      awayScore: matchResults.awayScore,
      statusShort: matchResults.statusShort,
    })
    .from(matchResults)

  return rows
}

/** Lecturas de resultados cacheadas entre requests (cron/sync usan fetch directo). */
export const getStoredMatchResults = unstable_cache(
  fetchStoredMatchResults,
  ['match-results-v1', String(DB_READ_CACHE_SECONDS)],
  {
    revalidate: DB_READ_CACHE_SECONDS,
    tags: [MATCH_RESULTS_CACHE_TAG, WC2026_MATCH_CACHE_TAG],
  },
)

export function mergeStoredResultsIntoMatches(
  matches: Match[],
  stored: MatchResultRow[],
): Match[] {
  if (stored.length === 0) return matches

  const byId = new Map(stored.map(row => [row.matchId, row]))

  return matches.map(match => {
    if (match.result != null) return match

    const row = byId.get(match.id)
    if (!row) return match

    return {
      ...match,
      result: { home: row.homeScore, away: row.awayScore },
      statusShort: row.statusShort ?? match.statusShort ?? 'FT',
      liveScore: undefined,
    }
  })
}

/** Sincroniza resultados finalizados desde la API hacia match_results (solo partidos sin result en estático). */
export async function syncFinishedResultsFromApi(): Promise<{
  synced: MatchResultRow[]
  newlySynced: number
  updated: number
  skippedStatic: number
  apiFinishedCount: number
}> {
  const games = await fetchWorldCup26AllGamesPlain()
  const groupGames = games.filter(g => g.type === 'group')
  const enriched = enrichMatchesFromWorldCup26(STATIC_GROUP_MATCHES, groupGames)
  const knockouts = buildKnockoutMatchesFromGames(games)

  const staticWithResult = new Set(
    STATIC_GROUP_MATCHES.filter(m => m.result != null).map(m => m.id),
  )

  const finishedFromApi = [
    ...enriched.filter(m => m.result != null && !staticWithResult.has(m.id)),
    ...knockouts.filter(m => m.result != null),
  ]

  const existing = await fetchStoredMatchResults()
  const existingById = new Map(existing.map(row => [row.matchId, row]))

  let newlySynced = 0
  let updated = 0

  for (const match of finishedFromApi) {
    const result = match.result!
    const prev = existingById.get(match.id)

    if (!prev) {
      await db.insert(matchResults).values({
        matchId: match.id,
        homeScore: result.home,
        awayScore: result.away,
        statusShort: match.statusShort ?? 'FT',
        syncedAt: new Date(),
      })
      newlySynced++
      continue
    }

    if (prev.homeScore !== result.home || prev.awayScore !== result.away) {
      await db
        .update(matchResults)
        .set({
          homeScore: result.home,
          awayScore: result.away,
          statusShort: match.statusShort ?? 'FT',
          syncedAt: new Date(),
        })
        .where(eq(matchResults.matchId, match.id))
      updated++
    }
  }

  const synced = await fetchStoredMatchResults()

  return {
    synced,
    newlySynced,
    updated,
    skippedStatic: staticWithResult.size,
    apiFinishedCount: finishedFromApi.length,
  }
}

/**
 * Otorga puntos a predicciones cuyo partido ya está en match_results.
 * Idempotente: solo actualiza filas con pointsAwarded IS NULL.
 */
export async function scoreUnscoredPredictions(): Promise<number> {
  const stored = await fetchStoredMatchResults()
  if (stored.length === 0) return 0

  const resultByMatchId = new Map(
    stored.map(row => [row.matchId, { home: row.homeScore, away: row.awayScore }]),
  )

  const unscored = await db
    .select({
      id: predictions.id,
      userId: predictions.userId,
      matchId: predictions.matchId,
      homeScore: predictions.homeScore,
      awayScore: predictions.awayScore,
    })
    .from(predictions)
    .where(isNull(predictions.pointsAwarded))

  let newlyScored = 0
  const now = new Date()

  for (const pred of unscored) {
    const result = resultByMatchId.get(pred.matchId)
    if (!result) continue

    const points = calcPoints(
      { home: pred.homeScore, away: pred.awayScore },
      result,
    )

    await db
      .update(predictions)
      .set({ pointsAwarded: points, updatedAt: now })
      .where(
        and(
          eq(predictions.userId, pred.userId),
          eq(predictions.matchId, pred.matchId),
          isNull(predictions.pointsAwarded),
        ),
      )

    newlyScored++
  }

  return newlyScored
}

export async function syncMatchResultsAndScore(): Promise<SyncMatchResultsReport> {
  const sync = await syncFinishedResultsFromApi()
  const newlyScored = await scoreUnscoredPredictions()

  return {
    apiFinishedCount: sync.apiFinishedCount,
    newlySynced: sync.newlySynced,
    updated: sync.updated,
    skippedStatic: sync.skippedStatic,
    newlyScored,
    totalStoredResults: sync.synced.length,
  }
}

export async function scoreFromStoredResultsOnly(): Promise<number> {
  return scoreUnscoredPredictions()
}
