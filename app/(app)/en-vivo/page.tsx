import { getPredictions, getRevealedPredictionsByMatchIds } from '@/lib/actions'
import { MatchesStatusClient } from '@/components/matches-status-client'
import { getGroupStageData } from '@/lib/wc2026/get-matches'
import { getMatchStatus } from '@/lib/wc2026-data'

export default async function EnVivoPage() {
  const [predictions, { matches, source }] = await Promise.all([
    getPredictions(),
    getGroupStageData(),
  ])
  const liveMatchIds = matches
    .filter(match => getMatchStatus(match) === 'live')
    .map(match => match.id)
  const communityPicksByMatch = await getRevealedPredictionsByMatchIds(liveMatchIds)

  return (
    <MatchesStatusClient
      initialPredictions={predictions}
      matches={matches}
      dataSource={source}
      filter="live"
      communityPicksByMatch={communityPicksByMatch}
    />
  )
}
