/**
 * Applies pending DB schema changes. Run: bun run db:migrate
 */
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "prediction_votes" (
      "id" text PRIMARY KEY NOT NULL,
      "predictionId" text NOT NULL,
      "voterId" text NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )
  `)

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "prediction_votes_prediction_voter_unique"
      ON "prediction_votes" ("predictionId", "voterId")
  `)

  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "prediction_votes"
        ADD CONSTRAINT "prediction_votes_predictionId_predictions_id_fk"
        FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$
  `)

  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "prediction_votes"
        ADD CONSTRAINT "prediction_votes_voterId_user_id_fk"
        FOREIGN KEY ("voterId") REFERENCES "user"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$
  `)

  console.log('Migration complete: user.isAnonymous, user_profiles.recoveryPinHash, prediction_votes')
  await pool.query(`
    ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS "burnedAt" timestamp
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "account_burn_votes" (
      "id" text PRIMARY KEY NOT NULL,
      "targetUserId" text NOT NULL,
      "voterId" text NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )
  `)

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "account_burn_votes_target_voter_unique"
      ON "account_burn_votes" ("targetUserId", "voterId")
  `)

  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "account_burn_votes"
        ADD CONSTRAINT "account_burn_votes_targetUserId_user_id_fk"
        FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$
  `)

  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "account_burn_votes"
        ADD CONSTRAINT "account_burn_votes_voterId_user_id_fk"
        FOREIGN KEY ("voterId") REFERENCES "user"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$
  `)

  console.log('Migration complete: prediction_votes, account_burn_votes, user_profiles.burnedAt')
}

migrate()
  .then(() => pool.end())
  .catch(err => {
    console.error(err)
    pool.end()
    process.exit(1)
  })
