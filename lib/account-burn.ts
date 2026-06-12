/** Votes required to cosmetically burn an account on the leaderboard. */
export const ACCOUNT_BURN_VOTE_THRESHOLD = 5

export function isAccountBurned(burnedAt: Date | null | undefined): boolean {
  return burnedAt != null
}

export function formatBurnVoteProgress(voteCount: number): string {
  return `${Math.min(voteCount, ACCOUNT_BURN_VOTE_THRESHOLD)}/${ACCOUNT_BURN_VOTE_THRESHOLD}`
}
