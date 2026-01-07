import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { flavorDnaService, InteractionType } from '../services/flavor-dna.service';
import type {
  TrackInteractionDto,
  CreateCookingReviewDto,
  UpdateCookingReviewDto,
  CreateSeasoningFeedbackDto,
} from '../services/flavor-dna.service';

// ==================== QUERY KEYS ====================

export const flavorDnaKeys = {
  all: ['flavor-dna'] as const,
  interactions: () => [...flavorDnaKeys.all, 'interactions'] as const,
  recipeStats: (recipeId: string) => [...flavorDnaKeys.interactions(), 'stats', recipeId] as const,
  recentInteractions: () => [...flavorDnaKeys.interactions(), 'recent'] as const,
  reviews: () => [...flavorDnaKeys.all, 'reviews'] as const,
  userReview: (recipeId: string) => [...flavorDnaKeys.reviews(), 'user', recipeId] as const,
  recipeReviewStats: (recipeId: string) => [...flavorDnaKeys.reviews(), 'stats', recipeId] as const,
  seasoning: () => [...flavorDnaKeys.all, 'seasoning'] as const,
  seasoningPreferences: () => [...flavorDnaKeys.seasoning(), 'preferences'] as const,
  profile: () => [...flavorDnaKeys.all, 'profile'] as const,
  profileSummary: () => [...flavorDnaKeys.profile(), 'summary'] as const,
  recommendations: (limit?: number) => [...flavorDnaKeys.all, 'recommendations', limit] as const,
  matchScore: (recipeId: string) => [...flavorDnaKeys.all, 'match-score', recipeId] as const,
};

// ==================== INTERACTION HOOKS ====================

/**
 * Track a recipe interaction (view, save, cook, etc.)
 */
export function useTrackInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: TrackInteractionDto) => flavorDnaService.trackInteraction(dto),
    onSuccess: (_, dto) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: flavorDnaKeys.recipeStats(dto.recipeId) });
      queryClient.invalidateQueries({ queryKey: flavorDnaKeys.recentInteractions() });

      // Profile updates happen asynchronously on the backend
      // We can invalidate profile after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: flavorDnaKeys.profile() });
      }, 2000);
    },
  });
}

/**
 * Automatically track recipe views with time spent
 */
export function useTrackRecipeView(recipeId: string | undefined, enabled = true) {
  const trackMutation = useTrackInteraction();
  const startTimeRef = useRef<number | null>(null);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!recipeId || !enabled || hasTrackedRef.current) return;

    // Track view immediately
    startTimeRef.current = Date.now();
    trackMutation.mutate({
      recipeId,
      type: InteractionType.VIEW,
    });
    hasTrackedRef.current = true;

    // Track duration when leaving page
    return () => {
      if (startTimeRef.current) {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (duration > 5) {
          // Only track if they stayed more than 5 seconds
          trackMutation.mutate({
            recipeId,
            type: InteractionType.VIEW,
            duration,
            metadata: { isExitEvent: true },
          });
        }
      }
    };
  }, [recipeId, enabled]);

  // Reset when recipeId changes
  useEffect(() => {
    hasTrackedRef.current = false;
    startTimeRef.current = null;
  }, [recipeId]);
}

/**
 * Get interaction stats for a recipe
 */
export function useRecipeInteractionStats(recipeId: string) {
  return useQuery({
    queryKey: flavorDnaKeys.recipeStats(recipeId),
    queryFn: () => flavorDnaService.getRecipeInteractionStats(recipeId),
    enabled: !!recipeId,
  });
}

/**
 * Get user's recent interactions
 */
export function useRecentInteractions(limit = 50) {
  return useQuery({
    queryKey: flavorDnaKeys.recentInteractions(),
    queryFn: () => flavorDnaService.getRecentInteractions(limit),
  });
}

// ==================== COOKING REVIEW HOOKS ====================

/**
 * Create a cooking review ("Made It" flow)
 */
export function useCreateCookingReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCookingReviewDto) => flavorDnaService.createReview(dto),
    onSuccess: (_, dto) => {
      queryClient.invalidateQueries({ queryKey: flavorDnaKeys.userReview(dto.recipeId) });
      queryClient.invalidateQueries({ queryKey: flavorDnaKeys.recipeReviewStats(dto.recipeId) });
      queryClient.invalidateQueries({ queryKey: flavorDnaKeys.profile() });
    },
  });
}

/**
 * Update an existing cooking review
 */
