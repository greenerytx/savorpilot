import {
  Download,
  Music,
  Mic,
  ImageIcon,
  ScanText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Minimize2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { YouTubeJob } from '../../types/youtube';
import { getStatusText, formatDuration } from '../../types/youtube';

interface YouTubeJobProgressProps {
  job: YouTubeJob;
  onCancel?: () => void;
  onContinueInBackground?: () => void;
  isLoading?: boolean;
}

/**
 * Progress display for YouTube extraction job
 */
export function YouTubeJobProgress({
  job,
  onCancel,
  onContinueInBackground,
  isLoading = false,
}: YouTubeJobProgressProps) {
  const steps = [
    { key: 'DOWNLOADING', label: 'Download', icon: Download },
    { key: 'EXTRACTING_AUDIO', label: 'Audio', icon: Music },
    { key: 'TRANSCRIBING', label: 'Transcribe', icon: Mic },
    { key: 'EXTRACTING_FRAMES', label: 'Frames', icon: ImageIcon },
    { key: 'OCR_PROCESSING', label: 'OCR', icon: ScanText },
    { key: 'AI_SYNTHESIS', label: 'AI', icon: Sparkles },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === job.status);
  const isComplete = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';

  return (
    <Card className="p-6">
      {/* Video Info */}
      <div className="flex gap-4 mb-6">
        {job.thumbnailUrl && (
          <img
            src={job.thumbnailUrl}
            alt={job.videoTitle || 'Video thumbnail'}
            className="w-32 h-20 object-cover rounded-lg"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-neutral-900 truncate">
            {job.videoTitle || 'Loading video info...'}
          </h3>
          <p className="text-sm text-neutral-500">
            {job.channelName}
            {job.videoDuration && (
              <span className="ms-2">({formatDuration(job.videoDuration)})</span>
            )}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-neutral-600">
            {job.currentStep || getStatusText(job.status)}
          </span>
          <span className="text-neutral-500">{job.progress}%</span>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isFailed
                ? 'bg-red-500'
                : isComplete
                  ? 'bg-green-500'
                  : 'bg-primary-500'
            }`}
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.key === job.status;
          const isCompleted = currentStepIndex > index || isComplete;

          return (
            <div
              key={step.key}
              className={`flex flex-col items-center ${
                isActive
                  ? 'text-primary-600'
                  : isCompleted
                    ? 'text-green-600'
                    : 'text-neutral-300'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive
                    ? 'bg-primary-100'
                    : isCompleted
                      ? 'bg-green-100'
                      : 'bg-neutral-50'
                }`}
              >
                {isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span className="text-xs mt-1">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      {(job.framesExtracted > 0 || job.framesWithText > 0) && (
        <div className="flex gap-4 text-sm text-neutral-500 mb-4">
          {job.framesExtracted > 0 && (
            <span>Frames: {job.framesExtracted}</span>
          )}
          {job.framesWithText > 0 && (
            <span>With text: {job.framesWithText}</span>
          )}
        </div>
      )}

      {/* Status Messages */}
      {isComplete && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle2 className="h-5 w-5" />
          <span>Extraction complete! Review the recipe below.</span>
        </div>
      )}

      {isFailed && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <XCircle className="h-5 w-5" />
          <span>{job.errorMessage || 'Extraction failed. Please try again.'}</span>
        </div>
      )}

      {/* Action Buttons */}
      {!isComplete && !isFailed && (
        <div className="mt-4 flex justify-end gap-2">
          {onContinueInBackground && (
            <Button
              variant="outline"
              size="sm"
              onClick={onContinueInBackground}
            >
              <Minimize2 className="h-4 w-4 me-1" />
              Continue in Background
            </Button>
          )}
          {onCancel && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
