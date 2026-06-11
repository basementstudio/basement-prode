export const ALLOWED_DOMAIN = 'basement.studio'

/** Solo para testing con Resend sandbox (mail de tu cuenta Resend). */
export function isAllowedLoginEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  const extra = process.env.NEXT_PUBLIC_AUTH_EXTRA_EMAIL?.trim().toLowerCase()

  if (extra && normalized === extra) {
    return true
  }

  const domain = normalized.split('@')[1]
  return domain === ALLOWED_DOMAIN
}

export function allowedLoginEmailError(): string {
  const extra = process.env.NEXT_PUBLIC_AUTH_EXTRA_EMAIL?.trim()
  if (extra) {
    return `Solo se aceptan mails @${ALLOWED_DOMAIN} o ${extra} (testing).`
  }
  return `Solo se aceptan mails @${ALLOWED_DOMAIN}.`
}
