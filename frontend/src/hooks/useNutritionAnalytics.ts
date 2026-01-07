import { useQuery } from '@tanstack/react-query';
import {
  nutritionAnalyticsService,
  NutritionMetric,
  SortOrder,
  type AnalyticsFilters,
} from '../services/nutrition-analytics.service';

// Query keys
export const nutritionAnalyticsKeys = {
  all: ['nutrition-analytics'] as const,
  weekly: (weekStart: string) => [...nutritionAnalyticsKeys.all, 'weekly', weekStart] as const,
  monthly: (year: number, month: number) =>
    [...nutritionAnalyticsKeys.all, 'monthly', year, month] as const,
  rolling: (days: number) => [...nutritionAnalyticsKeys.all, 'rolling', days] as const,
  topRecipes: (metric: NutritionMetric, limit: number, startDate?: string, endDate?: string) =>
    [...nutritionAnalyticsKeys.all, 'top-recipes', metric, limit, startDate, endDate] as const,
  gaps: (days: number, startDate?: string, endDate?: string) =>
    [...nutritionAnalyticsKeys.all, 'gaps', days, startDate, endDate] as const,
  comparison: (p1Start: string, p1End: string, p2Start: string, p2End: string) =>
    [...nutritionAnalyticsKeys.all, 'comparison', p1Start, p1End, p2Start, p2End] as const,
  filtered: (filters: AnalyticsFilters) =>
    [...nutritionAnalyticsKeys.all, 'filtered', filters] as const,
};

/**
 * Get weekly analytics
 */
export function useWeeklyAnalytics(weekStart: string, enabled = true) {
  return useQuery({
    queryKey: nutritionAnalyticsKeys.weekly(weekStart),
    queryFn: () => nutritionAnalyticsService.getWeeklyAnalytics(weekStart),
    enabled: !!weekStart && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get monthly analytics
 */
export function useMonthlyAnalytics(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: nutritionAnalyticsKeys.monthly(year, month),
    queryFn: () => nutritionAnalyticsService.getMonthlyAnalytics(year, month),
    enabled: !!year && !!month && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get rolling average (7, 14, or 30 days)
 */
export function useRollingAverage(days: number = 7, enabled = true) {
  return useQuery({
    queryKey: nutritionAnalyticsKeys.rolling(days),
    queryFn: () => nutritionAnalyticsService.getRollingAverage(days),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get top recipes by metric
 */
export function useTopRecipes(
  metric: NutritionMetric,
  limit: number = 10,
  order: SortOrder = SortOrder.DESC,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: nutritionAnalyticsKeys.topRecipes(metric, limit, startDate, endDate),
    queryFn: () =>
      nutritionAnalyticsService.getTopRecipes(metric, limit, order, startDate, endDate),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get nutrient gaps
 */
export function useNutrientGaps(
  days: number = 7,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: nutritionAnalyticsKeys.gaps(days, startDate, endDate),
    queryFn: () => nutritionAnalyticsService.getNutrientGaps(days, startDate, endDate),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Compare two periods
 */
export function usePeriodComparison(
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string,
  enabled = true,
) {
  return useQuery({
    queryKey: nutritionAnalyticsKeys.comparison(period1Start, period1End, period2Start, period2End),
    queryFn: () =>
      nutritionAnalyticsService.getComparison(period1Start, period1End, period2Start, period2End),
    enabled: !!period1Start && !!period1End && !!period2Start && !!period2End && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get filtered analytics
 */
export function useFilteredAnalytics(filters: AnalyticsFilters, enabled = true) {
  return useQuery({
    queryKey: nutritionAnalyticsKeys.filtered(filters),
    queryFn: () => nutritionAnalyticsService.getFilteredAnalytics(filters),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Helper functions

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return formatDateLocal(d);
}

export function getPreviousWeekStart(weekStart: string): string {
  const d = parseDateLocal(weekStart);
  d.setDate(d.getDate() - 7);
  return formatDateLocal(d);
}

export function getNextWeekStart(weekStart: string): string {
  const d = parseDateLocal(weekStart);
  d.setDate(d.getDate() + 7);
  return formatDateLocal(d);
}

export function formatDateRange(start: string, end: string): string {
  const startDate = parseDateLocal(start);
  const endDate = parseDateLocal(end);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}
