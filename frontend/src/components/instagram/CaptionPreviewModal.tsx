import { X, ExternalLink, Copy, Check, ChevronLeft, ChevronRight, Plus, ListPlus, Loader2, CheckCircle, Play, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { SavedInstagramPost } from '../../types/instagram';

interface CaptionPreviewModalProps {
  post: SavedInstagramPost;
  isOpen: boolean;
  onClose: () => void;
  onImport?: () => void;
  onDismiss?: () => void;
  onAddToQueue?: () => void;
  onImportQueue?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  currentIndex?: number;
  totalCount?: number;
  queueSize?: number;
  isLoading?: boolean;
  isInQueue?: boolean;
}

export function CaptionPreviewModal({
  post,
  isOpen,
  onClose,
  onImport,
  onDismiss,
  onAddToQueue,
  onImportQueue,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
  currentIndex,
  totalCount,
  queueSize = 0,
  isLoading = false,
  isInQueue = false,
}: CaptionPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset video state when post changes
  useEffect(() => {
    setShowVideo(false);
    setVideoError(false);
    setIsMuted(true);
  }, [post?.id]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || !post) return;

    // Don't trigger if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.key) {
      case 'ArrowLeft':
        if (hasPrev && onPrev) onPrev();
        break;
      case 'ArrowRight':
        if (hasNext && onNext) onNext();
        break;
      case 'd':
      case 'D':
        if (post.status === 'PENDING' && onDismiss) {
          onDismiss();
        }
        break;
      case 'q':
      case 'Q':
        if (post.status === 'PENDING' && onAddToQueue && !isInQueue) {
          onAddToQueue();
        }
        break;
      case 'i':
      case 'I':
        if (post.status === 'PENDING') {
          if (queueSize > 0 && onImportQueue) {
            onClose();
            onImportQueue();
          } else if (onImport) {
            onClose();
            onImport();
          }
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [isOpen, hasPrev, hasNext, onPrev, onNext, onDismiss, onAddToQueue, onImport, onImportQueue, onClose, post, queueSize, isInQueue]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (post?.caption) {
      await navigator.clipboard.writeText(post.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const instagramUrl = post ? `https://www.instagram.com/p/${post.shortcode}/` : '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            {/* Navigation - Previous */}
            {(hasPrev || hasNext) && (
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous (←)"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-600" />
              </button>
            )}

            <div>
              {post ? (
                <a
                  href={`https://instagram.com/${post.ownerUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-neutral-900 hover:text-primary-600 flex items-center gap-1"
                >
                  @{post.ownerUsername}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="font-medium text-neutral-400">Loading...</span>
              )}
              <p className="text-xs text-neutral-500">
                {post?.postedAt ? new Date(post.postedAt).toLocaleDateString() : ''}
                {currentIndex !== undefined && totalCount !== undefined && totalCount > 0 && (
                  <span className="ml-2 text-primary-600 font-medium">
                    {currentIndex + 1} of {totalCount}
                  </span>
                )}
              </p>
            </div>

            {/* Navigation - Next */}
            {(hasPrev || hasNext) && (
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next (→)"
              >
                <ChevronRight className="w-5 h-5 text-neutral-600" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content area with media and caption */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading || !post ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Media section - Image/Video */}
              <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                {post.isVideo && post.videoUrl && !videoError ? (
                  showVideo ? (
                    <div className="relative w-full h-full">
                      <video
                        ref={videoRef}
                        src={post.videoUrl}
                        poster={post.imageUrl || undefined}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        className="w-full h-full object-contain bg-black"
                        onError={() => setVideoError(true)}
                      />
                      {/* Video controls overlay */}
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                        >
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="relative w-full h-full cursor-pointer group"
                      onClick={() => setShowVideo(true)}
                    >
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-200" />
                      )}
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-black/60 group-hover:bg-black/80 flex items-center justify-center transition-colors">
                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                      </div>
                      <span className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
                        Click to play video
                      </span>
                    </div>
                  )
                ) : post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    No media available
                  </div>
                )}
                {videoError && post.isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                    <div className="text-center text-neutral-500 p-4">
                      <p className="text-sm font-medium">Video unavailable</p>
                      <p className="text-xs mt-1">The video URL may have expired</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Caption section */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-500">Caption</h3>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-neutral-50 rounded-lg p-4 flex-1 overflow-y-auto min-h-[350px]">
                  {post.caption ? (
                    <p className="text-neutral-800 whitespace-pre-wrap text-sm leading-relaxed">
                      {post.caption}
                    </p>
                  ) : (
                    <p className="text-neutral-400 italic">No caption</p>
                  )}
                </div>

                {/* Translated caption if available */}
                {post.captionTranslated && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-neutral-500 mb-2">Translated</h3>
                    <div className="bg-blue-50 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                      <p className="text-neutral-800 whitespace-pre-wrap text-sm leading-relaxed">
                        {post.captionTranslated}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 rounded-b-xl space-y-3">
          {/* Keyboard hints */}
          {post?.status === 'PENDING' && (hasPrev || hasNext) && (
            <div className="flex items-center justify-center gap-4 text-xs text-neutral-400">
              <span><kbd className="px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-600">←</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-600">→</kbd> Navigate</span>
              <span><kbd className="px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-600">D</kbd> Dismiss</span>
              <span><kbd className="px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-600">Q</kbd> Queue</span>
              <span><kbd className="px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-600">I</kbd> {queueSize > 0 ? `Import Queue (${queueSize})` : 'Import'}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {post ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View on Instagram
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Close
              </button>
              {post?.status === 'PENDING' && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-3 py-2 text-sm text-neutral-600 border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Dismiss and continue (D)"
                >
                  <X className="w-4 h-4" />
                  Dismiss
                </button>
              )}
              {post?.status === 'PENDING' && onAddToQueue && (
                isInQueue ? (
                  <span className="px-3 py-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    In Queue
                  </span>
                ) : (
                  <button
                    onClick={onAddToQueue}
                    className="px-3 py-2 text-sm text-primary-600 border border-primary-300 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Add to import queue and continue (Q)"
                  >
                    <ListPlus className="w-4 h-4" />
                    Add to Queue
                  </button>
                )
              )}
              {post?.status === 'PENDING' && queueSize > 0 && onImportQueue && (
                <button
                  onClick={() => {
                    onClose();
                    onImportQueue();
                  }}
                  className="px-3 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center gap-1.5"
                  title={`Import all ${queueSize} queued posts`}
                >
                  <ListPlus className="w-4 h-4" />
                  Import Queue ({queueSize})
                </button>
              )}
              {post?.status === 'PENDING' && queueSize === 0 && onImport && (
                <button
                  onClick={() => {
                    onClose();
                    onImport();
                  }}
                  className="px-3 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center gap-1.5"
                  title="Import now with options (I)"
                >
                  <Plus className="w-4 h-4" />
                  Import Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
