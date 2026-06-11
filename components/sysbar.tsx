'use client'

import { useSession } from '@/lib/auth-client'

export function Sysbar() {
  const { data: session } = useSession()

  const playedCount = 0 // could be dynamic later
  const build = 'v0.1.0'

  return (
    <div className="sysbar hidden md:flex" role="banner">
      <div className="sysbar-item accent">
        <span className="sysbar-dot" aria-hidden="true" />
        PRODE.BASEMENT.STUDIO
      </div>
      <div className="sysbar-item">/</div>
      <div className="sysbar-item">
        MUNDIAL 2026
      </div>
      <div className="sysbar-item">
        ·
      </div>
      <div className="sysbar-item">
        FASE DE GRUPOS
      </div>

      {/* spacer */}
      <div className="flex-1" />

      {session?.user && (
        <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>
          {session.user.email.toLowerCase()}
        </div>
      )}
      <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>
        3 PTS GANADOR
      </div>
      <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>
        ×2 EXACTO
      </div>
      <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>
        {build}
      </div>
    </div>
  )
}
