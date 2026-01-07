import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '../services/recipe.service';
import type { CreateGroupDto, UpdateGroupDto } from '../types/recipe';

// Query keys
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (query?: { page?: number; limit?: number; search?: string }) =>
    [...groupKeys.lists(), query] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  shared: () => [...groupKeys.all, 'shared'] as const,
};

// Get all groups
export function useGroups(query?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: groupKeys.list(query),
    queryFn: () => groupService.getGroups(query),
  });
}

// Get a single group with recipes
export function useGroup(id: string) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => groupService.getGroup(id),
    enabled: !!id,
  });
}

// Get groups shared with user
export function useSharedGroups(query?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...groupKeys.shared(), query],
    queryFn: () => groupService.getSharedGroups(query),
  });
}

// Create group mutation
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupDto) => groupService.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

// Update group mutation
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupDto }) =>
      groupService.updateGroup(id, data),
    onSuccess: (group) => {
      queryClient.setQueryData(groupKeys.detail(group.id), group);
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

// Delete group mutation
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groupService.deleteGroup(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: groupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

// Add recipes to group mutation
export function useAddRecipesToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, recipeIds }: { groupId: string; recipeIds: string[] }) =>
      groupService.addRecipesToGroup(groupId, recipeIds),
    onSuccess: (group) => {
      queryClient.setQueryData(groupKeys.detail(group.id), group);
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

// Remove recipes from group mutation
export function useRemoveRecipesFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, recipeIds }: { groupId: string; recipeIds: string[] }) =>
      groupService.removeRecipesFromGroup(groupId, recipeIds),
    onSuccess: (group) => {
      queryClient.setQueryData(groupKeys.detail(group.id), group);
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}
