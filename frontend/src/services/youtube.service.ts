import { api } from './api';
import type {
  YouTubeJob,
  YouTubeExtractionResult,
  SubmitYouTubeDto,
  ImportYouTubeRecipeDto,
} from '../types/youtube';

/**
 * YouTube recipe extraction service
 */
export const youtubeService = {
  /**
   * Submit a YouTube URL for recipe extraction
   */
  async submitUrl(dto: SubmitYouTubeDto): Promise<{ jobId: string }> {
    const response = await api.post<{ jobId: string }>('/youtube/extract', dto);
    return response.data;
  },

  /**
   * Get extraction job status
   */
  async getJobStatus(jobId: string): Promise<YouTubeJob> {
    const response = await api.get<YouTubeJob>(`/youtube/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Get extraction result with extracted recipe
   */
  async getExtractionResult(jobId: string): Promise<YouTubeExtractionResult> {
    const response = await api.get<YouTubeExtractionResult>(
      `/youtube/jobs/${jobId}/result`,
    );
    return response.data;
  },

  /**
   * Import extracted recipe as a saved recipe
   */
  async importRecipe(
    jobId: string,
    recipeIndex: number,
    dto: ImportYouTubeRecipeDto,
  ): Promise<{ recipeId: string }> {
    const response = await api.post<{ recipeId: string }>(
      `/youtube/jobs/${jobId}/import`,
      dto,
      { params: { recipeIndex } },
    );
    return response.data;
  },

  /**
   * Cancel an in-progress extraction job
   */
  async cancelJob(jobId: string): Promise<void> {
    await api.delete(`/youtube/jobs/${jobId}`);
  },

  /**
   * Retry a failed extraction job
   */
  async retryJob(jobId: string): Promise<{ jobId: string }> {
    const response = await api.post<{ jobId: string }>(
      `/youtube/jobs/${jobId}/retry`,
    );
    return response.data;
  },

  /**
   * Get user's extraction job history
   */
  async getJobHistory(limit: number = 10): Promise<YouTubeJob[]> {
    const response = await api.get<YouTubeJob[]>('/youtube/jobs', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Delete a job from extraction history
   */
  async deleteFromHistory(jobId: string): Promise<void> {
    await api.delete(`/youtube/history/${jobId}`);
  },
};
