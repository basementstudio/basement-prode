/**
 * Wipes all app + auth data. Run: bun run db:wipe
 * Keeps table structure; removes users, sessions, profiles, and predictions.
 */
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function wipeDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  await pool.query(`
    TRUNCATE TABLE
      verification,
      session,
      account,
      account_burn_votes,
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
