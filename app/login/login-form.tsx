'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { allowedLoginEmailError, isAllowedLoginEmail } from '@/lib/auth-allowed-email'

const OTP_LENGTH = 6

type Step = 'email' | 'otp'

function otpErrorMessage(error: { message?: string; code?: string } | null | undefined): string {
  if (!error) return 'Incorrect or expired code. Request a new one.'
  if (error.code === 'OTP_EXPIRED') return 'Code expired. Request a new one.'
  if (error.code === 'TOO_MANY_ATTEMPTS') return 'Too many attempts. Request a new code.'
  return error.message || 'Incorrect or expired code. Request a new one.'
}

export function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const verifyingRef = useRef(false)
  const emailRef = useRef(email)
  emailRef.current = email

  const handleVerify = useCallback(async (rawCode: string) => {
    const code = rawCode.replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (code.length !== OTP_LENGTH || verifyingRef.current) return

    verifyingRef.current = true
    setError('')
    setLoading(true)
    try {
      const result = await authClient.signIn.emailOtp({
        email: emailRef.current.toLowerCase(),
        otp: code,
      })
      if (result.error) {
        setError(otpErrorMessage(result.error))
        setOtp(Array(OTP_LENGTH).fill(''))
        otpRefs.current[0]?.focus()
      } else {
        router.push('/pronosticos')
        router.refresh()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed. Try again.'
      setError(message)
    } finally {
      setLoading(false)
      verifyingRef.current = false
    }
  }, [router])
  // ---- Step 1: send OTP ----
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!isAllowedLoginEmail(email)) {
      setError(allowedLoginEmailError())
      return
    }

    setLoading(true)
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: email.toLowerCase(),
        type: 'sign-in',
      })
      setSent(true)
      setStep('otp')
    } catch (err: any) {
      setError(err?.message || 'Could not send the code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ---- Step 2: verify OTP ----
  // (handleVerify defined above)

  const handleOtpChange = useCallback((index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1)
    setOtp((prev) => {
      const next = [...prev]
      next[index] = char
      if (char && next.every((c) => c !== '')) {
        queueMicrotask(() => handleVerify(next.join('')))
      }
      return next
    })

    if (char && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }, [handleVerify])

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent, current: string) => {
    if (e.key === 'Backspace' && !current && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }, [])

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((c, i) => { next[i] = c })
    setOtp(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    otpRefs.current[focusIdx]?.focus()
    if (pasted.length === OTP_LENGTH) {
      queueMicrotask(() => handleVerify(pasted))
    }
  }, [handleVerify])

  return (
    <div className="cell w-full max-w-[440px]" style={{ position: 'relative' }}>
      {/* Corner ticks */}
      <span style={{ position:'absolute', top:'-3px', left:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />
      <span style={{ position:'absolute', top:'-3px', right:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />
      <span style={{ position:'absolute', bottom:'-3px', left:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />
      <span style={{ position:'absolute', bottom:'-3px', right:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />

      <div style={{ padding: '32px 32px 28px' }}>
        {/* Eyebrow */}
        <div className="eyebrow" style={{ marginBottom: '20px' }}>
          <span className="num">PRODE/BASEMENT</span>
          <span className="sep"> — </span>
          ACCESS
          <span style={{ color: 'var(--fg-4)', margin: '0 6px' }}>·</span>
          CREW ONLY
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
          {step === 'email' ? 'Enter the pool.' : 'Enter the code.'}
        </h1>
        <p style={{ color: 'var(--fg-3)', fontSize: '15px', lineHeight: '1.5', marginBottom: '28px' }}>
          {step === 'email'
            ? `Pick the group stage of World Cup 2026. Basement email only — no password, we send you a code.`
            : `We sent a ${OTP_LENGTH}-digit code to ${email}. Enter it to sign in.`}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendCode}>
            <label className="mono-label" style={{ display: 'block', color: 'var(--fg-3)', marginBottom: '8px' }}>
              Your basement email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              className={`input${error ? ' error' : ''}`}
              placeholder="nombre@basement.studio"
              autoComplete="email"
              autoFocus
              required
              style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)', letterSpacing: '0.01em' }}
            />
            {error && (
              <p className="mono-label" style={{ color: 'var(--color-contrast)', marginBottom: '16px' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !email}
              className="btn solid"
              style={{ width: '100%', height: '44px', fontSize: '12px', justifyContent: 'center', gap: '10px' }}
            >
              {loading ? 'Sending...' : 'Send code'}
              {!loading && <span className="btn-arrow">→</span>}
            </button>
          </form>
        ) : (
          <div>
            <label className="mono-label" style={{ display: 'block', color: 'var(--fg-3)', marginBottom: '12px' }}>
              {OTP_LENGTH}-digit code
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }} onPaste={handleOtpPaste}>
              {otp.map((val, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e, val)}
                  className="otp-input"
                  autoFocus={i === 0}
                  aria-label={`Code digit ${i + 1}`}
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <p className="mono-label" style={{ color: 'var(--color-contrast)', marginBottom: '16px' }}>
                {error}
              </p>
            )}

            {loading && (
              <p className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '16px' }}>
                Verifying...
              </p>
            )}

            <button
              onClick={() => {
                verifyingRef.current = false
                setStep('email')
                setOtp(Array(OTP_LENGTH).fill(''))
                setError('')
              }}
              className="btn"
              style={{ width: '100%', height: '36px', justifyContent: 'center' }}
            >
              Change email or resend code
            </button>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div style={{
        borderTop: '1px solid var(--fg-4)',
        padding: '14px 32px',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start'
      }}>
        <div style={{ width: '2px', alignSelf: 'stretch', background: 'var(--color-contrast)', flexShrink: 0 }} />
        <div>
          <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
            internal mode · any{' '}
          </span>
          <span className="mono-label" style={{ color: 'var(--color-contrast)' }}>
            @basement.studio
          </span>
          <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
            {' '}address works — the code arrives in your inbox.
          </span>
        </div>
      </div>
    </div>
  )
}
