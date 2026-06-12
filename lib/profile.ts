export function normalizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function isProfileComplete(profile: {
  displayName?: string | null
  avatarUrl?: string | null
  recoveryPinHash?: string | null
} | null | undefined): boolean {
  return Boolean(
    profile?.displayName?.trim() &&
      profile?.avatarUrl?.trim() &&
      profile?.recoveryPinHash?.trim(),
  )
}
