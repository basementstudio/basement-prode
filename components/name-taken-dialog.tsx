'use client'

interface NameTakenDialogProps {
  open: boolean
  name: string
  onClose: () => void
}

export function NameTakenDialog({ open, name, onClose }: NameTakenDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-taken-title"
      onClick={onClose}
    >
      <div
        className="cell relative w-full max-w-[400px]"
        onClick={e => e.stopPropagation()}
      >
        <span style={{ position: 'absolute', top: '-3px', left: '-3px', width: '6px', height: '6px', background: 'var(--fg-1)', zIndex: 2 }} />
        <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '6px', height: '6px', background: 'var(--fg-1)', zIndex: 2 }} />
        <span style={{ position: 'absolute', bottom: '-3px', left: '-3px', width: '6px', height: '6px', background: 'var(--fg-1)', zIndex: 2 }} />
        <span style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '6px', height: '6px', background: 'var(--fg-1)', zIndex: 2 }} />

        <div style={{ padding: '28px 28px 24px' }}>
          <div className="eyebrow" style={{ marginBottom: '16px', color: 'var(--color-contrast)' }}>
            NAME TAKEN
          </div>
          <h2
            id="name-taken-title"
            style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}
          >
            That name is already in use.
          </h2>
          <p style={{ color: 'var(--fg-3)', fontSize: '15px', lineHeight: 1.5, marginBottom: '24px' }}>
            <strong style={{ color: 'var(--fg-1)' }}>{name}</strong> is already taken by another player. Pick a different name to continue.
          </p>
          <button
            type="button"
            className="btn solid"
            onClick={onClose}
            style={{ width: '100%', height: '44px', justifyContent: 'center' }}
          >
            Choose another name
          </button>
        </div>
      </div>
    </div>
  )
}
