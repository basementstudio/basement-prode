import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getMyProfile, getProfileStatus } from '@/lib/actions'
import { Sysbar } from '@/components/sysbar'
import { SiteHeader } from '@/components/site-header'

async function AppChrome({ children }: { children: React.ReactNode }) {
  const status = await getProfileStatus()
  if (!status.authenticated) redirect('/login')
  if (!status.complete) redirect('/login')

  const profile = await getMyProfile()

  return (
    <>
      <Sysbar displayName={profile.resolvedName} />
      <SiteHeader
        avatarUrl={profile.avatarUrl}
        displayName={profile.resolvedName}
      />
      <main className="flex-1">{children}</main>
    </>
  )
}

function AppChromeFallback() {
  return (
    <>
      <div className="h-8 border-b border-border bg-black/95" />
      <div className="h-[52px] border-b border-border bg-black/95" />
      <main className="flex-1" />
    </>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<AppChromeFallback />}>
        <AppChrome>{children}</AppChrome>
      </Suspense>
    </div>
  )
}
