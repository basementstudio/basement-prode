import 'server-only'

import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

/** Una sola consulta de sesión por request de RSC (deduplica layout + páginas + actions). */
export const getAuthSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export const requireAuthUserId = cache(async () => {
  const session = await getAuthSession()
  if (!session?.user) {
    throw new Error('Session expired — sign in again with your name and PIN.')
  }
  return session.user.id
})
