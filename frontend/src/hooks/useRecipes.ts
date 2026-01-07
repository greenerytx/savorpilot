import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '../services/recipe.service';
import type { RecipeQuery, CreateRecipeDto, UpdateRecipeDto, ForkRecipeDto } from '../types/recipe';

// Query keys
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (query: RecipeQuery) => [...recipeKeys.lists(), query] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
  shared: () => [...recipeKeys.all, 'shared'] as const,
  statistics: () => [...recipeKeys.all, 'statistics'] as const,
  forks: (id: string) => [...recipeKeys.detail(id), 'forks'] as const,
  lineage: (id: string) => [...recipeKeys.detail(id), 'lineage'] as const,
  comparison: (id1: string, id2: string) => [...recipeKeys.all, 'compare', id1, id2] as const,
};

// Get recipes with pagination and filters
export function useRecipes(query?: RecipeQuery) {
  return useQuery({
    queryKey: recipeKeys.list(query || {}),
    queryFn: () => recipeService.getRecipes(query),
  });
}

// Get a single recipe
export function useRecipe(id: string) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => recipeService.getRecipe(id),
    enabled: !!id,
  });
}

// Get recipes shared with user
export function useSharedRecipes(query?: RecipeQuery) {
  return useQuery({
    queryKey: [...recipeKeys.shared(), query],
    queryFn: () => recipeService.getSharedRecipes(query),
  });
}

// Get recipe statistics
export function useRecipeStatistics() {
  return useQuery({
    queryKey: recipeKeys.statistics(),
    queryFn: () => recipeService.getStatistics(),
  });
}

// Create recipe mutation
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecipeDto) => recipeService.createRecipe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeKeys.statistics() });
    },
  });
}

// Update recipe mutation
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecipeDto }) =>
      recipeService.updateRecipe(id, data),
    onSuccess: (recipe) => {
      queryClient.setQueryData(recipeKeys.detail(recipe.id), recipe);
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

// Delete recipe mutation
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recipeService.deleteRecipe(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: recipeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeKeys.statistics() });
    },
  });
}

// Update notes mutation
export function useUpdateRecipeNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      personalNotes,
      sharedNotes,
    }: {
      id: string;
      personalNotes?: string;
      sharedNotes?: string;
    }) => recipeService.updateNotes(id, personalNotes, sharedNotes),
    onSuccess: (recipe) => {
      queryClient.setQueryData(recipeKeys.detail(recipe.id), recipe);
    },
  });
}

// Download and store image locally
export function useDownloadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, imageUrl }: { recipeId: string; imageUrl: string }) =>
      recipeService.downloadImage(recipeId, imageUrl),
    onSuccess: (_, { recipeId }) => {
      // Refetch the recipe to get the updated image URL
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
      // Also invalidate the lists so recipe cards update
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

// Download and store video locally (fetches fresh URL from Instagram)
export function useDownloadVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) => recipeService.downloadVideo(recipeId),
    onSuccess: (_, recipeId) => {
      // Refetch the recipe to get the updated video URL
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    },
  });
}

// Translate recipe mutation
export function useTranslateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) => recipeService.translateRecipe(recipeId),
    onSuccess: (_, recipeId) => {
      // Invalidate translations query
      queryClient.invalidateQueries({ queryKey: [...recipeKeys.detail(recipeId), 'translations'] });
    },
  });
}

// Get recipe translations
export function useRecipeTranslations(recipeId: string) {
  return useQuery({
    queryKey: [...recipeKeys.detail(recipeId), 'translations'],
    queryFn: () => recipeService.getTranslations(recipeId),
    enabled: !!recipeId,
  });
}

// ==================== FORKING HOOKS ====================

// Fork a recipe mutation
export function useForkRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, dto }: { recipeId: string; dto?: ForkRecipeDto }) =>
      recipeService.forkRecipe(recipeId, dto),
    onSuccess: (newRecipe, { recipeId }) => {
      // Invalidate parent recipe to update fork count
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
      // Invalidate forks list for the parent
      queryClient.invalidateQueries({ queryKey: recipeKeys.forks(recipeId) });
      // Invalidate recipe lists
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeKeys.statistics() });
    },
  });
}

// Get forks of a recipe
export function useRecipeForks(recipeId: string, query?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: recipeKeys.forks(recipeId),
    queryFn: () => recipeService.getRecipeForks(recipeId, query),
    enabled: !!recipeId,
  });
}

// Get recipe lineage (ancestors and forks)
export function useRecipeLineage(recipeId: string) {
  return useQuery({
    queryKey: recipeKeys.lineage(recipeId),
    queryFn: () => recipeService.getRecipeLineage(recipeId),
    enabled: !!recipeId,
  });
}

// Compare two recipes
export function useRecipeComparison(recipeId1: string, recipeId2: string, enabled = true) {
  return useQuery({
    queryKey: recipeKeys.comparison(recipeId1, recipeId2),
    queryFn: () => recipeService.compareRecipes(recipeId1, recipeId2),
    enabled: enabled && !!recipeId1 && !!recipeId2,
  });
}

// ==================== VISIBILITY HOOKS ====================

// Update recipe visibility mutation
export function useUpdateRecipeVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, visibility }: { recipeId: string; visibility: 'PRIVATE' | 'FOLLOWERS' | 'PUBLIC' }) =>
      recipeService.updateVisibility(recipeId, visibility),
    onSuccess: (updatedRecipe) => {
      // Update the recipe in cache
      queryClient.setQueryData(recipeKeys.detail(updatedRecipe.id), updatedRecipe);
      // Invalidate recipe lists
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

// Bulk update recipe visibility mutation
export function useBulkUpdateVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeIds, visibility }: { recipeIds: string[]; visibility: 'PRIVATE' | 'FOLLOWERS' | 'PUBLIC' }) =>
      recipeService.bulkUpdateVisibility(recipeIds, visibility),
    onSuccess: () => {
      // Invalidate all recipe queries to refresh data
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeKeys.all });
    },
  });
}

// ==================== AI CHAT HOOKS ====================

import { aiService } from '../services/recipe.service';

// Recipe chat mutation - for AI cooking assistant
export function useRecipeChat() {
  return useMutation({
    mutationFn: ({
      recipeId,
      message,
      conversationHistory,
    }: {
      recipeId: string;
      message: string;
      conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
    }) => aiService.recipeChat(recipeId, message, conversationHistory),
  });
}
