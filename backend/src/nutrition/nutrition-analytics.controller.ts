import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NutritionAnalyticsService } from './nutrition-analytics.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  NutritionMetric,
  SortOrder,
  WeeklyAnalyticsResponse,
  MonthlyAnalyticsResponse,
  TopRecipeItem,
  NutrientGap,
  PeriodComparison,
  RollingAverageResponse,
} from './dto/analytics-query.dto';

@Controller('nutrition/analytics')
export class NutritionAnalyticsController {
  constructor(private readonly analyticsService: NutritionAnalyticsService) {}

  /**
   * Get weekly analytics
   * GET /nutrition/analytics/weekly?weekStart=2024-01-01
   */
  @Get('weekly')
  async getWeeklyAnalytics(
    @CurrentUser('id') userId: string,
    @Query('weekStart') weekStart: string,
  ): Promise<WeeklyAnalyticsResponse> {
    return this.analyticsService.getWeeklyAnalytics(userId, weekStart);
  }

  /**
   * Get monthly analytics
   * GET /nutrition/analytics/monthly?year=2024&month=1
   */
  @Get('monthly')
  async getMonthlyAnalytics(
    @CurrentUser('id') userId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ): Promise<MonthlyAnalyticsResponse> {
    return this.analyticsService.getMonthlyAnalytics(userId, year, month);
  }

  /**
   * Get rolling average
   * GET /nutrition/analytics/rolling?days=7
   */
  @Get('rolling')
  async getRollingAverage(
    @CurrentUser('id') userId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ): Promise<RollingAverageResponse> {
    return this.analyticsService.getRollingAverage(userId, days);
  }

  /**
   * Get top recipes by nutrition metric
   * GET /nutrition/analytics/top-recipes?metric=protein&limit=10&order=desc
   */
  @Get('top-recipes')
  async getTopRecipes(
    @CurrentUser('id') userId: string,
    @Query('metric') metric: NutritionMetric,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order', new DefaultValuePipe(SortOrder.DESC)) order: SortOrder,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TopRecipeItem[]> {
    return this.analyticsService.getTopRecipes(
      userId,
      metric,
      limit,
      order,
      startDate,
      endDate,
    );
  }

  /**
   * Get nutrient gaps (where actual < goal)
   * GET /nutrition/analytics/gaps?days=7
   */
  @Get('gaps')
  async getNutrientGaps(
    @CurrentUser('id') userId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<NutrientGap[]> {
    return this.analyticsService.getNutrientGaps(userId, days, startDate, endDate);
  }

  /**
   * Compare two periods
   * GET /nutrition/analytics/compare?period1Start=...&period1End=...&period2Start=...&period2End=...
   */
  @Get('compare')
  async getComparison(
    @CurrentUser('id') userId: string,
    @Query('period1Start') period1Start: string,
    @Query('period1End') period1End: string,
    @Query('period2Start') period2Start: string,
    @Query('period2End') period2End: string,
  ): Promise<PeriodComparison> {
    return this.analyticsService.getComparison(
      userId,
      period1Start,
      period1End,
      period2Start,
      period2End,
    );
  }

  /**
   * Get filtered analytics
   * GET /nutrition/analytics/filtered?mealPlanId=...&cuisine=...&startDate=...&endDate=...
   */
  @Get('filtered')
  async getFilteredAnalytics(
    @CurrentUser('id') userId: string,
    @Query('mealPlanId') mealPlanId?: string,
    @Query('collectionId') collectionId?: string,
    @Query('cuisine') cuisine?: string,
    @Query('circleId') circleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<WeeklyAnalyticsResponse> {
    return this.analyticsService.getFilteredAnalytics(userId, {
      mealPlanId,
      collectionId,
      cuisine,
      circleId,
      startDate,
      endDate,
    });
  }
}
