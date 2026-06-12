'use client'

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

import { authClient } from '@/lib/auth-client'

/** Sincroniza la sesión en el cliente y revalida Server Components. */
export async function syncAuthSessionAndRefresh(router: AppRouterInstance) {
  await authClient.getSession()
  router.refresh()
}

/** Tras login/recover: confirma que hay sesión antes de navegar. */
export async function ensureAuthenticatedSession(): Promise<boolean> {
  const { data } = await authClient.getSession()
  return Boolean(data?.user)
}

/** Tras sign out: confirma que la sesión se limpió. */
export async function ensureSignedOut(): Promise<boolean> {
  const { data } = await authClient.getSession()
  return !data?.user
}
