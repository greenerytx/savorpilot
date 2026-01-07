import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Response DTO for YouTube job status
 */
export class YouTubeJobStatusDto {
  id: string;
  status: string;
  currentStep: string | null;
  progress: number;
  videoTitle: string | null;
  channelName: string | null;
  thumbnailUrl: string | null;
  videoDuration: number | null;
  framesExtracted: number;
  framesWithText: number;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Ingredient DTO for recipe import
 */
class IngredientDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  optional?: boolean;
}

/**
 * Step DTO for recipe import
 */
class StepDto {
  @IsNumber()
  order: number;

  @IsString()
  instruction: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  tips?: string;
}

/**
 * Component DTO for recipe import
 */
class ComponentDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients: IngredientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepDto)
  steps: StepDto[];
}

/**
 * Extracted recipe structure
 */
export interface ExtractedRecipeDto {
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  category?: string;
  cuisine?: string;
  tags?: string[];
  components: Array<{
    name: string;
    ingredients: Array<{
      quantity?: number;
      unit?: string;
      name: string;
      notes?: string;
      optional?: boolean;
    }>;
    steps: Array<{
      order: number;
      instruction: string;
      duration?: number;
      tips?: string;
    }>;
  }>;
  confidence: number;
}

/**
 * Response DTO for extraction result
 */
export class YouTubeExtractionResultDto {
  id: string;
  videoTitle: string | null;
  channelName: string | null;
  thumbnailUrl: string | null;
  youtubeUrl: string;
  transcription: string | null;
  extractedRecipes: ExtractedRecipeDto[];
  importedRecipeIds: string[];
}

/**
 * DTO for importing extracted recipe
 */
export class ImportYouTubeRecipeDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  prepTimeMinutes?: number;

  @IsOptional()
  @IsNumber()
  cookTimeMinutes?: number;

  @IsOptional()
  @IsNumber()
  servings?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentDto)
  components: ComponentDto[];
}
