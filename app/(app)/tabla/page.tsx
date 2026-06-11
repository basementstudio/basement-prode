import { getLeaderboard, getMyProfile } from '@/lib/actions'
import { TablaClient } from '@/components/tabla-client'

export default async function TablaPage() {
  const [players, myProfile] = await Promise.all([getLeaderboard(), getMyProfile()])

  return <TablaClient players={players} myProfile={myProfile} />
}
