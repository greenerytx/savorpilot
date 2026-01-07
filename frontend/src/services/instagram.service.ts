import { api } from './api';
import type {
  SavedInstagramPost,
  SavedPostsListResponse,
  SavedPostsQuery,
  FiltersResponse,
  SyncInstagramDto,
  SyncResponse,
  ParsedInstagramPost,
  ImportSinglePostDto,
  BulkImportDto,
  BulkImportResponse,
  ImportJobStatus,
  GenerateStepsDto,
  GeneratedSteps,
  ReloadImageDto,
  BulkReloadImagesDto,
  ReloadImageResponse,
  BulkReloadImagesResponse,
} from '../types/instagram';

export const instagramService = {
  /**
   * Sync saved posts from Instagram using cookies
   */
  async syncPosts(dto: SyncInstagramDto): Promise<SyncResponse> {
    const response = await api.post<SyncResponse>('/instagram/sync', dto);
    return response.data;
  },

  /**
   * Get saved posts with filters and pagination
   */
  async getSavedPosts(query?: SavedPostsQuery): Promise<SavedPostsListResponse> {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get<SavedPostsListResponse>('/instagram/saved-posts', { params });
    return response.data;
  },

  /**
   * Get filter options for saved posts
   */
  async getFilters(status?: string): Promise<FiltersResponse> {
    const params = status ? { status } : undefined;
    const response = await api.get<FiltersResponse>('/instagram/saved-posts/filters', { params });
    return response.data;
  },

  /**
   * Get a single saved post
   */
  async getSavedPost(id: string): Promise<SavedInstagramPost> {
    const response = await api.get<SavedInstagramPost>(`/instagram/saved-posts/${id}`);
    return response.data;
  },

  /**
   * Parse post with AI to extract recipe data
   */
  async parsePost(id: string): Promise<ParsedInstagramPost> {
    const response = await api.post<ParsedInstagramPost>(`/instagram/saved-posts/${id}/parse`);
    return response.data;
  },

  /**
   * Translate post caption to English
   */
  async translateCaption(id: string): Promise<{ translatedCaption: string }> {
    const response = await api.post<{ translatedCaption: string }>(
      `/instagram/saved-posts/${id}/translate`
    );
    return response.data;
  },

  /**
   * Generate cooking steps with AI
   */
  async generateSteps(id: string, dto: GenerateStepsDto): Promise<GeneratedSteps> {
    const response = await api.post<GeneratedSteps>(
      `/instagram/saved-posts/${id}/generate-steps`,
      dto
    );
    return response.data;
  },

  /**
   * Import a single post as a recipe
   */
  async importPost(id: string, dto: ImportSinglePostDto): Promise<{ recipeId: string }> {
    const response = await api.post<{ recipeId: string }>(
      `/instagram/saved-posts/${id}/import`,
      dto
    );
    return response.data;
  },

  /**
   * Queue bulk import job
   */
  async bulkImport(dto: BulkImportDto): Promise<BulkImportResponse> {
    const response = await api.post<BulkImportResponse>('/instagram/import/bulk', dto);
    return response.data;
  },

  /**
   * Get import job status
   */
  async getImportJobStatus(jobId: string): Promise<ImportJobStatus> {
    const response = await api.get<ImportJobStatus>(`/instagram/import-jobs/${jobId}`);
    return response.data;
  },

  /**
   * Dismiss multiple posts
   */
  async dismissPosts(postIds: string[]): Promise<{ dismissed: number }> {
    const response = await api.patch<{ dismissed: number }>('/instagram/saved-posts/dismiss', {
      postIds,
    });
    return response.data;
  },

  /**
   * Restore a dismissed post
   */
  async restorePost(id: string): Promise<{ success: boolean }> {
    const response = await api.patch<{ success: boolean }>(
      `/instagram/saved-posts/${id}/restore`
    );
    return response.data;
  },

  /**
   * Delete multiple posts permanently
   */
  async deletePosts(postIds: string[]): Promise<{ deleted: number }> {
    const response = await api.delete<{ deleted: number }>('/instagram/saved-posts', {
      data: { postIds },
    });
    return response.data;
  },

  /**
   * Delete all posts by status
   */
  async deleteAllByStatus(status: string): Promise<{ deleted: number }> {
    const response = await api.delete<{ deleted: number }>(
      `/instagram/saved-posts/by-status/${status}`
    );
    return response.data;
  },

  /**
   * Get all post IDs by filters (for mass selection)
   */
  async getPostIdsByFilters(filters: {
    status?: string;
    search?: string;
    ownerUsername?: string;
    collectionName?: string;
  }): Promise<{ ids: string[]; count: number }> {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.ownerUsername) params.ownerUsername = filters.ownerUsername;
    if (filters.collectionName) params.collectionName = filters.collectionName;

    const response = await api.get<{ ids: string[]; count: number }>(
      '/instagram/saved-posts/ids',
      { params }
    );
    return response.data;
  },

  /**
   * Reload image for a single post
   */
  async reloadPostImage(postId: string, dto: ReloadImageDto): Promise<ReloadImageResponse> {
    const response = await api.post<ReloadImageResponse>(
      `/instagram/saved-posts/${postId}/reload-image`,
      dto
    );
    return response.data;
  },

  /**
   * Bulk reload images for multiple posts
   */
  async bulkReloadImages(dto: BulkReloadImagesDto): Promise<BulkReloadImagesResponse> {
    const response = await api.post<BulkReloadImagesResponse>(
      '/instagram/saved-posts/reload-images',
      dto
    );
    return response.data;
  },

  /**
   * Download video for a recipe using Instagram cookies
   */
  async downloadVideoForRecipe(
    recipeId: string,
    cookies: { sessionId: string; csrfToken: string; dsUserId?: string; igWwwClaim?: string }
  ): Promise<{ success: boolean; videoUrl?: string; message?: string }> {
    const response = await api.post<{ success: boolean; videoUrl?: string; message?: string }>(
      `/instagram/recipes/${recipeId}/download-video`,
      cookies
    );
    return response.data;
  },
};
