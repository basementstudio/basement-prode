import { revalidatePath, revalidateTag } from 'next/cache'
import {
  LEADERBOARD_CACHE_TAG,
  MATCH_RESULTS_CACHE_TAG,
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

/** Invalida agregados cacheados (tabla, resultados en BD). */
export function revalidateDbAggregates() {
  revalidateTag(LEADERBOARD_CACHE_TAG, 'max')
  revalidateTag(MATCH_RESULTS_CACHE_TAG, 'max')
}

/** Invalida perfil cacheado (avatar, nombre, onboarding). */
export function revalidateUserProfileCache() {
  revalidateTag(USER_PROFILE_CACHE_TAG, 'max')
}