export function useUpdateCookingReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, dto }: { reviewId: string; dto: UpdateCookingReviewDto }) =>
      flavorDnaService.updateReview(reviewId, dto),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: flavorDnaKeys.userReview(review.recipeId) });
      queryClient.invalidateQueries({ queryKey: flavorDnaKeys.recipeReviewStats(review.recipeId) });
    },
  });
}

/**
 * Get user's review for a specific recipe
 */
export function useUserReviewForRecipe(recipeId: string) {
  return useQuery({
    queryKey: flavorDnaKeys.userReview(recipeId),
    queryFn: () => flavorDnaService.getUserReviewForRecipe(recipeId),
    enabled: !!recipeId,
  });
}

/**
 * Get review stats for a recipe
 */
export function useRecipeReviewStats(recipeId: string) {
  return useQuery({
    queryKey: flavorDnaKeys.recipeReviewStats(recipeId),
    queryFn: () => flavorDnaService.getRecipeReviewStats(recipeId),
    enabled: !!recipeId,
  });
}

// ==================== SEASONING FEEDBACK HOOKS (SALT SENSE) ====================

/**
 * Record seasoning feedback during cooking
 */
export function useRecordSeasoningFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSeasoningFeedbackDto) =>
      flavorDnaService.recordSeasoningFeedback(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flavorDnaKeys.seasoningPreferences() });
      queryClient.invalidateQueries({ queryKey: flavorDnaKeys.profile() });
    },
  });
}

/**
 * Get user's seasoning preferences
 */
export function useSeasoningPreferences() {
  return useQuery({
    queryKey: flavorDnaKeys.seasoningPreferences(),
    queryFn: () => flavorDnaService.getSeasoningPreferences(),
  });
}

// ==================== FLAVOR PROFILE HOOKS ====================

/**
 * Get full flavor profile
 */
export function useFlavorProfile() {
  return useQuery({
    queryKey: flavorDnaKeys.profile(),
    queryFn: () => flavorDnaService.getFlavorProfile(),
  });
}

/**
 * Get flavor profile summary (human-readable)
 */
export function useFlavorProfileSummary() {
  return useQuery({
    queryKey: flavorDnaKeys.profileSummary(),
    queryFn: () => flavorDnaService.getFlavorProfileSummary(),
  });
}

// ==================== RECOMMENDATIONS HOOKS ====================

/**
 * Get personalized recipe recommendations based on Flavor DNA
 */
export function useRecommendedRecipes(limit = 10) {
  return useQuery({
    queryKey: flavorDnaKeys.recommendations(limit),
    queryFn: () => flavorDnaService.getRecommendedRecipes(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== MATCH SCORE HOOKS ====================

/**
 * Get personalized match score for a specific recipe
 */
export function useRecipeMatchScore(recipeId: string | undefined) {
  return useQuery({
    queryKey: flavorDnaKeys.matchScore(recipeId || ''),
    queryFn: () => flavorDnaService.getRecipeMatchScore(recipeId!),
    enabled: !!recipeId,
    staleTime: 10 * 60 * 1000, // 10 minutes - score doesn't change often
  });
}

// ==================== CONVENIENCE HOOKS ====================

/**
 * Combined hook for tracking common recipe actions
 */
export function useRecipeActions(recipeId: string) {
  const trackMutation = useTrackInteraction();

  const trackSave = useCallback(() => {
    trackMutation.mutate({ recipeId, type: InteractionType.SAVE });
  }, [recipeId, trackMutation]);

  const trackUnsave = useCallback(() => {
    trackMutation.mutate({ recipeId, type: InteractionType.UNSAVE });
  }, [recipeId, trackMutation]);

  const trackCookStart = useCallback(() => {
    trackMutation.mutate({ recipeId, type: InteractionType.COOK_START });
  }, [recipeId, trackMutation]);

  const trackCookComplete = useCallback(() => {
    trackMutation.mutate({ recipeId, type: InteractionType.COOK_COMPLETE });
  }, [recipeId, trackMutation]);

  const trackPrint = useCallback(() => {
    trackMutation.mutate({ recipeId, type: InteractionType.PRINT });
  }, [recipeId, trackMutation]);

  const trackShare = useCallback(() => {
    trackMutation.mutate({ recipeId, type: InteractionType.SHARE });
  }, [recipeId, trackMutation]);

  const trackFork = useCallback(() => {
    trackMutation.mutate({ recipeId, type: InteractionType.FORK });
  }, [recipeId, trackMutation]);

  return {
    trackSave,
    trackUnsave,
    trackCookStart,
    trackCookComplete,
    trackPrint,
    trackShare,
    trackFork,
    isTracking: trackMutation.isPending,
  };
}
