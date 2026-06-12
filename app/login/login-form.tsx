'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserAvatar } from '@/components/user-avatar'
import { NameTakenDialog } from '@/components/name-taken-dialog'
import { authClient } from '@/lib/auth-client'
import { compressImageFile } from '@/lib/avatar-utils'
import {
  isValidRecoveryPin,
  RECOVERY_PIN_MAX,
  recoveryPinError,
} from '@/lib/recovery-pin'

type Step = 'enter' | 'onboarding' | 'recover'

interface LoginFormProps {
  initialStep?: Step
}

export function LoginForm({ initialStep = 'enter' }: LoginFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>(initialStep)
  const [displayName, setDisplayName] = useState('')
  const [recoverName, setRecoverName] = useState('')
  const [recoveryPin, setRecoveryPin] = useState('')
  const [confirmRecoveryPin, setConfirmRecoveryPin] = useState('')
  const [recoverPin, setRecoverPin] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [nameTakenOpen, setNameTakenOpen] = useState(false)
  const [isUploading, startUpload] = useTransition()
  const [isSaving, startSaving] = useTransition()

  async function handleEnter() {
    setError('')
    setLoading(true)
    try {
      const result = await authClient.signIn.anonymous()
      if (result.error) {
        setError(result.error.message || 'Could not sign in. Try again.')
        return
      }
      setStep('onboarding')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not sign in. Try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmed = recoverName.trim()
    if (!trimmed) {
      setError('Enter your name.')
      return
    }
    if (!isValidRecoveryPin(recoverPin)) {
      setError(recoveryPinError())
      return
    }

    setLoading(true)
    try {
      const result = await authClient.$fetch('/recover/by-username', {
        method: 'POST',
        body: { displayName: trimmed, pin: recoverPin },
      })

      if (result.error) {
        const message = result.error.message ?? ''
        setError(
          message === 'INVALID_CREDENTIALS'
            ? 'Wrong name or PIN. Try again.'
            : result.error.message || 'Could not recover account.',
        )
        return
      }

      router.push('/pronosticos')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not recover account.'
      setError(
        message.includes('INVALID_CREDENTIALS')
          ? 'Wrong name or PIN. Try again.'
          : message,
      )
    } finally {
      setLoading(false)
    }
  }

  function handleAvatarSelect() {
    setUploadError('')
    fileInputRef.current?.click()
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    startUpload(async () => {
      try {
        const dataUrl = await compressImageFile(file)
        setAvatarPreview(dataUrl)
        setUploadError('')
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Could not upload photo')
        setAvatarPreview(null)
      }
    })
  }

  function handleOnboardingSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedName = displayName.trim()
    if (!trimmedName) {
      setError('Enter your name.')
      return
    }
    if (!avatarPreview) {
      setError('Upload a profile photo.')
      return
    }
    if (!isValidRecoveryPin(recoveryPin)) {
      setError(recoveryPinError())
      return
    }
    if (recoveryPin !== confirmRecoveryPin) {
      setError('PINs do not match.')
      return
    }

    startSaving(async () => {
      try {
        const result = await authClient.$fetch('/complete-onboarding', {
          method: 'POST',
          body: {
            displayName: trimmedName,
            avatarUrl: avatarPreview,
            recoveryPin,
          },
        })

        if (result.error) {
          if (result.error.message === 'NAME_TAKEN') {
            setNameTakenOpen(true)
            return
          }
          setError(result.error.message || 'Could not save profile. Try again.')
          return
        }

        router.push('/pronosticos')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save profile. Try again.')
      }
    })
  }

  const heading =
    step === 'enter'
      ? 'Join the prode.'
      : step === 'recover'
        ? 'Recover your picks.'
        : 'Set up your profile.'

  const description =
    step === 'enter'
      ? "Basement's internal World Cup 2026 prode — just for fun. No email, just your name, photo, and a short PIN to recover later."
      : step === 'recover'
        ? 'Enter your name and the PIN you chose when signing up. We will restore your account and predictions.'
        : 'Choose a unique name, upload a photo, and set a 4–6 digit PIN to recover your account later.'

  return (
    <>
      <div className="cell w-full max-w-[440px]" style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', top: '-3px', left: '-3px', width: '6px', height: '6px', background: 'var(--fg-1)', zIndex: 2 }} />
        <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '6px', height: '6px', background: 'var(--fg-1)', zIndex: 2 }} />
        <span style={{ position: 'absolute', bottom: '-3px', left: '-3px', width: '6px', height: '6px', background: 'var(--fg-1)', zIndex: 2 }} />
        <span style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '6px', height: '6px', background: 'var(--fg-1)', zIndex: 2 }} />

        <div style={{ padding: '32px 32px 28px' }}>
          <div className="eyebrow" style={{ marginBottom: '20px' }}>
            <span className="num">PRODE/BASEMENT</span>
            <span className="sep"> — </span>
            ACCESS
            <span style={{ color: 'var(--fg-4)', margin: '0 6px' }}>·</span>
            INTERNAL
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            {heading}
          </h1>
          <p style={{ color: 'var(--fg-3)', fontSize: '15px', lineHeight: '1.5', marginBottom: '28px' }}>
            {description}
          </p>

          {step === 'enter' && (
            <div>
              {error && (
                <p className="mono-label" style={{ color: 'var(--color-contrast)', marginBottom: '16px' }}>
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={handleEnter}
                disabled={loading}
                className="btn solid"
                style={{ width: '100%', height: '44px', fontSize: '12px', justifyContent: 'center', gap: '10px' }}
              >
                {loading ? 'One sec...' : 'Join in'}
                {!loading && <span className="btn-arrow">→</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('recover')
                  setError('')
                }}
                className="btn"
                style={{
                  width: '100%',
                  marginTop: '12px',
                  height: '32px',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'var(--fg-3)',
                }}
              >
                Already played? Recover with name + PIN
              </button>
            </div>
          )}

          {step === 'recover' && (
            <form onSubmit={handleRecover}>
              <label className="mono-label" style={{ display: 'block', color: 'var(--fg-3)', marginBottom: '8px' }}>
                Your name
              </label>
              <input
                type="text"
                value={recoverName}
                onChange={e => {
                  setRecoverName(e.target.value)
                  setError('')
                }}
                className={`input${error ? ' error' : ''}`}
                placeholder="Same name as on the leaderboard"
                autoComplete="nickname"
                autoFocus
                required
                maxLength={40}
                style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)', letterSpacing: '0.01em' }}
              />

              <label className="mono-label" style={{ display: 'block', color: 'var(--fg-3)', marginBottom: '8px' }}>
                Your PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={recoverPin}
                onChange={e => {
                  setRecoverPin(e.target.value.replace(/\D/g, '').slice(0, RECOVERY_PIN_MAX))
                  setError('')
                }}
                className={`input${error ? ' error' : ''}`}
                placeholder="4–6 digits"
                required
                maxLength={RECOVERY_PIN_MAX}
                style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}
              />

              {error && (
                <p className="mono-label" style={{ color: 'var(--color-contrast)', marginBottom: '16px' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !recoverName.trim() || !isValidRecoveryPin(recoverPin)}
                className="btn solid"
                style={{ width: '100%', height: '44px', fontSize: '12px', justifyContent: 'center', gap: '10px' }}
              >
                {loading ? 'Recovering...' : 'Recover account'}
                {!loading && <span className="btn-arrow">→</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('enter')
                  setError('')
                }}
                className="btn"
                style={{ width: '100%', marginTop: '12px', height: '32px', justifyContent: 'center' }}
              >
                Back
              </button>
            </form>
          )}

          {step === 'onboarding' && (
            <form onSubmit={handleOnboardingSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                <button
                  type="button"
                  className="mb-4 cursor-pointer transition-opacity disabled:cursor-wait disabled:opacity-60 hover:enabled:opacity-80"
                  onClick={handleAvatarSelect}
                  disabled={isUploading}
                  aria-label="Upload profile photo"
                >
                  <UserAvatar name={displayName || 'Player'} imageUrl={avatarPreview} size="lg" highlight />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  hidden
                />

                <button
                  type="button"
                  className="btn"
                  onClick={handleAvatarSelect}
                  disabled={isUploading}
                  style={{ width: '100%', justifyContent: 'center', height: '36px' }}
                >
                  {isUploading ? 'Uploading…' : avatarPreview ? 'Change photo' : 'Upload photo'}
                </button>

                {uploadError && (
                  <p className="mono-label" style={{ color: 'var(--color-contrast)', marginTop: '8px', fontSize: '10px' }}>
                    {uploadError}
                  </p>
                )}
              </div>

              <label className="mono-label" style={{ display: 'block', color: 'var(--fg-3)', marginBottom: '8px' }}>
                Your name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => {
                  setDisplayName(e.target.value)
                  setError('')
                }}
                className={`input${error ? ' error' : ''}`}
                placeholder="How you appear on the leaderboard"
                autoComplete="nickname"
                autoFocus
                required
                maxLength={40}
                style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)', letterSpacing: '0.01em' }}
              />

              <label className="mono-label" style={{ display: 'block', color: 'var(--fg-3)', marginBottom: '8px' }}>
                Recovery PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={recoveryPin}
                onChange={e => {
                  setRecoveryPin(e.target.value.replace(/\D/g, '').slice(0, RECOVERY_PIN_MAX))
                  setError('')
                }}
                className="input"
                placeholder="4–6 digits"
                required
                maxLength={RECOVERY_PIN_MAX}
                style={{ marginBottom: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}
              />

              <label className="mono-label" style={{ display: 'block', color: 'var(--fg-3)', marginBottom: '8px' }}>
                Confirm PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={confirmRecoveryPin}
                onChange={e => {
                  setConfirmRecoveryPin(e.target.value.replace(/\D/g, '').slice(0, RECOVERY_PIN_MAX))
                  setError('')
                }}
                className="input"
                placeholder="Repeat PIN"
                required
                maxLength={RECOVERY_PIN_MAX}
                style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}
              />

              {error && (
                <p className="mono-label" style={{ color: 'var(--color-contrast)', marginBottom: '16px' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  isSaving ||
                  isUploading ||
                  !displayName.trim() ||
                  !avatarPreview ||
                  !isValidRecoveryPin(recoveryPin) ||
                  recoveryPin !== confirmRecoveryPin
                }
                className="btn solid"
                style={{ width: '100%', height: '44px', fontSize: '12px', justifyContent: 'center', gap: '10px' }}
              >
                {isSaving ? 'Saving...' : 'Start picking'}
                {!isSaving && <span className="btn-arrow">→</span>}
              </button>
            </form>
          )}
        </div>

        <div style={{
          borderTop: '1px solid var(--fg-4)',
          padding: '14px 32px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
        }}>
          <div style={{ width: '2px', alignSelf: 'stretch', background: 'var(--color-contrast)', flexShrink: 0 }} />
          <div>
            <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
              basement internal · we only store your{' '}
            </span>
            <span className="mono-label" style={{ color: 'var(--color-contrast)' }}>
              name + photo + PIN
            </span>
            <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
              {' '}— recover with name + PIN if you lose this device.
            </span>
          </div>
        </div>
      </div>

      <NameTakenDialog
        open={nameTakenOpen}
        name={displayName.trim()}
        onClose={() => setNameTakenOpen(false)}
      />
    </>
  )
}
