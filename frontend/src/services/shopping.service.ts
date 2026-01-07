import { api } from './api';
import {
  normalizeUnit,
  toBaseUnits,
  fromBaseUnits,
  formatQuantity,
  type UnitSystem,
} from '../utils/unitConversion';

export enum IngredientCategory {
  PRODUCE = 'produce',
  DAIRY = 'dairy',
  MEAT = 'meat',
  SEAFOOD = 'seafood',
  BAKERY = 'bakery',
  FROZEN = 'frozen',
  PANTRY = 'pantry',
  SPICES = 'spices',
  CONDIMENTS = 'condiments',
  BEVERAGES = 'beverages',
  OTHER = 'other',
}

export interface ShoppingListItem {
  id: string;
  ingredient: string;
  quantity?: number;
  unit?: string;
  category?: string;
  isChecked: boolean;
  recipeId?: string;
  recipe?: {
    id: string;
    title: string;
  };
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items?: ShoppingListItem[];
  itemCount?: number;
  checkedCount?: number;
  groupedItems?: Record<string, ShoppingListItem[]>;
}

export interface ShoppingListListResponse {
  data: ShoppingList[];
  total: number;
}

export interface CreateShoppingListDto {
  name: string;
}

export interface CreateShoppingListItemDto {
  ingredient: string;
  quantity?: number;
  unit?: string;
  category?: string;
  recipeId?: string;
}

export interface UpdateShoppingListItemDto {
  ingredient?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  isChecked?: boolean;
}

export interface GenerateFromRecipeDto {
  recipeId: string;
  servings?: number;
  name?: string;
}

export interface GenerateFromMealPlanDto {
  mealPlanId: string;
  name?: string;
  startDate?: string;
  endDate?: string;
}

class ShoppingService {
  async getShoppingLists(): Promise<ShoppingListListResponse> {
    const response = await api.get('/shopping-lists');
    return response.data;
  }

  async getShoppingList(id: string): Promise<ShoppingList> {
    const response = await api.get(`/shopping-lists/${id}`);
    return response.data;
  }

  async createShoppingList(dto: CreateShoppingListDto): Promise<ShoppingList> {
    const response = await api.post('/shopping-lists', dto);
    return response.data;
  }

  async updateShoppingList(id: string, dto: CreateShoppingListDto): Promise<ShoppingList> {
    const response = await api.put(`/shopping-lists/${id}`, dto);
    return response.data;
  }

  async deleteShoppingList(id: string): Promise<void> {
    await api.delete(`/shopping-lists/${id}`);
  }

  async addItem(listId: string, dto: CreateShoppingListItemDto): Promise<ShoppingListItem> {
    const response = await api.post(`/shopping-lists/${listId}/items`, dto);
    return response.data;
  }

  async updateItem(
    listId: string,
    itemId: string,
    dto: UpdateShoppingListItemDto,
  ): Promise<ShoppingListItem> {
    const response = await api.put(`/shopping-lists/${listId}/items/${itemId}`, dto);
    return response.data;
  }

  async toggleItem(listId: string, itemId: string): Promise<ShoppingListItem> {
    const response = await api.patch(`/shopping-lists/${listId}/items/${itemId}/toggle`);
    return response.data;
  }

  async deleteItem(listId: string, itemId: string): Promise<void> {
    await api.delete(`/shopping-lists/${listId}/items/${itemId}`);
  }

  async clearChecked(listId: string): Promise<void> {
    await api.delete(`/shopping-lists/${listId}/items/checked`);
  }

  async generateFromRecipe(dto: GenerateFromRecipeDto): Promise<ShoppingList> {
    const response = await api.post('/shopping-lists/generate/from-recipe', dto);
    return response.data;
  }

  async generateFromMealPlan(dto: GenerateFromMealPlanDto): Promise<ShoppingList> {
    const response = await api.post('/shopping-lists/generate/from-meal-plan', dto);
    return response.data;
  }
}

export const shoppingService = new ShoppingService();

// Utility functions
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    produce: 'Produce',
    dairy: 'Dairy',
    meat: 'Meat',
    seafood: 'Seafood',
    bakery: 'Bakery',
    frozen: 'Frozen',
    pantry: 'Pantry',
    spices: 'Spices',
    condiments: 'Condiments',
    beverages: 'Beverages',
    other: 'Other',
  };
  return labels[category] || category;
}

