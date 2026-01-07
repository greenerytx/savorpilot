export class FlavorProfileResponseDto {
  id: string;
  userId: string;

  // Seasoning preferences (0.0 to 1.0)
  saltPreference: number;
  heatPreference: number;
  acidPreference: number;
  sweetPreference: number;
  umamiPreference: number;

  // Cuisine affinities
  cuisineAffinities: Record<string, number>;
  topCuisines: { cuisine: string; score: number }[];

  // Ingredient preferences
  ingredientScores: Record<string, number>;
  lovedIngredients: string[];
  dislikedIngredients: string[];

  // Cooking style
  preferredComplexity: number;
  preferredCookTime?: number;
  preferredServings?: number;

  // Confidence
  dataPoints: number;
  confidence: number;
  updatedAt: Date;
}

export class FlavorProfileSummaryDto {
  userId: string;

  // Human-readable preferences
  tasteProfile: {
    salt: 'low' | 'moderate' | 'high';
    heat: 'mild' | 'moderate' | 'spicy';
    acid: 'low' | 'balanced' | 'tangy';
    sweet: 'savory' | 'balanced' | 'sweet';
    umami: 'light' | 'moderate' | 'rich';
  };

  // Top 3 cuisines
  favoriteCuisines: string[];

  // Cooking style summary
  cookingStyle: {
    complexity: 'simple' | 'moderate' | 'complex';
    typicalCookTime: string; // "under 30 min", "30-60 min", "over 1 hour"
  };

  // Confidence indicator
  profileStrength: 'new' | 'developing' | 'established' | 'strong';
  recipesNeededForNextLevel: number;
}

export class RecipeMatchScoreDto {
  recipeId: string;
  recipeTitle: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  warnings: string[]; // e.g., "Spicier than you usually prefer"
}
