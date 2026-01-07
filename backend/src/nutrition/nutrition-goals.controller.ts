import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { NutritionGoalsService } from './nutrition-goals.service';
import {
  UpdateNutritionGoalsDto,
  NutritionGoalsResponseDto,
  NUTRITION_PRESETS,
  NutritionPresetKey,
} from './dto/nutrition-goals.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('nutrition')
export class NutritionGoalsController {
  constructor(private readonly nutritionGoalsService: NutritionGoalsService) {}

  /**
   * Get current user's nutrition goals
   */
  @Get('goals')
  async getGoals(@CurrentUser('id') userId: string): Promise<NutritionGoalsResponseDto> {
    return this.nutritionGoalsService.getGoals(userId);
  }

  /**
   * Update current user's nutrition goals
   */
  @Put('goals')
  async updateGoals(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNutritionGoalsDto,
  ): Promise<NutritionGoalsResponseDto> {
    return this.nutritionGoalsService.updateGoals(userId, dto);
  }

  /**
   * Get available nutrition presets
   */
  @Get('presets')
  getPresets(): Record<NutritionPresetKey, typeof NUTRITION_PRESETS[NutritionPresetKey]> {
    return this.nutritionGoalsService.getPresets();
  }

  /**
   * Apply a preset to current user's nutrition goals
   */
  @Post('goals/preset/:presetKey')
  async applyPreset(
    @CurrentUser('id') userId: string,
    @Param('presetKey') presetKey: string,
  ): Promise<NutritionGoalsResponseDto> {
    // Validate preset key
    if (!Object.keys(NUTRITION_PRESETS).includes(presetKey)) {
      throw new BadRequestException(
        `Invalid preset key. Available presets: ${Object.keys(NUTRITION_PRESETS).join(', ')}`,
      );
    }

    return this.nutritionGoalsService.applyPreset(userId, presetKey as NutritionPresetKey);
  }
}
