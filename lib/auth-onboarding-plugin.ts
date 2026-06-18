import { createAuthEndpoint } from '@better-auth/core/api'
import { APIError, getSessionFromCtx, sessionMiddleware } from 'better-auth/api'
import * as z from 'zod'
import { isValidStoredAvatarUrl } from '@/lib/avatar-url'
import { revalidateAfterAuthChange } from '@/lib/revalidate-app'
import { runCompleteOnboarding } from '@/lib/user-profile'
import { RECOVERY_PIN_MAX, RECOVERY_PIN_MIN } from '@/lib/recovery-pin'

export function onboardingPlugin() {
  return {
    id: 'onboarding',
    endpoints: {
      completeOnboarding: createAuthEndpoint(
        '/complete-onboarding',
        {
          method: 'POST',
          use: [sessionMiddleware],
          body: z.object({
            displayName: z.string().min(1).max(40),
            avatarUrl: z
              .string()
              .max(2_048)
              .refine(isValidStoredAvatarUrl, { message: 'Invalid image URL' }),
            recoveryPin: z
              .string()
              .min(RECOVERY_PIN_MIN)
              .max(RECOVERY_PIN_MAX)
              .regex(/^\d+$/),
          }),
        },
        async (ctx) => {
          const session = await getSessionFromCtx(ctx)
          if (!session?.user) {
            throw APIError.from('UNAUTHORIZED', { code: 'UNAUTHORIZED', message: 'UNAUTHORIZED' })
          }

          try {
            await runCompleteOnboarding(
              session.user.id,
              ctx.body.displayName,
              ctx.body.avatarUrl,
              ctx.body.recoveryPin,
            )
          } catch (err) {
            if (err instanceof Error && err.message === 'NAME_TAKEN') {
              throw APIError.from('CONFLICT', { code: 'NAME_TAKEN', message: 'NAME_TAKEN' })
            }
            if (err instanceof Error) {
              throw APIError.from('BAD_REQUEST', { code: err.message, message: err.message })
            }
            throw APIError.from('INTERNAL_SERVER_ERROR', {
              code: 'ONBOARDING_FAILED',
              message: 'ONBOARDING_FAILED',
            })
          }

          revalidateAfterAuthChange()

          return ctx.json({ complete: true })
        },
      ),
    },
  }
}
