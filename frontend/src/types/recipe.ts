// Recipe Types matching backend DTOs

export const RecipeSource = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  INSTAGRAM_URL: 'INSTAGRAM_URL',
  INSTAGRAM_SHARE: 'INSTAGRAM_SHARE',
  URL: 'URL',
  GENERATED: 'GENERATED',
  YOUTUBE: 'YOUTUBE',
  FACEBOOK_URL: 'FACEBOOK_URL',
  FACEBOOK_SHARE: 'FACEBOOK_SHARE',
  WEB_URL: 'WEB_URL',
  PDF: 'PDF',
  OTHER: 'OTHER',
} as const;
export type RecipeSource = (typeof RecipeSource)[keyof typeof RecipeSource];

export const RecipeDifficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
  EXPERT: 'EXPERT',
} as const;
export type RecipeDifficulty = (typeof RecipeDifficulty)[keyof typeof RecipeDifficulty];

export const RecipeCategory = {
  BREAKFAST: 'BREAKFAST',
  BRUNCH: 'BRUNCH',
  LUNCH: 'LUNCH',
  DINNER: 'DINNER',
  APPETIZER: 'APPETIZER',
  SNACK: 'SNACK',
  DESSERT: 'DESSERT',
  BEVERAGE: 'BEVERAGE',
  SOUP: 'SOUP',
  SALAD: 'SALAD',
  SIDE_DISH: 'SIDE_DISH',
  MAIN_COURSE: 'MAIN_COURSE',
  SAUCE: 'SAUCE',
  BREAD: 'BREAD',
  BAKING: 'BAKING',
  OTHER: 'OTHER',
} as const;
export type RecipeCategory = (typeof RecipeCategory)[keyof typeof RecipeCategory];

export const RecipeVisibility = {
  PRIVATE: 'PRIVATE',
  FOLLOWERS: 'FOLLOWERS',
  PUBLIC: 'PUBLIC',
} as const;
export type RecipeVisibility = (typeof RecipeVisibility)[keyof typeof RecipeVisibility];

export interface Ingredient {
  quantity?: number;
  unit?: string;
  name: string;
  notes?: string;
  optional?: boolean;
}

export interface Step {
  order: number;
  instruction: string;
  duration?: number;
  temperature?: string;
  tips?: string;
}

export interface RecipeComponent {
  name: string;
  ingredients: Ingredient[];
  steps: Step[];
}

export interface RecipeNotes {
  personalNotes?: string;
  sharedNotes?: string;
}

export interface RecipeNutrition {
  caloriesPerServing?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
}

export interface Recipe {
  id: string;
  userId: string;
  // Recipe owner info (for "Forked by" attribution)
  user?: { firstName: string; lastName: string };
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  difficulty?: RecipeDifficulty;
  category?: RecipeCategory;
  cuisine?: string;
  tags: string[];
  servings: number;
  servingUnit?: string;
  source: RecipeSource;
  sourceUrl?: string;
  sourceAuthor?: string;
  components: RecipeComponent[];
  createdAt: string;
  updatedAt: string;
  notes?: RecipeNotes;
  nutrition?: RecipeNutrition;
  // Forking fields
  parentRecipeId?: string;
  rootRecipeId?: string;
  forkCount: number;
  forkNote?: string;
  visibility: RecipeVisibility;
  parentRecipe?: {
    id: string;
    title: string;
    userId: string;
    user?: { firstName: string; lastName: string };
  };
}

export interface CreateRecipeDto {
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: RecipeDifficulty;
  category?: RecipeCategory;
  cuisine?: string;
  tags?: string[];
  servings?: number;
  servingUnit?: string;
  source?: RecipeSource;
  sourceUrl?: string;
  sourceAuthor?: string;
  visibility?: RecipeVisibility;
  components: RecipeComponent[];
}

export interface UpdateRecipeDto extends Partial<CreateRecipeDto> {}

export interface RecipeQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: RecipeCategory;
  difficulty?: RecipeDifficulty;
  cuisine?: string;
  maxTime?: number;
  sortBy?: 'createdAt' | 'title' | 'prepTimeMinutes' | 'cookTimeMinutes';
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface RecipeStatistics {
  totalRecipes: number;
  byCategory: { category: RecipeCategory; count: number }[];
  topCuisines: { cuisine: string; count: number }[];
  recentRecipes: { id: string; title: string; imageUrl?: string; createdAt: string }[];
}

// Group Types
export type GroupVisibility = 'PRIVATE' | 'FOLLOWERS' | 'PUBLIC';

export interface RecipeGroup {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean; // legacy, use visibility instead
  visibility: GroupVisibility;
  createdAt: string;
  updatedAt: string;
  recipeCount?: number;
  recipePreview?: { id: string; title: string; imageUrl?: string }[];
}

export interface GroupDetail extends RecipeGroup {
  recipes: {
    id: string;
    title: string;
    imageUrl?: string;
    category?: RecipeCategory;
    cuisine?: string;
    totalTimeMinutes?: number;
    sortOrder?: number;
  }[];
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  coverImage?: string;
  isPublic?: boolean; // legacy, use visibility instead
  visibility?: GroupVisibility;
}

export interface UpdateGroupDto extends Partial<CreateGroupDto> {}

// ==================== FORKING TYPES ====================

export interface ForkRecipeDto {
  forkNote?: string;
  visibility?: RecipeVisibility;
}

export interface RecipeLineage {
  ancestors: {
    id: string;
    title: string;
    userId: string;
    user?: { firstName: string; lastName: string };
  }[];
  forks: {
    id: string;
    title: string;
    userId: string;
    forkNote?: string;
    forkCount: number;
    createdAt: string;
    user?: { firstName: string; lastName: string };
  }[];
  forkCount: number;
}

export interface IngredientDiff {
  added: Ingredient[];
  removed: Ingredient[];
  modified: { original: Ingredient; modified: Ingredient }[];
}

export interface StepDiff {
  added: Step[];
  removed: Step[];
  modified: { original: Step; modified: Step }[];
}

export interface MetadataDiff {
  field: string;
  original: unknown;
  modified: unknown;
}

export interface RecipeDiff {
  ingredients: IngredientDiff;
  steps: StepDiff;
  metadata: MetadataDiff[];
}
