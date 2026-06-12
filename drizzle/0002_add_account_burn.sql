-- Additive migration: account burn votes (Feature 5)
-- Safe for prod: nullable column + new table only

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS "burnedAt" timestamp;

CREATE TABLE IF NOT EXISTS "account_burn_votes" (
  "id" text PRIMARY KEY NOT NULL,
  "targetUserId" text NOT NULL,
  "voterId" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "account_burn_votes_target_voter_unique"
  ON "account_burn_votes" ("targetUserId", "voterId");

DO $$ BEGIN
  ALTER TABLE "account_burn_votes"
    ADD CONSTRAINT "account_burn_votes_targetUserId_user_id_fk"
    FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "account_burn_votes"
    ADD CONSTRAINT "account_burn_votes_voterId_user_id_fk"
    FOREIGN KEY ("voterId") REFERENCES "user"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
