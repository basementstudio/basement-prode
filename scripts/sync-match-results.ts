/**
 * Sincroniza resultados finalizados desde worldcup26.ir y puntúa predicciones pendientes.
 * Idempotente — seguro ejecutar en producción.
 *
 *   bun scripts/sync-match-results.ts
 */
import { pool } from '@/lib/db/pool'
import { syncMatchResultsAndScore } from '@/lib/match-results/sync'

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  const report = await syncMatchResultsAndScore()
  console.log(JSON.stringify(report, null, 2))
}

main()
  .then(() => pool.end())
  .catch(err => {
    console.error(err)
    pool.end()
    process.exit(1)
  })
