import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecipeVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AllergenMappingService } from '../recipes/allergen-mapping.service';
import {
  GenerateMealPlanRequestDto,
  GenerateMealPlanResponseDto,
  ApplyGeneratedPlanDto,
  RegenerateMealDto,
  GeneratedMealEntryDto,
  DailyPlanSummaryDto,
  MealType,
} from './dto/generate-meal-plan.dto';
import { MealPlanResponse } from './dto/meal-plan.dto';
import { MealPlanningService } from './meal-planning.service';

interface RecipeSummary {
  id: string;
  title: string;
  cuisine: string | null;
  category: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  prepTime: number | null;
  cookTime: number | null;
  imageUrl: string | null;
  servings: number;
}

@Injectable()
export class AiMealPlanService {
  private readonly logger = new Logger(AiMealPlanService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly model = 'gpt-4o-mini';

  // In-memory cache for preview plans (expires after 1 hour)
  private previewCache = new Map<string, GenerateMealPlanResponseDto>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly allergenMapping: AllergenMappingService,
    private readonly mealPlanningService: MealPlanningService,
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('OpenAI API key not configured');
    }
  }

  /**
   * Generate a meal plan using AI
   */
  async generateMealPlan(
    userId: string,
    dto: GenerateMealPlanRequestDto,
  ): Promise<GenerateMealPlanResponseDto> {
    this.logger.log(`Generating meal plan for user ${userId}`);

    const durationDays = dto.durationDays || 7;
    const mealTypes = dto.mealTypes || [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];

    // 1. Fetch user's recipes with nutrition data
    const userRecipes = await this.fetchUserRecipes(userId, dto);
    this.logger.log(`Found ${userRecipes.length} recipes in user library`);

    // 2. Apply circle dietary filters if requested
    let filteredRecipes = userRecipes;
    if (dto.useCircleRestrictions && dto.circleId) {
      filteredRecipes = await this.filterByCircleRestrictions(userId, dto.circleId, userRecipes);
      this.logger.log(`Filtered to ${filteredRecipes.length} compatible recipes`);
    }

    // 3. Build recipe summary for AI
    const recipeSummary: RecipeSummary[] = filteredRecipes.map((r) => ({
      id: r.id,
      title: r.title,
      cuisine: r.cuisine,
      category: r.category,
      calories: r.nutrition?.caloriesPerServing || null,
      protein: r.nutrition?.proteinGrams || null,
      carbs: r.nutrition?.carbsGrams || null,
      fat: r.nutrition?.fatGrams || null,
      prepTime: r.prepTimeMinutes,
      cookTime: r.cookTimeMinutes,
      imageUrl: r.imageUrl,
      servings: r.servings || 4,
    }));

    // 4. Generate plan with AI
    const aiPlan = await this.generateWithAI(dto, recipeSummary, durationDays, mealTypes);

    // 5. Enrich with totals and calculate deviations
    const enrichedPlan = this.enrichPlanWithTotals(aiPlan, dto, durationDays, recipeSummary);

    // 6. Generate preview ID and cache
    const previewId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    enrichedPlan.planId = previewId;

    this.previewCache.set(previewId, enrichedPlan);

    // Expire after 1 hour
    setTimeout(() => {
      this.previewCache.delete(previewId);
      this.logger.log(`Preview ${previewId} expired and removed from cache`);
    }, 60 * 60 * 1000);

    this.logger.log(`Generated meal plan preview ${previewId}`);
    return enrichedPlan;
  }

  /**
   * Apply a generated plan to the actual meal planner
   */
  async applyGeneratedPlan(
    userId: string,
    dto: ApplyGeneratedPlanDto,
  ): Promise<MealPlanResponse> {
    const preview = this.previewCache.get(dto.previewPlanId);
    if (!preview) {
      throw new NotFoundException('Preview expired or not found. Please generate a new plan.');
    }

    // Create or get meal plan
    let mealPlanId = dto.mealPlanId;
    if (!mealPlanId) {
      const newPlan = await this.mealPlanningService.create(userId, {
        name: dto.mealPlanName || `AI Generated Plan - ${preview.startDate}`,
        startDate: preview.startDate,
        endDate: preview.endDate,
        circleId: dto.circleId,
      });
      mealPlanId = newPlan.id;
    }

    // Convert to bulk entries (only existing recipes with recipeId)
    const entries = preview.dailyPlans
      .flatMap((day) => day.meals)
      .filter((meal) => meal.isExisting && meal.recipeId)
      .map((meal) => ({
        recipeId: meal.recipeId!,
        date: meal.date,
        mealType: meal.mealType,
        servings: meal.servings,
      }));

    if (entries.length > 0) {
      await this.mealPlanningService.bulkAddEntries(userId, mealPlanId, entries);
    }

    // Remove from cache
    this.previewCache.delete(dto.previewPlanId);

    this.logger.log(`Applied ${entries.length} entries to meal plan ${mealPlanId}`);

    // Return the full meal plan
    return this.mealPlanningService.findOne(userId, mealPlanId);
  }

  /**
   * Regenerate a single meal in the preview
   */
  async regenerateMeal(
    userId: string,
    dto: RegenerateMealDto,
  ): Promise<GeneratedMealEntryDto> {
    const preview = this.previewCache.get(dto.previewPlanId);
    if (!preview) {
      throw new NotFoundException('Preview expired or not found.');
    }

    // Find the day
    const dayPlan = preview.dailyPlans.find((d) => d.date === dto.date);
    if (!dayPlan) {
      throw new NotFoundException('Day not found in preview.');
    }

    // Fetch user recipes excluding specified ones
    const userRecipes = await this.prisma.recipe.findMany({
      where: {
        userId,
        id: { notIn: dto.excludeRecipeIds || [] },
      },
      include: { nutrition: true },
      take: 50,
    });

    // Find a suitable replacement
    const recipeSummary = userRecipes.map((r) => ({
      id: r.id,
      title: r.title,
      cuisine: r.cuisine,
      category: r.category,
      calories: r.nutrition?.caloriesPerServing || null,
      protein: r.nutrition?.proteinGrams || null,
      carbs: r.nutrition?.carbsGrams || null,
      fat: r.nutrition?.fatGrams || null,
      prepTime: r.prepTimeMinutes,
      cookTime: r.cookTimeMinutes,
      imageUrl: r.imageUrl,
      servings: r.servings || 4,
    }));

    // Pick a random suitable recipe or generate AI suggestion
    const suitable = recipeSummary.filter((r) => {
      if (dto.mealType === MealType.BREAKFAST) {
        return r.category === 'BREAKFAST' || r.category === 'BRUNCH';
      }
      return true;
    });

    const newMeal: GeneratedMealEntryDto = suitable.length > 0
      ? {
          recipeId: suitable[0].id,
          recipeTitle: suitable[0].title,
          date: dto.date,
          mealType: dto.mealType,
          servings: preview.dailyPlans[0]?.meals[0]?.servings || 4,
          isExisting: true,
          hasNutritionData: suitable[0].calories !== null,
          estimatedCalories: suitable[0].calories || undefined,
          estimatedProtein: suitable[0].protein || undefined,
          estimatedCarbs: suitable[0].carbs || undefined,
          estimatedFat: suitable[0].fat || undefined,
          imageUrl: suitable[0].imageUrl || undefined,
        }
      : {
          recipeTitle: 'Custom Meal',
          date: dto.date,
          mealType: dto.mealType,
          servings: 4,
          isExisting: false,
          hasNutritionData: false,
          suggestedRecipe: {
            title: 'Simple Homemade Meal',
            description: 'A quick and easy meal to prepare',
            ingredients: ['Choose your ingredients'],
            briefInstructions: 'Prepare according to your preferences',
          },
        };

    // Update the preview cache
    const mealIndex = dayPlan.meals.findIndex((m) => m.mealType === dto.mealType);
    if (mealIndex >= 0) {
      dayPlan.meals[mealIndex] = newMeal;
    } else {
      dayPlan.meals.push(newMeal);
    }

    // Recalculate day totals
    dayPlan.totals = this.calculateDayTotals(dayPlan.meals);

    return newMeal;
  }

  /**
   * Fetch user's recipes with nutrition data
   */
  private async fetchUserRecipes(userId: string, dto: GenerateMealPlanRequestDto) {
    return this.prisma.recipe.findMany({
      where: {
        OR: [
          { userId },
          { visibility: RecipeVisibility.PUBLIC },
        ],
        ...(dto.cuisines?.length ? { cuisine: { in: dto.cuisines } } : {}),
      },
      include: {
        nutrition: true,
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: 100,
    });
  }

  /**
   * Filter recipes by circle dietary restrictions
   */
  private async filterByCircleRestrictions(
    userId: string,
    circleId: string,
    recipes: any[],
  ): Promise<any[]> {
    const circle = await this.prisma.dinnerCircle.findFirst({
      where: {
        id: circleId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: { members: true },
    });

    if (!circle) return recipes;

    const allAllergens = circle.members.flatMap((m) => m.allergens);
    const allRestrictions = circle.members.flatMap((m) => m.restrictions);

    if (allAllergens.length === 0 && allRestrictions.length === 0) {
      return recipes;
    }

    return recipes.filter((recipe) => {
      const components = recipe.components as any[];
      if (!components) return true;

      const allergenConflicts = this.allergenMapping.checkRecipeForAllergens(components, allAllergens);
      const restrictionConflicts = this.allergenMapping.checkRecipeForRestrictions(components, allRestrictions);

      return allergenConflicts.length === 0 && restrictionConflicts.length === 0;
    });
  }

  /**
   * Generate meal plan with AI
   */
  private async generateWithAI(
    dto: GenerateMealPlanRequestDto,
    recipes: RecipeSummary[],
    durationDays: number,
    mealTypes: MealType[],
  ): Promise<{ dailyPlans: any[] }> {
    // Build start and end dates
    const startDate = new Date(dto.startDate);
    const dates: string[] = [];
    for (let i = 0; i < durationDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const recipesWithNutrition = recipes.filter((r) => r.calories !== null);
    const recipesForAI = recipesWithNutrition.length > 0 ? recipesWithNutrition : recipes;

    const systemPrompt = `You are a professional meal planner creating personalized weekly meal plans.

AVAILABLE RECIPES FROM USER'S LIBRARY (${recipesForAI.length} recipes):
${JSON.stringify(recipesForAI.slice(0, 50), null, 2)}

RULES:
1. PRIORITIZE existing recipes from the library above, especially those with nutrition data
2. Use recipe IDs from the library when selecting existing recipes
3. Ensure variety - don't repeat the same recipe within 3 days
4. Balance nutrition across the day to meet daily targets
5. Consider prep/cook time for weekday vs weekend meals
6. Match recipe categories to meal types (breakfast recipes for breakfast, etc.)
7. Only suggest NEW recipes if no existing recipe fits the nutritional needs

MEAL TYPE MAPPING:
- breakfast: BREAKFAST, BRUNCH categories
- lunch: LUNCH, SALAD, SOUP, MAIN_COURSE categories
- dinner: DINNER, MAIN_COURSE categories
- snack: SNACK, DESSERT, APPETIZER categories

TARGET NUTRITION (per day):
- Calories: ${dto.targetCalories || 2000}
${dto.macroTargets?.protein ? `- Protein: ${dto.macroTargets.protein}g` : ''}
${dto.macroTargets?.carbs ? `- Carbs: ${dto.macroTargets.carbs}g` : ''}
${dto.macroTargets?.fat ? `- Fat: ${dto.macroTargets.fat}g` : ''}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "dailyPlans": [
    {
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "recipeId": "uuid from library or null if suggesting new",
          "recipeTitle": "Recipe Title",
          "mealType": "breakfast|lunch|dinner|snack",
          "servings": ${dto.servingsPerMeal || 4},
          "isExisting": true/false,
          "hasNutritionData": true/false,
          "estimatedCalories": number,
          "estimatedProtein": number,
          "estimatedCarbs": number,
          "estimatedFat": number,
          "suggestedRecipe": null or { "title": "", "description": "", "ingredients": [], "briefInstructions": "" }
        }
      ]
    }
  ],
  "warnings": ["Any notes about meeting targets"]
}`;

    const userPrompt = `Create a ${durationDays}-day meal plan starting ${dto.startDate}.

Include these meals each day: ${mealTypes.join(', ')}
Servings per meal: ${dto.servingsPerMeal || 4}
${dto.cuisines?.length ? `Preferred cuisines: ${dto.cuisines.join(', ')}` : ''}

Dates to plan:
${dates.map((d) => `- ${d} (${new Date(d).toLocaleDateString('en-US', { weekday: 'long' })})`).join('\n')}`;

    const response = await this.callOpenAI(systemPrompt, userPrompt);

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log('Successfully parsed AI meal plan response');

      // Enrich with imageUrl from recipes
      const recipeMap = new Map(recipes.map((r) => [r.id, r]));
      for (const day of parsed.dailyPlans) {
        for (const meal of day.meals) {
          if (meal.recipeId && recipeMap.has(meal.recipeId)) {
            const recipe = recipeMap.get(meal.recipeId)!;
            meal.imageUrl = recipe.imageUrl;
          }
        }
      }

      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse AI response, generating fallback plan');
      return this.generateFallbackPlan(recipes, dates, mealTypes, dto.servingsPerMeal || 4);
    }
  }

  /**
   * Generate a fallback plan if AI fails
   */
  private generateFallbackPlan(
    recipes: RecipeSummary[],
    dates: string[],
    mealTypes: MealType[],
    servings: number,
  ): { dailyPlans: any[] } {
    const dailyPlans = dates.map((date) => ({
      date,
      meals: mealTypes.map((mealType, idx) => {
        const recipe = recipes[idx % recipes.length];
        return recipe
          ? {
              recipeId: recipe.id,
              recipeTitle: recipe.title,
              mealType,
              servings,
              isExisting: true,
              hasNutritionData: recipe.calories !== null,
              estimatedCalories: recipe.calories,
              estimatedProtein: recipe.protein,
              estimatedCarbs: recipe.carbs,
              estimatedFat: recipe.fat,
              imageUrl: recipe.imageUrl,
            }
          : {
              recipeTitle: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meal`,
              mealType,
              servings,
              isExisting: false,
              hasNutritionData: false,
              suggestedRecipe: {
                title: 'Simple Homemade Meal',
                description: 'Prepare a quick meal',
                ingredients: ['Your choice'],
                briefInstructions: 'Cook as preferred',
              },
            };
      }),
    }));

    return { dailyPlans };
  }

  /**
   * Enrich plan with calculated totals
   */
  private enrichPlanWithTotals(
    aiPlan: { dailyPlans: any[]; warnings?: string[] },
    dto: GenerateMealPlanRequestDto,
    durationDays: number,
    recipes: RecipeSummary[],
  ): GenerateMealPlanResponseDto {
    const endDate = new Date(dto.startDate);
    endDate.setDate(endDate.getDate() + durationDays - 1);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let existingRecipesUsed = 0;
    let newRecipesSuggested = 0;
    let recipesWithNutrition = 0;
    const cuisineCount: Record<string, number> = {};

    const dailyPlans: DailyPlanSummaryDto[] = aiPlan.dailyPlans.map((day) => {
      const dayTotals = this.calculateDayTotals(day.meals);
      totalCalories += dayTotals.calories;
      totalProtein += dayTotals.protein;
      totalCarbs += dayTotals.carbs;
      totalFat += dayTotals.fat;

      for (const meal of day.meals) {
        if (meal.isExisting) {
          existingRecipesUsed++;
          const recipe = recipes.find((r) => r.id === meal.recipeId);
          if (recipe?.cuisine) {
            cuisineCount[recipe.cuisine] = (cuisineCount[recipe.cuisine] || 0) + 1;
          }
        } else {
          newRecipesSuggested++;
        }
        if (meal.hasNutritionData) {
          recipesWithNutrition++;
        }
      }

      const targetDeviation = {
        caloriesDiff: dayTotals.calories - (dto.targetCalories || 2000),
        proteinDiff: dto.macroTargets?.protein
          ? dayTotals.protein - dto.macroTargets.protein
          : undefined,
        carbsDiff: dto.macroTargets?.carbs
          ? dayTotals.carbs - dto.macroTargets.carbs
          : undefined,
        fatDiff: dto.macroTargets?.fat
          ? dayTotals.fat - dto.macroTargets.fat
          : undefined,
      };

      return {
        date: day.date,
        dayOfWeek: new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }),
        meals: day.meals,
        totals: dayTotals,
        targetDeviation,
      };
    });

    const daysWithData = dailyPlans.length || 1;

    return {
      planId: '', // Will be set later
      startDate: dto.startDate,
      endDate: endDate.toISOString().split('T')[0],
      durationDays,
      dailyPlans,
      weeklyTotals: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
      },
      weeklyAverages: {
        caloriesPerDay: Math.round(totalCalories / daysWithData),
        proteinPerDay: Math.round(totalProtein / daysWithData),
        carbsPerDay: Math.round(totalCarbs / daysWithData),
        fatPerDay: Math.round(totalFat / daysWithData),
      },
      statistics: {
        existingRecipesUsed,
        newRecipesSuggested,
        recipesWithNutrition,
        cuisineBreakdown: cuisineCount,
      },
      warnings: aiPlan.warnings || [],
    };
  }

  /**
   * Calculate daily nutrition totals
   */
  private calculateDayTotals(meals: GeneratedMealEntryDto[]) {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.estimatedCalories || 0),
        protein: acc.protein + (meal.estimatedProtein || 0),
        carbs: acc.carbs + (meal.estimatedCarbs || 0),
        fat: acc.fat + (meal.estimatedFat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenAI API error: ${response.status} - ${error}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}
