-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RecipeSource" AS ENUM ('TEXT', 'IMAGE', 'INSTAGRAM_URL', 'INSTAGRAM_SHARE', 'URL', 'GENERATED', 'OTHER');

-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "RecipeCategory" AS ENUM ('BREAKFAST', 'BRUNCH', 'LUNCH', 'DINNER', 'APPETIZER', 'SNACK', 'DESSERT', 'BEVERAGE', 'SOUP', 'SALAD', 'SIDE_DISH', 'MAIN_COURSE', 'SAUCE', 'BREAD', 'BAKING', 'PRESERVES', 'COCKTAIL', 'SMOOTHIE', 'BABY_FOOD', 'PET_FOOD', 'CONDIMENT', 'MARINADE', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "avatar_url" VARCHAR(500),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "default_servings" INTEGER DEFAULT 4,
    "preferred_units" VARCHAR(20) DEFAULT 'metric',
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "language" VARCHAR(10) DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "family" VARCHAR(100) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "replaced_by" UUID,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "device_name" VARCHAR(100),
    "device_type" VARCHAR(50),
    "push_token" VARCHAR(500),
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_link_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_link_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dietary_restrictions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "restriction" VARCHAR(100) NOT NULL,

    CONSTRAINT "user_dietary_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_allergens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "allergen" VARCHAR(100) NOT NULL,

    CONSTRAINT "user_allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "prep_time_minutes" INTEGER,
    "cook_time_minutes" INTEGER,
    "total_time_minutes" INTEGER,
    "difficulty" "RecipeDifficulty",
    "category" "RecipeCategory",
    "cuisine" VARCHAR(100),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "servings" INTEGER NOT NULL DEFAULT 4,
    "serving_unit" VARCHAR(50),
    "source" "RecipeSource" NOT NULL DEFAULT 'TEXT',
    "source_url" VARCHAR(1000),
    "source_author" VARCHAR(255),
    "instagram_post_id" VARCHAR(100),
    "instagram_caption" TEXT,
    "components" JSONB NOT NULL DEFAULT '[]',
    "was_generated" BOOLEAN NOT NULL DEFAULT false,
    "generation_prompt" TEXT,
    "language_detected" VARCHAR(10),
    "was_translated" BOOLEAN NOT NULL DEFAULT false,
    "original_language" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_notes" (
    "id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "personal_notes" TEXT,
    "shared_notes" TEXT,

    CONSTRAINT "recipe_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_nutrition" (
    "id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "calories_per_serving" INTEGER,
    "protein_grams" DOUBLE PRECISION,
    "carbs_grams" DOUBLE PRECISION,
    "fat_grams" DOUBLE PRECISION,
    "fiber_grams" DOUBLE PRECISION,
    "sugar_grams" DOUBLE PRECISION,
    "sodium_mg" DOUBLE PRECISION,
    "saturated_fat_grams" DOUBLE PRECISION,
    "cholesterol_mg" DOUBLE PRECISION,
    "is_estimated" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recipe_nutrition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_versions" (
    "id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "change_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "recipe_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_equipment" (
    "recipe_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recipe_equipment_pkey" PRIMARY KEY ("recipe_id","equipment_id")
);

-- CreateTable
CREATE TABLE "allergens" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'medium',

    CONSTRAINT "allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_allergens" (
    "recipe_id" UUID NOT NULL,
    "allergen_id" UUID NOT NULL,

    CONSTRAINT "recipe_allergens_pkey" PRIMARY KEY ("recipe_id","allergen_id")
);

-- CreateTable
CREATE TABLE "diet_plans" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "diet_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_diet_plans" (
    "recipe_id" UUID NOT NULL,
    "diet_plan_id" UUID NOT NULL,

    CONSTRAINT "recipe_diet_plans_pkey" PRIMARY KEY ("recipe_id","diet_plan_id")
);

-- CreateTable
CREATE TABLE "cooking_methods" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "cooking_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_cooking_methods" (
    "recipe_id" UUID NOT NULL,
    "cooking_method_id" UUID NOT NULL,

    CONSTRAINT "recipe_cooking_methods_pkey" PRIMARY KEY ("recipe_id","cooking_method_id")
);

-- CreateTable
CREATE TABLE "recipe_groups" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_group_memberships" (
    "recipe_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sort_order" INTEGER,

    CONSTRAINT "recipe_group_memberships_pkey" PRIMARY KEY ("recipe_id","group_id")
);

-- CreateTable
CREATE TABLE "shared_recipes" (
    "id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "shared_by_user_id" UUID NOT NULL,
    "shared_with_user_id" UUID NOT NULL,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_reshare" BOOLEAN NOT NULL DEFAULT false,
    "shared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),

    CONSTRAINT "shared_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_recipe_groups" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "shared_by_user_id" UUID NOT NULL,
    "shared_with_user_id" UUID NOT NULL,
    "shared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_recipe_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ratings" (
    "id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cook_logs" (
    "id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "cooked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER,
    "notes" TEXT,
    "photo_url" VARCHAR(500),
    "modifications" JSONB,

    CONSTRAINT "cook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_entries" (
    "id" UUID NOT NULL,
    "meal_plan_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "meal_type" VARCHAR(50) NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "notes" VARCHAR(255),

    CONSTRAINT "meal_plan_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_lists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_list_items" (
    "id" UUID NOT NULL,
    "shopping_list_id" UUID NOT NULL,
    "ingredient" VARCHAR(255) NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" VARCHAR(50),
    "category" VARCHAR(100),
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "recipe_id" UUID,

    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_device_id_key" ON "user_devices"("device_id");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "user_devices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_link_codes_code_key" ON "user_link_codes"("code");

-- CreateIndex
CREATE INDEX "user_link_codes_code_idx" ON "user_link_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_dietary_restrictions_user_id_restriction_key" ON "user_dietary_restrictions"("user_id", "restriction");

-- CreateIndex
CREATE UNIQUE INDEX "user_allergens_user_id_allergen_key" ON "user_allergens"("user_id", "allergen");

-- CreateIndex
CREATE INDEX "recipes_user_id_idx" ON "recipes"("user_id");

-- CreateIndex
CREATE INDEX "recipes_category_idx" ON "recipes"("category");

-- CreateIndex
CREATE INDEX "recipes_cuisine_idx" ON "recipes"("cuisine");

-- CreateIndex
CREATE INDEX "recipes_created_at_idx" ON "recipes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_notes_recipe_id_key" ON "recipe_notes"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_nutrition_recipe_id_key" ON "recipe_nutrition"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_versions_recipe_id_idx" ON "recipe_versions"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_versions_recipe_id_version_number_key" ON "recipe_versions"("recipe_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_name_key" ON "equipment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "allergens_name_key" ON "allergens"("name");

-- CreateIndex
CREATE UNIQUE INDEX "diet_plans_name_key" ON "diet_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cooking_methods_name_key" ON "cooking_methods"("name");

-- CreateIndex
CREATE INDEX "recipe_groups_user_id_idx" ON "recipe_groups"("user_id");

-- CreateIndex
CREATE INDEX "shared_recipes_shared_with_user_id_idx" ON "shared_recipes"("shared_with_user_id");

-- CreateIndex
CREATE INDEX "shared_recipes_shared_by_user_id_idx" ON "shared_recipes"("shared_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_recipes_recipe_id_shared_with_user_id_key" ON "shared_recipes"("recipe_id", "shared_with_user_id");

-- CreateIndex
CREATE INDEX "shared_recipe_groups_shared_with_user_id_idx" ON "shared_recipe_groups"("shared_with_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_recipe_groups_group_id_shared_with_user_id_key" ON "shared_recipe_groups"("group_id", "shared_with_user_id");

-- CreateIndex
CREATE INDEX "recipe_ratings_recipe_id_idx" ON "recipe_ratings"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ratings_recipe_id_user_id_key" ON "recipe_ratings"("recipe_id", "user_id");

-- CreateIndex
CREATE INDEX "cook_logs_recipe_id_idx" ON "cook_logs"("recipe_id");

-- CreateIndex
CREATE INDEX "cook_logs_user_id_idx" ON "cook_logs"("user_id");

-- CreateIndex
CREATE INDEX "cook_logs_cooked_at_idx" ON "cook_logs"("cooked_at");

-- CreateIndex
CREATE INDEX "meal_plans_user_id_idx" ON "meal_plans"("user_id");

-- CreateIndex
CREATE INDEX "meal_plans_start_date_end_date_idx" ON "meal_plans"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "meal_plan_entries_meal_plan_id_idx" ON "meal_plan_entries"("meal_plan_id");

-- CreateIndex
CREATE INDEX "meal_plan_entries_date_idx" ON "meal_plan_entries"("date");

-- CreateIndex
CREATE INDEX "shopping_lists_user_id_idx" ON "shopping_lists"("user_id");

-- CreateIndex
CREATE INDEX "shopping_list_items_shopping_list_id_idx" ON "shopping_list_items"("shopping_list_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dietary_restrictions" ADD CONSTRAINT "user_dietary_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_allergens" ADD CONSTRAINT "user_allergens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_notes" ADD CONSTRAINT "recipe_notes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_nutrition" ADD CONSTRAINT "recipe_nutrition_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_equipment" ADD CONSTRAINT "recipe_equipment_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_equipment" ADD CONSTRAINT "recipe_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_allergens" ADD CONSTRAINT "recipe_allergens_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_allergens" ADD CONSTRAINT "recipe_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_diet_plans" ADD CONSTRAINT "recipe_diet_plans_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_diet_plans" ADD CONSTRAINT "recipe_diet_plans_diet_plan_id_fkey" FOREIGN KEY ("diet_plan_id") REFERENCES "diet_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_cooking_methods" ADD CONSTRAINT "recipe_cooking_methods_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_cooking_methods" ADD CONSTRAINT "recipe_cooking_methods_cooking_method_id_fkey" FOREIGN KEY ("cooking_method_id") REFERENCES "cooking_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_groups" ADD CONSTRAINT "recipe_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_group_memberships" ADD CONSTRAINT "recipe_group_memberships_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_group_memberships" ADD CONSTRAINT "recipe_group_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "recipe_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_recipes" ADD CONSTRAINT "shared_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_recipes" ADD CONSTRAINT "shared_recipes_shared_by_user_id_fkey" FOREIGN KEY ("shared_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_recipes" ADD CONSTRAINT "shared_recipes_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_recipe_groups" ADD CONSTRAINT "shared_recipe_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "recipe_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_recipe_groups" ADD CONSTRAINT "shared_recipe_groups_shared_by_user_id_fkey" FOREIGN KEY ("shared_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_recipe_groups" ADD CONSTRAINT "shared_recipe_groups_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ratings" ADD CONSTRAINT "recipe_ratings_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cook_logs" ADD CONSTRAINT "cook_logs_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_entries" ADD CONSTRAINT "meal_plan_entries_meal_plan_id_fkey" FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_shopping_list_id_fkey" FOREIGN KEY ("shopping_list_id") REFERENCES "shopping_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
