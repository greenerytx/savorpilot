import { api } from './api';
import type {
  Recipe,
  CreateRecipeDto,
  UpdateRecipeDto,
  RecipeQuery,
  PaginatedResponse,
  RecipeStatistics,
  RecipeGroup,
  GroupDetail,
  CreateGroupDto,
  UpdateGroupDto,
  ForkRecipeDto,
  RecipeLineage,
  RecipeDiff,
} from '../types/recipe';

// Per-ingredient nutrition breakdown item
export interface IngredientBreakdownItem {
  ingredient: string;
  quantity?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  percentageOfCalories: number;
}

// Nutrition estimate type
export interface NutritionEstimate {
  caloriesPerServing: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
  saturatedFatGrams?: number;
  cholesterolMg?: number;
  isEstimated?: boolean;
  ingredientBreakdown?: IngredientBreakdownItem[];
}

// Circle compatibility types
export interface IngredientConflict {
  ingredientName: string;
  componentName?: string;
  allergens: string[];
  quantity?: string;
  unit?: string;
}

export interface MemberConflict {
  memberId: string;
  memberName: string;
  avatarEmoji?: string;
  allergenConflicts: IngredientConflict[];
  restrictionConflicts: IngredientConflict[];
}

export interface CompatibilityReport {
  recipeId: string;
  circleId: string;
  circleName: string;
  isCompatible: boolean;
  memberConflicts: MemberConflict[];
  allConflictingIngredients: string[];
  allConflictingAllergens: string[];
  allConflictingRestrictions: string[];
  safeForMembers: Array<{ memberId: string; memberName: string }>;
  summary: string;
  languageSupported: boolean;
  detectedLanguage?: string;
}

