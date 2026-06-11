'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

const ALLOWED_DOMAIN = 'basement.studio'
const OTP_LENGTH = 6

type Step = 'email' | 'otp'

export function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ---- Step 1: send OTP ----
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const domain = email.split('@')[1]?.toLowerCase()
    if (domain !== ALLOWED_DOMAIN) {
      setError(`Solo se aceptan mails @${ALLOWED_DOMAIN}.`)
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
      setError(err?.message || 'No se pudo enviar el código. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ---- Step 2: verify OTP ----
  async function handleVerify(code: string) {
    setError('')
    setLoading(true)
    try {
      const result = await authClient.signIn.emailOtp({
        email: email.toLowerCase(),
        otp: code,
      })
      if (result.error) {
        setError('Código incorrecto o expirado. Pedí uno nuevo.')
        setOtp(Array(OTP_LENGTH).fill(''))
        otpRefs.current[0]?.focus()
      } else {
        router.push('/pronosticos')
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || 'Error al verificar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // OTP input handling
  const handleOtpChange = useCallback((index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = char
    setOtp(next)

    if (char && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all filled
    if (char && next.every(c => c !== '')) {
      const code = next.join('')
      handleVerify(code)
    }
  }, [otp])

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }, [otp])

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
      handleVerify(pasted)
    }
  }, [])

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
          <span className="num">PRODE/2026</span>
          <span className="sep"> — </span>
          ACCESO
          <span style={{ color: 'var(--fg-4)', margin: '0 6px' }}>·</span>
          SOLO CREW
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
          {step === 'email' ? 'Entrá al prode.' : 'Ingresá el código.'}
        </h1>
        <p style={{ color: 'var(--fg-3)', fontSize: '15px', lineHeight: '1.5', marginBottom: '28px' }}>
          {step === 'email'
            ? `Pronosticá la fase de grupos del Mundial 2026. Acceso solo con tu mail de basement — sin contraseña, te mandamos un código.`
            : `Mandamos un código de ${OTP_LENGTH} dígitos a ${email}. Ingresalo para entrar.`}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendCode}>
            <label className="mono-label" style={{ display: 'block', color: 'var(--fg-3)', marginBottom: '8px' }}>
              Tu mail de basement
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
              {loading ? 'Enviando...' : 'Enviar código'}
              {!loading && <span className="btn-arrow">→</span>}
            </button>
          </form>
        ) : (
          <div>
            <label className="mono-label" style={{ display: 'block', color: 'var(--fg-3)', marginBottom: '12px' }}>
              Código de {OTP_LENGTH} dígitos
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
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="otp-input"
                  autoFocus={i === 0}
                  aria-label={`Dígito ${i + 1} del código`}
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
                Verificando...
              </p>
            )}

            <button
              onClick={() => { setStep('email'); setOtp(Array(OTP_LENGTH).fill('')); setError('') }}
              className="btn"
              style={{ width: '100%', height: '36px', justifyContent: 'center' }}
            >
              Cambiar email o reenviar código
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
            modo interno · cualquier dirección{' '}
          </span>
          <span className="mono-label" style={{ color: 'var(--color-contrast)' }}>
            @basement.studio
          </span>
          <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
            {' '}entra — el código llega a tu mail.
          </span>
        </div>
      </div>
    </div>
  )
}
