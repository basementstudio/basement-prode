'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { ensureSignedOut, syncAuthSessionAndRefresh } from '@/lib/auth-refresh-client'
import { signOut, useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

interface SiteHeaderProps {
  avatarUrl?: string | null
  displayName?: string | null
}

type NavItem = {
  href: string
  label: string
  isActive: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/pronosticos',
    label: 'PICKS',
    isActive: pathname => pathname === '/pronosticos' || pathname === '/',
  },
  {
    href: '/en-vivo',
    label: 'LIVE',
    isActive: pathname => pathname === '/en-vivo',
  },
  {
    href: '/concluidos',
    label: 'FINISHED',
    isActive: pathname => pathname === '/concluidos',
  },
  {
    href: '/aciertos',
    label: 'HITS',
    isActive: pathname => pathname === '/aciertos',
  },
  {
    href: '/tabla',
    label: 'LEADERBOARD',
    isActive: pathname => pathname === '/tabla',
  },
]

function navLinkClass(active: boolean, mobile = false) {
  return cn(
    'relative flex items-center font-mono text-[11px] uppercase tracking-wide text-fg-2 no-underline transition-colors duration-200 ease-base hover:text-fg-1',
    mobile
      ? 'min-h-[44px] border-b border-border px-4 py-3 last:border-b-0'
      : 'h-full px-4',
    active &&
      (mobile
        ? 'bg-gray-800 text-fg-1'
        : 'text-fg-1 after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-accent'),
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="text-fg-1"
    >
      {open ? (
        <path
          d="M4 4L14 14M14 4L4 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      ) : (
        <>
          <path d="M2 5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M2 9H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M2 13H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </>
      )}
    </svg>
  )
}

export function SiteHeader({ avatarUrl, displayName }: SiteHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  async function handleSignOut() {
    await signOut()
    if (!(await ensureSignedOut())) {
      await signOut()
    }
    await syncAuthSessionAndRefresh(router)
    router.push('/login?recover=1')
  }

  const userName = displayName || session?.user?.name || 'Player'

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-black/95 backdrop-blur-sm">
      <div className="relative flex h-[52px] items-center gap-3 px-4 md:px-6">
        <Link
          href="/pronosticos"
          className="mr-auto flex min-w-0 shrink flex-col gap-0.5 no-underline"
          aria-label="Go to picks"
        >
          <span className="truncate text-lg font-bold uppercase leading-none tracking-tight text-fg-1 md:text-xl">
            BASEMENT/ PRODE
          </span>
        </Link>

        <nav
          className="absolute left-1/2 hidden h-full -translate-x-1/2 items-stretch lg:flex"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map(item => {
            const active = item.isActive(pathname)
            return (
              <Link key={item.href} href={item.href} className={navLinkClass(active)}>
                {item.label}
                {active && (
                  <span
                    className="ml-1.5 size-[5px] shrink-0 rounded-full! bg-accent"
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {session?.user && (
          <div className="hidden items-center lg:flex">
            <Link
              href="/tabla"
              className="flex h-9 items-center gap-2 border border-border px-3 no-underline transition-colors duration-200 ease-base hover:border-fg-2 hover:bg-gray-800"
              aria-label="Go to your profile"
            >
              <UserAvatar name={userName} imageUrl={avatarUrl} size="sm" />
              <span className="font-mono text-[11px] uppercase text-fg-2">
                {userName.split(' ')[0]}
              </span>
            </Link>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="h-9 rounded-none border-l-0 font-mono text-[11px] uppercase tracking-wide"
              aria-label="Sign out"
            >
              SIGN OUT
            </Button>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <Link
            href="/tabla"
            className={cn(
              'flex h-9 items-center border border-border px-3 font-mono text-[10px] uppercase tracking-wide no-underline transition-colors duration-200 ease-base hover:border-fg-2 hover:bg-gray-800 sm:text-[11px]',
              pathname === '/tabla' ? 'border-fg-2 bg-gray-800 text-fg-1' : 'text-fg-2',
            )}
            aria-label="Go to leaderboard"
          >
            LEADERBOARD
          </Link>
          <Button
            variant="outline"
            onClick={() => setMenuOpen(open => !open)}
            className="size-9 rounded-none p-0 font-mono"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <MenuIcon open={menuOpen} />
          </Button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[52px] z-40 bg-black/70 lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <nav
            id="mobile-nav"
            className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-52px)] overflow-y-auto border-b border-border bg-black/95 backdrop-blur-sm scrollbar-none lg:hidden"
            aria-label="Mobile navigation"
          >
            {NAV_ITEMS.filter(item => item.href !== '/tabla').map(item => {
              const active = item.isActive(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(active, true)}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                  {active && (
                    <span
                      className="ml-auto size-[5px] shrink-0 rounded-full! bg-accent"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              )
            })}

            {session?.user && (
              <div className="flex items-stretch border-t border-border">
                <Link
                  href="/tabla"
                  className="flex min-h-[44px] flex-1 items-center gap-2 border-r border-border px-4 no-underline transition-colors duration-200 ease-base hover:bg-gray-800"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserAvatar name={userName} imageUrl={avatarUrl} size="sm" />
                  <span className="truncate font-mono text-[11px] uppercase text-fg-2">
                    {userName.split(' ')[0]}
                  </span>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="min-h-[44px] rounded-none border-0 border-l border-border px-4 font-mono text-[11px] uppercase tracking-wide"
                  aria-label="Sign out"
                >
                  SIGN OUT
                </Button>
              </div>
            )}
          </nav>
        </>
      )}
    </header>
  )
}
