'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from '@/lib/auth-client'

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : session?.user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <header className="site-header">
      {/* Brand mark */}
      <Link href="/pronosticos" className="flex flex-col leading-none mr-auto" style={{ textDecoration: 'none' }}>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: 'var(--fg-1)',
          lineHeight: 1,
        }}>
          prode/2026
        </span>
        <span className="mono-label" style={{ color: 'var(--fg-3)', fontSize: '10px', letterSpacing: '0.06em' }}>
          basement.studio
        </span>
      </Link>

      {/* Nav centrado */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center" aria-label="Navegación principal">
        <Link
          href="/pronosticos"
          className={`nav-link${pathname === '/pronosticos' || pathname === '/' ? ' active' : ''}`}
        >
          pronósticos
          {(pathname === '/pronosticos' || pathname === '/') && (
            <span className="nav-dot" aria-hidden="true" />
          )}
        </Link>
        <Link
          href="/tabla"
          className={`nav-link${pathname === '/tabla' ? ' active' : ''}`}
        >
          tabla
        </Link>
      </nav>

      {/* User chip */}
      {session?.user && (
        <div className="flex items-center gap-0 ml-auto">
          <div className="user-chip" style={{ gap: '8px' }}>
            <div
              className="avatar"
              style={{ width: '24px', height: '24px', fontSize: '9px', border: '1px solid var(--color-contrast)' }}
              aria-hidden="true"
            >
              {initials}
            </div>
            <span className="mono-label" style={{ color: 'var(--fg-2)', fontSize: '11px' }}>
              {session.user.name?.split(' ')[0] || session.user.email.split('@')[0]}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="btn"
            style={{ height: '36px', borderLeft: 'none' }}
            aria-label="Cerrar sesión"
          >
            salir
          </button>
        </div>
      )}
    </header>
  )
}
