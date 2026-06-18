/**
 * Migración segura para producción: agrega match_results y predictions.pointsAwarded
 * sin borrar datos existentes. Idempotente — se puede ejecutar varias veces.
 *
 *   bun scripts/migrate-match-results.ts
 *   bun scripts/migrate-match-results.ts --dry-run
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const dryRun = process.argv.includes('--dry-run')

async function columnExists(table: string, column: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  )
  return rows.length > 0
}

async function tableExists(table: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  )
  return rows.length > 0
}

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  console.log(dryRun ? '[dry-run] Checking schema...' : 'Applying migration...')

  const needsTable = !(await tableExists('match_results'))
  const needsColumn = !(await columnExists('predictions', 'pointsAwarded'))

  if (!needsTable && !needsColumn) {
    console.log('Schema already up to date.')
    return
  }

  if (dryRun) {
    console.log('Would apply:', {
      createMatchResults: needsTable,
      addPointsAwarded: needsColumn,
    })
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (needsTable) {
      await client.query(`
        CREATE TABLE match_results (
          "matchId" text PRIMARY KEY,
          "homeScore" integer NOT NULL,
          "awayScore" integer NOT NULL,
          "statusShort" text NOT NULL DEFAULT 'FT',
          "syncedAt" timestamp NOT NULL DEFAULT now()
        );
      `)
      console.log('Created table match_results')
    }

    if (needsColumn) {
      await client.query(`
        ALTER TABLE predictions
        ADD COLUMN IF NOT EXISTS "pointsAwarded" integer;
      `)
      console.log('Added column predictions.pointsAwarded')
    }

    await client.query('COMMIT')
    console.log('Migration complete.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

migrate()
  .then(() => pool.end())
  .catch(err => {
    console.error(err)
    pool.end()
    process.exit(1)
  })
