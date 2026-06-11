/** Entero de goles válido para pronóstico (0–99). */
export function isValidScore(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= 99
}

/**
 * Parsea texto de input de goles.
 * Rechaza negativos, decimales, letras, leading zeros (01, 02…) y > 99.
 */
export function parseScoreInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return 0
  if (!/^\d+$/.test(trimmed)) return null
  if (trimmed.length > 1 && trimmed.startsWith('0')) return null
  const n = Number.parseInt(trimmed, 10)
  if (!isValidScore(n)) return null
  return n
}

/** Teclas bloqueadas en inputs de goles. */
export function isBlockedScoreKey(key: string): boolean {
  return key === '-' || key === '+' || key === 'e' || key === 'E' || key === '.'
}
