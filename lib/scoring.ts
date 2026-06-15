export type PredictionScore = { home: number; away: number }

type Outcome = 'home' | 'away' | 'draw'

function matchOutcome(score: PredictionScore): Outcome {
  if (score.home > score.away) return 'home'
  if (score.home < score.away) return 'away'
  return 'draw'
}

function isExactScore(pred: PredictionScore, result: PredictionScore): boolean {
  return pred.home === result.home && pred.away === result.away
}

/** 6 pts for exact score (including 0-0 draws); 3 for correct winner or draw direction. */
export function calcPoints(pred: PredictionScore, result: PredictionScore): number {
  const predOutcome = matchOutcome(pred)
  const resultOutcome = matchOutcome(result)

  if (predOutcome !== resultOutcome) return 0
  if (isExactScore(pred, result)) return 6

  return 3
}

export function scoreLabel(points: number): string {
  if (points === 6) return '+6 exact'
  if (points === 3) return '+3'
  return '0 pts'
}
