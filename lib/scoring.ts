export type PredictionScore = { home: number; away: number }

type Outcome = 'home' | 'away' | 'draw'

function matchOutcome(score: PredictionScore): Outcome {
  if (score.home > score.away) return 'home'
  if (score.home < score.away) return 'away'
  return 'draw'
}

/** 3 pts for correct winner or draw; 6 only for exact score on a win/loss (not draws). */
export function calcPoints(pred: PredictionScore, result: PredictionScore): number {
  const predOutcome = matchOutcome(pred)
  const resultOutcome = matchOutcome(result)

  if (predOutcome !== resultOutcome) return 0

  const isExact = pred.home === result.home && pred.away === result.away
  if (isExact && resultOutcome !== 'draw') return 6

  return 3
}

export function scoreLabel(points: number): string {
  if (points === 6) return '+6 exact'
  if (points === 3) return '+3'
  return '0 pts'
}
