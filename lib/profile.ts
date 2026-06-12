import { db } from '@/lib/db'
import { userProfiles } from '@/lib/db/schema'

export function normalizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export async function findProfileByDisplayName(displayName: string) {
  const normalized = normalizeDisplayName(displayName).toLowerCase()
  if (!normalized) return null

  const profiles = await db.select().from(userProfiles)
  return (
    profiles.find(
      profile =>
        normalizeDisplayName(profile.displayName ?? '').toLowerCase() === normalized,
    ) ?? null
  )
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
