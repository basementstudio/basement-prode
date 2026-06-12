import { redirect } from 'next/navigation'
import { getProfileStatus } from '@/lib/actions'

export default async function RootPage() {
  const status = await getProfileStatus()
  if (status.authenticated && status.complete) redirect('/pronosticos')
  redirect('/login')
}
