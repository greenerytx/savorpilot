import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Printer,
  FolderPlus,
  Globe,
  Lock,
  Users,
  GitFork,
  Play,
  ChefHat,
  Languages,
  Edit,
  Trash2,
  Loader2,
  MoreHorizontal,
  Copy,
  Image,
  Check,
} from 'lucide-react';
import { Button, Badge } from '../ui';
import { cn } from '../../lib/utils';
import { RecipeVisibility } from '../../types/recipe';

interface RecipeActionBarProps {
  recipeId: string;
  visibility: RecipeVisibility;
  isFavorite: boolean;
  hasTranslations: boolean;
  isTranslating: boolean;
  isUpdatingVisibility: boolean;
  isOwner: boolean;
  prevId: string | null;
  nextId: string | null;
  onFavoriteToggle: () => void;
  onShare: () => void;
  onPrint: () => void;
  onAddToCollection: () => void;
  onVisibilityChange: (visibility: RecipeVisibility) => void;
  onFork: () => void;
  onCook: () => void;
  onMadeIt: () => void;
  onTranslate: () => void;
  onDelete: () => void;
}

/**
 * Option A: Grouped Dropdown Approach
 * - Clean top bar with Share dropdown and More menu
 * - Floating bottom bar with primary CTAs (Cook, Made It)
 * - Reduces cognitive load from 13 buttons to 5 visible + 2 menus
 */
