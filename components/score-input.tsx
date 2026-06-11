'use client'

import { type Ref, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'
import { isBlockedScoreKey, parseScoreInput } from '@/lib/score'

interface ScoreInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
  onTabNext?: () => void
  onBlurComplete?: () => void
  onEdited?: () => void
  onActivate?: () => void
  onInteraction?: () => void
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
  onInteraction,
  className,
  'aria-label': ariaLabel,
}: ScoreInputProps) {
  function handleChange(raw: string) {
    const parsed = parseScoreInput(raw)
    if (parsed === null) return
    onEdited?.()
    onChange(parsed)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (isBlockedScoreKey(e.key)) {
      e.preventDefault()
      return
    }
    if (/^\d$/.test(e.key)) {
      onInteraction?.()
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
      type="text"
      inputMode="numeric"
      autoComplete="off"
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
