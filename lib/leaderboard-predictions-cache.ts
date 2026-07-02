import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import {
  DB_READ_CACHE_SECONDS,
  LEADERBOARD_CACHE_TAG,
  leaderboardUserTag,
} from '@/lib/server-cache'

export type CachedUserPredictionRow = {
  userId: string
  matchId: string
  homeScore: number
  awayScore: number
  pointsAwarded: number | null
}

export async function getCachedUserPredictions(
  userId: string,
): Promise<CachedUserPredictionRow[]> {
  'use cache'
  cacheTag(LEADERBOARD_CACHE_TAG, leaderboardUserTag(userId))
  cacheLife({ revalidate: DB_READ_CACHE_SECONDS })

  return db
    .select({
      userId: predictions.userId,
      matchId: predictions.matchId,
      homeScore: predictions.homeScore,
      awayScore: predictions.awayScore,
      pointsAwarded: predictions.pointsAwarded,
    })
    .from(predictions)
    .where(eq(predictions.userId, userId))
}
