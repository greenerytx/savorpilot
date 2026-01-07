import { Module } from '@nestjs/common';
import { MealPlanningController } from './meal-planning.controller';
import { MealPlanningService } from './meal-planning.service';
import { NutritionAggregationService } from './nutrition-aggregation.service';
import { AiMealPlanService } from './ai-meal-plan.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [PrismaModule, AiModule, RecipesModule],
  controllers: [MealPlanningController],
  providers: [MealPlanningService, NutritionAggregationService, AiMealPlanService],
  exports: [MealPlanningService, NutritionAggregationService, AiMealPlanService],
})
export class MealPlanningModule {}
