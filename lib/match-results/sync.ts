import { and, eq, isNull } from 'drizzle-orm'
import type { Match } from '@/lib/wc2026/types'
import { matchResults, predictions } from '@/lib/db/schema'
import { db } from '@/lib/db/pool'
import { calcPoints } from '@/lib/scoring'
import { STATIC_GROUP_MATCHES } from '@/lib/wc2026/static-matches'
import {
  enrichMatchesFromWorldCup26,
  fetchWorldCup26GamesPlain,
} from '@/lib/wc2026/worldcup26-api'

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

export async function getStoredMatchResults(): Promise<MatchResultRow[]> {
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
  const games = await fetchWorldCup26GamesPlain()
  const enriched = enrichMatchesFromWorldCup26(STATIC_GROUP_MATCHES, games)

  const staticWithResult = new Set(
    STATIC_GROUP_MATCHES.filter(m => m.result != null).map(m => m.id),
  )

  const finishedFromApi = enriched.filter(
    m => m.result != null && !staticWithResult.has(m.id),
  )

  const existing = await getStoredMatchResults()
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

  const synced = await getStoredMatchResults()

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
  const stored = await getStoredMatchResults()
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
