import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsInt,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MealType } from './meal-plan.dto';

// Re-export MealType for convenience
export { MealType };

// Macro targets for nutrition goals
export class MacroTargetsDto {
  @ApiPropertyOptional({ description: 'Target protein grams per day' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  protein?: number;

  @ApiPropertyOptional({ description: 'Target carbs grams per day' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carbs?: number;

  @ApiPropertyOptional({ description: 'Target fat grams per day' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fat?: number;
}

// Request DTO for generating a meal plan
export class GenerateMealPlanRequestDto {
  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Number of days to generate (default: 7)', default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  durationDays?: number;

  @ApiPropertyOptional({ description: 'Target daily calories' })
  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(10000)
  targetCalories?: number;

  @ApiPropertyOptional({ description: 'Macro targets per day' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MacroTargetsDto)
  macroTargets?: MacroTargetsDto;

  @ApiPropertyOptional({ description: 'Meal types to include', type: [String], enum: MealType })
  @IsOptional()
  @IsArray()
  @IsEnum(MealType, { each: true })
  mealTypes?: MealType[];

  @ApiPropertyOptional({ description: 'Preferred cuisines' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisines?: string[];

  @ApiPropertyOptional({ description: 'Circle ID for dietary filtering' })
  @IsOptional()
  @IsUUID()
  circleId?: string;

  @ApiPropertyOptional({ description: 'Filter by circle dietary restrictions', default: true })
  @IsOptional()
  @IsBoolean()
  useCircleRestrictions?: boolean;

  @ApiPropertyOptional({ description: 'Number of servings per meal', default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  servingsPerMeal?: number;

  @ApiPropertyOptional({ description: 'Prioritize variety over nutrition optimization' })
  @IsOptional()
  @IsBoolean()
  prioritizeVariety?: boolean;
}

// Suggested recipe for AI-generated new recipes
export class SuggestedRecipeDto {
  @ApiProperty({ description: 'Suggested recipe title' })
  title: string;

  @ApiProperty({ description: 'Brief description' })
  description: string;

  @ApiPropertyOptional({ description: 'Estimated prep time in minutes' })
  estimatedPrepTime?: number;

  @ApiPropertyOptional({ description: 'Estimated cook time in minutes' })
  estimatedCookTime?: number;

  @ApiPropertyOptional({ description: 'Cuisine type' })
  cuisine?: string;

  @ApiProperty({ description: 'List of main ingredients' })
  ingredients: string[];

  @ApiProperty({ description: 'Brief cooking instructions' })
  briefInstructions: string;
}

// Generated meal entry (either existing recipe or AI suggestion)
export class GeneratedMealEntryDto {
  @ApiPropertyOptional({ description: 'Recipe ID (null if AI suggestion)' })
  recipeId?: string;

  @ApiProperty({ description: 'Recipe title' })
  recipeTitle: string;

  @ApiProperty({ description: 'Date for this meal (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ enum: MealType, description: 'Type of meal' })
  mealType: MealType;

  @ApiProperty({ description: 'Number of servings' })
  servings: number;

  @ApiProperty({ description: 'Whether this is an existing recipe from user library' })
  isExisting: boolean;

  @ApiProperty({ description: 'Whether the recipe has nutrition data' })
  hasNutritionData: boolean;

  @ApiPropertyOptional({ description: 'Estimated calories' })
  estimatedCalories?: number;

  @ApiPropertyOptional({ description: 'Estimated protein in grams' })
  estimatedProtein?: number;

  @ApiPropertyOptional({ description: 'Estimated carbs in grams' })
  estimatedCarbs?: number;

  @ApiPropertyOptional({ description: 'Estimated fat in grams' })
  estimatedFat?: number;

  @ApiPropertyOptional({ description: 'Recipe image URL' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'AI suggested recipe (if not existing)', type: SuggestedRecipeDto })
  suggestedRecipe?: SuggestedRecipeDto;
}

// Daily nutrition totals
export class DailyNutritionTotalsDto {
  @ApiProperty({ description: 'Total calories' })
  calories: number;

  @ApiProperty({ description: 'Total protein in grams' })
  protein: number;

  @ApiProperty({ description: 'Total carbs in grams' })
  carbs: number;

  @ApiProperty({ description: 'Total fat in grams' })
  fat: number;
}

// Target deviation (how far from goals)
export class TargetDeviationDto {
  @ApiProperty({ description: 'Calorie difference from target' })
  caloriesDiff: number;

  @ApiPropertyOptional({ description: 'Protein difference from target' })
  proteinDiff?: number;

  @ApiPropertyOptional({ description: 'Carbs difference from target' })
  carbsDiff?: number;

  @ApiPropertyOptional({ description: 'Fat difference from target' })
  fatDiff?: number;
}

// Daily plan summary
export class DailyPlanSummaryDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Day of week (e.g., Monday)' })
  dayOfWeek: string;

  @ApiProperty({ description: 'Meals for this day', type: [GeneratedMealEntryDto] })
  meals: GeneratedMealEntryDto[];

  @ApiProperty({ description: 'Total nutrition for the day', type: DailyNutritionTotalsDto })
  totals: DailyNutritionTotalsDto;

  @ApiProperty({ description: 'Deviation from targets', type: TargetDeviationDto })
  targetDeviation: TargetDeviationDto;
}

// Weekly averages
export class WeeklyAveragesDto {
  @ApiProperty({ description: 'Average calories per day' })
  caloriesPerDay: number;

  @ApiProperty({ description: 'Average protein per day in grams' })
  proteinPerDay: number;

  @ApiProperty({ description: 'Average carbs per day in grams' })
  carbsPerDay: number;

  @ApiProperty({ description: 'Average fat per day in grams' })
  fatPerDay: number;
}

// Statistics about the generated plan
export class PlanStatisticsDto {
  @ApiProperty({ description: 'Number of existing recipes used' })
  existingRecipesUsed: number;

  @ApiProperty({ description: 'Number of new recipes suggested' })
  newRecipesSuggested: number;

  @ApiProperty({ description: 'Number of recipes with nutrition data' })
  recipesWithNutrition: number;

  @ApiPropertyOptional({ description: 'Cuisine breakdown (cuisine: count)' })
  cuisineBreakdown?: Record<string, number>;
}

// Full response DTO for generated meal plan preview
export class GenerateMealPlanResponseDto {
  @ApiProperty({ description: 'Temporary preview ID' })
  planId: string;

  @ApiProperty({ description: 'Start date' })
  startDate: string;

  @ApiProperty({ description: 'End date' })
  endDate: string;

  @ApiProperty({ description: 'Number of days' })
  durationDays: number;

  @ApiProperty({ description: 'Daily plans', type: [DailyPlanSummaryDto] })
  dailyPlans: DailyPlanSummaryDto[];

  @ApiProperty({ description: 'Weekly nutrition totals', type: DailyNutritionTotalsDto })
  weeklyTotals: DailyNutritionTotalsDto;

  @ApiProperty({ description: 'Weekly averages', type: WeeklyAveragesDto })
  weeklyAverages: WeeklyAveragesDto;

  @ApiProperty({ description: 'Plan statistics', type: PlanStatisticsDto })
  statistics: PlanStatisticsDto;

  @ApiProperty({ description: 'Any warnings or notes' })
  warnings: string[];
}

// Apply generated plan request
export class ApplyGeneratedPlanDto {
  @ApiProperty({ description: 'Preview plan ID from generation' })
  @IsString()
  previewPlanId: string;

  @ApiPropertyOptional({ description: 'Existing meal plan ID to add to' })
  @IsOptional()
  @IsUUID()
  mealPlanId?: string;

  @ApiPropertyOptional({ description: 'Name for new meal plan' })
  @IsOptional()
  @IsString()
  mealPlanName?: string;

  @ApiPropertyOptional({ description: 'Circle ID for the meal plan' })
  @IsOptional()
  @IsUUID()
  circleId?: string;
}

// Regenerate single meal request
export class RegenerateMealDto {
  @ApiProperty({ description: 'Preview plan ID' })
  @IsString()
  previewPlanId: string;

  @ApiProperty({ description: 'Date of the meal to regenerate' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: MealType, description: 'Meal type to regenerate' })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiPropertyOptional({ description: 'Recipe IDs to exclude from suggestions' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeRecipeIds?: string[];
}
