/** Pausa entre local → visitante y antes de guardar (ms). */
export const INPUT_PAUSE_MS = 200

/** Pausa antes de pasar al siguiente grupo (ms). */
export const GROUP_ADVANCE_MS = 200

/** Enfoca el input local del partido; solo hace scroll si la card queda fuera de vista. */
export function focusMatchInput(matchId: string) {
  requestAnimationFrame(() => {
    const card = document.getElementById(`match-${matchId}`)
    if (!card) return

    const headerOffset = 96
    const rect = card.getBoundingClientRect()
    const outOfView = rect.top < headerOffset || rect.bottom > window.innerHeight
    if (outOfView) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    const input = card.querySelector<HTMLInputElement>('input.score-input')
    input?.focus({ preventScroll: true })
    input?.select()
  })
}
