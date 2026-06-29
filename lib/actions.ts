'use server'

import { requireAuthUserId, getAuthSession } from '@/lib/auth-session'
import { getCachedUserProfile, getMyProfileData } from '@/lib/profile-server'
import { db } from '@/lib/db'
import { predictions, userProfiles, user, predictionVotes, accountBurnVotes } from '@/lib/db/schema'
import { ACCOUNT_BURN_VOTE_THRESHOLD } from '@/lib/account-burn'
import { summarizeAccountBurnVotes } from '@/lib/account-burn-votes'
import { isMatchLocked, getMatchKickoffMs } from '@/lib/wc2026-data'
import { getMatchByIdAsync, getGroupStageMatches } from '@/lib/wc2026/get-matches'
import {
  buildFinishedResultsMap,
  buildLeaderboardPlayers,
  type LeaderboardPlayer,
} from '@/lib/leaderboard-stats'
import {
  getStoredMatchResults,
  syncMatchResultsAndScore,
} from '@/lib/match-results/sync'
import { buildRevealedMatchPredictions, summarizePredictionVotes, type RevealedMatchPrediction } from '@/lib/match-predictions'
import { calcPoints } from '@/lib/scoring'
import { isValidScore } from '@/lib/score'
import type { Match } from '@/lib/wc2026/types'
import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { isProfileComplete, normalizeDisplayName } from '@/lib/profile'
import { isValidStoredAvatarUrl } from '@/lib/avatar-url'
import { isDisplayNameTaken, upsertProfile } from '@/lib/user-profile'

async function getUserId() {
  return requireAuthUserId()
}

async function getSessionUser() {
  const session = await getAuthSession()
  if (!session?.user) return null
  return session.user
}

export async function getProfileStatus() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return { authenticated: false as const, complete: false }
  }

  const profile = await getCachedUserProfile(sessionUser.id)

  return {
    authenticated: true as const,
    complete: isProfileComplete(profile),
    userId: sessionUser.id,
  }
}

export async function checkDisplayNameAvailable(displayName: string) {
  const userId = await getUserId()
  const normalized = normalizeDisplayName(displayName)
  if (!normalized) {
    return { available: false, error: 'Enter a name.' }
  }
  const taken = await isDisplayNameTaken(normalized, userId)
  return { available: !taken, error: taken ? 'That name is already in use.' : null }
}

export async function getPredictions(): Promise<Record<string, { home: number; away: number }>> {
  const userId = await getUserId()
  const rows = await db.select().from(predictions).where(eq(predictions.userId, userId))
  const map: Record<string, { home: number; away: number }> = {}
  for (const r of rows) {
    map[r.matchId] = { home: r.homeScore, away: r.awayScore }
  }
  return map
}

export async function savePrediction(
  matchId: string,
  homeScore: number,
  awayScore: number,
  clientNowMs?: number,
) {
  let userId: string | undefined

  try {
    userId = await getUserId()

    const match = await getMatchByIdAsync(matchId)
    if (!match) throw new Error('Match not found')

    const now = clientNowMs != null ? new Date(clientNowMs) : new Date()
    if (isMatchLocked(match, now)) {
      throw new Error('This match has started and can no longer be edited')
    }

    if (!isValidScore(homeScore) || !isValidScore(awayScore)) {
      throw new Error('Invalid score: use integers from 0 to 99')
    }

    const existing = await db
      .select()
      .from(predictions)
      .where(and(eq(predictions.userId, userId), eq(predictions.matchId, matchId)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(predictions)
        .set({ homeScore, awayScore, updatedAt: new Date() })
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, matchId)))
    } else {
      await db.insert(predictions).values({
        id: nanoid(),
        userId,
        matchId,
        homeScore,
        awayScore,
      })
    }

    revalidatePath('/pronosticos')
    revalidatePath('/en-vivo')
    revalidatePath('/concluidos')
    revalidatePath('/tabla')
    revalidatePath('/aciertos')
  } catch (err) {
    console.error('[savePrediction] failed', {
      userId,
      matchId,
      homeScore,
      awayScore,
      error: err instanceof Error ? err.message : err,
    })
    if (err instanceof Error) throw err
    throw new Error('Could not save prediction')
  }
}

export type { LeaderboardPlayer } from '@/lib/leaderboard-stats'
export type { RevealedMatchPrediction } from '@/lib/match-predictions'

