'use client'

import { createAuthClient } from 'better-auth/react'
import { anonymousClient } from 'better-auth/client/plugins'

const usernameRecoverClient = () => ({
  id: 'username-recover',
  pathMethods: {
    '/recover/by-username': 'POST',
  },
  atomListeners: [
    {
      matcher: (path: string) => path === '/recover/by-username',
      signal: '$sessionSignal',
    },
  ],
})

const onboardingClient = () => ({
  id: 'onboarding',
  pathMethods: {
    '/complete-onboarding': 'POST',
  },
  atomListeners: [
    {
      matcher: (path: string) => path === '/complete-onboarding',
      signal: '$sessionSignal',
    },
  ],
})

export const authClient = createAuthClient({
  plugins: [anonymousClient(), usernameRecoverClient(), onboardingClient()],
})

export const { signOut, useSession } = authClient
