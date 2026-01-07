// ==================== AUTO-FORK TEMPLATE TYPES ====================

export interface AutoForkTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'dietary' | 'cooking_method' | 'time' | 'health' | 'skill';
  modifications: ForkModification[];
  forkNote: string;
  forkTags: string[];
}

export interface ForkModification {
  type:
    | 'substitute_ingredient'
    | 'remove_ingredient'
    | 'reduce_quantity'
    | 'increase_quantity'
    | 'change_cooking_method'
    | 'reduce_time'
    | 'simplify_steps'
    | 'add_instruction';
  target?: string; // e.g., ingredient name, step type
  replacement?: string;
  reason: string;
}

// ==================== TEMPLATE DEFINITIONS ====================

export const AUTO_FORK_TEMPLATES: AutoForkTemplate[] = [
  // Dietary Templates
  {
    id: 'vegetarian',
    name: 'Make Vegetarian',
    description: 'Replace meat with plant-based alternatives',
    icon: '🥬',
    category: 'dietary',
    modifications: [
      {
        type: 'substitute_ingredient',
        target: 'meat',
        replacement: 'tofu or tempeh',
        reason: 'Plant-based protein alternative',
      },
    ],
    forkNote: 'Vegetarian version',
    forkTags: ['vegetarian'],
  },
  {
    id: 'vegan',
    name: 'Make Vegan',
    description: 'Remove all animal products',
    icon: '🌱',
    category: 'dietary',
    modifications: [
      {
        type: 'substitute_ingredient',
        target: 'dairy',
        replacement: 'plant-based alternatives',
        reason: 'Vegan substitution',
      },
      {
        type: 'substitute_ingredient',
        target: 'eggs',
        replacement: 'flax eggs or aquafaba',
        reason: 'Vegan egg replacement',
      },
    ],
    forkNote: 'Vegan version - no animal products',
    forkTags: ['vegan'],
  },
  {
    id: 'gluten-free',
    name: 'Make Gluten-Free',
    description: 'Replace wheat with gluten-free alternatives',
    icon: '🌾',
    category: 'dietary',
    modifications: [
      {
        type: 'substitute_ingredient',
        target: 'flour',
        replacement: 'gluten-free flour blend',
        reason: 'Gluten-free alternative',
      },
      {
        type: 'substitute_ingredient',
        target: 'pasta',
        replacement: 'gluten-free pasta',
        reason: 'Gluten-free alternative',
      },
    ],
    forkNote: 'Gluten-free version',
    forkTags: ['gluten-free'],
  },
  {
    id: 'dairy-free',
    name: 'Make Dairy-Free',
    description: 'Replace dairy with non-dairy alternatives',
    icon: '🥛',
    category: 'dietary',
    modifications: [
      {
        type: 'substitute_ingredient',
        target: 'milk',
        replacement: 'oat milk or almond milk',
        reason: 'Dairy-free alternative',
      },
      {
        type: 'substitute_ingredient',
        target: 'butter',
        replacement: 'olive oil or coconut oil',
        reason: 'Dairy-free alternative',
      },
      {
        type: 'substitute_ingredient',
        target: 'cheese',
        replacement: 'nutritional yeast or dairy-free cheese',
        reason: 'Dairy-free alternative',
      },
    ],
    forkNote: 'Dairy-free version',
    forkTags: ['dairy-free'],
  },
  {
    id: 'keto',
    name: 'Make Keto',
    description: 'Low-carb, high-fat modifications',
    icon: '🥑',
    category: 'dietary',
    modifications: [
      {
        type: 'substitute_ingredient',
        target: 'sugar',
        replacement: 'erythritol or stevia',
        reason: 'Zero-carb sweetener',
      },
      {
        type: 'substitute_ingredient',
        target: 'flour',
        replacement: 'almond flour or coconut flour',
        reason: 'Low-carb flour alternative',
      },
      {
        type: 'remove_ingredient',
        target: 'rice',
        reason: 'High carb - replace with cauliflower rice',
      },
    ],
    forkNote: 'Keto-friendly version - low carb, high fat',
    forkTags: ['keto', 'low-carb'],
  },

  // Cooking Method Templates
  {
    id: 'air-fryer',
    name: 'Air Fryer Version',
    description: 'Convert to air fryer cooking',
    icon: '🌀',
    category: 'cooking_method',
    modifications: [
      {
        type: 'change_cooking_method',
        target: 'frying',
        replacement: 'air frying',
        reason: 'Healthier cooking method with less oil',
      },
      {
        type: 'reduce_quantity',
        target: 'oil',
        reason: 'Air fryer needs much less oil',
      },
      {
        type: 'add_instruction',
        target: 'preheating',
        reason: 'Preheat air fryer to 380°F (190°C) for 3 minutes',
      },
    ],
    forkNote: 'Air fryer version - crispy with less oil',
    forkTags: ['healthier', 'quick'],
  },
  {
    id: 'instant-pot',
    name: 'Instant Pot Version',
    description: 'Adapt for pressure cooker',
    icon: '⏲️',
    category: 'cooking_method',
    modifications: [
      {
        type: 'change_cooking_method',
        target: 'slow_cooking',
        replacement: 'pressure_cooking',
        reason: 'Faster cooking time',
      },
      {
        type: 'reduce_time',
        target: 'cooking_time',
        reason: 'Pressure cooking is much faster',
      },
    ],
    forkNote: 'Instant Pot version - faster cooking',
    forkTags: ['quick'],
  },
  {
    id: 'one-pot',
    name: 'One-Pot Version',
    description: 'Simplify to one pot/pan',
    icon: '🍳',
    category: 'cooking_method',
    modifications: [
      {
        type: 'simplify_steps',
        reason: 'Combine steps to use only one pot',
      },
    ],
    forkNote: 'One-pot version - easier cleanup',
    forkTags: ['simplified'],
  },
  {
    id: 'oven-only',
    name: 'Oven Only',
    description: 'No stovetop needed',
    icon: '🔥',
    category: 'cooking_method',
    modifications: [
      {
        type: 'change_cooking_method',
        target: 'stovetop',
        replacement: 'oven',
        reason: 'Hands-off cooking',
      },
    ],
    forkNote: 'Oven-only version - no stovetop needed',
    forkTags: ['simplified'],
  },

  // Time Templates
  {
    id: 'quick-version',
    name: '30-Minute Version',
    description: 'Speed up with shortcuts',
    icon: '⚡',
    category: 'time',
    modifications: [
      {
        type: 'simplify_steps',
        reason: 'Use pre-made components where possible',
      },
      {
        type: 'reduce_time',
        target: 'marinating',
        reason: 'Skip or reduce marinating time',
      },
    ],
    forkNote: 'Quick 30-minute version',
    forkTags: ['quick'],
  },
  {
    id: 'meal-prep',
    name: 'Meal Prep Version',
    description: 'Batch cooking friendly',
    icon: '📦',
    category: 'time',
    modifications: [
      {
        type: 'increase_quantity',
        target: 'servings',
        reason: 'Scale up for meal prep',
      },
      {
        type: 'add_instruction',
        target: 'storage',
        reason: 'Add storage and reheating instructions',
      },
    ],
    forkNote: 'Meal prep version - make ahead',
    forkTags: ['budget-friendly'],
  },

  // Health Templates
  {
    id: 'low-sodium',
    name: 'Low Sodium',
    description: 'Reduce salt, enhance with herbs',
    icon: '🧂',
    category: 'health',
    modifications: [
      {
        type: 'reduce_quantity',
        target: 'salt',
        reason: 'Reduce sodium content',
      },
      {
        type: 'substitute_ingredient',
        target: 'soy_sauce',
        replacement: 'low-sodium soy sauce or coconut aminos',
        reason: 'Lower sodium alternative',
      },
      {
        type: 'add_instruction',
        target: 'seasoning',
        reason: 'Use herbs and citrus to enhance flavor without salt',
      },
    ],
    forkNote: 'Low sodium version - heart healthy',
    forkTags: ['healthier'],
  },
  {
    id: 'low-calorie',
    name: 'Lighter Version',
    description: 'Reduce calories and fat',
    icon: '🥗',
    category: 'health',
    modifications: [
      {
        type: 'reduce_quantity',
        target: 'oil',
        reason: 'Use less oil/butter',
      },
      {
        type: 'substitute_ingredient',
        target: 'cream',
        replacement: 'Greek yogurt or low-fat milk',
        reason: 'Lower calorie alternative',
      },
    ],
    forkNote: 'Lighter version - fewer calories',
    forkTags: ['healthier'],
  },
  {
    id: 'high-protein',
    name: 'High Protein',
    description: 'Boost protein content',
    icon: '💪',
    category: 'health',
    modifications: [
      {
        type: 'increase_quantity',
        target: 'protein',
        reason: 'Add more protein sources',
      },
      {
        type: 'add_instruction',
        target: 'protein',
        reason: 'Add protein powder, Greek yogurt, or extra meat',
      },
    ],
    forkNote: 'High protein version',
    forkTags: ['healthier'],
  },

  // Skill Templates
  {
    id: 'beginner',
    name: 'Beginner Friendly',
    description: 'Simplified for new cooks',
    icon: '👶',
    category: 'skill',
    modifications: [
      {
        type: 'simplify_steps',
        reason: 'Break down into simpler steps with more detail',
      },
      {
        type: 'substitute_ingredient',
        target: 'advanced_techniques',
        replacement: 'simpler alternatives',
        reason: 'Avoid complex techniques',
      },
    ],
    forkNote: 'Beginner-friendly version - simplified steps',
    forkTags: ['simplified', 'beginner-friendly'],
  },
  {
    id: 'kid-friendly',
    name: 'Kid Friendly',
    description: 'Milder flavors, fun presentation',
    icon: '👧',
    category: 'skill',
    modifications: [
      {
        type: 'reduce_quantity',
        target: 'spices',
        reason: 'Milder flavor for kids',
      },
      {
        type: 'remove_ingredient',
        target: 'hot_peppers',
        reason: 'Remove spicy ingredients',
      },
    ],
    forkNote: 'Kid-friendly version - milder flavors',
    forkTags: ['kid-friendly', 'milder'],
  },
];

// ==================== RESPONSE TYPES ====================

export interface AutoForkPreviewDto {
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

export interface AutoForkResultDto {
  success: boolean;
  newRecipeId?: string;
  changes: {
    ingredientsModified: number;
    stepsModified: number;
  };
  error?: string;
}
