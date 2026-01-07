import { api } from './api';

// ==================== COOK TRIAL TYPES ====================

export interface CookTrial {
  id: string;
  recipeId: string;
  userId: string;
  rating: number;
  ratingEmoji: string;
  wouldMakeAgain: boolean | null;
  tags: string[];
  notes: string | null;
  photoUrl: string | null;
  cookedAt: string;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export type ValidationBadgeType =
  | 'verified'
  | 'highly_rated'
  | 'time_accurate'
  | 'crowd_favorite'
  | 'photo_verified'
  | 'quick_win'
  | 'beginner_friendly'
  | 'expert_approved';

export interface ValidationBadge {
  type: ValidationBadgeType;
  label: string;
  description: string;
  icon: string;
  earnedAt?: string;
  progress?: number;
  threshold?: number;
}

export interface ForkValidationStats {
  recipeId: string;
  isFork: boolean;
  parentRecipeId: string | null;
  totalCooks: number;
  successfulCooks: number;
  successRate: number;
  averageRating: number;
  ratingDistribution: {
    rating1: number;
    rating2: number;
    rating3: number;
    rating4: number;
  };
  wouldMakeAgainCount: number;
  wouldMakeAgainRate: number;
  timeAccuracyReports: number;
  timeAccurateCount: number;
  timeAccuracyRate: number;
  photosCount: number;
  hasPhotoVerification: boolean;
  badges: ValidationBadge[];
  recentTrials: CookTrial[];
  comparedToParent?: {
    ratingDiff: number;
    successRateDiff: number;
    cookCountDiff: number;
    verdict: 'better' | 'similar' | 'worse' | 'insufficient_data';
  };
}

export interface ValidatedFork {
  id: string;
  title: string;
  forkNote: string | null;
  successRate: number;
  totalCooks: number;
  averageRating: number;
  badges: ValidationBadge[];
}

// ==================== FORK TAG TYPES ====================

export const FORK_TAG_OPTIONS = [
  'healthier',
  'vegan',
  'vegetarian',
  'gluten-free',
  'dairy-free',
  'keto',
  'low-carb',
  'quick',
  'budget-friendly',
  'kid-friendly',
  'spicier',
  'milder',
  'simplified',
  'elevated',
] as const;

export type ForkTag = (typeof FORK_TAG_OPTIONS)[number];

export interface ForkTagOption {
  value: string;
  label: string;
}

// ==================== FORK VOTING TYPES ====================

export interface ForkVoteStats {
  recipeId: string;
  voteCount: number;
  hasUserVoted: boolean;
}

// ==================== SMART FORK SUGGESTION TYPES ====================

export interface SmartForkSuggestion {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  forkNote?: string;
  forkTags: string[];
  matchScore: number;
  matchReasons: string[];
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  voteCount: number;
  createdAt: string;
}

// ==================== FORK CHANGELOG TYPES ====================

export interface ForkChangelog {
  ingredientsAdded: string[];
  ingredientsRemoved: string[];
  ingredientsModified: {
    original: string;
    modified: string;
  }[];
  stepsAdded: number;
  stepsRemoved: number;
  stepsModified: number;
  metadataChanges: {
    field: string;
    original: string | number | null;
    modified: string | number | null;
  }[];
  summary: string;
}

// ==================== FORK GALLERY TYPES ====================

export interface ForkGalleryItem {
  id: string;
  title: string;
  imageUrl?: string;
  forkNote?: string;
  forkTags: string[];
  voteCount: number;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  changelog?: ForkChangelog;
  createdAt: string;
}

export interface ForkGalleryResponse {
  forks: ForkGalleryItem[];
  total: number;
  hasMore: boolean;
}

// ==================== FORK ANALYTICS TYPES ====================

export interface ForkAnalytics {
  totalForksCreated: number;
  totalForksReceived: number;
  totalVotesReceived: number;
  forkInfluenceScore: number;
  topForkedRecipes: {
    id: string;
    title: string;
    forkCount: number;
    imageUrl?: string;
  }[];
  forkActivityByMonth: {
    month: string;
    forksCreated: number;
    forksReceived: number;
  }[];
  topForkTags: {
    tag: string;
    count: number;
  }[];
}

// ==================== AUTO-FORK TEMPLATE TYPES ====================

export interface AutoForkTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'dietary' | 'cooking_method' | 'time' | 'health' | 'skill';
  forkNote: string;
  forkTags: string[];
}

