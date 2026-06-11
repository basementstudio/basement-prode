'use client'

import { type Ref, type KeyboardEvent } from 'react'

interface ScoreInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
  onTabNext?: () => void
  onBlurComplete?: () => void
  onEdited?: () => void
  'aria-label'?: string
}

export function ScoreInput({
  value,
  onChange,
  disabled,
  inputRef,
  onTabNext,
  onBlurComplete,
  onEdited,
  'aria-label': ariaLabel,
}: ScoreInputProps) {
  function handleChange(raw: string) {
    onEdited?.()
    if (raw === '') {
      onChange(0)
      return
    }
    const n = Number.parseInt(raw, 10)
    if (Number.isNaN(n)) return
    onChange(Math.max(0, Math.min(99, n)))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onTabNext?.()
    }
  }

  return (
    <input
      ref={inputRef}
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      className="score-input"
      onChange={e => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={e => e.target.select()}
      onBlur={() => onBlurComplete?.()}
    />
  )
}
