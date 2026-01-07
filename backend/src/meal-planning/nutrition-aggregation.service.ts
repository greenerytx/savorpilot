import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class NutritionAggregationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get nutrition summary for an entire meal plan
   */
  async getMealPlanNutrition(
    userId: string,
    mealPlanId: string,
  ): Promise<MealPlanNutritionSummary> {
    // Fetch meal plan with entries
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id: mealPlanId, userId },
      include: {
        meals: {
          orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
        },
      },
    });

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    // Get all recipe IDs
    const recipeIds = [...new Set(mealPlan.meals.map((m) => m.recipeId))];

    // Fetch recipes with nutrition data
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: {
        id: true,
        title: true,
        servings: true,
        nutrition: true,
      },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    // Group meals by date
    const mealsByDate = new Map<string, typeof mealPlan.meals>();
    for (const meal of mealPlan.meals) {
      const dateStr = meal.date.toISOString().split('T')[0];
      if (!mealsByDate.has(dateStr)) {
        mealsByDate.set(dateStr, []);
      }
      mealsByDate.get(dateStr)!.push(meal);
    }

    // Calculate daily breakdown
    const dailyBreakdown: DailyNutritionSummary[] = [];
    let weeklyTotals: NutritionTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };
    let totalMeals = 0;
    let mealsWithNutrition = 0;

    // Sort dates
    const sortedDates = [...mealsByDate.keys()].sort();

    for (const dateStr of sortedDates) {
      const meals = mealsByDate.get(dateStr)!;
      const dailyMeals: MealNutrition[] = [];
      let dayTotals: NutritionTotals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      };
      let dayMealsWithNutrition = 0;
      let dayMealsWithoutNutrition = 0;

      for (const meal of meals) {
        totalMeals++;
        const recipe = recipeMap.get(meal.recipeId);

        if (!recipe) continue;

        const nutrition = recipe.nutrition;
        let mealNutrition: NutritionTotals | null = null;

        if (nutrition && nutrition.caloriesPerServing) {
          mealsWithNutrition++;
          dayMealsWithNutrition++;

          // Calculate nutrition for this meal based on servings
          // Nutrition is stored per recipe serving, so we need to adjust
          const servingMultiplier = meal.servings / (recipe.servings || 1);

          mealNutrition = {
            calories: Math.round((nutrition.caloriesPerServing || 0) * servingMultiplier),
            protein: Math.round((nutrition.proteinGrams || 0) * servingMultiplier),
            carbs: Math.round((nutrition.carbsGrams || 0) * servingMultiplier),
            fat: Math.round((nutrition.fatGrams || 0) * servingMultiplier),
            fiber: Math.round((nutrition.fiberGrams || 0) * servingMultiplier),
            sugar: Math.round((nutrition.sugarGrams || 0) * servingMultiplier),
            sodium: Math.round((nutrition.sodiumMg || 0) * servingMultiplier),
          };

          // Add to daily totals
          dayTotals.calories += mealNutrition.calories;
          dayTotals.protein += mealNutrition.protein;
          dayTotals.carbs += mealNutrition.carbs;
          dayTotals.fat += mealNutrition.fat;
          dayTotals.fiber += mealNutrition.fiber;
          dayTotals.sugar += mealNutrition.sugar;
          dayTotals.sodium += mealNutrition.sodium;
        } else {
          dayMealsWithoutNutrition++;
        }

        dailyMeals.push({
          mealType: meal.mealType,
          recipeId: meal.recipeId,
          recipeTitle: recipe.title,
          servings: meal.servings,
          nutrition: mealNutrition,
        });
      }

      // Add to weekly totals
      weeklyTotals.calories += dayTotals.calories;
      weeklyTotals.protein += dayTotals.protein;
      weeklyTotals.carbs += dayTotals.carbs;
      weeklyTotals.fat += dayTotals.fat;
      weeklyTotals.fiber += dayTotals.fiber;
      weeklyTotals.sugar += dayTotals.sugar;
      weeklyTotals.sodium += dayTotals.sodium;

      dailyBreakdown.push({
        date: dateStr,
        totals: dayTotals,
        meals: dailyMeals,
        mealsWithNutrition: dayMealsWithNutrition,
        mealsWithoutNutrition: dayMealsWithoutNutrition,
      });
    }

    // Calculate averages
    const daysWithMeals = dailyBreakdown.length || 1;
    const averages = {
      caloriesPerDay: Math.round(weeklyTotals.calories / daysWithMeals),
      proteinPerDay: Math.round(weeklyTotals.protein / daysWithMeals),
      carbsPerDay: Math.round(weeklyTotals.carbs / daysWithMeals),
      fatPerDay: Math.round(weeklyTotals.fat / daysWithMeals),
    };

    return {
      mealPlanId: mealPlan.id,
      mealPlanName: mealPlan.name,
      startDate: mealPlan.startDate.toISOString().split('T')[0],
      endDate: mealPlan.endDate.toISOString().split('T')[0],
      weeklyTotals,
      dailyBreakdown,
      averages,
      coverage: {
        totalMeals,
        mealsWithNutrition,
        coveragePercentage: totalMeals > 0
          ? Math.round((mealsWithNutrition / totalMeals) * 100)
          : 0,
      },
    };
  }

  /**
   * Get nutrition for a specific day in a meal plan
   */
  async getDailyNutrition(
    userId: string,
    mealPlanId: string,
    date: string,
  ): Promise<DailyNutritionSummary> {
    const summary = await this.getMealPlanNutrition(userId, mealPlanId);

    const dailySummary = summary.dailyBreakdown.find((d) => d.date === date);

    if (!dailySummary) {
      return {
        date,
        totals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        },
        meals: [],
        mealsWithNutrition: 0,
        mealsWithoutNutrition: 0,
      };
    }

    return dailySummary;
  }
}
