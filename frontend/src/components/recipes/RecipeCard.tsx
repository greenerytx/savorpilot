import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users as UsersIcon, Heart, MoreHorizontal, RefreshCw, Loader2, FolderPlus, GitFork, Globe, Lock, ChefHat, Eye, ChevronRight, Check } from 'lucide-react';
import { cn, formatTime, getImageUrl } from '../../lib/utils';
import { useToast } from '../ui';
import { useDownloadImage } from '../../hooks';
import { AddToCollectionModal } from './AddToCollectionModal';
import { refreshImageViaExtension, extractShortcode } from '../../services/extension.service';
import { useQueryClient } from '@tanstack/react-query';
import { recipeKeys } from '../../hooks/useRecipes';
import type { RecipeVisibility } from '../../types/recipe';

export interface RecipeCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  sourceUrl?: string;
  sourceAuthor?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  category?: string;
  cuisine?: string;
  isFavorite?: boolean;
  forkCount?: number;
  isPublic?: boolean;
  visibility?: RecipeVisibility;
  user?: { firstName: string; lastName: string };
  parentRecipe?: {
    id: string;
    title: string;
    userId: string;
    user?: { firstName: string; lastName: string };
  };
  onVisibilityChange?: (id: string, visibility: RecipeVisibility) => void;
  className?: string;
}

