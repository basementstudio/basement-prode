import 'server-only'

import { db } from '@/lib/db'
import { user, userProfiles } from '@/lib/db/schema'
import { normalizeDisplayName } from '@/lib/profile'
import { isValidRecoveryPin, recoveryPinError } from '@/lib/recovery-pin'
import { hashRecoveryPin } from '@/lib/recovery-pin-server'
import { isValidStoredAvatarUrl } from '@/lib/avatar-url'
import { and, eq, ne, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function findProfileByDisplayName(displayName: string) {
  const normalized = normalizeDisplayName(displayName).toLowerCase()
  if (!normalized) return null

  const rows = await db
    .select()
    .from(userProfiles)
    .where(sql`lower(trim(${userProfiles.displayName})) = ${normalized}`)
    .limit(1)

  return rows[0] ?? null
}

export async function isDisplayNameTaken(
  displayName: string,
  excludeUserId?: string,
): Promise<boolean> {
  const normalized = normalizeDisplayName(displayName).toLowerCase()
  if (!normalized) return false

  const conditions = [sql`lower(trim(${userProfiles.displayName})) = ${normalized}`]
  if (excludeUserId) {
    conditions.push(ne(userProfiles.userId, excludeUserId))
  }

  const rows = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(and(...conditions))
    .limit(1)

  return rows.length > 0
}

export async function upsertProfile(
  userId: string,
  data: { displayName?: string; avatarUrl?: string; recoveryPinHash?: string },
) {
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
  } else {
    await db.insert(userProfiles).values({
      id: nanoid(),
      userId,
      ...data,
    })
  }
}

export async function runCompleteOnboarding(
  userId: string,
  displayName: string,
  avatarUrl: string,
  recoveryPin: string,
) {
  const normalized = normalizeDisplayName(displayName)

  if (!normalized) throw new Error('Enter a name.')
  if (normalized.length > 40) throw new Error('Name is too long (max 40 characters).')
  if (await isDisplayNameTaken(normalized, userId)) {
    throw new Error('NAME_TAKEN')
  }
  if (!isValidRecoveryPin(recoveryPin)) throw new Error(recoveryPinError())
  if (!isValidStoredAvatarUrl(avatarUrl)) throw new Error('Invalid image')

  const recoveryPinHash = await hashRecoveryPin(recoveryPin)

  await db.update(user).set({ name: normalized, updatedAt: new Date() }).where(eq(user.id, userId))
  await upsertProfile(userId, { displayName: normalized, avatarUrl, recoveryPinHash })
}
