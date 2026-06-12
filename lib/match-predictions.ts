import { resolveDisplayName } from '@/lib/display-name'
import { calcPoints } from '@/lib/scoring'
import type { Match } from '@/lib/wc2026/types'

export type RevealedMatchPrediction = {
  predictionId: string
  userId: string
  name: string
  avatarUrl: string | null
  homeScore: number
  awayScore: number
  isMe: boolean
  points: number | null
  downvoteCount: number
  viewerHasDownvoted: boolean
}

type UserRow = { id: string; name: string; email: string }
type PredRow = {
  id: string
  userId: string
  matchId: string
  homeScore: number
  awayScore: number
}
type ProfileRow = { userId: string; displayName: string | null; avatarUrl: string | null }

type VoteSummary = {
  downvoteCountByPredictionId: Record<string, number>
  viewerDownvotedPredictionIds: Set<string>
}

export function buildRevealedMatchPredictions(
  match: Match,
  matchPreds: PredRow[],
  viewerUserId: string,
  users: UserRow[],
  profiles: ProfileRow[],
  locked: boolean,
  voteSummary: VoteSummary,
): RevealedMatchPrediction[] {
  const profileMap = new Map(profiles.map(p => [p.userId, p]))
  const userMap = new Map(users.map(u => [u.id, u]))

  const visiblePreds = locked
    ? matchPreds
    : matchPreds.filter(p => p.userId === viewerUserId)

  return visiblePreds
    .map(pred => {
      const profile = profileMap.get(pred.userId)
      const userRow = userMap.get(pred.userId)
      if (!userRow) return null

      const points = match.result
        ? calcPoints(
            { home: pred.homeScore, away: pred.awayScore },
            match.result,
          )
        : null

      return {
        predictionId: pred.id,
        userId: pred.userId,
        name: resolveDisplayName({
          displayName: profile?.displayName,
          name: userRow.name,
          email: userRow.email,
        }),
        avatarUrl: profile?.avatarUrl || null,
        homeScore: pred.homeScore,
        awayScore: pred.awayScore,
        isMe: pred.userId === viewerUserId,
        points,
        downvoteCount: voteSummary.downvoteCountByPredictionId[pred.id] ?? 0,
        viewerHasDownvoted: voteSummary.viewerDownvotedPredictionIds.has(pred.id),
      }
    })
    .filter((row): row is RevealedMatchPrediction => row != null)
    .sort((a, b) => {
      if (a.isMe !== b.isMe) return a.isMe ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

export function summarizePredictionVotes(
  votes: { predictionId: string; voterId: string }[],
  viewerUserId: string,
): VoteSummary {
  const downvoteCountByPredictionId: Record<string, number> = {}
  const viewerDownvotedPredictionIds = new Set<string>()

  for (const vote of votes) {
    downvoteCountByPredictionId[vote.predictionId] =
      (downvoteCountByPredictionId[vote.predictionId] ?? 0) + 1
    if (vote.voterId === viewerUserId) {
      viewerDownvotedPredictionIds.add(vote.predictionId)
    }
  }

  return { downvoteCountByPredictionId, viewerDownvotedPredictionIds }
}
