import { redirect } from 'next/navigation'
import { LoginAmbience } from '@/components/login/login-ambience'
import { getProfileStatus } from '@/lib/actions'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  if (Object.keys(params).length > 0) {
    redirect('/login')
  }

  const status = await getProfileStatus()

  return (
    <div className="relative min-h-screen flex flex-col">
      <LoginAmbience />
      <div className="sysbar relative z-10 hidden md:flex">
        <div className="sysbar-item accent">
          <span className="sysbar-dot" aria-hidden="true" />
          PRODE/BASEMENT
        </div>
        <div className="sysbar-item">/</div>
        <div className="sysbar-item">WORLD CUP 2026</div>
        <div className="sysbar-item">·</div>
        <div className="sysbar-item">GROUP STAGE</div>
        <div className="flex-1" />
        <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>NOT SIGNED IN</div>
        <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>3 PTS WINNER</div>
        <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>×2 EXACT</div>
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-16 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[440px]">
          <LoginForm profileComplete={status.authenticated && status.complete} />
        </div>
      </main>
    </div>
  )
}
