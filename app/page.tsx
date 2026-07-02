import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getProfileStatus } from '@/lib/actions'

async function RootRedirect() {
  const status = await getProfileStatus()
  if (status.authenticated && status.complete) redirect('/pronosticos')
  redirect('/login')
}

export default function RootPage() {
  return (
    <Suspense fallback={null}>
      <RootRedirect />
    </Suspense>
  )
}
