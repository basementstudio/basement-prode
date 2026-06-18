import type { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { syncMatchResultsAndScore } from '@/lib/match-results/sync'
import { WC2026_MATCH_CACHE_TAG } from '@/lib/wc2026/cache'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const report = await syncMatchResultsAndScore()
    revalidateTag(WC2026_MATCH_CACHE_TAG, 'max')

    return Response.json({ ok: true, ...report })
  } catch (error) {
    console.error('[cron/sync-match-results]', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 },
    )
  }
}
