import { getPredictions, getRevealedPredictionsByMatchIds } from '@/lib/actions'
import { MatchesStatusClient } from '@/components/matches-status-client'
import { getGroupStageData } from '@/lib/wc2026/get-matches'

export default async function ConcluidosPage() {
  const [predictions, { matches, source }] = await Promise.all([
    getPredictions(),
    getGroupStageData(),
  ])
  const communityPicksByMatch = await getRevealedPredictionsByMatchIds(matches.map(m => m.id))

  return (
    <MatchesStatusClient
      initialPredictions={predictions}
      matches={matches}
      dataSource={source}
      filter="finished"
      communityPicksByMatch={communityPicksByMatch}
    />
  )
}
