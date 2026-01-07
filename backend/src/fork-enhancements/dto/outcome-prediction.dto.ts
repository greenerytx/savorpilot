// ==================== FORK OUTCOME PREDICTION TYPES ====================

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskFactor {
  id: string;
  type: 'warning' | 'caution' | 'info';
  icon: string;
  title: string;
  description: string;
  severity: number; // 1-10
}

export interface ForkOutcomePredictionDto {
  recipeId: string;
  isFork: boolean;
  overallRiskLevel: RiskLevel;
  confidenceScore: number; // 0-100, higher = more data to make prediction
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

// ==================== RISK FACTOR DEFINITIONS ====================

export const RISK_FACTORS: Record<string, Omit<RiskFactor, 'id'>> = {
  no_cook_trials: {
    type: 'warning',
    icon: '⚠️',
    title: 'Untested Recipe',
    description: 'No one has tried this fork yet. Results may vary.',
    severity: 7,
  },
  few_cook_trials: {
    type: 'caution',
    icon: '⏳',
    title: 'Limited Testing',
    description: 'Only a few people have tried this fork.',
    severity: 4,
  },
  low_success_rate: {
    type: 'warning',
    icon: '📉',
    title: 'Low Success Rate',
    description: 'Many cooks have had issues with this recipe.',
    severity: 8,
  },
  moderate_success_rate: {
    type: 'caution',
    icon: '⚖️',
    title: 'Mixed Results',
    description: 'Success rate is moderate - some cooks had issues.',
    severity: 5,
  },
  low_rating: {
    type: 'warning',
    icon: '⭐',
    title: 'Low Ratings',
    description: 'Average rating is below expectations.',
    severity: 6,
  },
  major_substitutions: {
    type: 'caution',
    icon: '🔄',
    title: 'Major Ingredient Changes',
    description: 'This fork has significant ingredient substitutions.',
    severity: 5,
  },
  complex_modifications: {
    type: 'caution',
    icon: '📝',
    title: 'Many Step Changes',
    description: 'Cooking method differs significantly from original.',
    severity: 4,
  },
  worse_than_parent: {
    type: 'warning',
    icon: '📊',
    title: 'Below Original',
    description: 'This fork has lower ratings than the original recipe.',
    severity: 6,
  },
  time_inaccurate: {
    type: 'caution',
    icon: '⏱️',
    title: 'Time May Vary',
    description: 'Actual cooking time often differs from stated.',
    severity: 3,
  },
};

export const POSITIVE_FACTORS: Record<string, Omit<RiskFactor, 'id'>> = {
  well_tested: {
    type: 'info',
    icon: '✅',
    title: 'Well Tested',
    description: 'Many cooks have successfully made this recipe.',
    severity: -5,
  },
  high_success_rate: {
    type: 'info',
    icon: '🎯',
    title: 'High Success Rate',
    description: 'Most people succeed with this recipe.',
    severity: -7,
  },
  highly_rated: {
    type: 'info',
    icon: '⭐',
    title: 'Highly Rated',
    description: 'Cooks love this recipe!',
    severity: -6,
  },
  better_than_parent: {
    type: 'info',
    icon: '🏆',
    title: 'Improved Recipe',
    description: 'This fork outperforms the original.',
    severity: -5,
  },
  crowd_favorite: {
    type: 'info',
    icon: '❤️',
    title: 'Crowd Favorite',
    description: 'Most people would make this again.',
    severity: -6,
  },
  photo_verified: {
    type: 'info',
    icon: '📸',
    title: 'Photo Verified',
    description: 'Multiple cooks have shared their results.',
    severity: -3,
  },
  minimal_changes: {
    type: 'info',
    icon: '👍',
    title: 'Minimal Changes',
    description: 'Only minor tweaks from the original recipe.',
    severity: -2,
  },
};
