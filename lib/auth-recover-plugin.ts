import { createAuthEndpoint } from '@better-auth/core/api'
import { APIError, getSessionFromCtx } from 'better-auth/api'
import { deleteSessionCookie, setSessionCookie } from 'better-auth/cookies'
import { parseUserOutput } from 'better-auth/db'
import * as z from 'zod'
import { revalidateAfterAuthChange } from '@/lib/revalidate-app'
import { findProfileByDisplayName, isDisplayNameTaken } from '@/lib/user-profile'
import { isProfileComplete, normalizeDisplayName } from '@/lib/profile'
import { isValidRecoveryPin, RECOVERY_PIN_MAX, RECOVERY_PIN_MIN } from '@/lib/recovery-pin'
import { verifyRecoveryPin } from '@/lib/recovery-pin-server'

export function usernameRecoverPlugin() {
  return {
    id: 'username-recover',
    endpoints: {
      recoverByUsername: createAuthEndpoint(
        '/recover/by-username',
        {
          method: 'POST',
          body: z.object({
            displayName: z.string().min(1).max(40),
            pin: z
              .string()
              .min(RECOVERY_PIN_MIN)
              .max(RECOVERY_PIN_MAX)
              .regex(/^\d+$/),
          }),
        },
        async (ctx) => {
          const normalized = normalizeDisplayName(ctx.body.displayName)
          const pin = ctx.body.pin

          if (!normalized || !isValidRecoveryPin(pin)) {
            throw APIError.from('BAD_REQUEST', {
              code: 'INVALID_CREDENTIALS',
              message: 'INVALID_CREDENTIALS',
            })
          }

          const profile = await findProfileByDisplayName(normalized)
          if (!profile || !isProfileComplete(profile) || !profile.recoveryPinHash) {
            throw APIError.from('UNAUTHORIZED', {
              code: 'INVALID_CREDENTIALS',
              message: 'INVALID_CREDENTIALS',
            })
          }

          const pinValid = await verifyRecoveryPin(pin, profile.recoveryPinHash)
          if (!pinValid) {
            throw APIError.from('UNAUTHORIZED', {
              code: 'INVALID_CREDENTIALS',
              message: 'INVALID_CREDENTIALS',
            })
          }

          const targetUser = await ctx.context.internalAdapter.findUserById(profile.userId)
          if (!targetUser) {
            throw APIError.from('UNAUTHORIZED', {
              code: 'INVALID_CREDENTIALS',
              message: 'INVALID_CREDENTIALS',
            })
          }

          const existingSession = await getSessionFromCtx(ctx, { disableRefresh: true })
          if (existingSession) {
            await ctx.context.internalAdapter.deleteSession(existingSession.session.token)
            await deleteSessionCookie(ctx)
          }

          const session = await ctx.context.internalAdapter.createSession(targetUser.id)
          if (!session) {
            throw APIError.from('INTERNAL_SERVER_ERROR', {
              code: 'SESSION_FAILED',
              message: 'SESSION_FAILED',
            })
          }

          await setSessionCookie(ctx, { session, user: targetUser })

          revalidateAfterAuthChange()

          return ctx.json({
            recovered: true,
            user: parseUserOutput(ctx.context.options, targetUser),
          })
        },
      ),
    },
  }
}
