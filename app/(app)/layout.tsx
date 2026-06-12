import { redirect } from 'next/navigation'
import { getMyProfile, getProfileStatus } from '@/lib/actions'
import { Sysbar } from '@/components/sysbar'
import { SiteHeader } from '@/components/site-header'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const status = await getProfileStatus()
  if (!status.authenticated) redirect('/login')
  if (!status.complete) redirect('/login')

  const profile = await getMyProfile()

  return (
    <div className="min-h-screen flex flex-col">
      <Sysbar displayName={profile.resolvedName} />
      <SiteHeader
        avatarUrl={profile.avatarUrl}
        displayName={profile.resolvedName}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
