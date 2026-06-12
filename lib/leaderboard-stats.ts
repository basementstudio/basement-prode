import { resolveDisplayName } from '@/lib/display-name'
import { isProfileComplete } from '@/lib/profile'
import { calcPoints } from '@/lib/scoring'

export type LeaderboardPlayer = {
  id: string
  name: string
  avatarUrl: string | null
  points: number
  hitCount: number
  playedCount: number
  predictionCount: number
  winRate: number
  rank: number
  isBurned: boolean
  burnVoteCount: number
  viewerHasBurnVoted: boolean
}

export type WorstBoardPlayer = LeaderboardPlayer & {
  worstRank: number
}

type UserRow = { id: string; name: string; email: string }
type PredRow = { userId: string; matchId: string; homeScore: number; awayScore: number }
type ProfileRow = {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  burnedAt: Date | null
}
type PlayedMatch = { id: string; result: { home: number; away: number } }

export function isLeaderboardEligible(
  profile: ProfileRow | undefined,
  predictionCount: number,
): boolean {
  if (isProfileComplete(profile)) return true
  return predictionCount > 0
}

export function buildLeaderboardPlayers(
  allUsers: UserRow[],
  allPreds: PredRow[],
  allProfiles: ProfileRow[],
  playedMatches: PlayedMatch[],
  burnSummary: {
    burnVoteCountByUserId: Record<string, number>
    viewerBurnVotedUserIds: Set<string>
  },
): LeaderboardPlayer[] {
  const scores: Record<string, number> = {}
  const hitCounts: Record<string, number> = {}
  const playedCounts: Record<string, number> = {}
  const predictionCounts: Record<string, number> = {}

  for (const u of allUsers) {
    scores[u.id] = 0
    hitCounts[u.id] = 0
    playedCounts[u.id] = 0
    predictionCounts[u.id] = 0
  }

  for (const pred of allPreds) {
    predictionCounts[pred.userId] = (predictionCounts[pred.userId] || 0) + 1
  }

  for (const match of playedMatches) {
    const result = match.result
    for (const pred of allPreds.filter(p => p.matchId === match.id)) {
      const points = calcPoints(
        { home: pred.homeScore, away: pred.awayScore },
        result,
      )
      scores[pred.userId] = (scores[pred.userId] || 0) + points
      playedCounts[pred.userId] = (playedCounts[pred.userId] || 0) + 1
      if (points > 0) {
        hitCounts[pred.userId] = (hitCounts[pred.userId] || 0) + 1
      }
    }
  }

  const profileMap: Record<string, ProfileRow> = {}
  for (const p of allProfiles) {
    profileMap[p.userId] = p
  }

  return allUsers
    .filter(u => isLeaderboardEligible(profileMap[u.id], predictionCounts[u.id] || 0))
    .map(u => {
      const profile = profileMap[u.id]
      const playedCount = playedCounts[u.id] || 0
      const hitCount = hitCounts[u.id] || 0
      const predictionCount = predictionCounts[u.id] || 0
      const winRate = playedCount > 0 ? (hitCount / playedCount) * 100 : 0

      return {
        id: u.id,
        name: resolveDisplayName({
          displayName: profile?.displayName,
          name: u.name,
          email: u.email,
        }),
        avatarUrl: profile?.avatarUrl || null,
        points: scores[u.id] || 0,
        hitCount,
        playedCount,
        predictionCount,
        winRate,
        rank: 0,
        isBurned: profile?.burnedAt != null,
        burnVoteCount: burnSummary.burnVoteCountByUserId[u.id] ?? 0,
        viewerHasBurnVoted: burnSummary.viewerBurnVotedUserIds.has(u.id),
      }
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.predictionCount !== a.predictionCount) return b.predictionCount - a.predictionCount
      return a.name.localeCompare(b.name)
    })
    .map((player, index) => ({ ...player, rank: index + 1 }))
}

export function buildWorstBoardPlayers(players: LeaderboardPlayer[]): WorstBoardPlayer[] {
  return [...players]
    .sort((a, b) => {
      if (a.winRate !== b.winRate) return a.winRate - b.winRate
      if (a.points !== b.points) return a.points - b.points
      return a.name.localeCompare(b.name)
    })
    .map((player, index) => ({ ...player, worstRank: index + 1 }))
}

export function formatWinRate(winRate: number): string {
  if (winRate === 0) return '0%'
  return `${Math.round(winRate)}%`
}

export function formatLeaderboardSubtitle(player: LeaderboardPlayer): string {
  if (player.points === 0 && player.predictionCount > 0) {
    return `${player.predictionCount} picks · 0 PTS`
  }
  return `${player.points} PTS`
}
