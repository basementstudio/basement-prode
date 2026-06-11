'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from '@/lib/auth-client'

interface SiteHeaderProps {
  avatarUrl?: string | null
  displayName?: string | null
}

function initialsFrom(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function SiteHeader({ avatarUrl, displayName }: SiteHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const userName = displayName || session?.user?.name || session?.user?.email?.split('@')[0] || '??'
  const userInitials = initialsFrom(userName)

  return (
    <header className="site-header">
      <Link href="/pronosticos" className="site-brand" aria-label="Ir a pronósticos">
        <span className="site-brand-title">PRODE/2026</span>
        <span className="mono-label site-brand-sub">BASEMENT.STUDIO</span>
      </Link>

      <nav className="site-nav" aria-label="Navegación principal">
        <Link
          href="/pronosticos"
          className={`nav-link${pathname === '/pronosticos' || pathname === '/' ? ' active' : ''}`}
        >
          PRONÓSTICOS
          {(pathname === '/pronosticos' || pathname === '/') && (
            <span className="nav-dot" aria-hidden="true" />
          )}
        </Link>
        <Link
          href="/tabla"
          className={`nav-link${pathname === '/tabla' ? ' active' : ''}`}
        >
          TABLA
        </Link>
      </nav>

      {session?.user && (
        <div className="site-header-actions">
          <Link href="/tabla" className="user-chip" aria-label="Ir a tu perfil">
            <div
              className="avatar avatar-sm"
              aria-hidden="true"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} />
              ) : (
                userInitials
              )}
            </div>
            <span className="mono-label user-chip-name">{userName.split(' ')[0]}</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="btn"
            style={{ height: '36px', borderLeft: 'none' }}
            aria-label="Cerrar sesión"
          >
            SALIR
          </button>
        </div>
      )}
    </header>
  )
}
