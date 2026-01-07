import { api } from './api';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export interface MealPlanEntry {
  id: string;
  recipeId: string;
  date: string;
  mealType: MealType;
  servings: number;
  notes?: string;
  recipe?: {
    id: string;
    title: string;
    imageUrl?: string;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    servings: number;
  };
}

export interface MealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  circleId?: string;
  createdAt: string;
  updatedAt: string;
  meals?: MealPlanEntry[];
  circle?: {
    id: string;
    name: string;
    emoji?: string;
  };
}

export interface MealPlanListResponse {
  data: MealPlan[];
  total: number;
}

export interface CreateMealPlanDto {
  name: string;
  startDate: string;
  endDate: string;
  circleId?: string;
}

export interface UpdateMealPlanDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  circleId?: string;
}

export interface CreateMealPlanEntryDto {
  recipeId: string;
  date: string;
  mealType: MealType;
  servings?: number;
  notes?: string;
}

export interface MealPlanQuery {
  startDate?: string;
  endDate?: string;
  circleId?: string;
}

// Nutrition types
export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface MealNutrition {
  mealType: string;
  recipeId: string;
  recipeTitle: string;
  servings: number;
  nutrition: NutritionTotals | null;
}

export interface DailyNutritionSummary {
  date: string;
  totals: NutritionTotals;
  meals: MealNutrition[];
  mealsWithNutrition: number;
  mealsWithoutNutrition: number;
}

export interface MealPlanNutritionSummary {
  mealPlanId: string;
  mealPlanName: string;
  startDate: string;
  endDate: string;
  weeklyTotals: NutritionTotals;
  dailyBreakdown: DailyNutritionSummary[];
  averages: {
    caloriesPerDay: number;
    proteinPerDay: number;
    carbsPerDay: number;
    fatPerDay: number;
  };
  coverage: {
    totalMeals: number;
    mealsWithNutrition: number;
    coveragePercentage: number;
  };
}

// AI Meal Plan Generation types
export interface MacroTargets {
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface GenerateMealPlanRequest {
  startDate: string;
  durationDays?: number;
  targetCalories?: number;
  macroTargets?: MacroTargets;
  mealTypes?: MealType[];
  cuisines?: string[];
  circleId?: string;
  useCircleRestrictions?: boolean;
  servingsPerMeal?: number;
  prioritizeVariety?: boolean;
}

export interface SuggestedRecipe {
  title: string;
  description: string;
  estimatedPrepTime?: number;
  estimatedCookTime?: number;
  cuisine?: string;
  ingredients: string[];
  briefInstructions: string;
}

export interface GeneratedMealEntry {
  recipeId?: string;
  recipeTitle: string;
  date: string;
  mealType: MealType;
  servings: number;
  isExisting: boolean;
  hasNutritionData: boolean;
  estimatedCalories?: number;
  estimatedProtein?: number;
  estimatedCarbs?: number;
  estimatedFat?: number;
  imageUrl?: string;
  suggestedRecipe?: SuggestedRecipe;
}

export interface DailyNutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface TargetDeviation {
  caloriesDiff: number;
  proteinDiff?: number;
  carbsDiff?: number;
  fatDiff?: number;
}

export interface DailyPlanSummary {
  date: string;
  dayOfWeek: string;
  meals: GeneratedMealEntry[];
  totals: DailyNutritionTotals;
  targetDeviation: TargetDeviation;
}

export interface WeeklyAverages {
  caloriesPerDay: number;
  proteinPerDay: number;
  carbsPerDay: number;
  fatPerDay: number;
}

export interface PlanStatistics {
  existingRecipesUsed: number;
  newRecipesSuggested: number;
  recipesWithNutrition: number;
  cuisineBreakdown?: Record<string, number>;
}

export interface GeneratedMealPlanPreview {
  planId: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  dailyPlans: DailyPlanSummary[];
  weeklyTotals: DailyNutritionTotals;
  weeklyAverages: WeeklyAverages;
  statistics: PlanStatistics;
  warnings: string[];
}

export interface ApplyGeneratedPlanRequest {
  previewPlanId: string;
  mealPlanId?: string;
  mealPlanName?: string;
  circleId?: string;
}

export interface RegenerateMealRequest {
  previewPlanId: string;
  date: string;
  mealType: MealType;
  excludeRecipeIds?: string[];
}

class MealPlanningService {
  async getMealPlans(query?: MealPlanQuery): Promise<MealPlanListResponse> {
    const params = new URLSearchParams();
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.circleId) params.append('circleId', query.circleId);

    const response = await api.get(`/meal-plans?${params.toString()}`);
    return response.data;
  }

  async getMealPlan(id: string): Promise<MealPlan> {
    const response = await api.get(`/meal-plans/${id}`);
    return response.data;
  }

  async getWeekPlan(weekStart: string): Promise<MealPlan | null> {
    const response = await api.get(`/meal-plans/week/${weekStart}`);
    return response.data;
  }

  async createMealPlan(dto: CreateMealPlanDto): Promise<MealPlan> {
    const response = await api.post('/meal-plans', dto);
    return response.data;
  }

  async updateMealPlan(id: string, dto: UpdateMealPlanDto): Promise<MealPlan> {
    const response = await api.put(`/meal-plans/${id}`, dto);
    return response.data;
  }

  async deleteMealPlan(id: string): Promise<void> {
    await api.delete(`/meal-plans/${id}`);
  }

  async addEntry(mealPlanId: string, dto: CreateMealPlanEntryDto): Promise<MealPlanEntry> {
    const response = await api.post(`/meal-plans/${mealPlanId}/entries`, dto);
    return response.data;
  }

  async updateEntry(
    mealPlanId: string,
    entryId: string,
    dto: Partial<CreateMealPlanEntryDto>,
  ): Promise<MealPlanEntry> {
    const response = await api.put(`/meal-plans/${mealPlanId}/entries/${entryId}`, dto);
    return response.data;
  }

  async deleteEntry(mealPlanId: string, entryId: string): Promise<void> {
    await api.delete(`/meal-plans/${mealPlanId}/entries/${entryId}`);
  }

  async bulkAddEntries(
    mealPlanId: string,
    entries: CreateMealPlanEntryDto[],
  ): Promise<MealPlanEntry[]> {
    const response = await api.post(`/meal-plans/${mealPlanId}/entries/bulk`, { entries });
    return response.data;
  }

  // Nutrition methods
  async getMealPlanNutrition(mealPlanId: string): Promise<MealPlanNutritionSummary> {
    const response = await api.get(`/meal-plans/${mealPlanId}/nutrition`);
    return response.data;
  }

  async getDailyNutrition(mealPlanId: string, date: string): Promise<DailyNutritionSummary> {
    const response = await api.get(`/meal-plans/${mealPlanId}/nutrition/daily/${date}`);
    return response.data;
  }

  // AI Meal Plan Generation methods
  async generateMealPlan(dto: GenerateMealPlanRequest): Promise<GeneratedMealPlanPreview> {
    const response = await api.post('/meal-plans/generate', dto);
    return response.data;
  }

  async applyGeneratedPlan(dto: ApplyGeneratedPlanRequest): Promise<MealPlan> {
    const response = await api.post('/meal-plans/generate/apply', dto);
    return response.data;
  }

  async regenerateMeal(dto: RegenerateMealRequest): Promise<GeneratedMealEntry> {
    const response = await api.post('/meal-plans/generate/regenerate-meal', dto);
    return response.data;
  }
}

export const mealPlanningService = new MealPlanningService();
