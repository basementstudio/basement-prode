import { getPredictions, getRevealedPredictionsByMatchIds } from '@/lib/actions'
import { MatchesStatusClient } from '@/components/matches-status-client'
import { getGroupStageData } from '@/lib/wc2026/get-matches'
import { getMatchStatus } from '@/lib/wc2026-data'

export default async function ConcluidosPage() {
  const [predictions, { matches, source }] = await Promise.all([
    getPredictions(),
    getGroupStageData(),
  ])
  const finishedMatchIds = matches
    .filter(match => getMatchStatus(match) === 'finished')
    .map(match => match.id)
  const communityPicksByMatch = await getRevealedPredictionsByMatchIds(finishedMatchIds)

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
