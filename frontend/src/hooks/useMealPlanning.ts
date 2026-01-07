import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealPlanningService } from '../services/meal-planning.service';
import type {
  MealPlan,
  MealPlanEntry,
  CreateMealPlanDto,
  UpdateMealPlanDto,
  CreateMealPlanEntryDto,
  MealPlanQuery,
  MealPlanNutritionSummary,
  DailyNutritionSummary,
} from '../services/meal-planning.service';

// Query keys
export const mealPlanKeys = {
  all: ['meal-plans'] as const,
  lists: () => [...mealPlanKeys.all, 'list'] as const,
  list: (query?: MealPlanQuery) => [...mealPlanKeys.lists(), query] as const,
  details: () => [...mealPlanKeys.all, 'detail'] as const,
  detail: (id: string) => [...mealPlanKeys.details(), id] as const,
  week: (weekStart: string) => [...mealPlanKeys.all, 'week', weekStart] as const,
  nutrition: (id: string) => [...mealPlanKeys.all, 'nutrition', id] as const,
  dailyNutrition: (id: string, date: string) => [...mealPlanKeys.all, 'nutrition', id, date] as const,
};

// Get all meal plans
export function useMealPlans(query?: MealPlanQuery) {
  return useQuery({
    queryKey: mealPlanKeys.list(query),
    queryFn: () => mealPlanningService.getMealPlans(query),
  });
}

// Get single meal plan
export function useMealPlan(id: string) {
  return useQuery({
    queryKey: mealPlanKeys.detail(id),
    queryFn: () => mealPlanningService.getMealPlan(id),
    enabled: !!id,
  });
}

// Get meal plan for a specific week
export function useWeekPlan(weekStart: string) {
  return useQuery({
    queryKey: mealPlanKeys.week(weekStart),
    queryFn: () => mealPlanningService.getWeekPlan(weekStart),
    enabled: !!weekStart,
  });
}

// Create meal plan
export function useCreateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMealPlanDto) => mealPlanningService.createMealPlan(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
    },
  });
}

// Update meal plan
export function useUpdateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMealPlanDto }) =>
      mealPlanningService.updateMealPlan(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
      queryClient.setQueryData(mealPlanKeys.detail(data.id), data);
    },
  });
}

// Delete meal plan
export function useDeleteMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mealPlanningService.deleteMealPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
    },
  });
}

// Add meal entry
export function useAddMealEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mealPlanId,
      dto,
    }: {
      mealPlanId: string;
      dto: CreateMealPlanEntryDto;
    }) => mealPlanningService.addEntry(mealPlanId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(variables.mealPlanId) });
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.lists() });
    },
  });
}

// Update meal entry
export function useUpdateMealEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mealPlanId,
      entryId,
      dto,
    }: {
      mealPlanId: string;
      entryId: string;
      dto: Partial<CreateMealPlanEntryDto>;
    }) => mealPlanningService.updateEntry(mealPlanId, entryId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(variables.mealPlanId) });
    },
  });
}

// Delete meal entry
export function useDeleteMealEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mealPlanId, entryId }: { mealPlanId: string; entryId: string }) =>
      mealPlanningService.deleteEntry(mealPlanId, entryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(variables.mealPlanId) });
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.lists() });
    },
  });
}

// Bulk add entries
export function useBulkAddMealEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mealPlanId,
      entries,
    }: {
      mealPlanId: string;
      entries: CreateMealPlanEntryDto[];
    }) => mealPlanningService.bulkAddEntries(mealPlanId, entries),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(variables.mealPlanId) });
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.lists() });
    },
  });
}

// Get meal plan nutrition summary
export function useMealPlanNutrition(mealPlanId: string, enabled = true) {
  return useQuery({
    queryKey: mealPlanKeys.nutrition(mealPlanId),
    queryFn: () => mealPlanningService.getMealPlanNutrition(mealPlanId),
    enabled: !!mealPlanId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - nutrition data doesn't change often
  });
}

// Get daily nutrition for a specific date
export function useDailyNutrition(mealPlanId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: mealPlanKeys.dailyNutrition(mealPlanId, date),
    queryFn: () => mealPlanningService.getDailyNutrition(mealPlanId, date),
    enabled: !!mealPlanId && !!date && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Utility functions
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function getWeekDates(weekStart: string): Date[] {
  const dates: Date[] = [];
  // Parse as local time to avoid timezone shift
  const [year, month, day] = weekStart.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export function formatDate(date: Date): string {
  // Use local date to avoid timezone shift
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMealTypeLabel(mealType: string): string {
  const labels: Record<string, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  };
  return labels[mealType] || mealType;
}

export function getMealTypeEmoji(mealType: string): string {
  const emojis: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍿',
  };
  return emojis[mealType] || '🍽️';
}