export interface AutoForkPreview {
  template: AutoForkTemplate;
  suggestedChanges: {
    ingredientChanges: {
      action: 'substitute' | 'remove' | 'reduce' | 'increase';
      original?: string;
      replacement?: string;
      reason: string;
    }[];
    stepChanges: {
      action: 'modify' | 'add' | 'remove';
      stepIndex?: number;
      description: string;
    }[];
    metadataChanges: {
      field: string;
      oldValue: string | number;
      newValue: string | number;
    }[];
  };
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  warnings: string[];
}

export interface AutoForkResult {
  success: boolean;
  newRecipeId?: string;
  changes?: {
    ingredientsModified: number;
    stepsModified: number;
  };
  error?: string;
}

// ==================== FORK OUTCOME PREDICTION TYPES ====================

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskFactor {
  id: string;
  type: 'warning' | 'caution' | 'info';
  icon: string;
  title: string;
  description: string;
  severity: number;
}

export interface ForkOutcomePrediction {
  recipeId: string;
  isFork: boolean;
  overallRiskLevel: RiskLevel;
  confidenceScore: number;
  riskFactors: RiskFactor[];
  positiveFactors: RiskFactor[];
  recommendation: {
    action: 'proceed' | 'proceed_with_caution' | 'not_recommended';
    message: string;
  };
  stats: {
    totalCooks: number;
    successRate: number;
    averageRating: number;
    ingredientChanges: number;
    stepChanges: number;
    comparedToParent?: {
      ratingDiff: number;
      successRateDiff: number;
    };
  };
}

// ==================== GENEALOGY TREE TYPES ====================

export interface GenealogyTreeNode {
  id: string;
  title: string;
  imageUrl?: string;
  forkNote?: string;
  forkTags: string[];
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  forkCount: number;
  voteCount: number;
  depth: number;
  children: GenealogyTreeNode[];
  hasMoreChildren: boolean;
}

export interface GenealogyTreeResponse {
  root: GenealogyTreeNode;
  currentPath: string[];
  totalNodes: number;
  maxDepthReached: boolean;
}

// ==================== FORK COMPARISON TYPES ====================

export interface ForkComparisonItem {
  id: string;
  title: string;
  forkNote?: string;
  author: {
    firstName: string;
    lastName: string;
  };
  voteCount: number;
  totalTimeMinutes?: number;
  servings?: number;
  difficulty?: string;
  ingredientCount: number;
  stepCount: number;
  calories?: number;
}

export interface ForkComparisonMatrix {
  original: ForkComparisonItem;
  forks: ForkComparisonItem[];
  fields: {
    key: string;
    label: string;
    values: (string | number | null)[];
  }[];
}

// ==================== SERVICE ====================

