import 'server-only'

import { unstable_cache } from 'next/cache'
import { inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { accountBurnVotes, predictions, user, userProfiles } from '@/lib/db/schema'
import { isProfileComplete } from '@/lib/profile'
import { buildFinishedResultsMap } from '@/lib/leaderboard-stats'
import { getStoredMatchResults } from '@/lib/match-results/sync'
import { DB_READ_CACHE_SECONDS, LEADERBOARD_CACHE_TAG } from '@/lib/server-cache'
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

async function loadLeaderboardRawData(): Promise<LeaderboardRawData> {
  const [allPreds, allProfiles, allBurnVotes, tournamentData, storedResults] = await Promise.all([
    db
      .select({
        userId: predictions.userId,
        matchId: predictions.matchId,
        homeScore: predictions.homeScore,
        awayScore: predictions.awayScore,
        pointsAwarded: predictions.pointsAwarded,
      })
      .from(predictions),
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
    getTournamentData(),
    getStoredMatchResults(),
  ])

  const matches = mergeStoredResultsIntoMatches(tournamentData.matches, storedResults)
  const finishedResultsByMatchId = Object.fromEntries(
    buildFinishedResultsMap(matches, storedResults),
  )

  const eligibleUserIds = new Set(allPreds.map(p => p.userId))
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
    allPreds,
    allProfiles,
    allBurnVotes,
    allUsers,
    finishedResultsByMatchId,
  }
}

export const getLeaderboardRawData = unstable_cache(
  loadLeaderboardRawData,
  ['leaderboard-raw-v1', String(DB_READ_CACHE_SECONDS)],
  {
    revalidate: DB_READ_CACHE_SECONDS,
    tags: [LEADERBOARD_CACHE_TAG],
  },
)
