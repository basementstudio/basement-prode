/**
 * Applies pending DB schema changes. Run: bun run db:migrate
 */
import { pool } from '../lib/db'

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  await pool.query(`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "isAnonymous" boolean DEFAULT false
  `)

  await pool.query(`
    ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS "recoveryPinHash" text
  `)

  console.log('Migration complete: user.isAnonymous, user_profiles.recoveryPinHash')
}

migrate()
  .then(() => pool.end())
  .catch(err => {
    console.error(err)
    pool.end()
    process.exit(1)
  })
