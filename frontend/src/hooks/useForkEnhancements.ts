import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forkEnhancementsService } from '../services/fork-enhancements.service';

// ==================== QUERY KEYS ====================

export const forkEnhancementsKeys = {
  all: ['fork-enhancements'] as const,
  tagOptions: () => [...forkEnhancementsKeys.all, 'tag-options'] as const,
  voteStats: (recipeId: string) =>
    [...forkEnhancementsKeys.all, 'vote-stats', recipeId] as const,
  smartSuggestions: (recipeId: string) =>
    [...forkEnhancementsKeys.all, 'smart-suggestions', recipeId] as const,
  changelog: (forkId: string) =>
    [...forkEnhancementsKeys.all, 'changelog', forkId] as const,
  gallery: (recipeId: string) =>
    [...forkEnhancementsKeys.all, 'gallery', recipeId] as const,
  analytics: () => [...forkEnhancementsKeys.all, 'analytics'] as const,
  comparisonMatrix: (recipeId: string) =>
    [...forkEnhancementsKeys.all, 'comparison-matrix', recipeId] as const,
  validationStats: (recipeId: string) =>
    [...forkEnhancementsKeys.all, 'validation-stats', recipeId] as const,
  topValidatedForks: (recipeId: string) =>
    [...forkEnhancementsKeys.all, 'top-validated-forks', recipeId] as const,
};

// ==================== FORK TAG HOOKS ====================

export function useForkTagOptions() {
  return useQuery({
    queryKey: forkEnhancementsKeys.tagOptions(),
    queryFn: () => forkEnhancementsService.getForkTagOptions(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - tags don't change often
  });
}

export function useUpdateForkTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, tags }: { recipeId: string; tags: string[] }) =>
      forkEnhancementsService.updateForkTags(recipeId, tags),
    onSuccess: (_, { recipeId }) => {
      // Invalidate the recipe query to refresh tags
      queryClient.invalidateQueries({ queryKey: ['recipes', recipeId] });
    },
  });
}

// ==================== FORK VOTING HOOKS ====================

export function useForkVoteStats(recipeId: string) {
  return useQuery({
    queryKey: forkEnhancementsKeys.voteStats(recipeId),
    queryFn: () => forkEnhancementsService.getForkVoteStats(recipeId),
    enabled: !!recipeId,
  });
}

export function useVoteFork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) =>
      forkEnhancementsService.voteFork(recipeId),
    onSuccess: (_, recipeId) => {
      queryClient.invalidateQueries({
        queryKey: forkEnhancementsKeys.voteStats(recipeId),
      });
      queryClient.invalidateQueries({
        queryKey: forkEnhancementsKeys.gallery(recipeId),
      });
    },
  });
}

export function useUnvoteFork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) =>
      forkEnhancementsService.unvoteFork(recipeId),
    onSuccess: (_, recipeId) => {
      queryClient.invalidateQueries({
        queryKey: forkEnhancementsKeys.voteStats(recipeId),
      });
      queryClient.invalidateQueries({
        queryKey: forkEnhancementsKeys.gallery(recipeId),
      });
    },
  });
}

// ==================== SMART FORK SUGGESTION HOOKS ====================

export function useSmartForkSuggestions(recipeId: string) {
  return useQuery({
    queryKey: forkEnhancementsKeys.smartSuggestions(recipeId),
    queryFn: () => forkEnhancementsService.getSmartForkSuggestions(recipeId),
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== FORK CHANGELOG HOOKS ====================

export function useForkChangelog(forkId: string) {
  return useQuery({
    queryKey: forkEnhancementsKeys.changelog(forkId),
    queryFn: () => forkEnhancementsService.getForkChangelog(forkId),
    enabled: !!forkId,
    staleTime: 10 * 60 * 1000, // 10 minutes - changelogs don't change
  });
}

// ==================== FORK GALLERY HOOKS ====================

export function useForkGallery(
  recipeId: string,
  options?: { limit?: number; offset?: number; sortBy?: string },
) {
  return useQuery({
    queryKey: [...forkEnhancementsKeys.gallery(recipeId), options],
    queryFn: () => forkEnhancementsService.getForkGallery(recipeId, options),
    enabled: !!recipeId,
  });
}

// ==================== FORK ANALYTICS HOOKS ====================

export function useForkAnalytics() {
  return useQuery({
    queryKey: forkEnhancementsKeys.analytics(),
    queryFn: () => forkEnhancementsService.getForkAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== FORK COMPARISON MATRIX HOOKS ====================

export function useForkComparisonMatrix(recipeId: string) {
  return useQuery({
    queryKey: forkEnhancementsKeys.comparisonMatrix(recipeId),
    queryFn: () => forkEnhancementsService.getForkComparisonMatrix(recipeId),
    enabled: !!recipeId,
  });
}

// ==================== COOK TRIALS + VALIDATION HOOKS ====================

export function useForkValidationStats(recipeId: string) {
  return useQuery({
    queryKey: forkEnhancementsKeys.validationStats(recipeId),
    queryFn: () => forkEnhancementsService.getForkValidationStats(recipeId),
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTopValidatedForks(recipeId: string, limit = 5) {
  return useQuery({
    queryKey: [...forkEnhancementsKeys.topValidatedForks(recipeId), limit],
    queryFn: () => forkEnhancementsService.getTopValidatedForks(recipeId, limit),
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== AUTO-FORK TEMPLATE HOOKS ====================

export function useAutoForkTemplates() {
  return useQuery({
    queryKey: [...forkEnhancementsKeys.all, 'auto-fork-templates'],
    queryFn: () => forkEnhancementsService.getAutoForkTemplates(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - templates don't change
  });
}

export function useAutoForkTemplatesByCategory() {
  return useQuery({
    queryKey: [...forkEnhancementsKeys.all, 'auto-fork-templates-by-category'],
    queryFn: () => forkEnhancementsService.getAutoForkTemplatesByCategory(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useAutoForkPreview(recipeId: string, templateId: string | null) {
  return useQuery({
    queryKey: [...forkEnhancementsKeys.all, 'auto-fork-preview', recipeId, templateId],
    queryFn: () => forkEnhancementsService.previewAutoFork(recipeId, templateId!),
    enabled: !!recipeId && !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useApplyAutoFork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, templateId }: { recipeId: string; templateId: string }) =>
      forkEnhancementsService.applyAutoFork(recipeId, templateId),
    onSuccess: (_, { recipeId }) => {
      // Invalidate recipe queries to show new fork
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({
        queryKey: forkEnhancementsKeys.gallery(recipeId),
      });
    },
  });
}

// ==================== FORK OUTCOME PREDICTION HOOKS ====================

export function useForkOutcomePrediction(recipeId: string) {
  return useQuery({
    queryKey: [...forkEnhancementsKeys.all, 'outcome-prediction', recipeId],
    queryFn: () => forkEnhancementsService.getForkOutcomePrediction(recipeId),
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== GENEALOGY TREE HOOKS ====================

export function useGenealogyTree(recipeId: string, maxDepth = 5) {
  return useQuery({
    queryKey: [...forkEnhancementsKeys.all, 'genealogy-tree', recipeId, maxDepth],
    queryFn: () => forkEnhancementsService.getGenealogyTree(recipeId, maxDepth),
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000, // 5 minutes - trees can change
  });
}
