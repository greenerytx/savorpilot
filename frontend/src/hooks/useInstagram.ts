import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instagramService } from '../services/instagram.service';
import type {
  SavedPostsQuery,
  SyncInstagramDto,
  ImportSinglePostDto,
  BulkImportDto,
  GenerateStepsDto,
  ReloadImageDto,
  BulkReloadImagesDto,
} from '../types/instagram';

// Query keys for cache management
export const instagramKeys = {
  all: ['instagram'] as const,
  posts: () => [...instagramKeys.all, 'posts'] as const,
  postsList: (query: SavedPostsQuery) => [...instagramKeys.posts(), 'list', query] as const,
  postDetail: (id: string) => [...instagramKeys.posts(), 'detail', id] as const,
  filtersBase: () => [...instagramKeys.all, 'filters'] as const,
  filters: (status?: string) => [...instagramKeys.filtersBase(), status] as const,
  importJobs: () => [...instagramKeys.all, 'import-jobs'] as const,
  importJob: (id: string) => [...instagramKeys.importJobs(), id] as const,
};

/**
 * Get saved Instagram posts with filters and pagination
 */
export function useSavedPosts(query?: SavedPostsQuery) {
  return useQuery({
    queryKey: instagramKeys.postsList(query || {}),
    queryFn: () => instagramService.getSavedPosts(query),
  });
}

/**
 * Get a single saved post
 */
export function useSavedPost(id: string) {
  return useQuery({
    queryKey: instagramKeys.postDetail(id),
    queryFn: () => instagramService.getSavedPost(id),
    enabled: !!id,
  });
}

/**
 * Get filter options for saved posts
 */
export function useSavedPostFilters(status?: string) {
  return useQuery({
    queryKey: instagramKeys.filters(status),
    queryFn: () => instagramService.getFilters(status),
  });
}

/**
 * Sync saved posts from Instagram
 */
export function useSyncInstagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SyncInstagramDto) => instagramService.syncPosts(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
      queryClient.invalidateQueries({ queryKey: instagramKeys.filtersBase() });
    },
  });
}

/**
 * Parse a saved post to extract recipe data
 */
export function useParsePost() {
  return useMutation({
    mutationFn: (id: string) => instagramService.parsePost(id),
  });
}

/**
 * Translate a post's caption
 */
export function useTranslateCaption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => instagramService.translateCaption(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.postDetail(id) });
    },
  });
}

/**
 * Generate cooking steps with AI
 */
export function useGenerateSteps() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: GenerateStepsDto }) =>
      instagramService.generateSteps(id, dto),
  });
}

/**
 * Import a single post as a recipe
 */
export function useImportPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ImportSinglePostDto }) =>
      instagramService.importPost(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.postDetail(id) });
      queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
      queryClient.invalidateQueries({ queryKey: instagramKeys.filtersBase() });
    },
  });
}

/**
 * Queue a bulk import job
 */
export function useBulkImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: BulkImportDto) => instagramService.bulkImport(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
      queryClient.invalidateQueries({ queryKey: instagramKeys.filtersBase() });
    },
  });
}

/**
 * Get import job status
 */
export function useImportJobStatus(jobId: string, enabled = true) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: instagramKeys.importJob(jobId),
    queryFn: async () => {
      const result = await instagramService.getImportJobStatus(jobId);
      // Invalidate posts and filters when job completes
      if (result.status === 'COMPLETED' || result.status === 'FAILED') {
        queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
        queryClient.invalidateQueries({ queryKey: instagramKeys.filtersBase() });
      }
      return result;
    },
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      // Poll every 2 seconds while job is in progress
      const status = query.state.data?.status;
      if (status === 'PENDING' || status === 'PROCESSING') {
        return 2000;
      }
      return false;
    },
  });
}

/**
 * Dismiss posts
 */
export function useDismissPosts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postIds: string[]) => instagramService.dismissPosts(postIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
      queryClient.invalidateQueries({ queryKey: instagramKeys.filtersBase() });
    },
  });
}

/**
 * Restore a dismissed post
 */
export function useRestorePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => instagramService.restorePost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.postDetail(id) });
      queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
      queryClient.invalidateQueries({ queryKey: instagramKeys.filtersBase() });
    },
  });
}

/**
 * Delete posts permanently
 */
export function useDeletePosts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postIds: string[]) => instagramService.deletePosts(postIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
      queryClient.invalidateQueries({ queryKey: instagramKeys.filtersBase() });
    },
  });
}

/**
 * Delete all posts by status
 */
export function useDeleteAllByStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: string) => instagramService.deleteAllByStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
      queryClient.invalidateQueries({ queryKey: instagramKeys.filtersBase() });
    },
  });
}

/**
 * Get all post IDs by status (for mass selection)
 */
export function usePostIdsByStatus(status?: string, enabled = false) {
  return useQuery({
    queryKey: [...instagramKeys.posts(), 'ids', status],
    queryFn: () => instagramService.getPostIdsByFilters({ status }),
    enabled,
  });
}

/**
 * Reload image for a single post
 */
export function useReloadPostImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, dto }: { postId: string; dto: ReloadImageDto }) =>
      instagramService.reloadPostImage(postId, dto),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.postDetail(postId) });
      queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
    },
  });
}

/**
 * Bulk reload images for multiple posts
 */
export function useBulkReloadImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: BulkReloadImagesDto) => instagramService.bulkReloadImages(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
    },
  });
}
