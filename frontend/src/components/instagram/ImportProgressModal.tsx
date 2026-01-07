import { X, Loader2, CheckCircle, XCircle, Clock, Minimize2 } from 'lucide-react';
import { useImportJobStatus } from '../../hooks/useInstagram';

interface ImportProgressModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImportProgressModal({ jobId, isOpen, onClose }: ImportProgressModalProps) {
  const { data: job, isLoading } = useImportJobStatus(jobId, isOpen);

  const isComplete = job?.status === 'COMPLETED' || job?.status === 'FAILED';
  const isProcessing = job?.status === 'PENDING' || job?.status === 'PROCESSING';
  const progress = job ? Math.round((job.processedPosts / job.totalPosts) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {isComplete ? 'Import Complete' : 'Importing Posts...'}
          </h2>
          {isComplete && (
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && !job ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
              <p className="text-neutral-600">Loading job status...</p>
            </div>
          ) : job ? (
            <div className="space-y-6">
              {/* Status icon */}
              <div className="flex justify-center">
                {job.status === 'PENDING' && (
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-amber-600" />
                  </div>
                )}
                {job.status === 'PROCESSING' && (
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  </div>
                )}
                {job.status === 'COMPLETED' && (
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                )}
                {job.status === 'FAILED' && (
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-neutral-600">
                    Processing {job.processedPosts} of {job.totalPosts} posts
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      job.status === 'FAILED' ? 'bg-red-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{job.successfulPosts}</p>
                  <p className="text-sm text-green-600">Successful</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{job.failedPosts}</p>
                  <p className="text-sm text-red-600">Failed</p>
                </div>
              </div>

              {/* Error message */}
              {job.errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {job.errorMessage}
                </div>
              )}

              {/* Status messages */}
              <div className="text-center text-sm text-neutral-500">
                {job.status === 'PENDING' && 'Waiting to start...'}
                {job.status === 'PROCESSING' && 'This may take a few minutes. Please wait...'}
                {job.status === 'COMPLETED' && (
                  <span className="text-green-600">
                    Successfully imported {job.successfulPosts} recipes!
                  </span>
                )}
                {job.status === 'FAILED' && (
                  <span className="text-red-600">Import job failed. Please try again.</span>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {(isComplete || isProcessing) && (
          <div className="flex items-center justify-center gap-3 p-4 border-t bg-neutral-50">
            {isProcessing && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-100 flex items-center gap-2"
              >
                <Minimize2 className="w-4 h-4" />
                Continue in Background
              </button>
            )}
            {isComplete && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
