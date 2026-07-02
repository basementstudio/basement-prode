import { revalidatePath, revalidateTag } from 'next/cache'
import { WC2026_MATCH_CACHE_TAG } from '@/lib/wc2026/cache'
import type { ScoreUpdate } from '@/lib/match-results/sync'
import {
  LEADERBOARD_META_TAG,
  leaderboardMatchTag,
  leaderboardUserTag,
  matchResultTag,
  USER_PROFILE_CACHE_TAG,
} from '@/lib/server-cache'

/** Invalida rutas que dependen de sesión / perfil tras cambios de auth. */
export function revalidateAfterAuthChange() {
  revalidateUserProfileCache()
  revalidatePath('/')
  revalidatePath('/login')
  revalidatePath('/pronosticos')
  revalidatePath('/tabla')
  revalidatePath('/en-vivo')
  revalidatePath('/concluidos')
  revalidatePath('/aciertos')
}

/** Invalida solo los jugadores cuyas predicciones/puntos cambiaron. */
export function revalidateLeaderboardUsers(userIds: string[]) {
  for (const userId of [...new Set(userIds)]) {
    revalidateTag(leaderboardUserTag(userId), 'max')
  }
}

/** Invalida metadatos de tabla (perfiles, burns, lista de usuarios). */
export function revalidateLeaderboardMeta() {
  revalidateTag(LEADERBOARD_META_TAG, 'max')
}

/**
 * Tras sincronizar resultados / puntuar: invalida solo el partido y los jugadores afectados.
 */
export function revalidateAfterMatchScoring(
  changedMatchIds: string[],
  scoreUpdates: ScoreUpdate[],
) {
  for (const matchId of [...new Set(changedMatchIds)]) {
    revalidateTag(matchResultTag(matchId), 'max')
    revalidateTag(leaderboardMatchTag(matchId), 'max')
  }

  revalidateLeaderboardUsers(scoreUpdates.map(update => update.userId))

  if (changedMatchIds.length > 0) {
    revalidateTag(WC2026_MATCH_CACHE_TAG, 'max')
    revalidatePath('/concluidos')
    revalidatePath('/en-vivo')
  }

  if (scoreUpdates.length > 0) {
    revalidatePath('/tabla')
    revalidatePath('/aciertos')
  }
}

/** @deprecated Preferir revalidateLeaderboardUsers / revalidateAfterMatchScoring */
export function revalidateDbAggregates() {
  revalidateLeaderboardMeta()
}

/** Invalida perfil cacheado (avatar, nombre, onboarding). */
export function revalidateUserProfileCache() {
  revalidateTag(USER_PROFILE_CACHE_TAG, 'max')
}
