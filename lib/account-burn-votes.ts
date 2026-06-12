import { isAccountBurned } from '@/lib/account-burn'

type BurnVoteRow = { targetUserId: string; voterId: string }

export function summarizeAccountBurnVotes(
  votes: BurnVoteRow[],
  viewerUserId: string,
): {
  burnVoteCountByUserId: Record<string, number>
  viewerBurnVotedUserIds: Set<string>
} {
  const burnVoteCountByUserId: Record<string, number> = {}
  const viewerBurnVotedUserIds = new Set<string>()

  for (const vote of votes) {
    burnVoteCountByUserId[vote.targetUserId] =
      (burnVoteCountByUserId[vote.targetUserId] ?? 0) + 1
    if (vote.voterId === viewerUserId) {
      viewerBurnVotedUserIds.add(vote.targetUserId)
    }
  }

  return { burnVoteCountByUserId, viewerBurnVotedUserIds }
}

export { isAccountBurned }