export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    produce: '🥬',
    dairy: '🧀',
    meat: '🥩',
    seafood: '🐟',
    bakery: '🍞',
    frozen: '🧊',
    pantry: '🥫',
    spices: '🌶️',
    condiments: '🍯',
    beverages: '🥤',
    other: '📦',
  };
  return emojis[category] || '📦';
}

export function getCategoryOrder(): string[] {
  return [
    'produce',
    'dairy',
    'meat',
    'seafood',
    'bakery',
    'pantry',
    'spices',
    'condiments',
    'frozen',
    'beverages',
    'other',
  ];
}

// ==================== UNIT CONVERSION AGGREGATION ====================

export interface OriginalItemInfo {
  quantity: number;
  unit: string;
  recipeTitle?: string;
}

export interface AggregatedShoppingItem extends ShoppingListItem {
  originalItems?: OriginalItemInfo[];
  displayQuantity?: string;
  displayUnit?: string;
}

/**
 * Aggregate shopping items by ingredient name, combining convertible units.
 * Non-convertible units are kept separate.
 */
export function aggregateShoppingItems(
  items: ShoppingListItem[],
  targetSystem: UnitSystem | 'original'
): AggregatedShoppingItem[] {
  if (targetSystem === 'original') {
    // No aggregation, just return items with display values
    return items.map((item) => ({
      ...item,
      displayQuantity: item.quantity ? formatQuantity(item.quantity) : undefined,
      displayUnit: item.unit,
    }));
  }

  // Group items by normalized ingredient name
  const groups = new Map<string, ShoppingListItem[]>();

  for (const item of items) {
    const key = item.ingredient.toLowerCase().trim();
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: AggregatedShoppingItem[] = [];

  for (const [, groupItems] of groups) {
    // Separate convertible and non-convertible items
    const convertible: { item: ShoppingListItem; base: { value: number; category: 'volume' | 'weight' } }[] = [];
    const nonConvertible: ShoppingListItem[] = [];

    for (const item of groupItems) {
      if (item.quantity && item.unit) {
        const base = toBaseUnits(item.quantity, item.unit);
        if (base) {
          convertible.push({ item, base });
        } else {
          nonConvertible.push(item);
        }
      } else {
        nonConvertible.push(item);
      }
    }

    // Aggregate convertible items by category (volume/weight)
    const volumeItems = convertible.filter((c) => c.base.category === 'volume');
    const weightItems = convertible.filter((c) => c.base.category === 'weight');

    // Aggregate volume items
    if (volumeItems.length > 0) {
      const totalBase = volumeItems.reduce((sum, c) => sum + c.base.value, 0);
      const converted = fromBaseUnits(totalBase, 'volume', targetSystem);
      const originalItems: OriginalItemInfo[] = volumeItems.map((c) => ({
        quantity: c.item.quantity!,
        unit: c.item.unit!,
        recipeTitle: c.item.recipe?.title,
      }));

      result.push({
        ...volumeItems[0].item,
        quantity: converted.quantity,
        unit: converted.unit,
        displayQuantity: formatQuantity(converted.quantity),
        displayUnit: converted.unit,
        originalItems,
        isChecked: volumeItems.every((c) => c.item.isChecked),
      });
    }

    // Aggregate weight items
    if (weightItems.length > 0) {
      const totalBase = weightItems.reduce((sum, c) => sum + c.base.value, 0);
      const converted = fromBaseUnits(totalBase, 'weight', targetSystem);
      const originalItems: OriginalItemInfo[] = weightItems.map((c) => ({
        quantity: c.item.quantity!,
        unit: c.item.unit!,
        recipeTitle: c.item.recipe?.title,
      }));

      result.push({
        ...weightItems[0].item,
        quantity: converted.quantity,
        unit: converted.unit,
        displayQuantity: formatQuantity(converted.quantity),
        displayUnit: converted.unit,
        originalItems,
        isChecked: weightItems.every((c) => c.item.isChecked),
      });
    }

    // Add non-convertible items as-is
    for (const item of nonConvertible) {
      result.push({
        ...item,
        displayQuantity: item.quantity ? formatQuantity(item.quantity) : undefined,
        displayUnit: item.unit,
      });
    }
  }

  return result;
}
