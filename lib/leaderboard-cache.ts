import 'server-only'

import { unstable_cache } from 'next/cache'
import { inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { accountBurnVotes, predictions, user, userProfiles } from '@/lib/db/schema'
import { isProfileComplete } from '@/lib/profile'
import { buildFinishedResultsMap } from '@/lib/leaderboard-stats'
import { fetchStoredMatchResults } from '@/lib/match-results/sync'
import { getCachedUserPredictions } from '@/lib/leaderboard-predictions-cache'
import { DB_READ_CACHE_SECONDS, LEADERBOARD_META_TAG } from '@/lib/server-cache'
import { getTournamentData } from '@/lib/wc2026/get-matches'
import { mergeStoredResultsIntoMatches } from '@/lib/match-results/sync'

export type LeaderboardRawData = {
  allPreds: {
    userId: string
    matchId: string
    homeScore: number
    awayScore: number
    pointsAwarded: number | null
  }[]
  allProfiles: {
    userId: string
    displayName: string | null
    avatarUrl: string | null
    burnedAt: Date | null
  }[]
  allBurnVotes: {
    targetUserId: string
    voterId: string
  }[]
  allUsers: {
    id: string
    name: string
    email: string
  }[]
  finishedResultsByMatchId: Record<string, { home: number; away: number }>
}

type LeaderboardMeta = {
  allProfiles: LeaderboardRawData['allProfiles']
  allBurnVotes: LeaderboardRawData['allBurnVotes']
  allUsers: LeaderboardRawData['allUsers']
  eligibleUserIds: string[]
}

async function loadLeaderboardMeta(): Promise<LeaderboardMeta> {
  const [allPredUserIds, allProfiles, allBurnVotes] = await Promise.all([
    db.select({ userId: predictions.userId }).from(predictions),
    db
      .select({
        userId: userProfiles.userId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        burnedAt: userProfiles.burnedAt,
      })
      .from(userProfiles),
    db
      .select({
        targetUserId: accountBurnVotes.targetUserId,
        voterId: accountBurnVotes.voterId,
      })
      .from(accountBurnVotes),
  ])

  const eligibleUserIds = new Set(allPredUserIds.map(row => row.userId))
  for (const profile of allProfiles) {
    if (isProfileComplete(profile)) {
      eligibleUserIds.add(profile.userId)
    }
  }

  const allUsers =
    eligibleUserIds.size === 0
      ? []
      : await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
          })
          .from(user)
          .where(inArray(user.id, [...eligibleUserIds]))

  return {
    allProfiles,
    allBurnVotes,
    allUsers,
    eligibleUserIds: [...eligibleUserIds],
  }
}

const getLeaderboardMeta = unstable_cache(
  loadLeaderboardMeta,
  ['leaderboard-meta-v1', String(DB_READ_CACHE_SECONDS)],
  {
    revalidate: DB_READ_CACHE_SECONDS,
    tags: [LEADERBOARD_META_TAG],
  },
)

export async function getLeaderboardRawData(): Promise<LeaderboardRawData> {
  const [meta, tournamentData, storedResults] = await Promise.all([
    getLeaderboardMeta(),
    getTournamentData(),
    fetchStoredMatchResults(),
  ])

  const matches = mergeStoredResultsIntoMatches(tournamentData.matches, storedResults)
  const finishedResultsByMatchId = Object.fromEntries(
    buildFinishedResultsMap(matches, storedResults),
  )

  const predRows = await Promise.all(
    meta.eligibleUserIds.map(userId => getCachedUserPredictions(userId)),
  )

  return {
    allPreds: predRows.flat(),
    allProfiles: meta.allProfiles,
    allBurnVotes: meta.allBurnVotes,
    allUsers: meta.allUsers,
    finishedResultsByMatchId,
  }
}
