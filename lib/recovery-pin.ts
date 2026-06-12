export const RECOVERY_PIN_MIN = 4
export const RECOVERY_PIN_MAX = 6

export function normalizeRecoveryPin(pin: string): string {
  return pin.trim()
}

export function isValidRecoveryPin(pin: string): boolean {
  const normalized = normalizeRecoveryPin(pin)
  return (
    normalized.length >= RECOVERY_PIN_MIN &&
    normalized.length <= RECOVERY_PIN_MAX &&
    /^\d+$/.test(normalized)
  )
}

export function recoveryPinError(): string {
  return `Use a ${RECOVERY_PIN_MIN}–${RECOVERY_PIN_MAX} digit PIN.`
}
