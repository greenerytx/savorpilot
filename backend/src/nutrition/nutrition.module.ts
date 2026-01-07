import { Module } from '@nestjs/common';
import { NutritionGoalsController } from './nutrition-goals.controller';
import { NutritionAnalyticsController } from './nutrition-analytics.controller';
import { NutritionGoalsService } from './nutrition-goals.service';
import { NutritionAnalyticsService } from './nutrition-analytics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NutritionGoalsController, NutritionAnalyticsController],
  providers: [NutritionGoalsService, NutritionAnalyticsService],
  exports: [NutritionGoalsService, NutritionAnalyticsService],
})
export class NutritionModule {}
