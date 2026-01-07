// ==================== COOK TRIAL TYPES ====================

export interface CookTrialDto {
  id: string;
  recipeId: string;
  userId: string;
  rating: number; // 1-4
  ratingEmoji: string;
  wouldMakeAgain: boolean | null;
  tags: string[];
  notes: string | null;
  photoUrl: string | null;
  cookedAt: Date;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

// ==================== VALIDATION BADGE TYPES ====================

export type ValidationBadgeType =
  | 'verified' // 5+ successful cooks
  | 'highly_rated' // Average rating >= 3.5
  | 'time_accurate' // Reported times match recipe
  | 'crowd_favorite' // High "would make again" rate
  | 'photo_verified' // Has cook photos
  | 'quick_win' // Fast + easy + high success
  | 'beginner_friendly' // High success from new cooks
  | 'expert_approved'; // High-rated by experienced cooks

export interface ValidationBadgeDto {
  type: ValidationBadgeType;
  label: string;
  description: string;
  icon: string; // emoji
  earnedAt?: Date;
  progress?: number; // 0-100, for badges not yet earned
  threshold?: number; // What's needed to earn
}

export interface ForkValidationStatsDto {
  recipeId: string;
  isFork: boolean;
  parentRecipeId: string | null;

  // Cook trial stats
  totalCooks: number;
  successfulCooks: number; // Rating >= 3
  successRate: number; // 0-100

  // Rating stats
  averageRating: number;
  ratingDistribution: {
    rating1: number;
    rating2: number;
    rating3: number;
    rating4: number;
  };

  // Would make again
  wouldMakeAgainCount: number;
  wouldMakeAgainRate: number; // 0-100

  // Time accuracy (based on cook tags)
  timeAccuracyReports: number;
  timeAccurateCount: number;
  timeAccuracyRate: number;

  // Photo verification
  photosCount: number;
  hasPhotoVerification: boolean;

  // Earned badges
  badges: ValidationBadgeDto[];

  // Recent cook trials (for display)
  recentTrials: CookTrialDto[];

  // Comparison with parent (if fork)
  comparedToParent?: {
    ratingDiff: number; // positive = better than parent
    successRateDiff: number;
    cookCountDiff: number;
    verdict: 'better' | 'similar' | 'worse' | 'insufficient_data';
  };
}

// ==================== BADGE DEFINITIONS ====================

export const VALIDATION_BADGES: Record<
  ValidationBadgeType,
  Omit<ValidationBadgeDto, 'earnedAt' | 'progress' | 'threshold'>
> = {
  verified: {
    type: 'verified',
    label: 'Verified',
    description: '5+ people have successfully made this recipe',
    icon: '✅',
  },
  highly_rated: {
    type: 'highly_rated',
    label: 'Highly Rated',
    description: 'Average rating of 3.5+ stars',
    icon: '⭐',
  },
  time_accurate: {
    type: 'time_accurate',
    label: 'Time Accurate',
    description: 'Cooking time matches what users report',
    icon: '⏱️',
  },
  crowd_favorite: {
    type: 'crowd_favorite',
    label: 'Crowd Favorite',
    description: '80%+ would make this again',
    icon: '❤️',
  },
  photo_verified: {
    type: 'photo_verified',
    label: 'Photo Verified',
    description: 'Multiple users have shared photos',
    icon: '📸',
  },
  quick_win: {
    type: 'quick_win',
    label: 'Quick Win',
    description: 'Fast, easy, and consistently successful',
    icon: '🚀',
  },
  beginner_friendly: {
    type: 'beginner_friendly',
    label: 'Beginner Friendly',
    description: 'High success rate among new cooks',
    icon: '👶',
  },
  expert_approved: {
    type: 'expert_approved',
    label: 'Expert Approved',
    description: 'Highly rated by experienced cooks',
    icon: '👨‍🍳',
  },
};
