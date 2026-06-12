'use client'

interface SysbarProps {
  displayName?: string | null
}

export function Sysbar({ displayName }: SysbarProps) {

  const playedCount = 0 // could be dynamic later
  const build = 'v0.1.0'

  return (
    <div className="sysbar hidden md:flex" role="banner">
      <div className="sysbar-item accent">
        <span className="sysbar-dot" aria-hidden="true" />
        PRODE/BASEMENT
      </div>
      <div className="sysbar-item">/</div>
      <div className="sysbar-item">
        WORLD CUP 2026
      </div>
      <div className="sysbar-item">
        ·
      </div>
      <div className="sysbar-item">
        GROUP STAGE
      </div>

      {/* spacer */}
      <div className="flex-1" />

      {displayName && (
        <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>
          {displayName.toUpperCase()}
        </div>
      )}
      <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>
        3 PTS WINNER
      </div>
      <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>
        ×2 EXACT · W/L
      </div>
      <div className="sysbar-item" style={{ borderRight: 'none', borderLeft: '1px solid var(--fg-4)' }}>
        {build}
      </div>
    </div>
  )
}
