import { Suspense } from 'react'
import { getPredictions, getRevealedPredictionsByMatchIds } from '@/lib/actions'
import { MatchesStatusClient } from '@/components/matches-status-client'
import { getGroupStageData } from '@/lib/wc2026/get-matches'
import { getMatchStatus } from '@/lib/wc2026-data'
import { PageLoadingShell } from '@/components/page-loading-shell'

async function EnVivoContent() {
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

export default function EnVivoPage() {
  return (
    <Suspense fallback={<PageLoadingShell />}>
      <EnVivoContent />
    </Suspense>
  )
}
