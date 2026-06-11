'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { signOut, useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

interface SiteHeaderProps {
  avatarUrl?: string | null
  displayName?: string | null
}

function navLinkClass(active: boolean) {
  return cn(
    'relative flex h-full items-center px-4 font-mono text-[11px] uppercase tracking-wide text-fg-2 no-underline transition-colors duration-200 ease-base hover:text-fg-1',
    active &&
      'text-fg-1 after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-accent',
  )
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

  const userName =
    displayName || session?.user?.name || session?.user?.email?.split('@')[0] || '??'

  const isPronosticos = pathname === '/pronosticos' || pathname === '/'
  const isEnVivo = pathname === '/en-vivo'
  const isConcluidos = pathname === '/concluidos'
  const isAciertos = pathname === '/aciertos'
  const isTabla = pathname === '/tabla'

  return (
    <header className="sticky top-0 z-50 flex h-[52px] items-center border-b border-border bg-black/95 px-6 backdrop-blur-sm">
      <Link
        href="/pronosticos"
        className="mr-auto flex flex-col gap-0.5 no-underline"
        aria-label="Ir a pronósticos"
      >
        <span className="text-xl font-bold uppercase leading-none tracking-tight text-fg-1">
          PRODE/2026
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-3">
          BASEMENT.STUDIO
        </span>
      </Link>

      <nav
        className="absolute left-1/2 flex h-full -translate-x-1/2 items-stretch"
        aria-label="Navegación principal"
      >
        <Link href="/pronosticos" className={navLinkClass(isPronosticos)}>
          PRONÓSTICOS
          {isPronosticos && (
            <span
              className="ml-1.5 size-[5px] shrink-0 rounded-full! bg-accent"
              aria-hidden="true"
            />
          )}
        </Link>
        <Link href="/aciertos" className={navLinkClass(isAciertos)}>
          ACIERTOS
          {isAciertos && (
            <span
              className="ml-1.5 size-[5px] shrink-0 rounded-full! bg-accent"
              aria-hidden="true"
            />
          )}
        </Link>
        <Link href="/tabla" className={navLinkClass(isTabla)}>
          TABLA
        </Link>
      </nav>

      {session?.user && (
        <div className="ml-auto flex items-center">
          <Link
            href="/tabla"
            className="flex h-9 items-center gap-2 border border-border px-3 no-underline transition-colors duration-200 ease-base hover:border-fg-2 hover:bg-gray-800"
            aria-label="Ir a tu perfil"
          >
            <UserAvatar name={userName} imageUrl={avatarUrl} size="sm" highlight />
            <span className="font-mono text-[11px] uppercase text-fg-2">
              {userName.split(' ')[0]}
            </span>
          </Link>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="h-9 rounded-none border-l-0 font-mono text-[11px] uppercase tracking-wide"
            aria-label="Cerrar sesión"
          >
            SALIR
          </Button>
        </div>
      )}
    </header>
  )
}