export function RecipeCard({
  id,
  title,
  imageUrl,
  sourceUrl,
  sourceAuthor,
  prepTime,
  cookTime,
  difficulty,
  cuisine,
  isFavorite = false,
  forkCount = 0,
  visibility = 'PRIVATE',
  user,
  parentRecipe,
  onVisibilityChange,
  className,
}: RecipeCardProps) {
  const totalTime = (prepTime || 0) + (cookTime || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [isRefreshingImage, setIsRefreshingImage] = useState(false);
  const [showVisibilitySubmenu, setShowVisibilitySubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const downloadImage = useDownloadImage();
  const toast = useToast();
  const queryClient = useQueryClient();

  const isExternalImage = imageUrl?.startsWith('http') && !imageUrl?.includes('/uploads/');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowVisibilitySubmenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!imageUrl || !isExternalImage) return;

    try {
      await downloadImage.mutateAsync({ recipeId: id, imageUrl });
      toast.success('Image saved locally!');
      setShowMenu(false);
    } catch (err: any) {
      console.error('Failed to save image:', err);
      if (err?.response?.status === 502 || err?.response?.status === 400) {
        const shortcode = extractShortcode(sourceUrl || '');
        if (shortcode) {
          await handleRefreshViaExtension(shortcode);
        } else {
          toast.error('Image URL expired. No source URL available to refresh.');
        }
      } else {
        toast.error('Failed to save image. The source may no longer be available.');
      }
    }
  };

  const handleRefreshViaExtension = async (shortcode: string) => {
    setIsRefreshingImage(true);
    setShowMenu(false);

    try {
      toast.info('Refreshing image via extension...');
      const result = await refreshImageViaExtension(id, shortcode);

      if (result.success && result.imageUrl) {
        toast.success('Image refreshed and saved!');
        queryClient.invalidateQueries({ queryKey: recipeKeys.all });
      } else {
        toast.error(result.error || 'Failed to refresh image via extension.');
      }
    } catch (err) {
      console.error('Extension refresh error:', err);
      toast.error('Failed to communicate with extension.');
    } finally {
      setIsRefreshingImage(false);
    }
  };

  // Get author display name
  const authorName = sourceAuthor || (user ? `${user.firstName} ${user.lastName}` : null);

  return (
    <>
      <Link to={`/recipes/${id}`}>
        <article
          className={cn(
            'group relative bg-white rounded-2xl shadow-sm border border-primary-100',
            'hover:shadow-lg hover:border-coral-200 transition-all cursor-pointer',
            showMenu ? 'z-50 overflow-visible' : 'overflow-hidden',
            className
          )}
        >
          {/* Image Section */}
          <div className="aspect-[4/3] overflow-hidden relative">
            {imageUrl ? (
              <img
                src={getImageUrl(imageUrl)}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <ChefHat className="w-10 h-10 text-primary-300" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Cuisine tag */}
            {cuisine && (
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-primary-700 text-xs font-semibold rounded-full shadow-sm">
                  {cuisine}
                </span>
              </div>
            )}

            {/* Visibility badge */}
            <div className="absolute top-3 left-3" style={{ marginLeft: cuisine ? '70px' : '0' }}>
              {visibility === 'PUBLIC' && (
                <span className="px-2 py-1 bg-mint-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Public
                </span>
              )}
              {visibility === 'FOLLOWERS' && (
                <span className="px-2 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
                  <UsersIcon className="w-3 h-3" /> Followers
                </span>
              )}
            </div>

            {/* Fork indicator */}
            {(parentRecipe || forkCount > 0) && (
              <div className="absolute bottom-3 left-3">
                {parentRecipe && (
                  <span className="px-2 py-1 bg-terracotta-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
                    <GitFork className="w-3 h-3" /> Forked
                  </span>
                )}
                {forkCount > 0 && !parentRecipe && (
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-primary-700 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
                    <GitFork className="w-3 h-3" /> {forkCount}
                  </span>
                )}
              </div>
            )}

            {/* Favorite button */}
            <button
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={cn(
                'absolute top-3 right-3 p-2 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100',
                isFavorite
                  ? 'bg-coral-500 text-white'
                  : 'bg-white/90 backdrop-blur-sm text-primary-400 hover:text-coral-500 hover:bg-white'
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Toggle favorite
              }}
            >
              <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
            </button>
          </div>

          {/* Content Section */}
          <div className="p-4">
            <h3 className="font-bold text-primary-900 group-hover:text-coral-600 transition-colors truncate">
              {title}
            </h3>
            {authorName && (
              <p className="text-sm text-primary-500 mt-1 truncate">{authorName}</p>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary-50">
              <div className="flex items-center gap-2 text-xs text-primary-400">
                {totalTime > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {totalTime}m
                  </span>
                )}
                {difficulty && (
                  <span className={cn(
                    'px-2 py-0.5 rounded font-medium capitalize',
                    difficulty === 'EASY' && 'bg-mint-100 text-mint-700',
                    difficulty === 'MEDIUM' && 'bg-butter-100 text-butter-700',
                    difficulty === 'HARD' && 'bg-coral-100 text-coral-700',
                    difficulty === 'EXPERT' && 'bg-terracotta-100 text-terracotta-700'
                  )}>
                    {difficulty.toLowerCase()}
                  </span>
                )}
              </div>

              {/* Menu button */}
              <div className="relative" ref={menuRef}>
                <button
                  aria-label="Recipe options"
                  className="p-1.5 rounded-lg text-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-xl shadow-lg border border-primary-100 py-1 z-[60]">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMenu(false);
                        setShowCollectionModal(true);
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2 transition-colors"
                    >
                      <FolderPlus className="w-4 h-4 text-primary-500" />
                      Add to Collection
                    </button>
                    {onVisibilityChange && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowVisibilitySubmenu(!showVisibilitySubmenu);
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-primary-500" />
                            Visibility
                          </span>
                          <ChevronRight className="w-4 h-4 text-primary-400" />
                        </button>
                        {showVisibilitySubmenu && (
                          <div className="absolute left-full top-0 ml-1 w-44 bg-white rounded-xl shadow-lg border border-primary-100 py-1 z-[70]">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (visibility !== 'PRIVATE') {
                                  onVisibilityChange(id, 'PRIVATE');
                                }
                                setShowVisibilitySubmenu(false);
                                setShowMenu(false);
                              }}
                              disabled={visibility === 'PRIVATE'}
                              className={cn(
                                'w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors',
                                visibility === 'PRIVATE'
                                  ? 'text-primary-400 bg-primary-50 cursor-default'
                                  : 'text-primary-700 hover:bg-primary-50'
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Private
                              </span>
                              {visibility === 'PRIVATE' && <Check className="w-4 h-4 text-mint-500" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (visibility !== 'FOLLOWERS') {
                                  onVisibilityChange(id, 'FOLLOWERS');
                                }
                                setShowVisibilitySubmenu(false);
                                setShowMenu(false);
                              }}
                              disabled={visibility === 'FOLLOWERS'}
                              className={cn(
                                'w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors',
                                visibility === 'FOLLOWERS'
                                  ? 'text-primary-400 bg-primary-50 cursor-default'
                                  : 'text-primary-700 hover:bg-primary-50'
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <UsersIcon className="w-4 h-4" />
                                Followers Only
                              </span>
                              {visibility === 'FOLLOWERS' && <Check className="w-4 h-4 text-mint-500" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (visibility !== 'PUBLIC') {
                                  onVisibilityChange(id, 'PUBLIC');
                                }
                                setShowVisibilitySubmenu(false);
                                setShowMenu(false);
                              }}
                              disabled={visibility === 'PUBLIC'}
                              className={cn(
                                'w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors',
                                visibility === 'PUBLIC'
                                  ? 'text-primary-400 bg-primary-50 cursor-default'
                                  : 'text-primary-700 hover:bg-primary-50'
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Public
                              </span>
                              {visibility === 'PUBLIC' && <Check className="w-4 h-4 text-mint-500" />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {isExternalImage && (
                      <button
                        onClick={handleSaveImage}
                        disabled={downloadImage.isPending || isRefreshingImage}
                        className="w-full px-3 py-2.5 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        {downloadImage.isPending || isRefreshingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin text-coral-500" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-primary-500" />
                        )}
                        {isRefreshingImage ? 'Refreshing...' : downloadImage.isPending ? 'Saving...' : 'Save Image Locally'}
                      </button>
                    )}
                    {!isExternalImage && imageUrl && (
                      <span className="px-3 py-2.5 text-sm text-mint-600 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Image saved locally
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      </Link>

      <AddToCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        recipeId={id}
        recipeTitle={title}
      />
    </>
  );
}