export async function getLeaderboard(): Promise<LeaderboardPlayer[]> {
  const viewerUserId = await getUserId()

  try {
    await syncMatchResultsAndScore()
  } catch (error) {
    console.error('[getLeaderboard] syncMatchResultsAndScore failed', error)
  }

  const [allPreds, allProfiles, allBurnVotes, matches, storedResults] = await Promise.all([
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
    getGroupStageMatches(),
    getStoredMatchResults(),
  ])

  const finishedResultsByMatchId = buildFinishedResultsMap(matches, storedResults)

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

  const burnSummary = summarizeAccountBurnVotes(allBurnVotes, viewerUserId)

  return buildLeaderboardPlayers(
    allUsers,
    allPreds,
    allProfiles,
    burnSummary,
    finishedResultsByMatchId,
  )
}

async function syncAccountBurnedAt(targetUserId: string, voteCount: number) {
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, targetUserId))
    .limit(1)

  const row = profile[0]
  if (!row) return

  const shouldBurn = voteCount >= ACCOUNT_BURN_VOTE_THRESHOLD
  const isBurned = row.burnedAt != null

  if (shouldBurn && !isBurned) {
    await db
      .update(userProfiles)
      .set({ burnedAt: new Date(), updatedAt: new Date() })
      .where(eq(userProfiles.userId, targetUserId))
  } else if (!shouldBurn && isBurned) {
    await db
      .update(userProfiles)
      .set({ burnedAt: null, updatedAt: new Date() })
      .where(eq(userProfiles.userId, targetUserId))
  }
}

export async function toggleAccountBurnVote(targetUserId: string): Promise<{
  burnVoteCount: number
  viewerHasBurnVoted: boolean
  isBurned: boolean
}> {
  const voterId = await getUserId()

  if (targetUserId === voterId) {
    throw new Error('You cannot burn your own account')
  }

  const targetProfile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, targetUserId))
    .limit(1)

  if (!targetProfile[0]) throw new Error('User not found')

  const existing = await db
    .select()
    .from(accountBurnVotes)
    .where(
      and(
        eq(accountBurnVotes.targetUserId, targetUserId),
        eq(accountBurnVotes.voterId, voterId),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    await db
      .delete(accountBurnVotes)
      .where(
        and(
          eq(accountBurnVotes.targetUserId, targetUserId),
          eq(accountBurnVotes.voterId, voterId),
        ),
      )
  } else {
    await db.insert(accountBurnVotes).values({
      id: nanoid(),
      targetUserId,
      voterId,
    })
  }

  const votes = await db
    .select({ voterId: accountBurnVotes.voterId })
    .from(accountBurnVotes)
    .where(eq(accountBurnVotes.targetUserId, targetUserId))

  const burnVoteCount = votes.length
  await syncAccountBurnedAt(targetUserId, burnVoteCount)

  const updatedProfile = await db
    .select({ burnedAt: userProfiles.burnedAt })
    .from(userProfiles)
    .where(eq(userProfiles.userId, targetUserId))
    .limit(1)

  revalidatePath('/tabla')

  return {
    burnVoteCount,
    viewerHasBurnVoted: votes.some(v => v.voterId === voterId),
    isBurned: updatedProfile[0]?.burnedAt != null,
  }
}