export interface CompatibleRecipesResponse {
  data: Recipe[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  circleInfo: {
    id: string;
    name: string;
    memberCount: number;
  };
}

export interface RecipeAllergenInfo {
  recipeId: string;
  detectedAllergens: string[];
  detectedRestrictionViolations: string[];
}

export interface PersonalCompatibilityReport {
  recipeId: string;
  isCompatible: boolean;
  allergenConflicts: IngredientConflict[];
  restrictionConflicts: IngredientConflict[];
  allConflictingIngredients: string[];
  allConflictingAllergens: string[];
  allConflictingRestrictions: string[];
  summary: string;
  languageSupported: boolean;
  detectedLanguage?: string;
}

// Translation types
export interface TranslationContent {
  title: string;
  description: string | null;
  components?: {
    name: string;
    ingredients: { quantity?: number; unit?: string; name: string; notes?: string; optional?: boolean }[];
    steps: { order: number; instruction: string; duration?: number; tips?: string }[];
  }[];
}

export interface RecipeTranslation {
  english: { title: string; description: string | null };
  arabic: { title: string; description: string | null };
}

export interface RecipeTranslations {
  english?: TranslationContent;
  arabic?: TranslationContent;
}

// Recipe endpoints
export const recipeService = {
  // Get all recipes with pagination and filters
  async getRecipes(query?: RecipeQuery): Promise<PaginatedResponse<Recipe>> {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await api.get<PaginatedResponse<Recipe>>('/recipes', { params });
    return response.data;
  },

  // Get a single recipe by ID
  async getRecipe(id: string): Promise<Recipe> {
    const response = await api.get<Recipe>(`/recipes/${id}`);
    return response.data;
  },

  // Create a new recipe
  async createRecipe(data: CreateRecipeDto): Promise<Recipe> {
    const response = await api.post<Recipe>('/recipes', data);
    return response.data;
  },

  // Update a recipe
  async updateRecipe(id: string, data: UpdateRecipeDto): Promise<Recipe> {
    const response = await api.put<Recipe>(`/recipes/${id}`, data);
    return response.data;
  },

  // Delete a recipe
  async deleteRecipe(id: string): Promise<void> {
    await api.delete(`/recipes/${id}`);
  },

  // Get recipes shared with current user
  async getSharedRecipes(query?: RecipeQuery): Promise<PaginatedResponse<Recipe>> {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get<PaginatedResponse<Recipe>>('/recipes/shared', { params });
    return response.data;
  },

  // Get recipe statistics
  async getStatistics(): Promise<RecipeStatistics> {
    const response = await api.get<RecipeStatistics>('/recipes/statistics');
    return response.data;
  },

  // Update recipe notes
  async updateNotes(id: string, personalNotes?: string, sharedNotes?: string): Promise<Recipe> {
    const response = await api.patch<Recipe>(`/recipes/${id}/notes`, {
      personalNotes,
      sharedNotes,
    });
    return response.data;
  },

  // Download and store image locally
  async downloadImage(recipeId: string, imageUrl: string): Promise<{ imageUrl: string }> {
    const response = await api.post<{ imageUrl: string }>('/image-proxy/download', {
      recipeId,
      url: imageUrl,
    });
    return response.data;
  },

  // Download and store video locally (fetches fresh URL from Instagram)
  async downloadVideo(recipeId: string): Promise<{ videoUrl: string }> {
    const response = await api.post<{ videoUrl: string }>('/image-proxy/download-video', {
      recipeId,
    });
    return response.data;
  },

  // Translate recipe to English and Arabic
  async translateRecipe(recipeId: string): Promise<RecipeTranslation> {
    const response = await api.post<RecipeTranslation>(`/recipes/${recipeId}/translate`);
    return response.data;
  },

  // Get recipe translations
  async getTranslations(recipeId: string): Promise<RecipeTranslations> {
    const response = await api.get<RecipeTranslations>(`/recipes/${recipeId}/translations`);
    return response.data;
  },

  // ==================== FORKING METHODS ====================

  // Fork a recipe to create your own copy
  async forkRecipe(recipeId: string, dto: ForkRecipeDto = {}): Promise<Recipe> {
    const response = await api.post<Recipe>(`/recipes/${recipeId}/fork`, dto);
    return response.data;
  },

  // Get all forks of a recipe
  async getRecipeForks(
    recipeId: string,
    query?: { page?: number; limit?: number }
  ): Promise<{ data: Recipe[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const response = await api.get<{ data: Recipe[]; total: number; page: number; limit: number }>(
      `/recipes/${recipeId}/forks`,
      { params }
    );
    return response.data;
  },

  // Get recipe lineage (ancestors and forks)
  async getRecipeLineage(recipeId: string): Promise<RecipeLineage> {
    const response = await api.get<RecipeLineage>(`/recipes/${recipeId}/lineage`);
    return response.data;
  },

  // Compare two recipes and get diff
  async compareRecipes(recipeId1: string, recipeId2: string): Promise<RecipeDiff> {
    const response = await api.get<RecipeDiff>(`/recipes/${recipeId1}/compare/${recipeId2}`);
    return response.data;
  },

  // ==================== VISIBILITY METHODS ====================

  // Update recipe visibility (PRIVATE/FOLLOWERS/PUBLIC)
  async updateVisibility(recipeId: string, visibility: 'PRIVATE' | 'FOLLOWERS' | 'PUBLIC'): Promise<Recipe> {
    const response = await api.patch<Recipe>(`/recipes/${recipeId}/visibility`, { visibility });
    return response.data;
  },

  // Bulk update recipe visibility
  async bulkUpdateVisibility(
    recipeIds: string[],
    visibility: 'PRIVATE' | 'FOLLOWERS' | 'PUBLIC'
  ): Promise<{ updated: number; failed: string[] }> {
    const response = await api.patch<{ updated: number; failed: string[] }>(
      '/recipes/bulk/visibility',
      { recipeIds, visibility }
    );
    return response.data;
  },

  // ==================== CIRCLE COMPATIBILITY METHODS ====================

  // Check recipe compatibility with a dinner circle
  async checkCompatibility(recipeId: string, circleId: string): Promise<CompatibilityReport> {
    const response = await api.get<CompatibilityReport>(
      `/recipes/${recipeId}/compatibility/${circleId}`
    );
    return response.data;
  },

  // Get recipes compatible with a dinner circle
  async getCompatibleRecipes(
    circleId: string,
    query?: { page?: number; limit?: number; search?: string; category?: string }
  ): Promise<CompatibleRecipesResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<CompatibleRecipesResponse>(
      `/recipes/circle/${circleId}/compatible`,
      { params }
    );
    return response.data;
  },

  // Analyze recipe for allergens and restrictions
  async analyzeAllergens(recipeId: string): Promise<RecipeAllergenInfo> {
    const response = await api.get<RecipeAllergenInfo>(`/recipes/${recipeId}/allergens`);
    return response.data;
  },

  // Batch check compatibility for multiple recipes
  async batchCheckCompatibility(
    recipeIds: string[],
    circleId: string
  ): Promise<Record<string, boolean>> {
    const response = await api.post<Record<string, boolean>>(
      `/recipes/batch-compatibility/${circleId}`,
      { recipeIds }
    );
    return response.data;
  },

  // Check recipe compatibility with current user's personal dietary preferences
  async checkPersonalCompatibility(recipeId: string): Promise<PersonalCompatibilityReport> {
    const response = await api.get<PersonalCompatibilityReport>(
      `/recipes/${recipeId}/personal-compatibility`
    );
    return response.data;
  },
};

// Group endpoints
export const groupService = {
  // Get all groups
  async getGroups(query?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<RecipeGroup>> {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get<PaginatedResponse<RecipeGroup>>('/groups', { params });
    return response.data;
  },

  // Get a single group with recipes
  async getGroup(id: string): Promise<GroupDetail> {
    const response = await api.get<GroupDetail>(`/groups/${id}`);
    return response.data;
  },

  // Create a new group
  async createGroup(data: CreateGroupDto): Promise<RecipeGroup> {
    const response = await api.post<RecipeGroup>('/groups', data);
    return response.data;
  },

  // Update a group
  async updateGroup(id: string, data: UpdateGroupDto): Promise<RecipeGroup> {
    const response = await api.put<RecipeGroup>(`/groups/${id}`, data);
    return response.data;
  },

  // Delete a group
  async deleteGroup(id: string): Promise<void> {
    await api.delete(`/groups/${id}`);
  },

  // Add recipes to a group
  async addRecipesToGroup(groupId: string, recipeIds: string[]): Promise<GroupDetail> {
    const response = await api.post<GroupDetail>(`/groups/${groupId}/recipes`, { recipeIds });
    return response.data;
  },

  // Remove recipes from a group
  async removeRecipesFromGroup(groupId: string, recipeIds: string[]): Promise<GroupDetail> {
    const response = await api.delete<GroupDetail>(`/groups/${groupId}/recipes`, {
      data: { recipeIds },
    });
    return response.data;
  },

  // Get groups shared with current user
  async getSharedGroups(query?: { page?: number; limit?: number }): Promise<PaginatedResponse<RecipeGroup>> {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get<PaginatedResponse<RecipeGroup>>('/groups/shared', { params });
    return response.data;
  },
};

// AI service for recipe parsing and generation
export interface ParsedRecipe {
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  difficulty?: string;
  category?: string;
  cuisine?: string;
  tags?: string[];
  components: {
    name: string;
    ingredients: {
      quantity?: number;
      unit?: string;
      name: string;
      notes?: string;
      optional?: boolean;
    }[];
    steps: {
      order: number;
      instruction: string;
      duration?: number;
      tips?: string;
    }[];
  }[];
  confidence?: number;
}

export const aiService = {
  // Parse recipe from text using AI
  async parseRecipeFromText(text: string): Promise<ParsedRecipe> {
    const response = await api.post<ParsedRecipe>('/ai/parse-text', { text });
    return response.data;
  },

  // Extract recipe from URL (Instagram, websites, etc.)
  async parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
    const response = await api.post<ParsedRecipe>('/ai/parse-url', { url });
    return response.data;
  },

  // Generate recipe from ingredients using AI
  async generateRecipe(
    ingredients: string[],
    preferences?: {
      cuisine?: string;
      difficulty?: string;
      dietary?: string[];
      mealType?: string;
    }
  ): Promise<ParsedRecipe> {
    const response = await api.post<ParsedRecipe>('/ai/generate', {
      ingredients,
      preferences,
    });
    return response.data;
  },

  // Parse recipe from image using AI Vision
  async parseRecipeFromImage(file: File): Promise<ParsedRecipe> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<ParsedRecipe>('/ai/parse-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Estimate nutrition for ingredients (without saving)
  async estimateNutrition(
    ingredients: { quantity?: number; unit?: string; name: string }[],
    servings?: number
  ): Promise<NutritionEstimate> {
    const response = await api.post<NutritionEstimate>('/ai/estimate-nutrition', {
      ingredients,
      servings,
    });
    return response.data;
  },

  // Estimate and save nutrition for a recipe
  async estimateAndSaveNutrition(recipeId: string): Promise<NutritionEstimate> {
    const response = await api.post<NutritionEstimate>(
      `/ai/estimate-nutrition/${recipeId}`
    );
    return response.data;
  },

  // Generate detailed cooking steps for a recipe
  async generateSteps(recipeId: string): Promise<import('../types/recipe').Recipe> {
    const response = await api.post<import('../types/recipe').Recipe>(
      `/ai/generate-steps/${recipeId}`
    );
    return response.data;
  },

  // Chat with AI about a specific recipe
  async recipeChat(
    recipeId: string,
    message: string,
    conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<{ message: string; suggestions?: string[] }> {
    const response = await api.post<{ message: string; suggestions?: string[] }>(
      `/ai/chat/${recipeId}`,
      {
        message,
        conversationHistory,
      }
    );
    return response.data;
  },

  // Generate an AI image for a recipe using DALL-E
  async generateImage(
    recipeId: string
  ): Promise<{ success: boolean; imageUrl: string; recipe: import('../types/recipe').Recipe }> {
    const response = await api.post<{
      success: boolean;
      imageUrl: string;
      recipe: import('../types/recipe').Recipe;
    }>(`/ai/generate-image/${recipeId}`);
    return response.data;
  },

  // Remove the image from a recipe
  async removeImage(
    recipeId: string
  ): Promise<{ success: boolean; recipe: import('../types/recipe').Recipe }> {
    const response = await api.post<{
      success: boolean;
      recipe: import('../types/recipe').Recipe;
    }>(`/ai/remove-image/${recipeId}`);
    return response.data;
  },

  // Create a fusion recipe from two recipes
  async createFusionRecipe(
    recipe1Id: string,
    recipe2Id: string,
    fusionStyle?: 'balanced' | 'recipe1-dominant' | 'recipe2-dominant' | 'experimental'
  ): Promise<ParsedRecipe & { fusionNotes?: string; parentRecipes?: string[] }> {
    const response = await api.post<ParsedRecipe & { fusionNotes?: string; parentRecipes?: string[] }>(
      '/ai/fusion',
      {
        recipe1Id,
        recipe2Id,
        fusionStyle,
      }
    );
    return response.data;
  },
};
