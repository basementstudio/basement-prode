'use client'

import { type Ref, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

interface ScoreInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
  onTabNext?: () => void
  onBlurComplete?: () => void
  onEdited?: () => void
  onActivate?: () => void
  className?: string
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
  onActivate,
  className,
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
    if (/^\d$/.test(e.key)) {
      onEdited?.()
    }
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
      className={cn('score-input', className)}
      onChange={e => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={e => {
        onActivate?.()
        e.target.select()
      }}
      onBlur={() => onBlurComplete?.()}
    />
  )
}
