import { useNavigate } from 'react-router-dom';
import { Loader2, Youtube, CheckCircle, XCircle, X } from 'lucide-react';
import type { BackgroundJob } from '../../contexts/BackgroundJobsContext';
import { getStatusText } from '../../types/youtube';

interface YouTubeJobItemProps {
  job: BackgroundJob;
  onDismiss: (jobId: string) => void;
}

export function YouTubeJobItem({ job, onDismiss }: YouTubeJobItemProps) {
  const navigate = useNavigate();
  const status = job.youtubeStatus;
  const progress = status?.progress ?? 0;
  const isProcessing = !job.isComplete && status && !['COMPLETED', 'FAILED'].includes(status.status);
  const isSuccess = job.isComplete && status?.status === 'COMPLETED';
  const isFailed = job.isComplete && status?.status === 'FAILED';

  // Determine background color based on state
  const bgClass = isSuccess
    ? 'bg-green-50 border-green-100'
    : isFailed
    ? 'bg-red-50 border-red-100'
    : 'bg-red-50/50 border-red-100';

  const iconBgClass = isSuccess
    ? 'bg-green-100'
    : isFailed
    ? 'bg-red-100'
    : 'bg-red-100';

  const handleClick = () => {
    navigate(`/youtube?jobId=${job.id}`);
  };

  return (
    <div
      className={`p-3 rounded-xl border ${bgClass} cursor-pointer hover:shadow-sm transition-shadow`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-lg ${iconBgClass}`}>
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : isFailed ? (
            <XCircle className="w-4 h-4 text-red-600" />
          ) : (
            <Youtube className="w-4 h-4 text-red-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {isSuccess
                ? 'Recipe Extracted'
                : isFailed
                ? 'Extraction Failed'
                : 'Extracting Recipe...'}
            </p>
            {job.isComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(job.id);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-black/5 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Video title */}
          <p className="text-xs text-neutral-500 truncate mt-0.5">
            {job.videoTitle || status?.videoTitle || 'YouTube Video'}
          </p>

          {status ? (
            <>
              {/* Status message */}
              {isSuccess && (
                <p className="text-xs text-green-600 mt-1">
                  Recipe ready to import
                </p>
              )}
              {isFailed && (
                <p className="text-xs text-red-600 mt-1">
                  {status.errorMessage || 'Failed to extract recipe'}
                </p>
              )}
              {isProcessing && (
                <p className="text-xs text-neutral-500 mt-1">
                  {status.currentStep || getStatusText(status.status)}
                </p>
              )}

              {/* Progress bar - only show when processing */}
              {isProcessing && (
                <div className="mt-2">
                  <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-400 mt-1 block text-right">
                    {progress}%
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-neutral-500 mt-1">
              Starting extraction...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
