export const ALLOWED_DOMAIN = 'basement.studio'

export function isAllowedLoginEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  const domain = normalized.split('@')[1]
  return domain === ALLOWED_DOMAIN
}

export function allowedLoginEmailError(): string {
  return `Only @${ALLOWED_DOMAIN} emails are accepted.`
}
