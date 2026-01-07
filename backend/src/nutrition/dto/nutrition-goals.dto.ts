import { IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateNutritionGoalsDto {
  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(10000)
  dailyCalories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  dailyProteinG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  dailyCarbsG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  dailyFatG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  dailyFiberG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  dailySodiumMg?: number;
}

export class NutritionGoalsResponseDto {
  id: string;
  userId: string;
  dailyCalories: number;
  dailyProteinG: number;
  dailyCarbsG: number;
  dailyFatG: number;
  dailyFiberG: number | null;
  dailySodiumMg: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Preset configurations for common goals
export const NUTRITION_PRESETS = {
  weightLoss: {
    dailyCalories: 1500,
    dailyProteinG: 75,
    dailyCarbsG: 150,
    dailyFatG: 50,
    dailyFiberG: 30,
    dailySodiumMg: 2000,
  },
  maintenance: {
    dailyCalories: 2000,
    dailyProteinG: 50,
    dailyCarbsG: 275,
    dailyFatG: 78,
    dailyFiberG: 25,
    dailySodiumMg: 2300,
  },
  muscleGain: {
    dailyCalories: 2500,
    dailyProteinG: 150,
    dailyCarbsG: 300,
    dailyFatG: 83,
    dailyFiberG: 30,
    dailySodiumMg: 2300,
  },
  lowCarb: {
    dailyCalories: 1800,
    dailyProteinG: 100,
    dailyCarbsG: 50,
    dailyFatG: 130,
    dailyFiberG: 25,
    dailySodiumMg: 2000,
  },
} as const;

export type NutritionPresetKey = keyof typeof NUTRITION_PRESETS;
