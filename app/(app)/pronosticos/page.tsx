import { getPredictions, getRevealedPredictionsByMatchIds } from '@/lib/actions'
import { PronosticosClient } from '@/components/pronosticos-client'
import { getGroupStageData } from '@/lib/wc2026/get-matches'
import { isMatchLocked } from '@/lib/wc2026-data'

export default async function PronosticosPage() {
  const [predictions, { matches, source }] = await Promise.all([
    getPredictions(),
    getGroupStageData(),
  ])
  const lockedMatchIds = matches.filter(match => isMatchLocked(match)).map(match => match.id)
  const communityPicksByMatch = await getRevealedPredictionsByMatchIds(lockedMatchIds)

  return (
    <PronosticosClient
      initialPredictions={predictions}
      matches={matches}
      dataSource={source}
      communityPicksByMatch={communityPicksByMatch}
    />
  )
}
