import 'server-only'

import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { userProfiles } from '@/lib/db/schema'
import { getAuthSession } from '@/lib/auth-session'
import { resolveDisplayName } from '@/lib/display-name'

export const getCachedUserProfile = cache(async (userId: string) => {
  const rows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)
  return rows[0] ?? null
})

export const getMyProfileData = cache(async () => {
  const session = await getAuthSession()
  if (!session?.user) {
    throw new Error('Session expired — sign in again with your name and PIN.')
  }

  const profile = await getCachedUserProfile(session.user.id)
  const email = session.user.email
  const authName = session.user.name
  const storedDisplayName = profile?.displayName ?? null

  return {
    userId: session.user.id,
    email,
    name: authName,
    displayName: storedDisplayName,
    resolvedName: resolveDisplayName({
      displayName: storedDisplayName,
      name: authName,
      email,
    }),
    avatarUrl: profile?.avatarUrl ?? null,
  }
})
