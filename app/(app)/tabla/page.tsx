import { Suspense } from 'react'
import { getLeaderboard, getMyProfile } from '@/lib/actions'
import { TablaClient } from '@/components/tabla-client'
import { PageLoadingShell } from '@/components/page-loading-shell'

async function TablaContent() {
  const [players, myProfile] = await Promise.all([getLeaderboard(), getMyProfile()])
  return <TablaClient players={players} myProfile={myProfile} />
}

export default function TablaPage() {
  return (
    <Suspense fallback={<PageLoadingShell />}>
      <TablaContent />
    </Suspense>
  )
}
