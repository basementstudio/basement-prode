export const ALLOWED_DOMAIN = 'basement.studio'

export function isAllowedLoginEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  const domain = normalized.split('@')[1]
  return domain === ALLOWED_DOMAIN
}

export function allowedLoginEmailError(): string {
  return `Solo se aceptan mails @${ALLOWED_DOMAIN}.`
}
