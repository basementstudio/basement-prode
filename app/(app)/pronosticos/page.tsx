import { getPredictions } from '@/lib/actions'
import { PronosticosClient } from '@/components/pronosticos-client'
import { getGroupStageData } from '@/lib/wc2026/get-matches'

export default async function PronosticosPage() {
  const [predictions, { matches, source }] = await Promise.all([
    getPredictions(),
    getGroupStageData(),
  ])

  return (
    <PronosticosClient
      initialPredictions={predictions}
      matches={matches}
      dataSource={source}
    />
  )
}
