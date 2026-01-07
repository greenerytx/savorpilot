import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { youtubeService } from '../services/youtube.service';
import type {
  YouTubeJob,
  YouTubeExtractionResult,
  SubmitYouTubeDto,
  ImportYouTubeRecipeDto,
} from '../types/youtube';

/**
 * Query keys for YouTube extraction
 */
export const youtubeKeys = {
  all: ['youtube'] as const,
  jobs: () => [...youtubeKeys.all, 'jobs'] as const,
  job: (id: string) => [...youtubeKeys.jobs(), id] as const,
  result: (id: string) => [...youtubeKeys.all, 'result', id] as const,
};

/**
 * Hook for submitting a YouTube URL for extraction
 */
export function useSubmitYouTubeUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SubmitYouTubeDto) => youtubeService.submitUrl(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: youtubeKeys.jobs() });
    },
  });
}

/**
 * Hook for polling job status
 */
export function useYouTubeJobStatus(
  jobId: string | null,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: youtubeKeys.job(jobId || ''),
    queryFn: () => youtubeService.getJobStatus(jobId!),
    enabled: !!jobId && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? 2000,
    staleTime: 1000,
  });
}

/**
 * Hook for getting extraction result
 */
export function useYouTubeExtractionResult(
  jobId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: youtubeKeys.result(jobId || ''),
    queryFn: () => youtubeService.getExtractionResult(jobId!),
    enabled: !!jobId && (options?.enabled ?? true),
    staleTime: 60000,
  });
}

/**
 * Hook for importing extracted recipe
 */
export function useImportYouTubeRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      recipeIndex,
      dto,
    }: {
      jobId: string;
      recipeIndex: number;
      dto: ImportYouTubeRecipeDto;
    }) => youtubeService.importRecipe(jobId, recipeIndex, dto),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: youtubeKeys.result(jobId) });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

/**
 * Hook for cancelling a job
 */
export function useCancelYouTubeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => youtubeService.cancelJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: youtubeKeys.job(jobId) });
      queryClient.invalidateQueries({ queryKey: youtubeKeys.jobs() });
    },
  });
}

/**
 * Hook for retrying a failed job
 */
export function useRetryYouTubeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => youtubeService.retryJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: youtubeKeys.jobs() });
    },
  });
}

/**
 * Hook for getting job history
 */
export function useYouTubeJobHistory(limit: number = 10) {
  return useQuery({
    queryKey: [...youtubeKeys.jobs(), 'history', limit],
    queryFn: () => youtubeService.getJobHistory(limit),
    staleTime: 30000,
  });
}

/**
 * Hook for deleting a job from extraction history
 */
export function useDeleteYouTubeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => youtubeService.deleteFromHistory(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: youtubeKeys.jobs() });
      queryClient.removeQueries({ queryKey: youtubeKeys.job(jobId) });
      queryClient.removeQueries({ queryKey: youtubeKeys.result(jobId) });
    },
  });
}
