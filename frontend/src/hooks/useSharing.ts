import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareService } from '../services/share.service';
import type { ShareRecipeDto, ShareGroupDto, UpdateShareDto } from '../services/share.service';

// Query keys
export const sharingKeys = {
  all: ['sharing'] as const,
  recipeShares: (recipeId: string) => [...sharingKeys.all, 'recipe', recipeId] as const,
  groupShares: (groupId: string) => [...sharingKeys.all, 'group', groupId] as const,
  smartCollectionShares: (collectionId: string) => [...sharingKeys.all, 'smart-collection', collectionId] as const,
  recipesSharedByMe: () => [...sharingKeys.all, 'recipes', 'by-me'] as const,
  recipesSharedWithMe: () => [...sharingKeys.all, 'recipes', 'with-me'] as const,
  groupsSharedByMe: () => [...sharingKeys.all, 'groups', 'by-me'] as const,
  groupsSharedWithMe: () => [...sharingKeys.all, 'groups', 'with-me'] as const,
  smartCollectionsSharedByMe: () => [...sharingKeys.all, 'smart-collections', 'by-me'] as const,
  smartCollectionsSharedWithMe: () => [...sharingKeys.all, 'smart-collections', 'with-me'] as const,
  userSearch: (query: string) => [...sharingKeys.all, 'users', query] as const,
};

// Get shares for a specific recipe
export function useRecipeShares(recipeId: string) {
  return useQuery({
    queryKey: sharingKeys.recipeShares(recipeId),
    queryFn: () => shareService.getRecipeShares(recipeId),
    enabled: !!recipeId,
  });
}

// Get shares for a specific group
export function useGroupShares(groupId: string) {
  return useQuery({
    queryKey: sharingKeys.groupShares(groupId),
    queryFn: () => shareService.getGroupShares(groupId),
    enabled: !!groupId,
  });
}

// Get recipes shared by current user
export function useRecipesSharedByMe() {
  return useQuery({
    queryKey: sharingKeys.recipesSharedByMe(),
    queryFn: () => shareService.getRecipesSharedByMe(),
  });
}

// Get recipes shared with current user
export function useRecipesSharedWithMe() {
  return useQuery({
    queryKey: sharingKeys.recipesSharedWithMe(),
    queryFn: () => shareService.getRecipesSharedWithMe(),
  });
}

// Get groups shared by current user
export function useGroupsSharedByMe() {
  return useQuery({
    queryKey: sharingKeys.groupsSharedByMe(),
    queryFn: () => shareService.getGroupsSharedByMe(),
  });
}

// Get groups shared with current user
export function useGroupsSharedWithMe() {
  return useQuery({
    queryKey: sharingKeys.groupsSharedWithMe(),
    queryFn: () => shareService.getGroupsSharedWithMe(),
  });
}

// Search users for sharing
export function useUserSearch(query: string) {
  return useQuery({
    queryKey: sharingKeys.userSearch(query),
    queryFn: () => shareService.searchUsers(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Share recipe mutation
export function useShareRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, data }: { recipeId: string; data: ShareRecipeDto }) =>
      shareService.shareRecipe(recipeId, data),
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: sharingKeys.recipeShares(recipeId) });
      queryClient.invalidateQueries({ queryKey: sharingKeys.recipesSharedByMe() });
    },
  });
}

// Share group mutation
export function useShareGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: ShareGroupDto }) =>
      shareService.shareGroup(groupId, data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: sharingKeys.groupShares(groupId) });
      queryClient.invalidateQueries({ queryKey: sharingKeys.groupsSharedByMe() });
    },
  });
}

// Update recipe share mutation
export function useUpdateRecipeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, data }: { shareId: string; data: UpdateShareDto }) =>
      shareService.updateRecipeShare(shareId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingKeys.all });
    },
  });
}

// Revoke recipe share mutation
export function useRevokeRecipeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => shareService.revokeRecipeShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingKeys.all });
    },
  });
}

// Revoke group share mutation
export function useRevokeGroupShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => shareService.revokeGroupShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingKeys.all });
    },
  });
}

// Smart Collection sharing hooks

// Get shares for a specific smart collection
export function useSmartCollectionShares(collectionId: string) {
  return useQuery({
    queryKey: sharingKeys.smartCollectionShares(collectionId),
    queryFn: () => shareService.getSmartCollectionShares(collectionId),
    enabled: !!collectionId,
  });
}

// Get smart collections shared by current user
export function useSmartCollectionsSharedByMe() {
  return useQuery({
    queryKey: sharingKeys.smartCollectionsSharedByMe(),
    queryFn: () => shareService.getSmartCollectionsSharedByMe(),
  });
}

// Get smart collections shared with current user
export function useSmartCollectionsSharedWithMe() {
  return useQuery({
    queryKey: sharingKeys.smartCollectionsSharedWithMe(),
    queryFn: () => shareService.getSmartCollectionsSharedWithMe(),
  });
}

// Share smart collection mutation
export function useShareSmartCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, data }: { collectionId: string; data: ShareGroupDto }) =>
      shareService.shareSmartCollection(collectionId, data),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: sharingKeys.smartCollectionShares(collectionId) });
      queryClient.invalidateQueries({ queryKey: sharingKeys.smartCollectionsSharedByMe() });
    },
  });
}

// Revoke smart collection share mutation
export function useRevokeSmartCollectionShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => shareService.revokeSmartCollectionShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingKeys.all });
    },
  });
}
