import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsEnum,
  IsUrl,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Enums matching Prisma schema
export enum RecipeSource {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  INSTAGRAM_URL = 'INSTAGRAM_URL',
  INSTAGRAM_SHARE = 'INSTAGRAM_SHARE',
  URL = 'URL',
  GENERATED = 'GENERATED',
  YOUTUBE = 'YOUTUBE',
  FACEBOOK_URL = 'FACEBOOK_URL',
  FACEBOOK_SHARE = 'FACEBOOK_SHARE',
  WEB_URL = 'WEB_URL',
  PDF = 'PDF',
  OTHER = 'OTHER',
}

export enum RecipeDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

export enum RecipeCategory {
  BREAKFAST = 'BREAKFAST',
  BRUNCH = 'BRUNCH',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  APPETIZER = 'APPETIZER',
  SNACK = 'SNACK',
  DESSERT = 'DESSERT',
  BEVERAGE = 'BEVERAGE',
  SOUP = 'SOUP',
  SALAD = 'SALAD',
  SIDE_DISH = 'SIDE_DISH',
  MAIN_COURSE = 'MAIN_COURSE',
  SAUCE = 'SAUCE',
  BREAD = 'BREAD',
  BAKING = 'BAKING',
  PRESERVES = 'PRESERVES',
  COCKTAIL = 'COCKTAIL',
  SMOOTHIE = 'SMOOTHIE',
  BABY_FOOD = 'BABY_FOOD',
  PET_FOOD = 'PET_FOOD',
  CONDIMENT = 'CONDIMENT',
  MARINADE = 'MARINADE',
  OTHER = 'OTHER',
}

export enum RecipeVisibility {
  PRIVATE = 'PRIVATE',
  FOLLOWERS = 'FOLLOWERS',
  PUBLIC = 'PUBLIC',
}

// Nested DTOs for recipe components
export class IngredientDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ example: 'cups' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 'all-purpose flour' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'sifted' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  optional?: boolean;
}

