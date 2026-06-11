/** Pausa entre local → visitante y antes de guardar (ms). */
export const INPUT_PAUSE_MS = 200

/** Pausa antes de pasar al siguiente grupo (ms). */
export const GROUP_ADVANCE_MS = 200

/** Enfoca el input local del partido y lo lleva a la vista. */
export function focusMatchInput(matchId: string) {
  requestAnimationFrame(() => {
    const card = document.getElementById(`match-${matchId}`)
    if (!card) return
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    const input = card.querySelector<HTMLInputElement>('input.score-input')
    input?.focus()
    input?.select()
  })
}
