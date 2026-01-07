// Smart Collection Types

export interface FilterRules {
  category?: string[];
  cuisine?: string[];
  difficulty?: string[];
  maxTime?: number;
  minTime?: number;
  tags?: string[];
  source?: string[];
  recentDays?: number;
  search?: string;
}

export type CollectionVisibility = 'PRIVATE' | 'FOLLOWERS' | 'PUBLIC';

export interface SmartCollection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isSystem: boolean;
  visibility: CollectionVisibility;
  filterRules: FilterRules;
  recipeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SmartCollectionWithRecipes extends SmartCollection {
  recipes: {
    id: string;
    title: string;
    imageUrl?: string;
    category?: string;
    cuisine?: string;
    totalTimeMinutes?: number;
    difficulty?: string;
    visibility?: CollectionVisibility;
  }[];
}

export interface CreateSmartCollectionDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  filterRules: FilterRules;
}

export interface UpdateSmartCollectionDto extends Partial<CreateSmartCollectionDto> {}

export interface FilterPreviewResult {
  count: number;
  recipes: {
    id: string;
    title: string;
    imageUrl?: string;
    category?: string;
    cuisine?: string;
    totalTimeMinutes?: number;
  }[];
}

// Predefined filter templates
export const FILTER_TEMPLATES = {
  quickMeals: {
    name: 'Quick Meals',
    description: 'Ready in 30 minutes or less',
    icon: 'clock',
    color: 'amber',
    filterRules: { maxTime: 30 },
  },
  easyRecipes: {
    name: 'Easy Recipes',
    description: 'Simple recipes for beginners',
    icon: 'smile',
    color: 'green',
    filterRules: { difficulty: ['EASY'] },
  },
  weeknight: {
    name: 'Weeknight Dinners',
    description: 'Easy dinners under 45 minutes',
    icon: 'utensils',
    color: 'orange',
    filterRules: { category: ['DINNER', 'MAIN_COURSE'], maxTime: 45, difficulty: ['EASY', 'MEDIUM'] },
  },
  healthy: {
    name: 'Healthy Options',
    description: 'Light and nutritious recipes',
    icon: 'heart',
    color: 'rose',
    filterRules: { tags: ['healthy'] },
  },
  vegetarian: {
    name: 'Vegetarian',
    description: 'Meat-free recipes',
    icon: 'leaf',
    color: 'emerald',
    filterRules: { tags: ['vegetarian'] },
  },
} as const;

// Icon options for smart collections
export const COLLECTION_ICONS = [
  'clock',
  'utensils',
  'cake',
  'coffee',
  'flame',
  'heart',
  'leaf',
  'salad',
  'soup',
  'star',
  'sun',
  'moon',
  'zap',
  'smile',
  'gift',
  'calendar',
] as const;

// Color options for smart collections
export const COLLECTION_COLORS = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const;
