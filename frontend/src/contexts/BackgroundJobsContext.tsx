import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { instagramService } from '../services/instagram.service';
import { youtubeService } from '../services/youtube.service';
import { instagramKeys } from '../hooks/useInstagram';
import type { ImportJobStatus } from '../types/instagram';
import type { YouTubeJob } from '../types/youtube';

export interface BackgroundJob {
  id: string;
  type: 'import' | 'youtube';
  startedAt: Date;
  status: ImportJobStatus | null;
  youtubeStatus: YouTubeJob | null;
  postIds: string[];
  videoTitle?: string;
  isComplete: boolean;
}

interface BackgroundJobsContextValue {
  backgroundJobs: BackgroundJob[];
  addBackgroundJob: (jobId: string, type: 'import', postIds?: string[]) => void;
  addYouTubeJob: (jobId: string, videoTitle?: string) => void;
  dismissBackgroundJob: (jobId: string) => void;
  hasActiveJobs: boolean;
  activeJobsCount: number;
  inProgressPostIds: Set<string>;
}

const BackgroundJobsContext = createContext<BackgroundJobsContextValue | null>(null);

const POLL_INTERVAL = 2000; // 2 seconds for responsive progress updates

export function BackgroundJobsProvider({ children }: { children: ReactNode }) {
  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJob[]>([]);
  const queryClient = useQueryClient();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to always have access to current jobs (avoids stale closures in polling)
  const backgroundJobsRef = useRef<BackgroundJob[]>([]);
  backgroundJobsRef.current = backgroundJobs;

  const addBackgroundJob = useCallback((jobId: string, type: 'import', postIds: string[] = []) => {
    setBackgroundJobs(prev => {
      // Don't add if already exists
      if (prev.some(j => j.id === jobId)) return prev;
      return [...prev, { id: jobId, type, startedAt: new Date(), status: null, youtubeStatus: null, postIds, isComplete: false }];
    });
  }, []);

  const addYouTubeJob = useCallback((jobId: string, videoTitle?: string) => {
    setBackgroundJobs(prev => {
      // Don't add if already exists
      if (prev.some(j => j.id === jobId)) return prev;
      return [...prev, { id: jobId, type: 'youtube', startedAt: new Date(), status: null, youtubeStatus: null, postIds: [], videoTitle, isComplete: false }];
    });
  }, []);

  const dismissBackgroundJob = useCallback((jobId: string) => {
    setBackgroundJobs(prev => prev.filter(j => j.id !== jobId));
  }, []);

  // Check if there are any active (not complete) jobs
  const hasIncompleteJobs = backgroundJobs.some(j => !j.isComplete);

  // Poll background jobs for status updates
  useEffect(() => {
    if (!hasIncompleteJobs) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const pollJobs = async () => {
      // Use ref to get current jobs (avoids stale closure)
      const currentJobs = backgroundJobsRef.current;
      const incompleteJobs = currentJobs.filter(j => !j.isComplete);

      if (incompleteJobs.length === 0) return;

      // Fetch status for all incomplete jobs
      const updates = new Map<string, { status?: ImportJobStatus; youtubeStatus?: YouTubeJob; isComplete: boolean }>();

      await Promise.all(
        incompleteJobs.map(async (job) => {
          try {
            if (job.type === 'youtube') {
              // Poll YouTube job
              const youtubeStatus = await youtubeService.getJobStatus(job.id);
              const isComplete = youtubeStatus.status === 'COMPLETED' || youtubeStatus.status === 'FAILED';

              // Check if status changed
              const hasChanged = isComplete || JSON.stringify(job.youtubeStatus) !== JSON.stringify(youtubeStatus);
              if (hasChanged) {
                updates.set(job.id, { youtubeStatus, isComplete });
              }
            } else {
              // Poll Instagram import job
              const status = await instagramService.getImportJobStatus(job.id);
              const isComplete = status.status === 'COMPLETED' || status.status === 'FAILED';

              if (isComplete) {
                // Invalidate queries to refresh data
                queryClient.invalidateQueries({ queryKey: instagramKeys.posts() });
                queryClient.invalidateQueries({ queryKey: instagramKeys.filtersBase() });
              }

              // Check if status changed
              const hasChanged = isComplete || JSON.stringify(job.status) !== JSON.stringify(status);
              if (hasChanged) {
                updates.set(job.id, { status, isComplete });
              }
            }
          } catch (error) {
            console.error('Error polling background job:', error);
          }
        })
      );

      // Apply updates using functional setState to preserve any newly added jobs
      if (updates.size > 0) {
        setBackgroundJobs(prev =>
          prev.map(job => {
            const update = updates.get(job.id);
            if (update) {
              return {
                ...job,
                status: update.status ?? job.status,
                youtubeStatus: update.youtubeStatus ?? job.youtubeStatus,
                videoTitle: update.youtubeStatus?.videoTitle ?? job.videoTitle,
                isComplete: update.isComplete
              };
            }
            return job;
          })
        );
      }
    };

    // Start polling
    pollIntervalRef.current = setInterval(pollJobs, POLL_INTERVAL);

    // Initial poll
    pollJobs();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [hasIncompleteJobs, queryClient]);

  // Compute all post IDs currently being imported (only from incomplete jobs)
  const inProgressPostIds = useMemo(() => {
    const ids = new Set<string>();
    for (const job of backgroundJobs) {
      if (!job.isComplete) {
        for (const postId of job.postIds) {
          ids.add(postId);
        }
      }
    }
    return ids;
  }, [backgroundJobs]);

  // Count of jobs that are still running (not complete)
  const activeJobsCount = backgroundJobs.filter(j => !j.isComplete).length;

  const value: BackgroundJobsContextValue = {
    backgroundJobs,
    addBackgroundJob,
    addYouTubeJob,
    dismissBackgroundJob,
    hasActiveJobs: activeJobsCount > 0,
    activeJobsCount,
    inProgressPostIds,
  };

  return (
    <BackgroundJobsContext.Provider value={value}>
      {children}
    </BackgroundJobsContext.Provider>
  );
}

export function useBackgroundJobs(): BackgroundJobsContextValue {
  const context = useContext(BackgroundJobsContext);
  if (!context) {
    throw new Error('useBackgroundJobs must be used within a BackgroundJobsProvider');
  }
  return context;
}
