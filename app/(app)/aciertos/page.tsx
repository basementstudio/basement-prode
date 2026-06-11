import { getMyScoredPredictions } from '@/lib/actions'
import { AciertosClient } from '@/components/aciertos-client'

export default async function AciertosPage() {
  const data = await getMyScoredPredictions()

  return (
    <AciertosClient
      items={data.items}
      totalPoints={data.totalPoints}
      exactCount={data.exactCount}
      winnerCount={data.winnerCount}
      missCount={data.missCount}
      playedCount={data.playedCount}
    />
  )
}
