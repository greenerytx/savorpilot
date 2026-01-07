import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NutritionGoalsService } from './nutrition-goals.service';
import {
  NutritionMetric,
  SortOrder,
  DailyNutritionData,
  WeeklyAnalyticsResponse,
  MonthlyAnalyticsResponse,
  TopRecipeItem,
  NutrientGap,
  PeriodComparison,
  RollingAverageResponse,
  FilteredAnalyticsQueryDto,
} from './dto/analytics-query.dto';

@Injectable()
export class NutritionAnalyticsService {
  constructor(
    private prisma: PrismaService,
    private goalsService: NutritionGoalsService,
  ) {}

  /**
   * Get weekly analytics with goal variance
   */
  async getWeeklyAnalytics(
    userId: string,
    weekStart: string,
  ): Promise<WeeklyAnalyticsResponse> {
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const dailyData = await this.getDailyNutritionRange(userId, startDate, endDate);
    const goals = await this.goalsService.getGoals(userId);

    // Calculate totals
    const totals = dailyData.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
        fiber: acc.fiber + day.fiber,
        sodium: acc.sodium + day.sodium,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
    );

    const daysWithData = dailyData.filter((d) => d.mealsCount > 0).length || 1;

    const averages = {
      caloriesPerDay: Math.round(totals.calories / daysWithData),
      proteinPerDay: Math.round(totals.protein / daysWithData),
      carbsPerDay: Math.round(totals.carbs / daysWithData),
      fatPerDay: Math.round(totals.fat / daysWithData),
      fiberPerDay: Math.round(totals.fiber / daysWithData),
      sodiumPerDay: Math.round(totals.sodium / daysWithData),
    };

    // Calculate goal variance (percentage difference)
    const goalVariance = {
      calories: this.calculateVariance(averages.caloriesPerDay, goals.dailyCalories),
      protein: this.calculateVariance(averages.proteinPerDay, goals.dailyProteinG),
      carbs: this.calculateVariance(averages.carbsPerDay, goals.dailyCarbsG),
      fat: this.calculateVariance(averages.fatPerDay, goals.dailyFatG),
    };

    // Calculate coverage
    const totalMeals = dailyData.reduce((sum, d) => sum + d.mealsCount, 0);
    const mealsWithNutrition = dailyData.reduce((sum, d) => sum + d.mealsWithNutrition, 0);

