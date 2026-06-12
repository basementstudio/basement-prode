/**
 * Wipes all app + auth data. Run: bun run db:wipe
 * Keeps table structure; removes users, sessions, profiles, and predictions.
 */
import { pool } from '../lib/db'

async function wipeDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  await pool.query(`
    TRUNCATE TABLE
      verification,
      session,
      account,
      prediction_votes,
      predictions,
      user_profiles,
      "user"
    RESTART IDENTITY CASCADE
  `)

  console.log('Database wiped: users, sessions, profiles, and predictions removed.')
}

wipeDb()
  .then(() => pool.end())
  .catch(err => {
    console.error(err)
    pool.end()
    process.exit(1)
  })
