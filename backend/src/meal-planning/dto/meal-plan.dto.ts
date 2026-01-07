import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export class CreateMealPlanDto {
  @ApiProperty({ description: 'Name of the meal plan' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Start date of the meal plan (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date of the meal plan (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Circle ID for dietary compatibility' })
  @IsOptional()
  @IsUUID()
  circleId?: string;
}

export class UpdateMealPlanDto {
  @ApiPropertyOptional({ description: 'Name of the meal plan' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Start date of the meal plan (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date of the meal plan (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Circle ID for dietary compatibility' })
  @IsOptional()
  @IsUUID()
  circleId?: string;
}

export class CreateMealPlanEntryDto {
  @ApiProperty({ description: 'Recipe ID to add to the meal plan' })
  @IsUUID()
  recipeId: string;

  @ApiProperty({ description: 'Date for this meal (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: MealType, description: 'Type of meal' })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiPropertyOptional({ description: 'Number of servings', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMealPlanEntryDto {
  @ApiPropertyOptional({ description: 'Date for this meal (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: MealType, description: 'Type of meal' })
  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;

  @ApiPropertyOptional({ description: 'Number of servings' })
  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkCreateEntriesDto {
  @ApiProperty({ type: [CreateMealPlanEntryDto], description: 'Array of meal entries to create' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealPlanEntryDto)
  entries: CreateMealPlanEntryDto[];
}

export class MealPlanQueryDto {
  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Circle ID filter' })
  @IsOptional()
  @IsUUID()
  circleId?: string;
}

// Response types
export class MealPlanEntryResponse {
  id: string;
  recipeId: string;
  date: string;
  mealType: string;
  servings: number;
  notes?: string;
  recipe?: {
    id: string;
    title: string;
    imageUrl?: string;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    servings: number;
  };
}

export class MealPlanResponse {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  circleId?: string;
  createdAt: Date;
  updatedAt: Date;
  meals?: MealPlanEntryResponse[];
  circle?: {
    id: string;
    name: string;
    emoji?: string;
  };
}

export class MealPlanListResponse {
  data: MealPlanResponse[];
  total: number;
}
