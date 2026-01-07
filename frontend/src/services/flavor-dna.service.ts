import { api } from './api';

// ==================== INTERACTION TYPES ====================

export enum InteractionType {
  VIEW = 'VIEW',
  SAVE = 'SAVE',
  UNSAVE = 'UNSAVE',
  COOK_START = 'COOK_START',
  COOK_COMPLETE = 'COOK_COMPLETE',
  PRINT = 'PRINT',
  SHARE = 'SHARE',
  FORK = 'FORK',
}

export interface TrackInteractionDto {
  recipeId: string;
  type: InteractionType;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface InteractionResponse {
  id: string;
  userId: string;
  recipeId: string;
  type: InteractionType;
  duration?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface InteractionStats {
  recipeId: string;
  viewCount: number;
  saveCount: number;
  cookCount: number;
  shareCount: number;
  forkCount: number;
  avgViewDuration?: number;
}

// ==================== COOKING REVIEW TYPES ====================

export const REVIEW_TAGS = [
  'too_salty',
  'too_spicy',
  'too_sweet',
  'too_bland',
  'perfect_flavor',
  'quick_easy',
  'time_consuming',
  'kids_approved',
  'date_night',
  'meal_prep_friendly',
  'great_leftovers',
  'impressive_presentation',
  'budget_friendly',
  'healthy',
  'comfort_food',
  'will_modify',
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];

export interface CreateCookingReviewDto {
  recipeId: string;
  rating: 1 | 2 | 3 | 4; // 1=😕, 2=😐, 3=🙂, 4=😍
  wouldMakeAgain?: boolean;
  tags?: string[];
  notes?: string;
  photoUrl?: string;
}

export interface UpdateCookingReviewDto {
  rating?: 1 | 2 | 3 | 4;
  wouldMakeAgain?: boolean;
  tags?: string[];
  notes?: string;
  photoUrl?: string;
}

export interface CookingReviewResponse {
  id: string;
  userId: string;
  recipeId: string;
  rating: number;
  ratingEmoji: string;
  wouldMakeAgain?: boolean;
  tags: string[];
  notes?: string;
  photoUrl?: string;
  cookedAt: string;
}

export interface RecipeReviewStats {
  recipeId: string;
  totalReviews: number;
  averageRating: number;
  wouldMakeAgainPercent: number;
  ratingDistribution: {
    rating1: number;
    rating2: number;
    rating3: number;
    rating4: number;
  };
  topTags: { tag: string; count: number }[];
}

// ==================== SEASONING FEEDBACK TYPES (SALT SENSE) ====================

export enum SeasoningDimension {
  SALT = 'SALT',
  ACID = 'ACID',
  HEAT = 'HEAT',
  SWEET = 'SWEET',
  UMAMI = 'UMAMI',
  BITTER = 'BITTER',
}

export enum SeasoningLevel {
  TOO_LITTLE = 'TOO_LITTLE',
  PERFECT = 'PERFECT',
  TOO_MUCH = 'TOO_MUCH',
}

export interface CreateSeasoningFeedbackDto {
  recipeId: string;
  stepIndex: number;
  dimension: SeasoningDimension;
  feedback: SeasoningLevel;
}

export interface SeasoningFeedbackResponse {
  id: string;
  userId: string;
  recipeId: string;
  stepIndex: number;
  dimension: SeasoningDimension;
  feedback: SeasoningLevel;
  createdAt: string;
}

export interface SeasoningPreference {
  dimension: SeasoningDimension;
  preference: number; // 0.0 to 1.0
  confidence: number;
  dataPoints: number;
}

export interface UserSeasoningPreferences {
  userId: string;
  preferences: SeasoningPreference[];
  summary: {
    likesItSalty: boolean;
    likesItSpicy: boolean;
    likesItSour: boolean;
    likesItSweet: boolean;
  };
}

// ==================== FLAVOR PROFILE TYPES ====================

export interface FlavorProfile {
  id: string;
  userId: string;
  saltPreference: number;
  heatPreference: number;
  acidPreference: number;
  sweetPreference: number;
  umamiPreference: number;
  cuisineAffinities: Record<string, number>;
  topCuisines: { cuisine: string; score: number }[];
  ingredientScores: Record<string, number>;
  lovedIngredients: string[];
  dislikedIngredients: string[];
  preferredComplexity: number;
  preferredCookTime?: number;
  preferredServings?: number;
  dataPoints: number;
  confidence: number;
  updatedAt: string;
}

export interface FlavorProfileSummary {
  userId: string;
  tasteProfile: {
    salt: 'low' | 'moderate' | 'high';
    heat: 'mild' | 'moderate' | 'spicy';
    acid: 'low' | 'balanced' | 'tangy';
    sweet: 'savory' | 'balanced' | 'sweet';
    umami: 'light' | 'moderate' | 'rich';
  };
  favoriteCuisines: string[];
  cookingStyle: {
    complexity: 'simple' | 'moderate' | 'complex';
    typicalCookTime: string;
  };
  profileStrength: 'new' | 'developing' | 'established' | 'strong';
  recipesNeededForNextLevel: number;
}

// ==================== RECOMMENDATIONS TYPES ====================

export interface RecommendedRecipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  cuisine?: string;
  totalTimeMinutes?: number;
  difficultyLevel?: string;
  score: number;
  matchReasons: string[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ==================== MATCH SCORE TYPES ====================

export interface RecipeMatchScore {
  recipeId: string;
  score: number | null;
  matchReasons: string[];
  hasProfile: boolean;
  message?: string;
  recipesNeeded?: number;
  breakdown?: {
    cuisine: number;
    complexity: number;
    cookTime: number;
    popularity: number;
    freshness: number;
  };
}

// ==================== SERVICE ====================

export const flavorDnaService = {
  // ==================== INTERACTIONS ====================

  async trackInteraction(dto: TrackInteractionDto): Promise<InteractionResponse> {
    const response = await api.post<InteractionResponse>('/flavor-dna/interactions', dto);
    return response.data;
  },

  async getRecentInteractions(limit = 50): Promise<InteractionResponse[]> {
    const response = await api.get<InteractionResponse[]>('/flavor-dna/interactions/recent', {
      params: { limit },
    });
    return response.data;
  },

  async getRecipeInteractionStats(recipeId: string): Promise<InteractionStats> {
    const response = await api.get<InteractionStats>(
      `/flavor-dna/interactions/recipe/${recipeId}/stats`
    );
    return response.data;
  },

  // ==================== COOKING REVIEWS ====================

  async createReview(dto: CreateCookingReviewDto): Promise<CookingReviewResponse> {
    const response = await api.post<CookingReviewResponse>('/flavor-dna/reviews', dto);
    return response.data;
  },

  async updateReview(
    reviewId: string,
    dto: UpdateCookingReviewDto
  ): Promise<CookingReviewResponse> {
    const response = await api.put<CookingReviewResponse>(
      `/flavor-dna/reviews/${reviewId}`,
      dto
    );
    return response.data;
  },

  async getUserReviewForRecipe(recipeId: string): Promise<CookingReviewResponse | null> {
    const response = await api.get<CookingReviewResponse | null>(
      `/flavor-dna/reviews/recipe/${recipeId}`
    );
    return response.data;
  },

  async getRecipeReviewStats(recipeId: string): Promise<RecipeReviewStats> {
    const response = await api.get<RecipeReviewStats>(
      `/flavor-dna/reviews/recipe/${recipeId}/stats`
    );
    return response.data;
  },

  // ==================== SEASONING FEEDBACK (SALT SENSE) ====================

  async recordSeasoningFeedback(
    dto: CreateSeasoningFeedbackDto
  ): Promise<SeasoningFeedbackResponse> {
    const response = await api.post<SeasoningFeedbackResponse>('/flavor-dna/seasoning', dto);
    return response.data;
  },

  async getSeasoningPreferences(): Promise<UserSeasoningPreferences> {
    const response = await api.get<UserSeasoningPreferences>(
      '/flavor-dna/seasoning/preferences'
    );
    return response.data;
  },

  // ==================== FLAVOR PROFILE ====================

  async getFlavorProfile(): Promise<FlavorProfile> {
    const response = await api.get<FlavorProfile>('/flavor-dna/profile');
    return response.data;
  },

  async getFlavorProfileSummary(): Promise<FlavorProfileSummary> {
    const response = await api.get<FlavorProfileSummary>('/flavor-dna/profile/summary');
    return response.data;
  },

  // ==================== RECOMMENDATIONS ====================

  async getRecommendedRecipes(limit = 10): Promise<RecommendedRecipe[]> {
    const response = await api.get<RecommendedRecipe[]>('/flavor-dna/recommendations', {
      params: { limit },
    });
    return response.data;
  },

  // ==================== RECIPE MATCH SCORE ====================

  async getRecipeMatchScore(recipeId: string): Promise<RecipeMatchScore> {
    const response = await api.get<RecipeMatchScore>(
      `/flavor-dna/recipes/${recipeId}/match-score`
    );
    return response.data;
  },
};
