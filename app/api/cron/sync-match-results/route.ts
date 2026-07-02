import type { NextRequest } from 'next/server'
import { syncMatchResultsAndScore } from '@/lib/match-results/sync'
import { revalidateAfterMatchScoring } from '@/lib/revalidate-app'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const report = await syncMatchResultsAndScore()
    revalidateAfterMatchScoring(report.changedMatchIds, report.scoreUpdates)

    return Response.json({ ok: true, ...report })
  } catch (error) {
    console.error('[cron/sync-match-results]', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 },
    )
  }
}
