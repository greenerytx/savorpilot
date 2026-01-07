import { Injectable, NotFoundException } from '@nestjs/common';
import { RecipeVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateShoppingListDto,
  UpdateShoppingListDto,
  CreateShoppingListItemDto,
  UpdateShoppingListItemDto,
  GenerateFromRecipeDto,
  GenerateFromMealPlanDto,
  ShoppingListResponse,
  ShoppingListListResponse,
  ShoppingListItemResponse,
  GroupedShoppingListResponse,
  IngredientCategory,
} from './dto/shopping-list.dto';

interface RecipeComponent {
  name: string;
  ingredients: Array<{
    quantity?: number;
    unit?: string;
    name: string;
    notes?: string;
    optional?: boolean;
  }>;
  steps: Array<{
    order: number;
    instruction: string;
  }>;
}

@Injectable()
export class ShoppingService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateShoppingListDto): Promise<ShoppingListResponse> {
    const list = await this.prisma.shoppingList.create({
      data: {
        userId,
        name: dto.name,
      },
    });

    return this.formatShoppingListResponse(list);
  }

  async findAll(userId: string): Promise<ShoppingListListResponse> {
    const [lists, total] = await Promise.all([
      this.prisma.shoppingList.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.shoppingList.count({ where: { userId } }),
    ]);

    return {
      data: lists.map((list) => ({
        ...this.formatShoppingListResponse(list),
        itemCount: list.items.length,
        checkedCount: list.items.filter((i) => i.isChecked).length,
      })),
      total,
    };
  }

  async findOne(userId: string, id: string): Promise<GroupedShoppingListResponse> {
    const list = await this.prisma.shoppingList.findFirst({
      where: { id, userId },
      include: {
        items: {
          orderBy: [{ category: 'asc' }, { ingredient: 'asc' }],
        },
      },
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    // Get recipe titles for items with recipeId
    const recipeIds = list.items
      .filter((i) => i.recipeId)
      .map((i) => i.recipeId as string);

    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: { id: true, title: true },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    const items: ShoppingListItemResponse[] = list.items.map((item) => ({
      id: item.id,
      ingredient: item.ingredient,
      quantity: item.quantity || undefined,
      unit: item.unit || undefined,
      category: item.category || undefined,
      isChecked: item.isChecked,
      recipeId: item.recipeId || undefined,
      recipe: item.recipeId ? recipeMap.get(item.recipeId) : undefined,
    }));

    // Group items by category
    const groupedItems: Record<string, ShoppingListItemResponse[]> = {};
    for (const item of items) {
      const category = item.category || 'other';
      if (!groupedItems[category]) {
        groupedItems[category] = [];
      }
      groupedItems[category].push(item);
    }

    return {
      ...this.formatShoppingListResponse(list),
      items,
      itemCount: items.length,
      checkedCount: items.filter((i) => i.isChecked).length,
      groupedItems,
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateShoppingListDto,
  ): Promise<ShoppingListResponse> {
    const existing = await this.prisma.shoppingList.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Shopping list not found');
    }

    const list = await this.prisma.shoppingList.update({
      where: { id },
      data: { name: dto.name },
    });

    return this.formatShoppingListResponse(list);
  }

  async delete(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.shoppingList.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Shopping list not found');
    }

    await this.prisma.shoppingList.delete({ where: { id } });
  }

  // Item operations
  async addItem(
    userId: string,
    listId: string,
    dto: CreateShoppingListItemDto,
  ): Promise<ShoppingListItemResponse> {
    const list = await this.prisma.shoppingList.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    const category = dto.category || this.guessCategory(dto.ingredient);

    const item = await this.prisma.shoppingListItem.create({
      data: {
        shoppingListId: listId,
        ingredient: dto.ingredient,
        quantity: dto.quantity,
        unit: dto.unit,
        category,
        recipeId: dto.recipeId,
      },
    });

    return {
      id: item.id,
      ingredient: item.ingredient,
      quantity: item.quantity || undefined,
      unit: item.unit || undefined,
      category: item.category || undefined,
      isChecked: item.isChecked,
      recipeId: item.recipeId || undefined,
    };
  }

  async updateItem(
    userId: string,
    listId: string,
    itemId: string,
    dto: UpdateShoppingListItemDto,
  ): Promise<ShoppingListItemResponse> {
    const list = await this.prisma.shoppingList.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    const existing = await this.prisma.shoppingListItem.findFirst({
      where: { id: itemId, shoppingListId: listId },
    });

    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    const item = await this.prisma.shoppingListItem.update({
      where: { id: itemId },
      data: {
        ingredient: dto.ingredient,
        quantity: dto.quantity,
        unit: dto.unit,
        category: dto.category,
        isChecked: dto.isChecked,
      },
    });

    return {
      id: item.id,
      ingredient: item.ingredient,
      quantity: item.quantity || undefined,
      unit: item.unit || undefined,
      category: item.category || undefined,
      isChecked: item.isChecked,
      recipeId: item.recipeId || undefined,
    };
  }

  async toggleItem(
    userId: string,
    listId: string,
    itemId: string,
  ): Promise<ShoppingListItemResponse> {
    const list = await this.prisma.shoppingList.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    const existing = await this.prisma.shoppingListItem.findFirst({
      where: { id: itemId, shoppingListId: listId },
    });

    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    const item = await this.prisma.shoppingListItem.update({
      where: { id: itemId },
      data: { isChecked: !existing.isChecked },
    });

    return {
      id: item.id,
      ingredient: item.ingredient,
      quantity: item.quantity || undefined,
      unit: item.unit || undefined,
      category: item.category || undefined,
      isChecked: item.isChecked,
      recipeId: item.recipeId || undefined,
    };
  }

  async deleteItem(userId: string, listId: string, itemId: string): Promise<void> {
    const list = await this.prisma.shoppingList.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    const existing = await this.prisma.shoppingListItem.findFirst({
      where: { id: itemId, shoppingListId: listId },
    });

    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    await this.prisma.shoppingListItem.delete({ where: { id: itemId } });
  }

  async bulkAddItems(
    userId: string,
    listId: string,
    items: CreateShoppingListItemDto[],
  ): Promise<ShoppingListItemResponse[]> {
    const results: ShoppingListItemResponse[] = [];
    for (const item of items) {
      const result = await this.addItem(userId, listId, item);
      results.push(result);
    }
    return results;
  }

  // Generate from recipe
  async generateFromRecipe(
    userId: string,
    dto: GenerateFromRecipeDto,
  ): Promise<GroupedShoppingListResponse> {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id: dto.recipeId,
        OR: [{ userId }, { visibility: RecipeVisibility.PUBLIC }],
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const scaleFactor = dto.servings ? dto.servings / recipe.servings : 1;

    // Create shopping list
    const list = await this.prisma.shoppingList.create({
      data: {
        userId,
        name: dto.name || `Shopping List - ${recipe.title}`,
      },
    });

    // Extract ingredients from recipe components
    const components = recipe.components as unknown as RecipeComponent[];
    const items: CreateShoppingListItemDto[] = [];

    for (const component of components) {
      for (const ing of component.ingredients) {
        if (!ing.optional) {
          items.push({
            ingredient: ing.name,
            quantity: ing.quantity ? ing.quantity * scaleFactor : undefined,
            unit: ing.unit,
            category: this.guessCategory(ing.name),
            recipeId: recipe.id,
          });
        }
      }
    }

    // Add items to list
    await this.bulkAddItems(userId, list.id, items);

    return this.findOne(userId, list.id);
  }

  // Generate from meal plan
  async generateFromMealPlan(
    userId: string,
    dto: GenerateFromMealPlanDto,
  ): Promise<GroupedShoppingListResponse> {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id: dto.mealPlanId, userId },
      include: {
        meals: true,
      },
    });

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    // Filter by date range if provided
    let meals = mealPlan.meals;
    if (dto.startDate) {
      const start = new Date(dto.startDate);
      meals = meals.filter((m) => m.date >= start);
    }
    if (dto.endDate) {
      const end = new Date(dto.endDate);
      meals = meals.filter((m) => m.date <= end);
    }

    // Get all recipes
    const recipeIds = [...new Set(meals.map((m) => m.recipeId))];
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    // Create shopping list
    const list = await this.prisma.shoppingList.create({
      data: {
        userId,
        name: dto.name || `Shopping List - ${mealPlan.name}`,
      },
    });

    // Aggregate ingredients with scaling
    const ingredientMap = new Map<
      string,
      { quantity: number; unit: string; category: string; recipeId: string }
    >();

    for (const meal of meals) {
      const recipe = recipeMap.get(meal.recipeId);
      if (!recipe) continue;

      const scaleFactor = meal.servings / recipe.servings;
      const components = recipe.components as unknown as RecipeComponent[];

      for (const component of components) {
        for (const ing of component.ingredients) {
          if (ing.optional) continue;

          const key = `${ing.name.toLowerCase()}-${ing.unit || ''}`;
          const existing = ingredientMap.get(key);

          if (existing && ing.quantity) {
            existing.quantity += ing.quantity * scaleFactor;
          } else {
            ingredientMap.set(key, {
              quantity: ing.quantity ? ing.quantity * scaleFactor : 0,
              unit: ing.unit || '',
              category: this.guessCategory(ing.name),
              recipeId: recipe.id,
            });
          }
        }
      }
    }

    // Create items
    const items: CreateShoppingListItemDto[] = [];
    for (const [key, value] of ingredientMap) {
      const ingredientName = key.split('-')[0];
      items.push({
        ingredient: ingredientName,
        quantity: value.quantity || undefined,
        unit: value.unit || undefined,
        category: value.category,
        recipeId: value.recipeId,
      });
    }

    await this.bulkAddItems(userId, list.id, items);

    return this.findOne(userId, list.id);
  }

  // Clear checked items
  async clearChecked(userId: string, listId: string): Promise<void> {
    const list = await this.prisma.shoppingList.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    await this.prisma.shoppingListItem.deleteMany({
      where: { shoppingListId: listId, isChecked: true },
    });
  }

  // Guess ingredient category based on name
  private guessCategory(ingredientName: string): string {
    const name = ingredientName.toLowerCase();

    // Produce
    const produce = [
      'lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'celery', 'pepper',
      'potato', 'spinach', 'kale', 'broccoli', 'cucumber', 'zucchini',
      'squash', 'mushroom', 'cabbage', 'corn', 'pea', 'bean', 'lemon',
      'lime', 'orange', 'apple', 'banana', 'berry', 'avocado', 'herb',
      'basil', 'cilantro', 'parsley', 'mint', 'ginger', 'scallion',
    ];
    if (produce.some((p) => name.includes(p))) return IngredientCategory.PRODUCE;

    // Dairy
    const dairy = [
      'milk', 'cream', 'butter', 'cheese', 'yogurt', 'sour cream',
      'cottage', 'ricotta', 'mozzarella', 'cheddar', 'parmesan',
    ];
    if (dairy.some((d) => name.includes(d))) return IngredientCategory.DAIRY;

    // Meat
    const meat = [
      'beef', 'steak', 'chicken', 'pork', 'bacon', 'sausage', 'ham',
      'turkey', 'lamb', 'ground', 'ribs', 'roast', 'tenderloin',
    ];
    if (meat.some((m) => name.includes(m))) return IngredientCategory.MEAT;

    // Seafood
    const seafood = [
      'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'cod',
      'tilapia', 'halibut', 'scallop', 'mussel', 'clam', 'oyster',
    ];
    if (seafood.some((s) => name.includes(s))) return IngredientCategory.SEAFOOD;

    // Bakery
    const bakery = ['bread', 'roll', 'bun', 'bagel', 'croissant', 'tortilla'];
    if (bakery.some((b) => name.includes(b))) return IngredientCategory.BAKERY;

    // Spices
    const spices = [
      'salt', 'pepper', 'cumin', 'paprika', 'oregano', 'thyme',
      'rosemary', 'cinnamon', 'nutmeg', 'cayenne', 'turmeric', 'spice',
    ];
    if (spices.some((s) => name.includes(s))) return IngredientCategory.SPICES;

    // Condiments
    const condiments = [
      'sauce', 'ketchup', 'mustard', 'mayo', 'vinegar', 'oil',
      'dressing', 'soy', 'worcestershire', 'hot sauce',
    ];
    if (condiments.some((c) => name.includes(c))) return IngredientCategory.CONDIMENTS;

    // Pantry
    const pantry = [
      'flour', 'sugar', 'rice', 'pasta', 'noodle', 'can', 'stock',
      'broth', 'bean', 'lentil', 'oat', 'cereal', 'honey', 'syrup',
    ];
    if (pantry.some((p) => name.includes(p))) return IngredientCategory.PANTRY;

    return IngredientCategory.OTHER;
  }

  private formatShoppingListResponse(list: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }): ShoppingListResponse {
    return {
      id: list.id,
      name: list.name,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }
}
