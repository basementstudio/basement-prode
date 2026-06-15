'use client'

import { cn } from '@/lib/utils'

interface Props {
  saved: boolean
  dirty: boolean
  saving: boolean
  disabled?: boolean
  onSave: () => void
}

export function PredictionSaveSwitch({ saved, dirty, saving, disabled, onSave }: Props) {
  const isOn = saved && !dirty
  const canSave = !disabled && !saving && dirty

  function handleClick() {
    if (isOn || !canSave) return
    onSave()
  }

  return (
    <button
      type="button"
      className={cn(
        'prediction-save-switch',
        isOn && 'is-on',
        canSave && 'is-ready',
        saving && 'is-saving',
      )}
      onClick={handleClick}
      disabled={!canSave && !isOn}
      aria-pressed={isOn}
      aria-label={isOn ? 'Prediction saved' : 'Save prediction'}
    >
      <span className="prediction-save-switch-track" aria-hidden>
        <span className="prediction-save-switch-thumb" />
      </span>
      <span className="prediction-save-switch-label mono-label">
        {saving ? 'Saving…' : isOn ? 'Saved' : 'Save'}
      </span>
    </button>
  )
}
