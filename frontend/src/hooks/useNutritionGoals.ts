import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  nutritionGoalsService,
  type UpdateNutritionGoalsDto,
  type NutritionPresetKey,
} from '../services/nutrition-goals.service';

// Query keys
export const nutritionGoalsKeys = {
  all: ['nutrition-goals'] as const,
  goals: () => [...nutritionGoalsKeys.all, 'goals'] as const,
  presets: () => [...nutritionGoalsKeys.all, 'presets'] as const,
};

/**
 * Get current user's nutrition goals
 */
export function useNutritionGoals() {
  return useQuery({
    queryKey: nutritionGoalsKeys.goals(),
    queryFn: () => nutritionGoalsService.getGoals(),
    staleTime: 10 * 60 * 1000, // 10 minutes - goals don't change often
  });
}

/**
 * Update nutrition goals
 */
export function useUpdateNutritionGoals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateNutritionGoalsDto) => nutritionGoalsService.updateGoals(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(nutritionGoalsKeys.goals(), data);
    },
  });
}

/**
 * Get available nutrition presets
 */
export function useNutritionPresets() {
  return useQuery({
    queryKey: nutritionGoalsKeys.presets(),
    queryFn: () => nutritionGoalsService.getPresets(),
    staleTime: Infinity, // Presets never change
  });
}

/**
 * Apply a preset to nutrition goals
 */
export function useApplyNutritionPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (presetKey: NutritionPresetKey) => nutritionGoalsService.applyPreset(presetKey),
    onSuccess: (data) => {
      queryClient.setQueryData(nutritionGoalsKeys.goals(), data);
    },
  });
}

/**
 * Helper hook to get goals with defaults for UI display
 */
export function useNutritionGoalsWithDefaults() {
  const { data: goals, isLoading, error } = useNutritionGoals();

  // Default values matching the maintenance preset
  const defaults = {
    dailyCalories: 2000,
    dailyProteinG: 50,
    dailyCarbsG: 275,
    dailyFatG: 78,
    dailyFiberG: 25,
    dailySodiumMg: 2300,
  };

  return {
    goals: goals
      ? {
          ...goals,
          dailyFiberG: goals.dailyFiberG ?? defaults.dailyFiberG,
          dailySodiumMg: goals.dailySodiumMg ?? defaults.dailySodiumMg,
        }
      : defaults,
    isLoading,
    error,
    hasCustomGoals: !!goals,
  };
}
