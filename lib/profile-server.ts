import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { userProfiles } from '@/lib/db/schema'
import { getAuthSession } from '@/lib/auth-session'
import { resolveDisplayName } from '@/lib/display-name'
import { PROFILE_CACHE_SECONDS, USER_PROFILE_CACHE_TAG } from '@/lib/server-cache'

async function fetchUserProfileById(userId: string) {
  const rows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)
  return rows[0] ?? null
}

const getUserProfileById = unstable_cache(
  fetchUserProfileById,
  ['user-profile-row-v1', String(PROFILE_CACHE_SECONDS)],
  {
    revalidate: PROFILE_CACHE_SECONDS,
    tags: [USER_PROFILE_CACHE_TAG],
  },
)

/** Perfil en BD, cacheado entre requests (invalidar al guardar perfil / auth). */
export const getCachedUserProfile = cache(async (userId: string) => {
  return getUserProfileById(userId)
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
