import { useState } from 'react';
import { Play, Heart, MessageCircle, Check, X, RotateCcw, ExternalLink, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import type { SavedInstagramPost, SavedPostStatus } from '../../types/instagram';
import { CaptionPreviewModal } from './CaptionPreviewModal';

interface SavedPostCardProps {
  post: SavedInstagramPost;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onImport?: (post: SavedInstagramPost) => void;
  onDismiss?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPreview?: (id: string) => void;
  onReloadImage?: (id: string) => void;
  isReloadingImage?: boolean;
}

const statusColors: Record<SavedPostStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
  IMPORTED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Imported' },
  DISMISSED: { bg: 'bg-neutral-100', text: 'text-neutral-500', label: 'Dismissed' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
};

const languageNames: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
};

export function SavedPostCard({
  post,
  isSelected = false,
  onSelect,
  onImport,
  onDismiss,
  onRestore,
  onPreview,
  onReloadImage,
  isReloadingImage = false,
}: SavedPostCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const statusStyle = statusColors[post.status];

  // Use page-level preview if onPreview is provided, otherwise use local state
  const handleOpenPreview = () => {
    if (onPreview) {
      onPreview(post.id);
    } else {
      setShowPreview(true);
    }
  };

  const truncatedCaption = post.caption
    ? post.caption.length > 150
      ? post.caption.slice(0, 150) + '...'
      : post.caption
    : 'No caption';

  const handleCardClick = () => {
    if (onSelect && post.status === 'PENDING') {
      onSelect(post.id, !isSelected);
    }
  };

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden border transition-all duration-200
        ${isSelected ? 'ring-2 ring-primary-500 border-primary-500' : 'border-neutral-200'}
        ${post.status === 'PENDING' ? 'hover:shadow-md cursor-pointer' : ''}
        ${post.status === 'DISMISSED' ? 'opacity-60' : ''}
        bg-white
      `}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      {post.status === 'PENDING' && onSelect && (
        <div
          className="absolute top-3 left-3 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(post.id, !isSelected);
          }}
        >
          <div
            className={`
              w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
              ${isSelected ? 'bg-primary-500 border-primary-500' : 'bg-white/80 border-neutral-300 hover:border-primary-400'}
            `}
          >
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        <span
          className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${statusStyle.bg} ${statusStyle.text}
          `}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Image/Video thumbnail */}
      <div className="relative aspect-square bg-neutral-100">
        {post.imageUrl && !imageError ? (
          <img
            src={post.imageUrl}
            alt={post.ownerUsername}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 p-4">
            <AlertCircle className="w-8 h-8 mb-2" />
            <span className="text-sm text-center mb-2">Image expired</span>
            {onReloadImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReloadImage(post.id);
                }}
                disabled={isReloadingImage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {isReloadingImage ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isReloadingImage ? 'Reloading...' : 'Reload Image'}
              </button>
            )}
          </div>
        )}

        {/* Video indicator */}
        {post.isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center gap-4 text-white text-sm">
            {post.likeCount !== null && (
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {post.likeCount.toLocaleString()}
              </span>
            )}
            {post.commentCount !== null && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {post.commentCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Owner info */}
        <div className="flex items-center gap-2 mb-2">
          <a
            href={`https://instagram.com/${post.ownerUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-neutral-900 hover:text-primary-600 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            @{post.ownerUsername}
            <ExternalLink className="w-3 h-3" />
          </a>
          {post.detectedLanguage && post.detectedLanguage !== 'en' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              {languageNames[post.detectedLanguage] || post.detectedLanguage}
            </span>
          )}
        </div>

        {/* Caption preview */}
        <p
          className="text-sm text-neutral-600 line-clamp-3 mb-3 cursor-pointer hover:text-neutral-800"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPreview();
          }}
          title="Click to view full caption"
        >
          {truncatedCaption}
        </p>

        {/* Collection tag */}
        {post.collectionName && (
          <span className="inline-block text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full mb-3">
            {post.collectionName}
          </span>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          {post.status === 'PENDING' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPreview();
                }}
                className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Preview caption"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImport?.(post);
                }}
                className="flex-1 py-2 px-3 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Import
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss?.(post.id);
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Dismiss Import"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}

          {post.status === 'IMPORTED' && post.importedRecipeId && (
            <a
              href={`/recipes/${post.importedRecipeId}`}
              className="flex-1 py-2 px-3 bg-green-100 text-green-700 text-sm font-medium rounded-lg text-center hover:bg-green-200 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View Recipe
            </a>
          )}

          {post.status === 'DISMISSED' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestore?.(post.id);
              }}
              className="flex-1 py-2 px-3 border border-neutral-200 text-neutral-600 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restore
            </button>
          )}

          {post.status === 'FAILED' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onImport?.(post);
              }}
              className="flex-1 py-2 px-3 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              Retry Import
            </button>
          )}
        </div>
      </div>

      {/* Caption Preview Modal - only used when page-level preview is not available */}
      {!onPreview && (
        <CaptionPreviewModal
          post={post}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onImport={() => onImport?.(post)}
          onDismiss={() => onDismiss?.(post.id)}
        />
      )}
    </div>
  );
}
