import { api } from './api';

// Enums
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

// Response Types
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
    calories: number;
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
  totalValue: number;
  averageValue: number;
  cuisine?: string;
}

export interface NutrientGap {
  metric: NutritionMetric;
  label: string;
  goal: number;
  actual: number;
  deficit: number;
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
  trend: 'up' | 'down' | 'stable';
}

export interface AnalyticsFilters {
  mealPlanId?: string;
  collectionId?: string;
  cuisine?: string;
  circleId?: string;
  startDate?: string;
  endDate?: string;
}

class NutritionAnalyticsService {
  /**
   * Get weekly analytics
   */
  async getWeeklyAnalytics(weekStart: string): Promise<WeeklyAnalyticsResponse> {
    const response = await api.get(`/nutrition/analytics/weekly?weekStart=${weekStart}`);
    return response.data;
  }

  /**
   * Get monthly analytics
   */
  async getMonthlyAnalytics(year: number, month: number): Promise<MonthlyAnalyticsResponse> {
    const response = await api.get(`/nutrition/analytics/monthly?year=${year}&month=${month}`);
    return response.data;
  }

  /**
   * Get rolling average
   */
  async getRollingAverage(days: number = 7): Promise<RollingAverageResponse> {
    const response = await api.get(`/nutrition/analytics/rolling?days=${days}`);
    return response.data;
  }

  /**
   * Get top recipes by metric
   */
  async getTopRecipes(
    metric: NutritionMetric,
    limit: number = 10,
    order: SortOrder = SortOrder.DESC,
    startDate?: string,
    endDate?: string,
  ): Promise<TopRecipeItem[]> {
    const params = new URLSearchParams({
      metric,
      limit: limit.toString(),
      order,
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/nutrition/analytics/top-recipes?${params}`);
    return response.data;
  }

  /**
   * Get nutrient gaps
   */
  async getNutrientGaps(
    days: number = 7,
    startDate?: string,
    endDate?: string,
  ): Promise<NutrientGap[]> {
    const params = new URLSearchParams({ days: days.toString() });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/nutrition/analytics/gaps?${params}`);
    return response.data;
  }

  /**
   * Compare two periods
   */
  async getComparison(
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string,
  ): Promise<PeriodComparison> {
    const params = new URLSearchParams({
      period1Start,
      period1End,
      period2Start,
      period2End,
    });

    const response = await api.get(`/nutrition/analytics/compare?${params}`);
    return response.data;
  }

  /**
   * Get filtered analytics
   */
  async getFilteredAnalytics(filters: AnalyticsFilters): Promise<WeeklyAnalyticsResponse> {
    const params = new URLSearchParams();
    if (filters.mealPlanId) params.append('mealPlanId', filters.mealPlanId);
    if (filters.collectionId) params.append('collectionId', filters.collectionId);
    if (filters.cuisine) params.append('cuisine', filters.cuisine);
    if (filters.circleId) params.append('circleId', filters.circleId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/nutrition/analytics/filtered?${params}`);
    return response.data;
  }
}

export const nutritionAnalyticsService = new NutritionAnalyticsService();
