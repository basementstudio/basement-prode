import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { Sysbar } from '@/components/sysbar'
import { SiteHeader } from '@/components/site-header'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <Sysbar />
      <SiteHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
