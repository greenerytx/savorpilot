import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';

// ==================== FORK TAGS ====================

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

export class UpdateForkTagsDto {
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

// ==================== FORK VOTING ====================

export class ForkVoteResponseDto {
  id: string;
  recipeId: string;
  userId: string;
  createdAt: Date;
}

export class ForkVoteStatsDto {
  recipeId: string;
  voteCount: number;
  hasUserVoted: boolean;
}

// ==================== SMART FORK SUGGESTIONS ====================

export class SmartForkSuggestionDto {
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
  createdAt: Date;
}

// ==================== FORK CHANGELOG ====================

export class ForkChangelogDto {
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
  summary: string; // Auto-generated human-readable summary
}

// ==================== FORK GALLERY ====================

export class ForkGalleryItemDto {
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
  changelog?: ForkChangelogDto;
  createdAt: Date;
}

export class ForkGalleryResponseDto {
  forks: ForkGalleryItemDto[];
  total: number;
  hasMore: boolean;
}

// ==================== FORK ANALYTICS ====================

export class ForkAnalyticsDto {
  // User's fork stats
  totalForksCreated: number;
  totalForksReceived: number;
  totalVotesReceived: number;
  forkInfluenceScore: number; // Calculated score based on fork activity

  // Top forked recipes
  topForkedRecipes: {
    id: string;
    title: string;
    forkCount: number;
    imageUrl?: string;
  }[];

  // Fork activity over time
  forkActivityByMonth: {
    month: string;
    forksCreated: number;
    forksReceived: number;
  }[];

  // Popular fork tags used
  topForkTags: {
    tag: string;
    count: number;
  }[];
}

// ==================== FORK COMPARISON MATRIX ====================

export class ForkComparisonItemDto {
  id: string;
  title: string;
  forkNote?: string;
  author: {
    firstName: string;
    lastName: string;
  };
  voteCount: number;
  // Comparison data
  totalTimeMinutes?: number;
  servings?: number;
  difficulty?: string;
  ingredientCount: number;
  stepCount: number;
  calories?: number;
}

export class ForkComparisonMatrixDto {
  original: ForkComparisonItemDto;
  forks: ForkComparisonItemDto[];
  // Comparison fields
  fields: {
    key: string;
    label: string;
    values: (string | number | null)[];
  }[];
}

// ==================== NOTIFICATIONS ====================

export class ForkNotificationDataDto {
  recipeId?: string;
  recipeTitle?: string;
  forkId?: string;
  forkTitle?: string;
  forkerId?: string;
  forkerName?: string;
  voteCount?: number;
  forkCount?: number;
}
