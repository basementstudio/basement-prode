'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { predictions, userProfiles, user, predictionVotes } from '@/lib/db/schema'
import { isMatchLocked, getMatchKickoffMs } from '@/lib/wc2026-data'
import { getMatchByIdAsync, getGroupStageMatches } from '@/lib/wc2026/get-matches'
import { buildLeaderboardPlayers, type LeaderboardPlayer } from '@/lib/leaderboard-stats'
import { buildRevealedMatchPredictions, summarizePredictionVotes, type RevealedMatchPrediction } from '@/lib/match-predictions'
import { calcPoints } from '@/lib/scoring'
import { isValidScore } from '@/lib/score'
import type { Match } from '@/lib/wc2026/types'
import { and, eq, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { resolveDisplayName } from '@/lib/display-name'
import { isProfileComplete, normalizeDisplayName } from '@/lib/profile'
import { isDisplayNameTaken, upsertProfile } from '@/lib/user-profile'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    throw new Error('Session expired — sign in again with your name and PIN.')
  }
  return session.user.id
}

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  return session.user
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

export async function getProfileStatus() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return { authenticated: false as const, complete: false }
  }

  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, sessionUser.id))
    .limit(1)

  return {
    authenticated: true as const,
    complete: isProfileComplete(profile[0]),
    userId: sessionUser.id,
  }
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
  const allUsers = await db.select().from(user)
  const allPreds = await db.select().from(predictions)
  const allProfiles = await db.select().from(userProfiles)

  const allMatches = await getGroupStageMatches()
  const playedMatches = allMatches
    .filter(m => m.result != null)
    .map(m => ({ id: m.id, result: m.result! }))

  return buildLeaderboardPlayers(allUsers, allPreds, allProfiles, playedMatches)
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

  const [allPreds, allProfiles, allUsers] = await Promise.all([
    db.select().from(predictions).where(inArray(predictions.matchId, relevantIds)),
    db.select().from(userProfiles),
    db.select().from(user),
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
  const rows = await db.select().from(predictions).where(eq(predictions.userId, userId))
  const allMatches = await getGroupStageMatches()

  const items: ScoredPrediction[] = []

  for (const row of rows) {
    const match = allMatches.find(m => m.id === row.matchId)
    if (!match?.result) continue

    const prediction = { home: row.homeScore, away: row.awayScore }
    const points = calcPoints(prediction, match.result)
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
  const userId = await getUserId()
  const session = await auth.api.getSession({ headers: await headers() })
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)
  const email = session!.user.email
  const authName = session!.user.name
  const storedDisplayName = profile[0]?.displayName || null

  return {
    userId,
    email,
    name: authName,
    displayName: storedDisplayName,
    resolvedName: resolveDisplayName({
      displayName: storedDisplayName,
      name: authName,
      email,
    }),
    avatarUrl: profile[0]?.avatarUrl || null,
  }
}

export async function updateProfile(displayName: string) {
  const userId = await getUserId()
  const normalized = normalizeDisplayName(displayName)

  if (!normalized) throw new Error('Enter a name.')
  if (normalized.length > 40) throw new Error('Name is too long (max 40 characters).')
  if (await isDisplayNameTaken(normalized, userId)) {
    throw new Error('NAME_TAKEN')
  }

  await db.update(user).set({ name: normalized, updatedAt: new Date() }).where(eq(user.id, userId))
  await upsertProfile(userId, { displayName: normalized })
  revalidatePath('/tabla')
}

export async function updateAvatar(avatarUrl: string) {
  const userId = await getUserId()

  if (!avatarUrl.startsWith('data:image/')) {
    throw new Error('Invalid image')
  }

  if (avatarUrl.length > 700_000) {
    throw new Error('Image is too large')
  }

  await upsertProfile(userId, { avatarUrl })
  revalidatePath('/tabla')
  revalidatePath('/pronosticos')
}
