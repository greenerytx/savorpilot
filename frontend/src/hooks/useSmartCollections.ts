import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smartCollectionService } from '../services/smart-collection.service';
import type {
  CreateSmartCollectionDto,
  UpdateSmartCollectionDto,
  FilterRules,
} from '../types/smart-collection';

// Query keys
export const smartCollectionKeys = {
  all: ['smartCollections'] as const,
  lists: () => [...smartCollectionKeys.all, 'list'] as const,
  detail: (id: string) => [...smartCollectionKeys.all, 'detail', id] as const,
  preview: (filters: FilterRules) => [...smartCollectionKeys.all, 'preview', filters] as const,
};

// Get all smart collections
export function useSmartCollections() {
  return useQuery({
    queryKey: smartCollectionKeys.lists(),
    queryFn: () => smartCollectionService.getSmartCollections(),
  });
}

// Get a single smart collection with recipes
export function useSmartCollection(id: string) {
  return useQuery({
    queryKey: smartCollectionKeys.detail(id),
    queryFn: () => smartCollectionService.getSmartCollection(id),
    enabled: !!id,
  });
}

// Create a smart collection
export function useCreateSmartCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSmartCollectionDto) =>
      smartCollectionService.createSmartCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartCollectionKeys.all });
    },
  });
}

// Update a smart collection
export function useUpdateSmartCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSmartCollectionDto }) =>
      smartCollectionService.updateSmartCollection(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: smartCollectionKeys.all });
      queryClient.invalidateQueries({ queryKey: smartCollectionKeys.detail(id) });
    },
  });
}

// Delete a smart collection
export function useDeleteSmartCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => smartCollectionService.deleteSmartCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartCollectionKeys.all });
    },
  });
}

// Preview filter results
export function useFilterPreview(filters: FilterRules, enabled = true) {
  return useQuery({
    queryKey: smartCollectionKeys.preview(filters),
    queryFn: () => smartCollectionService.previewFilter(filters),
    enabled: enabled && Object.keys(filters).length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Initialize system collections
export function useInitSystemCollections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => smartCollectionService.initSystemCollections(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartCollectionKeys.all });
    },
  });
}