export function OptionAActionBar({
  recipeId,
  visibility,
  isFavorite,
  hasTranslations,
  isTranslating,
  isUpdatingVisibility,
  isOwner,
  prevId,
  nextId,
  onFavoriteToggle,
  onShare,
  onPrint,
  onAddToCollection,
  onVisibilityChange,
  onFork,
  onCook,
  onMadeIt,
  onTranslate,
  onDelete,
}: RecipeActionBarProps) {
  const navigate = useNavigate();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showFloatingBar, setShowFloatingBar] = useState(true);

  const shareMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);

  const visibilityOptions = [
    { value: 'PRIVATE' as RecipeVisibility, label: 'Private', description: 'Only you can see', icon: Lock },
    { value: 'FOLLOWERS' as RecipeVisibility, label: 'Followers', description: 'Your followers can see', icon: Users },
    { value: 'PUBLIC' as RecipeVisibility, label: 'Public', description: 'Everyone can see', icon: Globe },
  ];

  const currentVisibility = visibilityOptions.find(v => v.value === visibility) || visibilityOptions[0];

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (visibilityMenuRef.current && !visibilityMenuRef.current.contains(event.target as Node)) {
        setShowVisibilityMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide floating bar when scrolled to bottom (near comments/footer)
  useEffect(() => {
    const handleScroll = () => {
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      // Hide when within 200px of bottom
      setShowFloatingBar(scrollBottom < docHeight - 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    setShowShareMenu(false);
  };

  return (
    <div className="space-y-3">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Back + Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {(prevId || nextId) && (
            <div className="flex items-center gap-1 ml-2 border-l pl-2 border-neutral-200">
              <Button
                variant="ghost"
                size="sm"
                disabled={!prevId}
                onClick={() => prevId && navigate(`/recipes/${prevId}`)}
                title="Previous recipe"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!nextId}
                onClick={() => nextId && navigate(`/recipes/${nextId}`)}
                title="Next recipe"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Favorite */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onFavoriteToggle}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={cn(
                'w-5 h-5 transition-colors',
                isFavorite ? 'fill-red-500 text-red-500' : ''
              )}
            />
          </Button>

          {/* Share Dropdown */}
          <div className="relative" ref={shareMenuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowShareMenu(!showShareMenu);
                setShowMoreMenu(false);
              }}
              className="gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              Share
              <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
            </Button>

            {showShareMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={handleCopyLink}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-500" />
                  )}
                  {linkCopied ? 'Link Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => {
                    onShare();
                    setShowShareMenu(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-neutral-500" />
                  Share with Someone
                </button>
                <div className="border-t border-neutral-100 my-1" />
                <button
                  onClick={() => {
                    onShare();
                    setShowShareMenu(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                >
                  <Image className="w-4 h-4 text-neutral-500" />
                  Create Image Card
                </button>
              </div>
            )}
          </div>

          {/* More Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowMoreMenu(!showMoreMenu);
                setShowShareMenu(false);
              }}
              title="More actions"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Owner-only: Edit */}
                {isOwner && (
                  <Link
                    to={`/recipes/${recipeId}/edit`}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <Edit className="w-4 h-4 text-neutral-500" />
                    Edit Recipe
                  </Link>
                )}
                <button
                  onClick={() => {
                    onAddToCollection();
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                >
                  <FolderPlus className="w-4 h-4 text-neutral-500" />
                  Add to Collection
                </button>
                <button
                  onClick={() => {
                    onFork();
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                >
                  <GitFork className="w-4 h-4 text-neutral-500" />
                  Fork / Adapt Recipe
                </button>

                <div className="border-t border-neutral-100 my-1" />

                <button
                  onClick={() => {
                    onPrint();
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                >
                  <Printer className="w-4 h-4 text-neutral-500" />
                  Print Recipe
                </button>
                <button
                  onClick={() => {
                    onTranslate();
                    setShowMoreMenu(false);
                  }}
                  disabled={isTranslating}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                >
                  {isTranslating ? (
                    <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
                  ) : (
                    <Languages className="w-4 h-4 text-neutral-500" />
                  )}
                  <span className="flex-1">Translate</span>
                  {hasTranslations && (
                    <Badge variant="success" className="text-xs py-0">Done</Badge>
                  )}
                </button>

                {/* Owner-only: Visibility and Delete */}
                {isOwner && (
                  <>
                    <div className="border-t border-neutral-100 my-1" />

                    {/* Visibility submenu */}
                    <div className="relative" ref={visibilityMenuRef}>
                      <button
                        onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                        disabled={isUpdatingVisibility}
                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                      >
                        {isUpdatingVisibility ? (
                          <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
                        ) : (
                          <currentVisibility.icon className="w-4 h-4 text-neutral-500" />
                        )}
                        <span className="flex-1">Visibility: {currentVisibility.label}</span>
                        <ChevronRight className="w-3 h-3 text-neutral-400" />
                      </button>

                      {showVisibilityMenu && (
                        <div className="absolute left-full top-0 ml-1 w-52 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50 animate-in fade-in slide-in-from-left-2 duration-150">
                          {visibilityOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                onVisibilityChange(option.value);
                                setShowVisibilityMenu(false);
                                setShowMoreMenu(false);
                              }}
                              disabled={isUpdatingVisibility}
                              className={cn(
                                'w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors disabled:opacity-50',
                                visibility === option.value && 'bg-primary-50'
                              )}
                            >
                              <option.icon className={cn(
                                'w-4 h-4',
                                visibility === option.value ? 'text-primary-500' : 'text-neutral-500'
                              )} />
                              <div className="flex-1">
                                <div className={cn(
                                  'font-medium',
                                  visibility === option.value && 'text-primary-600'
                                )}>
                                  {option.label}
                                </div>
                                <div className="text-xs text-neutral-500">{option.description}</div>
                              </div>
                              {visibility === option.value && (
                                <Check className="w-4 h-4 text-primary-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-neutral-100 my-1" />

                    <button
                      onClick={() => {
                        onDelete();
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Recipe
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Primary CTA - Cook (visible on larger screens) */}
          <Button
            onClick={onCook}
            className="hidden sm:flex bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="w-4 h-4 mr-1" />
            Cook
          </Button>
        </div>
      </div>

      {/* Floating Bottom Bar - Primary CTAs */}
      <div
        className={cn(
          'fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300',
          showFloatingBar
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200 px-3 py-2.5 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onMadeIt}
            className="rounded-xl px-4 border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <ChefHat className="w-4 h-4 mr-2" />
            Made It
          </Button>
          <Button
            onClick={onCook}
            className="rounded-xl px-5 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Cooking
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OptionAActionBar;