export class StepDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ example: 'Preheat the oven to 350°F (175°C).' })
  @IsString()
  instruction: string;

  @ApiPropertyOptional({ example: 10, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiPropertyOptional({ example: '350°F' })
  @IsOptional()
  @IsString()
  temperature?: string;

  @ApiPropertyOptional({ example: 'Make sure the oven is fully preheated' })
  @IsOptional()
  @IsString()
  tips?: string;
}

export class RecipeComponentDto {
  @ApiProperty({ example: 'Main', description: 'Component name (e.g., Main, Sauce, Marinade)' })
  @IsString()
  name: string;

  @ApiProperty({ type: [IngredientDto] })
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  @IsArray()
  ingredients: IngredientDto[];

  @ApiProperty({ type: [StepDto] })
  @ValidateNested({ each: true })
  @Type(() => StepDto)
  @IsArray()
  steps: StepDto[];
}

// Create Recipe DTO
export class CreateRecipeDto {
  @ApiProperty({ example: 'Homemade Pasta Carbonara' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'A classic Italian pasta dish with eggs, cheese, and pancetta' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  prepTimeMinutes?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  cookTimeMinutes?: number;

  @ApiPropertyOptional({ enum: RecipeDifficulty })
  @IsOptional()
  @IsEnum(RecipeDifficulty)
  difficulty?: RecipeDifficulty;

  @ApiPropertyOptional({ enum: RecipeCategory })
  @IsOptional()
  @IsEnum(RecipeCategory)
  category?: RecipeCategory;

  @ApiPropertyOptional({ example: 'Italian' })
  @IsOptional()
  @IsString()
  cuisine?: string;

  @ApiPropertyOptional({ example: ['pasta', 'italian', 'quick'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  servings?: number;

  @ApiPropertyOptional({ example: 'servings' })
  @IsOptional()
  @IsString()
  servingUnit?: string;

  @ApiPropertyOptional({ enum: RecipeSource })
  @IsOptional()
  @IsEnum(RecipeSource)
  source?: RecipeSource;

  @ApiPropertyOptional({ example: 'https://instagram.com/p/ABC123' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional({ example: '@chefname' })
  @IsOptional()
  @IsString()
  sourceAuthor?: string;

  @ApiPropertyOptional({ enum: RecipeVisibility, description: 'Recipe visibility level', default: 'PRIVATE' })
  @IsOptional()
  @IsEnum(RecipeVisibility)
  visibility?: RecipeVisibility;

  @ApiProperty({ type: [RecipeComponentDto], description: 'Recipe components with ingredients and steps' })
  @ValidateNested({ each: true })
  @Type(() => RecipeComponentDto)
  @IsArray()
  components: RecipeComponentDto[];
}

// Update Recipe DTO (all fields optional)
export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}

// Recipe Response DTO
export class RecipeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  // Recipe owner info (for "Forked by" attribution)
  @ApiPropertyOptional()
  user?: {
    firstName: string;
    lastName: string;
  };

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  videoUrl?: string;

  @ApiPropertyOptional()
  prepTimeMinutes?: number;

  @ApiPropertyOptional()
  cookTimeMinutes?: number;

  @ApiPropertyOptional()
  totalTimeMinutes?: number;

  @ApiPropertyOptional({ enum: RecipeDifficulty })
  difficulty?: RecipeDifficulty;

  @ApiPropertyOptional({ enum: RecipeCategory })
  category?: RecipeCategory;

  @ApiPropertyOptional()
  cuisine?: string;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  servings: number;

  @ApiPropertyOptional()
  servingUnit?: string;

  @ApiProperty({ enum: RecipeSource })
  source: RecipeSource;

  @ApiPropertyOptional()
  sourceUrl?: string;

  @ApiPropertyOptional()
  sourceAuthor?: string;

  @ApiProperty({ type: [RecipeComponentDto] })
  components: RecipeComponentDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Forking fields
  @ApiPropertyOptional()
  parentRecipeId?: string;

  @ApiPropertyOptional()
  rootRecipeId?: string;

  @ApiProperty({ default: 0 })
  forkCount: number;

  @ApiPropertyOptional()
  forkNote?: string;

  @ApiProperty({ enum: RecipeVisibility, default: 'PRIVATE' })
  visibility: RecipeVisibility;

  // Parent recipe info (when populated)
  @ApiPropertyOptional()
  parentRecipe?: {
    id: string;
    title: string;
    userId: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };

  // Related data (optional)
  @ApiPropertyOptional()
  notes?: {
    personalNotes?: string;
    sharedNotes?: string;
  };

  @ApiPropertyOptional()
  nutrition?: {
    caloriesPerServing?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    fiberGrams?: number;
    sugarGrams?: number;
    sodiumMg?: number;
    saturatedFatGrams?: number;
    cholesterolMg?: number;
    isEstimated?: boolean;
    ingredientBreakdown?: any;
  };
}

// Fork Recipe DTO
export class ForkRecipeDto {
  @ApiPropertyOptional({ example: 'Made it vegan by substituting eggs', maxLength: 500 })
  @IsOptional()
  @IsString()
  forkNote?: string;

  @ApiPropertyOptional({ enum: RecipeVisibility, description: 'Visibility of the forked recipe', default: 'PRIVATE' })
  @IsOptional()
  @IsEnum(RecipeVisibility)
  visibility?: RecipeVisibility;
}

// Recipe Lineage Response DTO
export class RecipeLineageDto {
  @ApiProperty({ description: 'Chain of parent recipes up to root' })
  ancestors: {
    id: string;
    title: string;
    userId: string;
    user?: { firstName: string; lastName: string };
  }[];

  @ApiProperty({ description: 'Direct forks of this recipe' })
  forks: {
    id: string;
    title: string;
    userId: string;
    forkNote?: string;
    forkCount: number;
    createdAt: Date;
    user?: { firstName: string; lastName: string };
  }[];

  @ApiProperty()
  forkCount: number;
}

// Ingredient Diff Item
export class IngredientDiffItemDto {
  @ApiProperty()
  original: IngredientDto;

  @ApiProperty()
  modified: IngredientDto;
}

// Step Diff Item
export class StepDiffItemDto {
  @ApiProperty()
  original: StepDto;

  @ApiProperty()
  modified: StepDto;
}

// Metadata Diff Item
export class MetadataDiffItemDto {
  @ApiProperty()
  field: string;

  @ApiProperty()
  original: any;

  @ApiProperty()
  modified: any;
}

// Recipe Diff Response DTO
export class RecipeDiffDto {
  @ApiProperty()
  ingredients: {
    added: IngredientDto[];
    removed: IngredientDto[];
    modified: IngredientDiffItemDto[];
  };

  @ApiProperty()
  steps: {
    added: StepDto[];
    removed: StepDto[];
    modified: StepDiffItemDto[];
  };

  @ApiProperty()
  metadata: MetadataDiffItemDto[];
}

// Update Visibility DTO
export class UpdateVisibilityDto {
  @ApiProperty({ enum: RecipeVisibility, description: 'Recipe visibility level' })
  @IsEnum(RecipeVisibility)
  visibility: RecipeVisibility;
}

// Bulk Update Visibility DTO
export class BulkUpdateVisibilityDto {
  @ApiProperty({ example: ['uuid1', 'uuid2'], description: 'Array of recipe IDs to update' })
  @IsArray()
  @IsString({ each: true })
  recipeIds: string[];

  @ApiProperty({ enum: RecipeVisibility, description: 'Visibility level to set for all recipes' })
  @IsEnum(RecipeVisibility)
  visibility: RecipeVisibility;
}

// Query DTO for listing recipes
export class RecipeQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'pasta' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RecipeCategory })
  @IsOptional()
  @IsEnum(RecipeCategory)
  category?: RecipeCategory;

  @ApiPropertyOptional({ enum: RecipeDifficulty })
  @IsOptional()
  @IsEnum(RecipeDifficulty)
  difficulty?: RecipeDifficulty;

  @ApiPropertyOptional({ example: 'Italian' })
  @IsOptional()
  @IsString()
  cuisine?: string;

  @ApiPropertyOptional({ example: 30, description: 'Maximum total time in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxTime?: number;

  @ApiPropertyOptional({ example: 'createdAt', enum: ['createdAt', 'title', 'prepTimeMinutes', 'cookTimeMinutes'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: ['pasta', 'quick'], description: 'Filter by tags' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// Paginated Response DTO
export class PaginatedRecipesDto {
  @ApiProperty({ type: [RecipeResponseDto] })
  data: RecipeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasMore: boolean;
}

// Query DTO for compatible recipes (filtered by dinner circle)
export class CompatibleRecipesQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'pasta' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RecipeCategory })
  @IsOptional()
  @IsEnum(RecipeCategory)
  category?: RecipeCategory;
}
