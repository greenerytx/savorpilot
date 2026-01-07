import { IsOptional, IsString, IsInt, IsEnum, IsDateString, Min, Max } from 'class-validator';

export enum NutritionMetric {
  CALORIES = 'calories',
  PROTEIN = 'protein',
  CARBS = 'carbs',
  FAT = 'fat',
  FIBER = 'fiber',
  SODIUM = 'sodium',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class WeeklyAnalyticsQueryDto {
  @IsDateString()
  weekStart: string;
}

export class MonthlyAnalyticsQueryDto {
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

export class DateRangeQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class TopRecipesQueryDto {
  @IsEnum(NutritionMetric)
  metric: NutritionMetric;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class NutrientGapsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number = 7;
}

export class ComparisonQueryDto {
  @IsDateString()
  period1Start: string;

  @IsDateString()
  period1End: string;

  @IsDateString()
  period2Start: string;

  @IsDateString()
  period2End: string;
}

export class FilteredAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  mealPlanId?: string;

  @IsOptional()
  @IsString()
  collectionId?: string;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsString()
  circleId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// Response DTOs
export interface DailyNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  mealsCount: number;
  mealsWithNutrition: number;
}

export interface WeeklyAnalyticsResponse {
  weekStart: string;
  weekEnd: string;
  dailyData: DailyNutritionData[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  averages: {
    caloriesPerDay: number;
    proteinPerDay: number;
    carbsPerDay: number;
    fatPerDay: number;
    fiberPerDay: number;
    sodiumPerDay: number;
  };
  goalVariance: {
    calories: number; // percentage difference from goal
    protein: number;
    carbs: number;
    fat: number;
  };
  coverage: {
    totalMeals: number;
    mealsWithNutrition: number;
    coveragePercentage: number;
  };
}

export interface MonthlyAnalyticsResponse {
  year: number;
  month: number;
  weeklyData: WeeklyAnalyticsResponse[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  averages: {
    caloriesPerDay: number;
    proteinPerDay: number;
    carbsPerDay: number;
    fatPerDay: number;
  };
  daysTracked: number;
}

export interface TopRecipeItem {
  recipeId: string;
  title: string;
  imageUrl?: string;
  timesCooked: number;
  totalValue: number; // total of the metric across all times cooked
  averageValue: number; // average per serving
  cuisine?: string;
}

export interface NutrientGap {
  metric: NutritionMetric;
  label: string;
  goal: number;
  actual: number;
  deficit: number; // positive = under goal, negative = over goal
  deficitPercentage: number;
  daysUnderGoal: number;
  totalDays: number;
}

export interface PeriodComparison {
  period1: {
    startDate: string;
    endDate: string;
    averages: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  period2: {
    startDate: string;
    endDate: string;
    averages: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  changes: {
    calories: { absolute: number; percentage: number };
    protein: { absolute: number; percentage: number };
    carbs: { absolute: number; percentage: number };
    fat: { absolute: number; percentage: number };
  };
}

export interface RollingAverageResponse {
  days: number;
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  trend: 'up' | 'down' | 'stable'; // compared to previous period
}
