import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RecipeVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMealPlanDto,
  UpdateMealPlanDto,
  CreateMealPlanEntryDto,
  UpdateMealPlanEntryDto,
  MealPlanQueryDto,
  MealPlanResponse,
  MealPlanListResponse,
  MealPlanEntryResponse,
} from './dto/meal-plan.dto';

@Injectable()
export class MealPlanningService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateMealPlanDto): Promise<MealPlanResponse> {
    const mealPlan = await this.prisma.mealPlan.create({
      data: {
        userId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });

    return this.formatMealPlanResponse(mealPlan);
  }

  async findAll(userId: string, query: MealPlanQueryDto): Promise<MealPlanListResponse> {
    const where: Record<string, unknown> = { userId };

    if (query.startDate && query.endDate) {
      where.OR = [
        {
          startDate: { lte: new Date(query.endDate) },
          endDate: { gte: new Date(query.startDate) },
        },
      ];
    }

    const [mealPlans, total] = await Promise.all([
      this.prisma.mealPlan.findMany({
        where,
        orderBy: { startDate: 'desc' },
        include: {
          meals: {
            orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
          },
        },
      }),
      this.prisma.mealPlan.count({ where }),
    ]);

    return {
      data: mealPlans.map((mp) => this.formatMealPlanResponse(mp)),
      total,
    };
  }

