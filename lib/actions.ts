'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { predictions, userProfiles, user } from '@/lib/db/schema'
import { isMatchLocked, getMatchKickoffMs } from '@/lib/wc2026-data'
import { getMatchByIdAsync, getGroupStageMatches } from '@/lib/wc2026/get-matches'
import { calcPoints } from '@/lib/scoring'
import type { Match } from '@/lib/wc2026/types'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
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
  const userId = await getUserId()

  const match = await getMatchByIdAsync(matchId)
  if (!match) throw new Error('Partido no encontrado')

  const now = clientNowMs != null ? new Date(clientNowMs) : new Date()
  if (isMatchLocked(match, now)) throw new Error('Este partido ya empezó y no se puede editar')

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
}

export async function getLeaderboard() {
  const allUsers = await db.select().from(user)
  const allPreds = await db.select().from(predictions)
  const allProfiles = await db.select().from(userProfiles)

  // Only score matches that have a real result (from data file)
  const allMatches = await getGroupStageMatches()
  const playedMatches = allMatches.filter(m => m.result)

  const scores: Record<string, number> = {}
  for (const u of allUsers) {
    scores[u.id] = 0
  }

  for (const match of playedMatches) {
    const result = match.result!
    for (const pred of allPreds.filter(p => p.matchId === match.id)) {
      // Exact score: 6 pts
      if (pred.homeScore === result.home && pred.awayScore === result.away) {
        scores[pred.userId] = (scores[pred.userId] || 0) + 6
      }
      // Correct winner/draw: 3 pts
      else {
        const predWinner =
          pred.homeScore > pred.awayScore ? 'home' :
          pred.homeScore < pred.awayScore ? 'away' : 'draw'
        const realWinner =
          result.home > result.away ? 'home' :
          result.home < result.away ? 'away' : 'draw'
        if (predWinner === realWinner) {
          scores[pred.userId] = (scores[pred.userId] || 0) + 3
        }
      }
    }
  }

  const profileMap: Record<string, { displayName: string | null; avatarUrl: string | null }> = {}
  for (const p of allProfiles) {
    profileMap[p.userId] = { displayName: p.displayName, avatarUrl: p.avatarUrl }
  }

  return allUsers
    .map(u => ({
      id: u.id,
      email: u.email,
      name: profileMap[u.id]?.displayName || u.name,
      avatarUrl: profileMap[u.id]?.avatarUrl || null,
      points: scores[u.id] || 0,
    }))
    .sort((a, b) => b.points - a.points)
    .map((u, i) => ({ ...u, rank: i + 1 }))
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
  return {
    userId,
    email: session!.user.email,
    name: session!.user.name,
    displayName: profile[0]?.displayName || null,
    avatarUrl: profile[0]?.avatarUrl || null,
  }
}

async function upsertProfile(
  userId: string,
  data: { displayName?: string; avatarUrl?: string },
) {
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
  } else {
    await db.insert(userProfiles).values({
      id: nanoid(),
      userId,
      ...data,
    })
  }
}

export async function updateProfile(displayName: string) {
  const userId = await getUserId()
  await upsertProfile(userId, { displayName })
  revalidatePath('/tabla')
}

export async function updateAvatar(avatarUrl: string) {
  const userId = await getUserId()

  if (!avatarUrl.startsWith('data:image/')) {
    throw new Error('Imagen inválida')
  }

  if (avatarUrl.length > 700_000) {
    throw new Error('La imagen es muy pesada')
  }

  await upsertProfile(userId, { avatarUrl })
  revalidatePath('/tabla')
  revalidatePath('/pronosticos')
}
