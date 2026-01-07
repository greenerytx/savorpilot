import { useQuery } from '@tanstack/react-query';
import { recipeService } from '../services/recipe.service';
import type {
  CompatibilityReport,
  CompatibleRecipesResponse,
  RecipeAllergenInfo,
  PersonalCompatibilityReport,
} from '../services/recipe.service';

// ==================== QUERY KEYS ====================

export const compatibilityKeys = {
  all: ['recipe-compatibility'] as const,
  check: (recipeId: string, circleId: string) =>
    [...compatibilityKeys.all, 'check', recipeId, circleId] as const,
  compatible: (circleId: string, query?: Record<string, unknown>) =>
    [...compatibilityKeys.all, 'compatible', circleId, query] as const,
  allergens: (recipeId: string) =>
    [...compatibilityKeys.all, 'allergens', recipeId] as const,
  batch: (circleId: string, recipeIds: string[]) =>
    [...compatibilityKeys.all, 'batch', circleId, recipeIds.sort().join(',')] as const,
  personal: (recipeId: string) =>
    [...compatibilityKeys.all, 'personal', recipeId] as const,
};

// ==================== HOOKS ====================

/**
 * Check if a recipe is compatible with a dinner circle
 */
export function useRecipeCompatibility(
  recipeId: string | undefined,
  circleId: string | undefined
) {
  return useQuery<CompatibilityReport>({
    queryKey: compatibilityKeys.check(recipeId || '', circleId || ''),
    queryFn: () => recipeService.checkCompatibility(recipeId!, circleId!),
    enabled: !!recipeId && !!circleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get recipes that are compatible with a dinner circle
 */
export function useCompatibleRecipes(
  circleId: string | undefined,
  query?: { page?: number; limit?: number; search?: string; category?: string }
) {
  return useQuery<CompatibleRecipesResponse>({
    queryKey: compatibilityKeys.compatible(circleId || '', query),
    queryFn: () => recipeService.getCompatibleRecipes(circleId!, query),
    enabled: !!circleId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Analyze a recipe for allergens and dietary restriction violations
 */
export function useRecipeAllergens(recipeId: string | undefined) {
  return useQuery<RecipeAllergenInfo>({
    queryKey: compatibilityKeys.allergens(recipeId || ''),
    queryFn: () => recipeService.analyzeAllergens(recipeId!),
    enabled: !!recipeId,
    staleTime: 1000 * 60 * 10, // 10 minutes - allergens don't change often
  });
}

/**
 * Batch check compatibility for multiple recipes with a circle
 * Useful for showing badges on recipe cards in a list
 */
export function useBatchCompatibility(
  recipeIds: string[],
  circleId: string | undefined
) {
  return useQuery<Record<string, boolean>>({
    queryKey: compatibilityKeys.batch(circleId || '', recipeIds),
    queryFn: () => recipeService.batchCheckCompatibility(recipeIds, circleId!),
    enabled: !!circleId && recipeIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Check if a recipe is compatible with current user's personal dietary preferences
 */
export function usePersonalCompatibility(recipeId: string | undefined) {
  return useQuery<PersonalCompatibilityReport>({
    queryKey: compatibilityKeys.personal(recipeId || ''),
    queryFn: () => recipeService.checkPersonalCompatibility(recipeId!),
    enabled: !!recipeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get severity level for personal compatibility
 */
export function getPersonalCompatibilitySeverity(
  report: PersonalCompatibilityReport
): 'safe' | 'warning' | 'danger' {
  if (report.isCompatible) return 'safe';
  // Allergen conflicts are more severe than restriction conflicts
  return report.allergenConflicts.length > 0 ? 'danger' : 'warning';
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format a list of member names for display
 * e.g., "Sarah, Tom, and 2 others"
 */
export function formatAffectedMembers(
  memberNames: string[],
  maxDisplay: number = 2
): string {
  if (memberNames.length === 0) return '';
  if (memberNames.length === 1) return memberNames[0];
  if (memberNames.length <= maxDisplay) {
    return memberNames.slice(0, -1).join(', ') + ' and ' + memberNames[memberNames.length - 1];
  }
  const displayed = memberNames.slice(0, maxDisplay).join(', ');
  const remaining = memberNames.length - maxDisplay;
  return `${displayed}, and ${remaining} other${remaining > 1 ? 's' : ''}`;
}

/**
 * Get a severity level for the compatibility issue
 */
export function getCompatibilitySeverity(
  report: CompatibilityReport
): 'safe' | 'warning' | 'danger' {
  if (report.isCompatible) return 'safe';

  // Check if any allergen conflicts (more severe than restriction conflicts)
  const hasAllergenConflicts = report.memberConflicts.some(
    (m) => m.allergenConflicts.length > 0
  );

  return hasAllergenConflicts ? 'danger' : 'warning';
}

/**
 * Get a human-readable summary of conflicts
 */
export function getConflictSummary(report: CompatibilityReport): string {
  if (report.isCompatible) {
    return `Safe for all ${report.safeForMembers.length} members`;
  }

  const allergenCount = report.allConflictingAllergens.length;
  const restrictionCount = report.allConflictingRestrictions.length;
  const memberCount = report.memberConflicts.length;

  const parts: string[] = [];
  if (allergenCount > 0) {
    parts.push(`${allergenCount} allergen${allergenCount > 1 ? 's' : ''}`);
  }
  if (restrictionCount > 0) {
    parts.push(`${restrictionCount} restriction${restrictionCount > 1 ? 's' : ''}`);
  }

  return `Contains ${parts.join(' and ')} affecting ${memberCount} member${memberCount > 1 ? 's' : ''}`;
}
