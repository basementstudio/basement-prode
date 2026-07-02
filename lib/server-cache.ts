import { unstable_cache } from 'next/cache'

/** Resultados persistidos en BD (match_results). */
export const MATCH_RESULTS_CACHE_TAG = 'match-results'

/** Tabla de posiciones y agregados derivados. */
export const LEADERBOARD_CACHE_TAG = 'leaderboard'

/** Metadatos de tabla (perfiles, usuarios, burn votes). */
export const LEADERBOARD_META_TAG = 'leaderboard-meta'

/** Perfil de usuario (avatar, display name, onboarding). */
export const USER_PROFILE_CACHE_TAG = 'user-profile'

/** Segundos entre refrescos de lecturas agregadas (leaderboard / match_results). */
export const DB_READ_CACHE_SECONDS = Number(process.env.DB_READ_CACHE_SECONDS) || 60

/** Segundos entre refrescos de perfil por usuario (layout / header). */
export const PROFILE_CACHE_SECONDS = Number(process.env.PROFILE_CACHE_SECONDS) || 180

export function matchResultTag(matchId: string): string {
  return `match-result:${matchId}`
}

export function leaderboardUserTag(userId: string): string {
  return `leaderboard-user:${userId}`
}

export function leaderboardMatchTag(matchId: string): string {
  return `leaderboard-match:${matchId}`
}
