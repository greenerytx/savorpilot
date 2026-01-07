import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mealPlanningService } from '../services/meal-planning.service';
import type {
  GenerateMealPlanRequest,
  GeneratedMealPlanPreview,
  ApplyGeneratedPlanRequest,
  RegenerateMealRequest,
  GeneratedMealEntry,
  MealType,
} from '../services/meal-planning.service';
import { mealPlanKeys } from './useMealPlanning';

// Generate a new meal plan preview
export function useGenerateMealPlan() {
  return useMutation({
    mutationFn: (dto: GenerateMealPlanRequest) =>
      mealPlanningService.generateMealPlan(dto),
  });
}

// Apply a generated meal plan to create actual entries
export function useApplyGeneratedPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ApplyGeneratedPlanRequest) =>
      mealPlanningService.applyGeneratedPlan(dto),
    onSuccess: () => {
      // Invalidate all meal plan queries to refresh data
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
    },
  });
}

// Regenerate a single meal in the preview
export function useRegenerateMeal() {
  return useMutation({
    mutationFn: (dto: RegenerateMealRequest) =>
      mealPlanningService.regenerateMeal(dto),
  });
}

// State management hook for AI meal plan workflow
export interface AiMealPlanState {
  isGenerating: boolean;
  preview: GeneratedMealPlanPreview | null;
  error: string | null;
}

export function useAiMealPlanWorkflow() {
  const [preview, setPreview] = useState<GeneratedMealPlanPreview | null>(null);
  const generateMutation = useGenerateMealPlan();
  const applyMutation = useApplyGeneratedPlan();
  const regenerateMutation = useRegenerateMeal();

  const generate = useCallback(
    async (request: GenerateMealPlanRequest) => {
      try {
        const result = await generateMutation.mutateAsync(request);
        setPreview(result);
        return result;
      } catch (error) {
        throw error;
      }
    },
    [generateMutation]
  );

  const apply = useCallback(
    async (mealPlanId?: string, mealPlanName?: string, circleId?: string) => {
      if (!preview) {
        throw new Error('No preview to apply');
      }

      const result = await applyMutation.mutateAsync({
        previewPlanId: preview.planId,
        mealPlanId,
        mealPlanName,
        circleId,
      });

      // Clear the preview after successful apply
      setPreview(null);
      return result;
    },
    [preview, applyMutation]
  );

  const regenerateMeal = useCallback(
    async (date: string, mealType: MealType, excludeRecipeIds?: string[]) => {
      if (!preview) {
        throw new Error('No preview to regenerate from');
      }

      const newMeal = await regenerateMutation.mutateAsync({
        previewPlanId: preview.planId,
        date,
        mealType,
        excludeRecipeIds,
      });

      // Update the preview with the new meal
      setPreview((prev) => {
        if (!prev) return prev;

        const updatedPlans = prev.dailyPlans.map((day) => {
          if (day.date !== date) return day;

          const updatedMeals = day.meals.map((meal) =>
            meal.mealType === mealType ? newMeal : meal
          );

          // Recalculate day totals
          const totals = {
            calories: updatedMeals.reduce((sum, m) => sum + (m.estimatedCalories || 0), 0),
            protein: updatedMeals.reduce((sum, m) => sum + (m.estimatedProtein || 0), 0),
            carbs: updatedMeals.reduce((sum, m) => sum + (m.estimatedCarbs || 0), 0),
            fat: updatedMeals.reduce((sum, m) => sum + (m.estimatedFat || 0), 0),
          };

          return { ...day, meals: updatedMeals, totals };
        });

        // Recalculate weekly totals and averages
        const weeklyTotals = {
          calories: updatedPlans.reduce((sum, d) => sum + d.totals.calories, 0),
          protein: updatedPlans.reduce((sum, d) => sum + d.totals.protein, 0),
          carbs: updatedPlans.reduce((sum, d) => sum + d.totals.carbs, 0),
          fat: updatedPlans.reduce((sum, d) => sum + d.totals.fat, 0),
        };

        const numDays = updatedPlans.length;
        const weeklyAverages = {
          caloriesPerDay: Math.round(weeklyTotals.calories / numDays),
          proteinPerDay: Math.round(weeklyTotals.protein / numDays),
          carbsPerDay: Math.round(weeklyTotals.carbs / numDays),
          fatPerDay: Math.round(weeklyTotals.fat / numDays),
        };

        return {
          ...prev,
          dailyPlans: updatedPlans,
          weeklyTotals,
          weeklyAverages,
        };
      });

      return newMeal;
    },
    [preview, regenerateMutation]
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return {
    preview,
    generate,
    apply,
    regenerateMeal,
    clearPreview,
    isGenerating: generateMutation.isPending,
    isApplying: applyMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
    generateError: generateMutation.error,
    applyError: applyMutation.error,
    regenerateError: regenerateMutation.error,
  };
}
