import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins'
import { pool } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email/send-otp-email'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  plugins: [
    emailOTP({
      resendStrategy: 'reuse',
      async sendVerificationOTP({ email, otp, type }) {
        try {
          await sendOtpEmail({ email, otp, type })
        } catch (err) {
          console.error('[auth] Error al enviar OTP por email:', err)
          throw err
        }
      },
      otpLength: 6,
      expiresIn: 600,
    }),
  ],
  trustedOrigins: [
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    'http://localhost:3000',
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'lax' as const,
            secure: false,
          },
        },
      }
    : {}),
})
