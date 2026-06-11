export type PredictionScore = { home: number; away: number }

export function calcPoints(pred: PredictionScore, result: PredictionScore): number {
  if (pred.home === result.home && pred.away === result.away) return 6
  const predW = pred.home > pred.away ? 'h' : pred.home < pred.away ? 'a' : 'd'
  const realW = result.home > result.away ? 'h' : result.home < result.away ? 'a' : 'd'
  if (predW === realW) return 3
  return 0
}

export function scoreLabel(points: number): string {
  if (points === 6) return '+6 exacto'
  if (points === 3) return '+3'
  return '0 pts'
}
