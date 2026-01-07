import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Youtube, History, ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  YouTubeUrlInput,
  YouTubeJobProgress,
  YouTubeExtractionResultComponent,
} from '../../components/youtube';
import {
  useSubmitYouTubeUrl,
  useYouTubeJobStatus,
  useYouTubeExtractionResult,
  useImportYouTubeRecipe,
  useCancelYouTubeJob,
  useRetryYouTubeJob,
  useYouTubeJobHistory,
  useDeleteYouTubeJob,
} from '../../hooks/useYouTube';
import { useToast } from '../../components/ui/Toast';
import { useBackgroundJobs } from '../../contexts/BackgroundJobsContext';
import type { ExtractedRecipe } from '../../types/youtube';

/**
 * Main page for YouTube recipe extraction
 */
export function YouTubeExtractPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { addYouTubeJob, dismissBackgroundJob, backgroundJobs } = useBackgroundJobs();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [importingIndex, setImportingIndex] = useState<number | null>(null);

  // Check for jobId in URL (coming from notification)
  useEffect(() => {
    const jobIdFromUrl = searchParams.get('jobId');
    if (jobIdFromUrl) {
      setActiveJobId(jobIdFromUrl);
      // Remove jobId from URL
      setSearchParams({}, { replace: true });
      // Dismiss from background jobs if it exists there
      dismissBackgroundJob(jobIdFromUrl);
    }
  }, [searchParams, setSearchParams, dismissBackgroundJob]);

  // Mutations
  const submitMutation = useSubmitYouTubeUrl();
  const cancelMutation = useCancelYouTubeJob();
  const retryMutation = useRetryYouTubeJob();
  const importMutation = useImportYouTubeRecipe();
  const deleteMutation = useDeleteYouTubeJob();

  // Job status polling
  const {
    data: jobStatus,
    isLoading: isLoadingStatus,
  } = useYouTubeJobStatus(activeJobId, {
    enabled: !!activeJobId,
    refetchInterval: isPolling ? 2000 : false,
  });

  // Control polling based on job status
  useEffect(() => {
    if (activeJobId && jobStatus) {
      const shouldPoll = !['COMPLETED', 'FAILED'].includes(jobStatus.status);
      setIsPolling(shouldPoll);
    } else if (activeJobId && !jobStatus) {
      // Start polling when we have an active job but no status yet
      setIsPolling(true);
    } else {
      setIsPolling(false);
    }
  }, [activeJobId, jobStatus?.status]);

  // Extraction result (only fetch when complete)
  const { data: extractionResult, isLoading: isLoadingResult } =
    useYouTubeExtractionResult(activeJobId, {
      enabled: !!activeJobId && jobStatus?.status === 'COMPLETED',
    });

  // Job history
  const { data: jobHistory } = useYouTubeJobHistory(10);

  // Handle URL submission
  const handleSubmit = async (url: string) => {
    try {
      const result = await submitMutation.mutateAsync({ url });
      setActiveJobId(result.jobId);
      setShowHistory(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Failed to start extraction. Please try again.'
      );
    }
  };

  // Handle job cancellation
  const handleCancel = async () => {
    if (!activeJobId) return;

    try {
      await cancelMutation.mutateAsync(activeJobId);
      setActiveJobId(null);
      toast.info('Extraction job cancelled.');
    } catch (error) {
      toast.error('Failed to cancel job.');
    }
  };

  // Handle recipe import
  const handleImport = async (recipe: ExtractedRecipe, index: number) => {
    if (!activeJobId) return;

    setImportingIndex(index);
    try {
      const result = await importMutation.mutateAsync({
        jobId: activeJobId,
        recipeIndex: index,
        dto: {
          title: recipe.title,
          description: recipe.description,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          category: recipe.category,
          cuisine: recipe.cuisine,
          tags: recipe.tags,
          components: recipe.components,
        },
      });

      toast.success(`"${recipe.title}" imported successfully!`);

      // Ask if user wants to view the recipe or stay here for more imports
      // For now, just stay on the page so they can import more recipes
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to import recipe.'
      );
    } finally {
      setImportingIndex(null);
    }
  };

  // Resume a previous job
  const handleResumeJob = (jobId: string) => {
    setActiveJobId(jobId);
    setShowHistory(false);
  };

  // Retry a failed job
  const handleRetry = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    try {
      const result = await retryMutation.mutateAsync(jobId);
      setActiveJobId(result.jobId);
      setShowHistory(false);
      toast.info('Retrying extraction...');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to retry extraction.'
      );
    }
  };

  // Delete a job from history
  const handleDelete = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click
    try {
      await deleteMutation.mutateAsync(jobId);
      // If we deleted the active job, clear it
      if (activeJobId === jobId) {
        setActiveJobId(null);
      }
      toast.success('Removed from history');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to delete from history.'
      );
    }
  };

  // Start a new extraction
  const handleNewExtraction = () => {
    setActiveJobId(null);
    setShowHistory(false);
  };

  // Continue extraction in background
  const handleContinueInBackground = () => {
    if (!activeJobId || !jobStatus) return;

    addYouTubeJob(activeJobId, jobStatus.videoTitle);
    setActiveJobId(null);
    toast.info('Extraction continuing in background. Check notifications for progress.');
  };

  const isProcessing =
    activeJobId &&
    jobStatus &&
    !['COMPLETED', 'FAILED'].includes(jobStatus.status);
  const isComplete = jobStatus?.status === 'COMPLETED';
  const isFailed = jobStatus?.status === 'FAILED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900 flex items-center gap-2">
            <Youtube className="h-7 w-7 text-red-500" />
            YouTube Recipe Extractor
          </h1>
          <p className="text-neutral-600">
            Extract recipes from cooking videos using AI
          </p>
        </div>
        <div className="flex gap-2">
          {activeJobId && (
            <Button
              variant="secondary"
              onClick={handleNewExtraction}
            >
              <ArrowLeft className="h-4 w-4 me-1" />
              New
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4 me-1" />
            History
          </Button>
        </div>
      </div>

      {/* Job History */}
      {showHistory && jobHistory && jobHistory.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-neutral-900 mb-3">Recent Extractions</h3>
          <div className="space-y-2">
            {jobHistory.map((job) => (
              <div
                key={job.id}
                onClick={() => handleResumeJob(job.id)}
                className="w-full text-start p-3 rounded-lg hover:bg-neutral-50 flex items-center gap-3 transition-colors cursor-pointer"
              >
                {job.thumbnailUrl && (
                  <img
                    src={job.thumbnailUrl}
                    alt=""
                    className="w-16 h-10 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {job.videoTitle || 'Unknown video'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {job.channelName} •{' '}
                    <span
                      className={
                        job.status === 'FAILED'
                          ? 'text-red-500'
                          : job.status === 'COMPLETED'
                            ? 'text-green-600'
                            : ''
                      }
                    >
                      {job.status}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {job.status === 'FAILED' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => handleRetry(job.id, e)}
                      disabled={retryMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 me-1" />
                      Retry
                    </Button>
                  )}
                  {['COMPLETED', 'FAILED'].includes(job.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(job.id, e)}
                      disabled={deleteMutation.isPending}
                      className="text-neutral-400 hover:text-red-500"
                      title="Delete from history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* URL Input - show when no active job or when failed */}
      {(!activeJobId || isFailed) && (
        <Card className="p-6">
          <YouTubeUrlInput
            onSubmit={handleSubmit}
            isLoading={submitMutation.isPending}
            error={
              submitMutation.error
                ? (submitMutation.error as any)?.response?.data?.message ||
                  'Failed to start extraction'
                : null
            }
          />
        </Card>
      )}

      {/* Job Progress */}
      {activeJobId && jobStatus && !isComplete && (
        <YouTubeJobProgress
          job={jobStatus}
          onCancel={handleCancel}
          onContinueInBackground={handleContinueInBackground}
          isLoading={cancelMutation.isPending}
        />
      )}

      {/* Extraction Result */}
      {activeJobId && isComplete && extractionResult && (
        <YouTubeExtractionResultComponent
          result={extractionResult}
          onImport={handleImport}
          isImporting={importMutation.isPending}
          importingIndex={importingIndex}
        />
      )}

      {/* Loading State */}
      {activeJobId && isLoadingStatus && !jobStatus && (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-2 text-neutral-500">
            <span className="animate-spin">⏳</span>
            Loading job status...
          </div>
        </Card>
      )}
    </div>
  );
}
