-- Additive migration: prediction downvotes (Feature 4)
-- Safe for prod: only creates new table + indexes + FKs

CREATE TABLE IF NOT EXISTS "prediction_votes" (
  "id" text PRIMARY KEY NOT NULL,
  "predictionId" text NOT NULL,
  "voterId" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "prediction_votes_prediction_voter_unique"
  ON "prediction_votes" ("predictionId", "voterId");

DO $$ BEGIN
  ALTER TABLE "prediction_votes"
    ADD CONSTRAINT "prediction_votes_predictionId_predictions_id_fk"
    FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "prediction_votes"
    ADD CONSTRAINT "prediction_votes_voterId_user_id_fk"
    FOREIGN KEY ("voterId") REFERENCES "user"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
