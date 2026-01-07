import { useTranslation } from 'react-i18next';
import { Loader2, Download, CheckCircle, XCircle, X } from 'lucide-react';
import type { BackgroundJob } from '../../contexts/BackgroundJobsContext';

interface ActiveJobItemProps {
  job: BackgroundJob;
  onDismiss: (jobId: string) => void;
}

export function ActiveJobItem({ job, onDismiss }: ActiveJobItemProps) {
  const { t } = useTranslation('notifications');
  const status = job.status;
  const progress = status ? Math.round((status.processedPosts / status.totalPosts) * 100) : 0;
  const isProcessing = !job.isComplete && (status?.status === 'PENDING' || status?.status === 'PROCESSING');
  const isSuccess = job.isComplete && status?.status === 'COMPLETED';
  const isFailed = job.isComplete && status?.status === 'FAILED';

  // Determine background color based on state
  const bgClass = isSuccess
    ? 'bg-green-50 border-green-100'
    : isFailed
    ? 'bg-red-50 border-red-100'
    : 'bg-primary-50 border-primary-100';

  const iconBgClass = isSuccess
    ? 'bg-green-100'
    : isFailed
    ? 'bg-red-100'
    : 'bg-primary-100';

  return (
    <div className={`p-3 rounded-xl border ${bgClass}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-lg ${iconBgClass}`}>
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : isFailed ? (
            <XCircle className="w-4 h-4 text-red-600" />
          ) : (
            <Download className="w-4 h-4 text-primary-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-neutral-900">
              {isSuccess
                ? t('jobs.importComplete')
                : isFailed
                ? t('jobs.importFailed')
                : t('jobs.importingRecipes')}
            </p>
            {job.isComplete && (
              <button
                onClick={() => onDismiss(job.id)}
                className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-black/5 rounded transition-colors"
                title={t('actions.dismiss')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {status ? (
            <>
              {/* Status message */}
              {isSuccess && (
                <p className="text-xs text-green-600 mt-0.5">
                  {t('jobs.successfullyImported', { count: status.successfulPosts })}
                  {status.failedPosts > 0 && ` ${t('jobs.failedCount', { count: status.failedPosts })}`}
                </p>
              )}
              {isFailed && (
                <p className="text-xs text-red-600 mt-0.5">
                  {status.errorMessage || t('jobs.failedToImport')}
                </p>
              )}
              {isProcessing && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t('jobs.postsProcessed', { processed: status.processedPosts, total: status.totalPosts })}
                </p>
              )}

              {/* Progress bar - only show when processing */}
              {isProcessing && (
                <div className="mt-2">
                  <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="text-green-600">
                  {t('jobs.imported', { count: status.successfulPosts })}
                </span>
                {status.failedPosts > 0 && (
                  <span className="text-red-600">
                    {t('jobs.failed', { count: status.failedPosts })}
                  </span>
                )}
                {isProcessing && (
                  <span className="text-neutral-400 ml-auto">
                    {progress}%
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-neutral-500 mt-0.5">
              {t('jobs.starting')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
