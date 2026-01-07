-- Migration: Convert isPublic boolean to visibility enum

-- Step 1: Create the RecipeVisibility enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "RecipeVisibility" AS ENUM ('PRIVATE', 'FOLLOWERS', 'PUBLIC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add the visibility column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "recipes" ADD COLUMN "visibility" "RecipeVisibility" DEFAULT 'PRIVATE';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Step 3: Migrate existing data from is_public to visibility
UPDATE "recipes"
SET "visibility" = CASE
    WHEN "is_public" = true THEN 'PUBLIC'::"RecipeVisibility"
    ELSE 'PRIVATE'::"RecipeVisibility"
END
WHERE "visibility" IS NULL OR "visibility" = 'PRIVATE'::"RecipeVisibility";

-- Step 4: Set NOT NULL constraint on visibility
ALTER TABLE "recipes" ALTER COLUMN "visibility" SET NOT NULL;
ALTER TABLE "recipes" ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE'::"RecipeVisibility";

-- Step 5: Drop the old is_public column
ALTER TABLE "recipes" DROP COLUMN IF EXISTS "is_public";

-- Step 6: Create index on visibility
CREATE INDEX IF NOT EXISTS "recipes_visibility_idx" ON "recipes"("visibility");
