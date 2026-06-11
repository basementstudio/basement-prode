import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { LoginForm } from './login-form'
import { Sysbar } from '@/components/sysbar'

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/pronosticos')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal sysbar for login */}
      <div className="sysbar hidden md:flex">
        <div className="sysbar-item accent">
          <span className="sysbar-dot" aria-hidden="true" />
          PRODE.BASEMENT.STUDIO
        </div>
        <div className="sysbar-item">/</div>
        <div className="sysbar-item">MUNDIAL 2026</div>
        <div className="sysbar-item">·</div>
        <div className="sysbar-item">FASE DE GRUPOS</div>
        <div className="flex-1" />
        <div className="sysbar-item" style={{ borderRight:'none', borderLeft:'1px solid var(--fg-4)' }}>SIN SESIÓN</div>
        <div className="sysbar-item" style={{ borderRight:'none', borderLeft:'1px solid var(--fg-4)' }}>3 PTS GANADOR</div>
        <div className="sysbar-item" style={{ borderRight:'none', borderLeft:'1px solid var(--fg-4)' }}>×2 EXACTO</div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <LoginForm />
      </main>
    </div>
  )
}