  async findOne(userId: string, id: string): Promise<MealPlanResponse> {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id, userId },
      include: {
        meals: {
          orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
        },
      },
    });

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    // Fetch recipes for all meal entries
    const recipeIds = mealPlan.meals.map((m) => m.recipeId);
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        servings: true,
      },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    const mealsWithRecipes = mealPlan.meals.map((meal) => {
      const recipe = recipeMap.get(meal.recipeId);
      return {
        id: meal.id,
        recipeId: meal.recipeId,
        date: meal.date.toISOString().split('T')[0],
        mealType: meal.mealType,
        servings: meal.servings,
        notes: meal.notes || undefined,
        recipe: recipe ? {
          id: recipe.id,
          title: recipe.title,
          imageUrl: recipe.imageUrl ?? undefined,
          prepTimeMinutes: recipe.prepTimeMinutes ?? undefined,
          cookTimeMinutes: recipe.cookTimeMinutes ?? undefined,
          servings: recipe.servings,
        } : undefined,
      };
    });

    return {
      ...this.formatMealPlanResponse(mealPlan),
      meals: mealsWithRecipes,
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateMealPlanDto,
  ): Promise<MealPlanResponse> {
    const existing = await this.prisma.mealPlan.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Meal plan not found');
    }

    const mealPlan = await this.prisma.mealPlan.update({
      where: { id },
      data: {
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    return this.formatMealPlanResponse(mealPlan);
  }

  async delete(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.mealPlan.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Meal plan not found');
    }

    await this.prisma.mealPlan.delete({ where: { id } });
  }

  // Entry management
  async addEntry(
    userId: string,
    mealPlanId: string,
    dto: CreateMealPlanEntryDto,
  ): Promise<MealPlanEntryResponse> {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id: mealPlanId, userId },
    });

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    // Verify recipe exists and user has access
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id: dto.recipeId,
        OR: [{ userId }, { visibility: RecipeVisibility.PUBLIC }],
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        servings: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found or not accessible');
    }

    const entry = await this.prisma.mealPlanEntry.create({
      data: {
        mealPlanId,
        recipeId: dto.recipeId,
        date: new Date(dto.date),
        mealType: dto.mealType,
        servings: dto.servings || recipe.servings || 1,
        notes: dto.notes,
      },
    });

    return {
      id: entry.id,
      recipeId: entry.recipeId,
      date: entry.date.toISOString().split('T')[0],
      mealType: entry.mealType,
      servings: entry.servings,
      notes: entry.notes || undefined,
      recipe: {
        id: recipe.id,
        title: recipe.title,
        imageUrl: recipe.imageUrl ?? undefined,
        prepTimeMinutes: recipe.prepTimeMinutes ?? undefined,
        cookTimeMinutes: recipe.cookTimeMinutes ?? undefined,
        servings: recipe.servings,
      },
    };
  }

  async updateEntry(
    userId: string,
    mealPlanId: string,
    entryId: string,
    dto: UpdateMealPlanEntryDto,
  ): Promise<MealPlanEntryResponse> {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id: mealPlanId, userId },
    });

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    const existing = await this.prisma.mealPlanEntry.findFirst({
      where: { id: entryId, mealPlanId },
    });

    if (!existing) {
      throw new NotFoundException('Meal plan entry not found');
    }

    const entry = await this.prisma.mealPlanEntry.update({
      where: { id: entryId },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        mealType: dto.mealType,
        servings: dto.servings,
        notes: dto.notes,
      },
    });

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: entry.recipeId },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        servings: true,
      },
    });

    return {
      id: entry.id,
      recipeId: entry.recipeId,
      date: entry.date.toISOString().split('T')[0],
      mealType: entry.mealType,
      servings: entry.servings,
      notes: entry.notes || undefined,
      recipe: recipe ? {
        id: recipe.id,
        title: recipe.title,
        imageUrl: recipe.imageUrl ?? undefined,
        prepTimeMinutes: recipe.prepTimeMinutes ?? undefined,
        cookTimeMinutes: recipe.cookTimeMinutes ?? undefined,
        servings: recipe.servings,
      } : undefined,
    };
  }

  async deleteEntry(
    userId: string,
    mealPlanId: string,
    entryId: string,
  ): Promise<void> {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id: mealPlanId, userId },
    });

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    const existing = await this.prisma.mealPlanEntry.findFirst({
      where: { id: entryId, mealPlanId },
    });

    if (!existing) {
      throw new NotFoundException('Meal plan entry not found');
    }

    await this.prisma.mealPlanEntry.delete({ where: { id: entryId } });
  }

  async bulkAddEntries(
    userId: string,
    mealPlanId: string,
    entries: CreateMealPlanEntryDto[],
  ): Promise<MealPlanEntryResponse[]> {
    const results: MealPlanEntryResponse[] = [];
    for (const entry of entries) {
      const result = await this.addEntry(userId, mealPlanId, entry);
      results.push(result);
    }
    return results;
  }

  // Get meal plan for a specific week
  async getWeekPlan(
    userId: string,
    weekStart: string,
  ): Promise<MealPlanResponse | null> {
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: {
        userId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      include: {
        meals: {
          orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
        },
      },
    });

    if (!mealPlan) {
      return null;
    }

    // Fetch recipes
    const recipeIds = mealPlan.meals.map((m) => m.recipeId);
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        servings: true,
      },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    return {
      ...this.formatMealPlanResponse(mealPlan),
      meals: mealPlan.meals.map((meal) => {
        const recipe = recipeMap.get(meal.recipeId);
        return {
          id: meal.id,
          recipeId: meal.recipeId,
          date: meal.date.toISOString().split('T')[0],
          mealType: meal.mealType,
          servings: meal.servings,
          notes: meal.notes || undefined,
          recipe: recipe ? {
            id: recipe.id,
            title: recipe.title,
            imageUrl: recipe.imageUrl ?? undefined,
            prepTimeMinutes: recipe.prepTimeMinutes ?? undefined,
            cookTimeMinutes: recipe.cookTimeMinutes ?? undefined,
            servings: recipe.servings,
          } : undefined,
        };
      }),
    };
  }

  private formatMealPlanResponse(mealPlan: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }): MealPlanResponse {
    return {
      id: mealPlan.id,
      name: mealPlan.name,
      startDate: mealPlan.startDate.toISOString().split('T')[0],
      endDate: mealPlan.endDate.toISOString().split('T')[0],
      createdAt: mealPlan.createdAt,
      updatedAt: mealPlan.updatedAt,
    };
  }
}
