import type { Match, MatchStage } from '@/lib/wc2026/types'
import { formatRoundKeyShort } from '@/lib/wc2026-data'

export type PredictionStageFilter = 'all' | MatchStage | 'knockout'

export const PREDICTION_STAGE_FILTERS: {
  id: PredictionStageFilter
  label: string
}[] = [
  { id: 'all', label: 'ALL' },
  { id: 'group', label: 'GROUPS' },
  { id: 'r32', label: 'R32' },
  { id: 'r16', label: 'R16' },
  { id: 'qf', label: 'QF' },
  { id: 'sf', label: 'SF' },
  { id: 'third', label: '3RD' },
  { id: 'final', label: 'FINAL' },
  { id: 'knockout', label: 'KO' },
]

export function formatMatchStageLabel(match: Match): string {
  if (match.stage === 'group') {
    return `GROUP ${match.group}`
  }

  return formatRoundKeyShort(match.stage)
}

export function matchesStageFilter(match: Match, filter: PredictionStageFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'knockout') return match.stage !== 'group'
  return match.stage === filter
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

/** Busca por equipos: "arg vs", "argentina alemania", "ger". */
export function matchesTeamSearch(match: Match, rawQuery: string): boolean {
  const query = normalizeSearchText(rawQuery)
  if (!query) return true

  const home = normalizeSearchText(`${match.home.name} ${match.home.code}`)
  const away = normalizeSearchText(`${match.away.name} ${match.away.code}`)
  const combined = `${home} ${away}`

  if (query.includes(' vs ')) {
    const [left, right] = query.split(' vs ').map(part => part.trim())
    if (!left || !right) return combined.includes(left || right)
    const homeHit = home.includes(left)
    const awayHit = away.includes(right)
    const swappedHit = home.includes(right) && away.includes(left)
    return (homeHit && awayHit) || swappedHit
  }

  const tokens = query.split(/\s+/).filter(Boolean)
  return tokens.every(token => combined.includes(token))
}