    return {
      weekStart,
      weekEnd: endDate.toISOString().split('T')[0],
      dailyData,
      totals,
      averages,
      goalVariance,
      coverage: {
        totalMeals,
        mealsWithNutrition,
        coveragePercentage: totalMeals > 0 ? Math.round((mealsWithNutrition / totalMeals) * 100) : 0,
      },
    };
  }

  /**
   * Get monthly analytics with weekly breakdown
   */
  async getMonthlyAnalytics(
    userId: string,
    year: number,
    month: number,
  ): Promise<MonthlyAnalyticsResponse> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    // Get all weeks in the month
    const weeklyData: WeeklyAnalyticsResponse[] = [];
    let currentWeekStart = this.getWeekStart(startDate);

    while (currentWeekStart <= endDate) {
      const weekData = await this.getWeeklyAnalytics(
        userId,
        currentWeekStart.toISOString().split('T')[0],
      );
      weeklyData.push(weekData);

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    // Aggregate totals
    const totals = weeklyData.reduce(
      (acc, week) => ({
        calories: acc.calories + week.totals.calories,
        protein: acc.protein + week.totals.protein,
        carbs: acc.carbs + week.totals.carbs,
        fat: acc.fat + week.totals.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const daysTracked = weeklyData.reduce(
      (sum, week) => sum + week.dailyData.filter((d) => d.mealsCount > 0).length,
      0,
    );

    const averages = {
      caloriesPerDay: daysTracked > 0 ? Math.round(totals.calories / daysTracked) : 0,
      proteinPerDay: daysTracked > 0 ? Math.round(totals.protein / daysTracked) : 0,
      carbsPerDay: daysTracked > 0 ? Math.round(totals.carbs / daysTracked) : 0,
      fatPerDay: daysTracked > 0 ? Math.round(totals.fat / daysTracked) : 0,
    };

    return {
      year,
      month,
      weeklyData,
      totals,
      averages,
      daysTracked,
    };
  }

  /**
   * Get rolling average for N days
   */
  async getRollingAverage(userId: string, days: number): Promise<RollingAverageResponse> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const dailyData = await this.getDailyNutritionRange(userId, startDate, endDate);
    const daysWithData = dailyData.filter((d) => d.mealsCount > 0).length || 1;

    const totals = dailyData.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
        fiber: acc.fiber + day.fiber,
        sodium: acc.sodium + day.sodium,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
    );

    const averages = {
      calories: Math.round(totals.calories / daysWithData),
      protein: Math.round(totals.protein / daysWithData),
      carbs: Math.round(totals.carbs / daysWithData),
      fat: Math.round(totals.fat / daysWithData),
      fiber: Math.round(totals.fiber / daysWithData),
      sodium: Math.round(totals.sodium / daysWithData),
    };

    // Get previous period to determine trend
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - days + 1);

    const prevDailyData = await this.getDailyNutritionRange(userId, prevStartDate, prevEndDate);
    const prevDaysWithData = prevDailyData.filter((d) => d.mealsCount > 0).length || 1;
    const prevCalories = prevDailyData.reduce((sum, d) => sum + d.calories, 0) / prevDaysWithData;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    const calorieChange = ((averages.calories - prevCalories) / prevCalories) * 100;
    if (calorieChange > 5) trend = 'up';
    else if (calorieChange < -5) trend = 'down';

    return { days, averages, trend };
  }

  /**
   * Get top recipes by a specific nutrition metric
   */
  async getTopRecipes(
    userId: string,
    metric: NutritionMetric,
    limit: number = 10,
    order: SortOrder = SortOrder.DESC,
    startDate?: string,
    endDate?: string,
  ): Promise<TopRecipeItem[]> {
    // Get meal plan entries for the user in date range
    const whereClause: any = {
      mealPlan: { userId },
    };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const entries = await this.prisma.mealPlanEntry.findMany({
      where: whereClause,
      include: {
        mealPlan: true,
      },
    });

    // Get unique recipe IDs
    const recipeIds = [...new Set(entries.map((e) => e.recipeId))];

    // Fetch recipes with nutrition
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      include: { nutrition: true },
    });

    // Calculate totals per recipe
    const recipeStats = new Map<string, { count: number; totalValue: number; recipe: typeof recipes[0] }>();

    for (const entry of entries) {
      const recipe = recipes.find((r) => r.id === entry.recipeId);
      if (!recipe?.nutrition) continue;

      const metricValue = this.getMetricValue(recipe.nutrition, metric);
      if (metricValue === null) continue;

      const servingMultiplier = entry.servings / (recipe.servings || 1);
      const scaledValue = metricValue * servingMultiplier;

      const existing = recipeStats.get(recipe.id) || { count: 0, totalValue: 0, recipe };
      existing.count++;
      existing.totalValue += scaledValue;
      recipeStats.set(recipe.id, existing);
    }

    // Convert to array and sort
    const results: TopRecipeItem[] = Array.from(recipeStats.entries()).map(([recipeId, stats]) => ({
      recipeId,
      title: stats.recipe.title,
      imageUrl: stats.recipe.imageUrl || undefined,
      timesCooked: stats.count,
      totalValue: Math.round(stats.totalValue),
      averageValue: Math.round(stats.totalValue / stats.count),
      cuisine: stats.recipe.cuisine || undefined,
    }));

    results.sort((a, b) => {
      const diff = order === SortOrder.DESC ? b.totalValue - a.totalValue : a.totalValue - b.totalValue;
      return diff;
    });

    return results.slice(0, limit);
  }

  /**
   * Get nutrient gaps (where actual < goal)
   */
  async getNutrientGaps(
    userId: string,
    days: number = 7,
    startDate?: string,
    endDate?: string,
  ): Promise<NutrientGap[]> {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) start.setDate(start.getDate() - days + 1);

    const dailyData = await this.getDailyNutritionRange(userId, start, end);
    const goals = await this.goalsService.getGoals(userId);
    const totalDays = dailyData.filter((d) => d.mealsCount > 0).length;

    if (totalDays === 0) return [];

    const metrics: { metric: NutritionMetric; label: string; goal: number; key: keyof DailyNutritionData }[] = [
      { metric: NutritionMetric.CALORIES, label: 'Calories', goal: goals.dailyCalories, key: 'calories' },
      { metric: NutritionMetric.PROTEIN, label: 'Protein', goal: goals.dailyProteinG, key: 'protein' },
      { metric: NutritionMetric.CARBS, label: 'Carbohydrates', goal: goals.dailyCarbsG, key: 'carbs' },
      { metric: NutritionMetric.FAT, label: 'Fat', goal: goals.dailyFatG, key: 'fat' },
    ];

    if (goals.dailyFiberG) {
      metrics.push({ metric: NutritionMetric.FIBER, label: 'Fiber', goal: goals.dailyFiberG, key: 'fiber' });
    }
    if (goals.dailySodiumMg) {
      metrics.push({ metric: NutritionMetric.SODIUM, label: 'Sodium', goal: goals.dailySodiumMg, key: 'sodium' });
    }

    const gaps: NutrientGap[] = [];

    for (const { metric, label, goal, key } of metrics) {
      const totalActual = dailyData.reduce((sum, d) => sum + (d[key] as number), 0);
      const avgActual = totalActual / totalDays;
      const deficit = goal - avgActual;
      const daysUnderGoal = dailyData.filter((d) => d.mealsCount > 0 && (d[key] as number) < goal * 0.9).length;

      // Only include if there's a significant gap (more than 10% under)
      if (deficit > goal * 0.1) {
        gaps.push({
          metric,
          label,
          goal,
          actual: Math.round(avgActual),
          deficit: Math.round(deficit),
          deficitPercentage: Math.round((deficit / goal) * 100),
          daysUnderGoal,
          totalDays,
        });
      }
    }

    // Sort by deficit percentage (worst gaps first)
    gaps.sort((a, b) => b.deficitPercentage - a.deficitPercentage);

    return gaps;
  }

  /**
   * Compare two periods
   */
  async getComparison(
    userId: string,
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string,
  ): Promise<PeriodComparison> {
    const [period1Data, period2Data] = await Promise.all([
      this.getDailyNutritionRange(userId, new Date(period1Start), new Date(period1End)),
      this.getDailyNutritionRange(userId, new Date(period2Start), new Date(period2End)),
    ]);

    const calcAverages = (data: DailyNutritionData[]) => {
      const daysWithData = data.filter((d) => d.mealsCount > 0).length || 1;
      return {
        calories: Math.round(data.reduce((s, d) => s + d.calories, 0) / daysWithData),
        protein: Math.round(data.reduce((s, d) => s + d.protein, 0) / daysWithData),
        carbs: Math.round(data.reduce((s, d) => s + d.carbs, 0) / daysWithData),
        fat: Math.round(data.reduce((s, d) => s + d.fat, 0) / daysWithData),
      };
    };

    const period1Averages = calcAverages(period1Data);
    const period2Averages = calcAverages(period2Data);

    const calcChange = (p1: number, p2: number) => ({
      absolute: p2 - p1,
      percentage: p1 > 0 ? Math.round(((p2 - p1) / p1) * 100) : 0,
    });

    return {
      period1: {
        startDate: period1Start,
        endDate: period1End,
        averages: period1Averages,
      },
      period2: {
        startDate: period2Start,
        endDate: period2End,
        averages: period2Averages,
      },
      changes: {
        calories: calcChange(period1Averages.calories, period2Averages.calories),
        protein: calcChange(period1Averages.protein, period2Averages.protein),
        carbs: calcChange(period1Averages.carbs, period2Averages.carbs),
        fat: calcChange(period1Averages.fat, period2Averages.fat),
      },
    };
  }

  /**
   * Get analytics with filters
   */
  async getFilteredAnalytics(
    userId: string,
    filters: FilteredAnalyticsQueryDto,
  ): Promise<WeeklyAnalyticsResponse> {
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);

    // Build where clause with filters
    const whereClause: any = {
      mealPlan: { userId },
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filters.mealPlanId) {
      whereClause.mealPlanId = filters.mealPlanId;
    }

    // Get filtered entries
    const entries = await this.prisma.mealPlanEntry.findMany({
      where: whereClause,
      include: {
        mealPlan: true,
      },
    });

    // Get recipes
    const recipeIds = [...new Set(entries.map((e) => e.recipeId))];
    let recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      include: { nutrition: true },
    });

    // Apply recipe-level filters
    if (filters.cuisine) {
      recipes = recipes.filter((r) => r.cuisine?.toLowerCase() === filters.cuisine?.toLowerCase());
    }

    if (filters.collectionId) {
      const collectionRecipes = await this.prisma.recipeGroupMembership.findMany({
        where: { groupId: filters.collectionId },
        select: { recipeId: true },
      });
      const collectionRecipeIds = new Set(collectionRecipes.map((cr) => cr.recipeId));
      recipes = recipes.filter((r) => collectionRecipeIds.has(r.id));
    }

    const validRecipeIds = new Set(recipes.map((r) => r.id));
    const filteredEntries = entries.filter((e) => validRecipeIds.has(e.recipeId));

    // Build daily data from filtered entries
    const dailyData = this.buildDailyDataFromEntries(filteredEntries, recipes, startDate, endDate);
    const goals = await this.goalsService.getGoals(userId);

    // Calculate totals and averages (same as getWeeklyAnalytics)
    const totals = dailyData.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
        fiber: acc.fiber + day.fiber,
        sodium: acc.sodium + day.sodium,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
    );

    const daysWithData = dailyData.filter((d) => d.mealsCount > 0).length || 1;

    const averages = {
      caloriesPerDay: Math.round(totals.calories / daysWithData),
      proteinPerDay: Math.round(totals.protein / daysWithData),
      carbsPerDay: Math.round(totals.carbs / daysWithData),
      fatPerDay: Math.round(totals.fat / daysWithData),
      fiberPerDay: Math.round(totals.fiber / daysWithData),
      sodiumPerDay: Math.round(totals.sodium / daysWithData),
    };

    const goalVariance = {
      calories: this.calculateVariance(averages.caloriesPerDay, goals.dailyCalories),
      protein: this.calculateVariance(averages.proteinPerDay, goals.dailyProteinG),
      carbs: this.calculateVariance(averages.carbsPerDay, goals.dailyCarbsG),
      fat: this.calculateVariance(averages.fatPerDay, goals.dailyFatG),
    };

    const totalMeals = dailyData.reduce((sum, d) => sum + d.mealsCount, 0);
    const mealsWithNutrition = dailyData.reduce((sum, d) => sum + d.mealsWithNutrition, 0);

    return {
      weekStart: startDate.toISOString().split('T')[0],
      weekEnd: endDate.toISOString().split('T')[0],
      dailyData,
      totals,
      averages,
      goalVariance,
      coverage: {
        totalMeals,
        mealsWithNutrition,
        coveragePercentage: totalMeals > 0 ? Math.round((mealsWithNutrition / totalMeals) * 100) : 0,
      },
    };
  }

  // ============ Helper Methods ============

  private async getDailyNutritionRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyNutritionData[]> {
    // Get all meal plan entries in range
    const entries = await this.prisma.mealPlanEntry.findMany({
      where: {
        mealPlan: { userId },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get all relevant recipes
    const recipeIds = [...new Set(entries.map((e) => e.recipeId))];
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      include: { nutrition: true },
    });

    return this.buildDailyDataFromEntries(entries, recipes, startDate, endDate);
  }

  private buildDailyDataFromEntries(
    entries: { recipeId: string; date: Date; servings: number }[],
    recipes: { id: string; servings: number; nutrition: any }[],
    startDate: Date,
    endDate: Date,
  ): DailyNutritionData[] {
    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    // Group entries by date
    const entriesByDate = new Map<string, typeof entries>();
    for (const entry of entries) {
      const dateStr = entry.date.toISOString().split('T')[0];
      if (!entriesByDate.has(dateStr)) {
        entriesByDate.set(dateStr, []);
      }
      entriesByDate.get(dateStr)!.push(entry);
    }

    // Build daily data for each day in range
    const dailyData: DailyNutritionData[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayEntries = entriesByDate.get(dateStr) || [];

      let calories = 0,
        protein = 0,
        carbs = 0,
        fat = 0,
        fiber = 0,
        sodium = 0;
      let mealsWithNutrition = 0;

      for (const entry of dayEntries) {
        const recipe = recipeMap.get(entry.recipeId);
        if (!recipe?.nutrition) continue;

        const n = recipe.nutrition;
        if (n.caloriesPerServing) {
          mealsWithNutrition++;
          const mult = entry.servings / (recipe.servings || 1);
          calories += (n.caloriesPerServing || 0) * mult;
          protein += (n.proteinGrams || 0) * mult;
          carbs += (n.carbsGrams || 0) * mult;
          fat += (n.fatGrams || 0) * mult;
          fiber += (n.fiberGrams || 0) * mult;
          sodium += (n.sodiumMg || 0) * mult;
        }
      }

      dailyData.push({
        date: dateStr,
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        fiber: Math.round(fiber),
        sodium: Math.round(sodium),
        mealsCount: dayEntries.length,
        mealsWithNutrition,
      });

      current.setDate(current.getDate() + 1);
    }

    return dailyData;
  }

  private calculateVariance(actual: number, goal: number): number {
    if (goal === 0) return 0;
    return Math.round(((actual - goal) / goal) * 100);
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getMetricValue(nutrition: any, metric: NutritionMetric): number | null {
    switch (metric) {
      case NutritionMetric.CALORIES:
        return nutrition.caloriesPerServing;
      case NutritionMetric.PROTEIN:
        return nutrition.proteinGrams;
      case NutritionMetric.CARBS:
        return nutrition.carbsGrams;
      case NutritionMetric.FAT:
        return nutrition.fatGrams;
      case NutritionMetric.FIBER:
        return nutrition.fiberGrams;
      case NutritionMetric.SODIUM:
        return nutrition.sodiumMg;
      default:
        return null;
    }
  }
}
