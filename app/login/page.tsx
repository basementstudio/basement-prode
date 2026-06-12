import { redirect } from 'next/navigation'
import { getProfileStatus } from '@/lib/actions'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ recover?: string }>
}) {
  const status = await getProfileStatus()
  const params = await searchParams
  if (status.authenticated && status.complete) redirect('/pronosticos')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal sysbar for login */}
      <div className="sysbar hidden md:flex">
        <div className="sysbar-item accent">
          <span className="sysbar-dot" aria-hidden="true" />
          PRODE/BASEMENT
        </div>
        <div className="sysbar-item">/</div>
        <div className="sysbar-item">WORLD CUP 2026</div>
        <div className="sysbar-item">·</div>
        <div className="sysbar-item">GROUP STAGE</div>
        <div className="flex-1" />
        <div className="sysbar-item" style={{ borderRight:'none', borderLeft:'1px solid var(--fg-4)' }}>NOT SIGNED IN</div>
        <div className="sysbar-item" style={{ borderRight:'none', borderLeft:'1px solid var(--fg-4)' }}>3 PTS WINNER</div>
        <div className="sysbar-item" style={{ borderRight:'none', borderLeft:'1px solid var(--fg-4)' }}>×2 EXACT</div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <LoginForm
          initialStep={
            status.authenticated
              ? 'onboarding'
              : params.recover === '1'
                ? 'recover'
                : 'enter'
          }
        />
      </main>
    </div>
  )
}