export async function getRevealedPredictionsByMatchIds(
  matchIds: string[],
): Promise<Record<string, RevealedMatchPrediction[]>> {
  const viewerUserId = await getUserId()
  const uniqueIds = [...new Set(matchIds)]
  if (uniqueIds.length === 0) return {}

  const now = new Date()
  const allMatches = await getGroupStageMatches()
  const matchMap = new Map(allMatches.map(m => [m.id, m]))
  const relevantIds = uniqueIds.filter(id => matchMap.has(id))

  if (relevantIds.length === 0) return {}

  const allPreds = await db
    .select({
      id: predictions.id,
      userId: predictions.userId,
      matchId: predictions.matchId,
      homeScore: predictions.homeScore,
      awayScore: predictions.awayScore,
    })
    .from(predictions)
    .where(inArray(predictions.matchId, relevantIds))

  if (allPreds.length === 0) return {}

  const authorUserIds = [...new Set(allPreds.map(p => p.userId))]
  const [allProfiles, allUsers] = await Promise.all([
    db
      .select({
        userId: userProfiles.userId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(userProfiles)
      .where(inArray(userProfiles.userId, authorUserIds)),
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(inArray(user.id, authorUserIds)),
  ])

  const predictionIds = allPreds.map(p => p.id)
  const allVotes =
    predictionIds.length > 0
      ? await db
          .select({
            predictionId: predictionVotes.predictionId,
            voterId: predictionVotes.voterId,
          })
          .from(predictionVotes)
          .where(inArray(predictionVotes.predictionId, predictionIds))
      : []

  const voteSummary = summarizePredictionVotes(allVotes, viewerUserId)

  const result: Record<string, RevealedMatchPrediction[]> = {}
  for (const matchId of relevantIds) {
    const match = matchMap.get(matchId)!
    const locked = isMatchLocked(match, now)
    const matchPreds = allPreds.filter(p => p.matchId === matchId)
    result[matchId] = buildRevealedMatchPredictions(
      match,
      matchPreds,
      viewerUserId,
      allUsers,
      allProfiles,
      locked,
      voteSummary,
    )
  }

  return result
}

export async function togglePredictionDownvote(
  predictionId: string,
): Promise<{ downvoteCount: number; viewerHasDownvoted: boolean }> {
  const voterId = await getUserId()

  const prediction = await db
    .select()
    .from(predictions)
    .where(eq(predictions.id, predictionId))
    .limit(1)

  const row = prediction[0]
  if (!row) throw new Error('Prediction not found')

  const match = await getMatchByIdAsync(row.matchId)
  if (!match) throw new Error('Match not found')

  if (!isMatchLocked(match, new Date())) {
    throw new Error('Downvotes are only available after kickoff')
  }

  const existing = await db
    .select()
    .from(predictionVotes)
    .where(
      and(
        eq(predictionVotes.predictionId, predictionId),
        eq(predictionVotes.voterId, voterId),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    await db
      .delete(predictionVotes)
      .where(
        and(
          eq(predictionVotes.predictionId, predictionId),
          eq(predictionVotes.voterId, voterId),
        ),
      )
  } else {
    await db.insert(predictionVotes).values({
      id: nanoid(),
      predictionId,
      voterId,
    })
  }

  const votes = await db
    .select({ voterId: predictionVotes.voterId })
    .from(predictionVotes)
    .where(eq(predictionVotes.predictionId, predictionId))

  revalidatePath('/pronosticos')
  revalidatePath('/en-vivo')
  revalidatePath('/concluidos')

  return {
    downvoteCount: votes.length,
    viewerHasDownvoted: votes.some(v => v.voterId === voterId),
  }
}

export type ScoredPrediction = {
  match: Match
  prediction: { home: number; away: number }
  result: { home: number; away: number }
  points: number
  outcome: 'exact' | 'winner' | 'miss'
}

export async function getMyScoredPredictions(): Promise<{
  items: ScoredPrediction[]
  totalPoints: number
  exactCount: number
  winnerCount: number
  missCount: number
  playedCount: number
}> {
  const userId = await getUserId()

  try {
    await syncMatchResultsAndScore()
  } catch (error) {
    console.error('[getMyScoredPredictions] syncMatchResultsAndScore failed', error)
  }

  const rows = await db.select().from(predictions).where(eq(predictions.userId, userId))
  const allMatches = await getGroupStageMatches()

  const items: ScoredPrediction[] = []

  for (const row of rows) {
    const match = allMatches.find(m => m.id === row.matchId)
    if (!match?.result) continue

    const prediction = { home: row.homeScore, away: row.awayScore }
    const points =
      row.pointsAwarded ?? calcPoints(prediction, match.result)
    const outcome: ScoredPrediction['outcome'] =
      points === 6 ? 'exact' : points === 3 ? 'winner' : 'miss'

    items.push({
      match,
      prediction,
      result: match.result,
      points,
      outcome,
    })
  }

  items.sort((a, b) => getMatchKickoffMs(b.match) - getMatchKickoffMs(a.match))

  return {
    items,
    totalPoints: items.reduce((sum, item) => sum + item.points, 0),
    exactCount: items.filter(i => i.outcome === 'exact').length,
    winnerCount: items.filter(i => i.outcome === 'winner').length,
    missCount: items.filter(i => i.outcome === 'miss').length,
    playedCount: items.length,
  }
}

export async function getMyProfile() {
  return getMyProfileData()
}

export async function saveMyProfile(displayName: string, avatarUrl?: string) {
  const userId = await getUserId()
  const normalized = normalizeDisplayName(displayName)

  if (!normalized) throw new Error('Enter a name.')
  if (normalized.length > 40) throw new Error('Name is too long (max 40 characters).')
  if (await isDisplayNameTaken(normalized, userId)) {
    throw new Error('NAME_TAKEN')
  }

  if (avatarUrl !== undefined && !isValidStoredAvatarUrl(avatarUrl)) {
    throw new Error('Invalid image')
  }

  await db.update(user).set({ name: normalized, updatedAt: new Date() }).where(eq(user.id, userId))
  await upsertProfile(userId, {
    displayName: normalized,
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
  })

  revalidatePath('/tabla')
  revalidatePath('/pronosticos')
}
