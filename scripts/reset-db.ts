/**
 * Drops all tables and recreates schema from scratch. Run: bun run db:reset
 */
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function resetDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  await pool.query(`
    DROP TABLE IF EXISTS account_burn_votes CASCADE;
    DROP TABLE IF EXISTS prediction_votes CASCADE;
    DROP TABLE IF EXISTS predictions CASCADE;
    DROP TABLE IF EXISTS user_profiles CASCADE;
    DROP TABLE IF EXISTS session CASCADE;
    DROP TABLE IF EXISTS account CASCADE;
    DROP TABLE IF EXISTS verification CASCADE;
    DROP TABLE IF EXISTS "user" CASCADE;
  `)

  await pool.query(`
    CREATE TABLE "user" (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      "emailVerified" boolean NOT NULL DEFAULT false,
      image text,
      "isAnonymous" boolean DEFAULT false,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE session (
      id text PRIMARY KEY,
      "expiresAt" timestamp NOT NULL,
      token text NOT NULL UNIQUE,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now(),
      "ipAddress" text,
      "userAgent" text,
      "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    );

    CREATE TABLE account (
      id text PRIMARY KEY,
      "accountId" text NOT NULL,
      "providerId" text NOT NULL,
      "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accessToken" text,
      "refreshToken" text,
      "idToken" text,
      "accessTokenExpiresAt" timestamp,
      "refreshTokenExpiresAt" timestamp,
      scope text,
      password text,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE verification (
      id text PRIMARY KEY,
      identifier text NOT NULL,
      value text NOT NULL,
      "expiresAt" timestamp NOT NULL,
      "createdAt" timestamp DEFAULT now(),
      "updatedAt" timestamp DEFAULT now()
    );

    CREATE TABLE predictions (
      id text PRIMARY KEY DEFAULT '',
      "userId" text NOT NULL,
      "matchId" text NOT NULL,
      "homeScore" integer NOT NULL,
      "awayScore" integer NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE prediction_votes (
      id text PRIMARY KEY NOT NULL,
      "predictionId" text NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
      "voterId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "createdAt" timestamp NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX prediction_votes_prediction_voter_unique
      ON prediction_votes ("predictionId", "voterId");

    CREATE TABLE user_profiles (
      id text PRIMARY KEY DEFAULT '',
      "userId" text NOT NULL UNIQUE,
      "displayName" text,
      "avatarUrl" text,
      "recoveryPinHash" text,
      "burnedAt" timestamp,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE account_burn_votes (
      id text PRIMARY KEY NOT NULL,
      "targetUserId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "voterId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "createdAt" timestamp NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX account_burn_votes_target_voter_unique
      ON account_burn_votes ("targetUserId", "voterId");
  `)

  console.log('Database reset complete: all tables dropped and recreated empty.')
}

resetDb()
  .then(() => pool.end())
  .catch(err => {
    console.error(err)
    pool.end()
    process.exit(1)
  })
