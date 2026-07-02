export function PageLoadingShell() {
  return (
    <div
      style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' }}
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="eyebrow" style={{ marginBottom: '8px', color: 'var(--fg-3)' }}>
        <span className="mono-label">LOADING…</span>
      </div>
      <div
        style={{
          border: '1px solid var(--fg-4)',
          height: '240px',
          background: 'var(--gray-900)',
        }}
      />
    </div>
  )
}
