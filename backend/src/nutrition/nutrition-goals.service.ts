import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateNutritionGoalsDto,
  NutritionGoalsResponseDto,
  NUTRITION_PRESETS,
  NutritionPresetKey,
} from './dto/nutrition-goals.dto';

@Injectable()
export class NutritionGoalsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user's nutrition goals, creating defaults if none exist
   */
  async getGoals(userId: string): Promise<NutritionGoalsResponseDto> {
    let goals = await this.prisma.nutritionGoals.findUnique({
      where: { userId },
    });

    if (!goals) {
      // Create default goals based on maintenance preset
      goals = await this.prisma.nutritionGoals.create({
        data: {
          userId,
          ...NUTRITION_PRESETS.maintenance,
        },
      });
    }

    return this.mapToResponse(goals);
  }

  /**
   * Update user's nutrition goals
   */
  async updateGoals(
    userId: string,
    dto: UpdateNutritionGoalsDto,
  ): Promise<NutritionGoalsResponseDto> {
    // Ensure goals exist first
    await this.getGoals(userId);

    const goals = await this.prisma.nutritionGoals.update({
      where: { userId },
      data: {
        ...(dto.dailyCalories !== undefined && { dailyCalories: dto.dailyCalories }),
        ...(dto.dailyProteinG !== undefined && { dailyProteinG: dto.dailyProteinG }),
        ...(dto.dailyCarbsG !== undefined && { dailyCarbsG: dto.dailyCarbsG }),
        ...(dto.dailyFatG !== undefined && { dailyFatG: dto.dailyFatG }),
        ...(dto.dailyFiberG !== undefined && { dailyFiberG: dto.dailyFiberG }),
        ...(dto.dailySodiumMg !== undefined && { dailySodiumMg: dto.dailySodiumMg }),
      },
    });

    return this.mapToResponse(goals);
  }

  /**
   * Apply a preset to user's nutrition goals
   */
  async applyPreset(
    userId: string,
    presetKey: NutritionPresetKey,
  ): Promise<NutritionGoalsResponseDto> {
    const preset = NUTRITION_PRESETS[presetKey];

    // Ensure goals exist first
    await this.getGoals(userId);

    const goals = await this.prisma.nutritionGoals.update({
      where: { userId },
      data: preset,
    });

    return this.mapToResponse(goals);
  }

  /**
   * Get available presets
   */
  getPresets(): Record<NutritionPresetKey, typeof NUTRITION_PRESETS[NutritionPresetKey]> {
    return NUTRITION_PRESETS;
  }

  private mapToResponse(goals: {
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
  }): NutritionGoalsResponseDto {
    return {
      id: goals.id,
      userId: goals.userId,
      dailyCalories: goals.dailyCalories,
      dailyProteinG: goals.dailyProteinG,
      dailyCarbsG: goals.dailyCarbsG,
      dailyFatG: goals.dailyFatG,
      dailyFiberG: goals.dailyFiberG,
      dailySodiumMg: goals.dailySodiumMg,
      createdAt: goals.createdAt,
      updatedAt: goals.updatedAt,
    };
  }
}