export const forkEnhancementsService = {
  // ==================== FORK TAGS ====================

  async getForkTagOptions(): Promise<ForkTagOption[]> {
    const response = await api.get<ForkTagOption[]>(
      '/fork-enhancements/tags/options',
    );
    return response.data;
  },

  async updateForkTags(
    recipeId: string,
    tags: string[],
  ): Promise<{ forkTags: string[] }> {
    const response = await api.put<{ forkTags: string[] }>(
      `/fork-enhancements/recipes/${recipeId}/tags`,
      { tags },
    );
    return response.data;
  },

  // ==================== FORK VOTING ====================

  async voteFork(recipeId: string): Promise<void> {
    await api.post(`/fork-enhancements/recipes/${recipeId}/vote`);
  },

  async unvoteFork(recipeId: string): Promise<void> {
    await api.delete(`/fork-enhancements/recipes/${recipeId}/vote`);
  },

  async getForkVoteStats(recipeId: string): Promise<ForkVoteStats> {
    const response = await api.get<ForkVoteStats>(
      `/fork-enhancements/recipes/${recipeId}/vote-stats`,
    );
    return response.data;
  },

  // ==================== SMART FORK SUGGESTIONS ====================

  async getSmartForkSuggestions(
    recipeId: string,
  ): Promise<SmartForkSuggestion[]> {
    const response = await api.get<SmartForkSuggestion[]>(
      `/fork-enhancements/recipes/${recipeId}/smart-suggestions`,
    );
    return response.data;
  },

  // ==================== FORK CHANGELOG ====================

  async getForkChangelog(forkId: string): Promise<ForkChangelog> {
    const response = await api.get<ForkChangelog>(
      `/fork-enhancements/recipes/${forkId}/changelog`,
    );
    return response.data;
  },

  // ==================== FORK GALLERY ====================

  async getForkGallery(
    recipeId: string,
    options?: { limit?: number; offset?: number; sortBy?: string },
  ): Promise<ForkGalleryResponse> {
    const response = await api.get<ForkGalleryResponse>(
      `/fork-enhancements/recipes/${recipeId}/gallery`,
      { params: options },
    );
    return response.data;
  },

  // ==================== FORK ANALYTICS ====================

  async getForkAnalytics(): Promise<ForkAnalytics> {
    const response = await api.get<ForkAnalytics>(
      '/fork-enhancements/analytics',
    );
    return response.data;
  },

  // ==================== FORK COMPARISON MATRIX ====================

  async getForkComparisonMatrix(
    recipeId: string,
  ): Promise<ForkComparisonMatrix> {
    const response = await api.get<ForkComparisonMatrix>(
      `/fork-enhancements/recipes/${recipeId}/comparison-matrix`,
    );
    return response.data;
  },

  // ==================== COOK TRIALS + VALIDATION ====================

  async getForkValidationStats(recipeId: string): Promise<ForkValidationStats> {
    const response = await api.get<ForkValidationStats>(
      `/fork-enhancements/recipes/${recipeId}/validation-stats`,
    );
    return response.data;
  },

  async getTopValidatedForks(
    recipeId: string,
    limit = 5,
  ): Promise<ValidatedFork[]> {
    const response = await api.get<ValidatedFork[]>(
      `/fork-enhancements/recipes/${recipeId}/top-validated-forks`,
      { params: { limit } },
    );
    return response.data;
  },

  // ==================== AUTO-FORK TEMPLATES ====================

  async getAutoForkTemplates(): Promise<AutoForkTemplate[]> {
    const response = await api.get<AutoForkTemplate[]>(
      '/fork-enhancements/auto-fork/templates',
    );
    return response.data;
  },

  async getAutoForkTemplatesByCategory(): Promise<
    Record<string, AutoForkTemplate[]>
  > {
    const response = await api.get<Record<string, AutoForkTemplate[]>>(
      '/fork-enhancements/auto-fork/templates/by-category',
    );
    return response.data;
  },

  async previewAutoFork(
    recipeId: string,
    templateId: string,
  ): Promise<AutoForkPreview> {
    const response = await api.get<AutoForkPreview>(
      `/fork-enhancements/recipes/${recipeId}/auto-fork/preview/${templateId}`,
    );
    return response.data;
  },

  async applyAutoFork(
    recipeId: string,
    templateId: string,
  ): Promise<AutoForkResult> {
    const response = await api.post<AutoForkResult>(
      `/fork-enhancements/recipes/${recipeId}/auto-fork/${templateId}`,
    );
    return response.data;
  },

  // ==================== FORK OUTCOME PREDICTION ====================

  async getForkOutcomePrediction(
    recipeId: string,
  ): Promise<ForkOutcomePrediction> {
    const response = await api.get<ForkOutcomePrediction>(
      `/fork-enhancements/recipes/${recipeId}/outcome-prediction`,
    );
    return response.data;
  },

  // ==================== GENEALOGY TREE ====================

  async getGenealogyTree(
    recipeId: string,
    maxDepth = 5,
  ): Promise<GenealogyTreeResponse> {
    const response = await api.get<GenealogyTreeResponse>(
      `/fork-enhancements/recipes/${recipeId}/genealogy-tree`,
      { params: { maxDepth } },
    );
    return response.data;
  },
};
