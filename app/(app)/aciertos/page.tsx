import { Suspense } from 'react'
import { getMyScoredPredictions } from '@/lib/actions'
import { AciertosClient } from '@/components/aciertos-client'
import { PageLoadingShell } from '@/components/page-loading-shell'

async function AciertosContent() {
  const data = await getMyScoredPredictions()

  return (
    <AciertosClient
      items={data.items}
      totalPoints={data.totalPoints}
      exactCount={data.exactCount}
      winnerCount={data.winnerCount}
      missCount={data.missCount}
      playedCount={data.playedCount}
      totalPicks={data.totalPicks}
    />
  )
}

export default function AciertosPage() {
  return (
    <Suspense fallback={<PageLoadingShell />}>
      <AciertosContent />
    </Suspense>
  )
}
