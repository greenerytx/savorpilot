import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Clock,
  Utensils,
  Cake,
  Heart,
  Leaf,
  Star,
  Calendar,
  Zap,
  Grid,
  List,
  Trash2,
  Edit3,
  ChefHat,
  Loader2,
  Filter,
  Share2,
  Lock,
  Globe,
  Users,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button, Card, Badge, useConfirm, useToast } from '../../components/ui';
import { RecipeCard } from '../../components/recipes/RecipeCard';
import { ShareModal } from '../../components/sharing';
import { useSmartCollection, useDeleteSmartCollection, useUpdateSmartCollection } from '../../hooks';
import type { CollectionVisibility } from '../../types/smart-collection';

// Icon mapping
const iconMap: Record<string, any> = {
  clock: Clock,
  utensils: Utensils,
  cake: Cake,
  heart: Heart,
  leaf: Leaf,
  star: Star,
  calendar: Calendar,
  zap: Zap,
  sparkles: Sparkles,
};

// Color mapping
const colorMap: Record<string, string> = {
  purple: 'bg-purple-100 text-purple-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  amber: 'bg-amber-100 text-amber-600',
  rose: 'bg-rose-100 text-rose-600',
  orange: 'bg-orange-100 text-orange-600',
  teal: 'bg-teal-100 text-teal-600',
  indigo: 'bg-indigo-100 text-indigo-600',
};

// Visibility options
const visibilityOptions: { value: CollectionVisibility; label: string; icon: typeof Lock; description: string }[] = [
  { value: 'PRIVATE', label: 'Private', icon: Lock, description: 'Only you can see' },
  { value: 'FOLLOWERS', label: 'Followers', icon: Users, description: 'Your followers can see' },
  { value: 'PUBLIC', label: 'Public', icon: Globe, description: 'Anyone can see' },
];

export function SmartCollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const toast = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const visibilityRef = useRef<HTMLDivElement>(null);

  const { data: collection, isLoading, error } = useSmartCollection(id!);
  const deleteMutation = useDeleteSmartCollection();
  const updateMutation = useUpdateSmartCollection();

  // Redirect if access denied (403) or not found
  useEffect(() => {
    if (error) {
      navigate('/collections', { replace: true });
    }
  }, [error, navigate]);

  // Close visibility menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (visibilityRef.current && !visibilityRef.current.contains(event.target as Node)) {
        setShowVisibilityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVisibilityChange = async (visibility: CollectionVisibility) => {
    if (!collection) return;
    try {
      await updateMutation.mutateAsync({ id: id!, data: { visibility } });
      toast.success('Visibility updated');
    } catch (error) {
      toast.error('Failed to update visibility');
    }
    setShowVisibilityMenu(false);
  };

  const handleDelete = async () => {
    if (!collection || collection.isSystem) return;

    const confirmed = await confirmDialog({
      title: 'Delete Smart Collection',
      message: `Delete "${collection.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id!);
        navigate('/collections');
      } catch (error) {
        toast.error('Failed to delete collection');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !collection) {
    // Redirect handled by useEffect, show nothing while redirecting
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const Icon = iconMap[collection.icon || 'sparkles'] || Sparkles;
  const colorClasses = colorMap[collection.color || 'purple'] || colorMap.purple;

  // Build filter description
  const filterDescriptions: string[] = [];
  if (collection.filterRules.category?.length) {
    filterDescriptions.push(`Categories: ${collection.filterRules.category.join(', ').toLowerCase()}`);
  }
  if (collection.filterRules.difficulty?.length) {
    filterDescriptions.push(`Difficulty: ${collection.filterRules.difficulty.join(', ').toLowerCase()}`);
  }
  if (collection.filterRules.maxTime) {
    filterDescriptions.push(`Max ${collection.filterRules.maxTime} minutes`);
  }
  if (collection.filterRules.recentDays) {
    filterDescriptions.push(`Last ${collection.filterRules.recentDays} days`);
  }
  if (collection.filterRules.tags?.length) {
    filterDescriptions.push(`Tags: ${collection.filterRules.tags.join(', ')}`);
  }
  if (collection.filterRules.source?.length) {
    filterDescriptions.push(`Sources: ${collection.filterRules.source.join(', ').toLowerCase()}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/collections')}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colorClasses}`}>
            <Icon className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display text-primary-900">{collection.name}</h1>
              {collection.isSystem && (
                <Badge variant="secondary">System</Badge>
              )}
            </div>
            {collection.description && (
              <p className="text-neutral-600 mt-1">{collection.description}</p>
            )}
            <p className="text-sm text-neutral-500 mt-2">
              {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'} • Auto-updated
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Visibility Dropdown */}
          <div className="relative" ref={visibilityRef}>
            <Button
              variant="outline"
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              className="min-w-[140px] justify-between"
            >
              {(() => {
                const current = visibilityOptions.find(o => o.value === (collection.visibility || 'PRIVATE'));
                const Icon = current?.icon || Lock;
                return (
                  <>
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {current?.label || 'Private'}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </>
                );
              })()}
            </Button>
            {showVisibilityMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-50">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = option.value === (collection.visibility || 'PRIVATE');
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleVisibilityChange(option.value)}
                      className="w-full px-4 py-2.5 text-left hover:bg-neutral-50 flex items-center gap-3"
                    >
                      <Icon className="w-4 h-4 text-neutral-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{option.label}</p>
                        <p className="text-xs text-neutral-500">{option.description}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Share Button */}
          <Button variant="outline" onClick={() => setShowShareModal(true)}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>

          {/* Delete Button (for non-system collections only) */}
          {!collection.isSystem && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Filter Info */}
      {filterDescriptions.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Active Filters</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterDescriptions.map((desc, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {desc}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === 'grid'
              ? 'bg-primary-100 text-primary-600'
              : 'text-neutral-500 hover:bg-neutral-100'
          }`}
        >
          <Grid className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === 'list'
              ? 'bg-primary-100 text-primary-600'
              : 'text-neutral-500 hover:bg-neutral-100'
          }`}
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      {/* Empty State */}
      {collection.recipes.length === 0 && (
        <Card className="p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No matching recipes</h3>
          <p className="text-neutral-600 mb-6">
            No recipes match this collection's filters yet. Add more recipes to see them here!
          </p>
          <Link to="/recipes/new?source=image">
            <Button>Add New Recipe</Button>
          </Link>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && collection.recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collection.recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              imageUrl={recipe.imageUrl}
              prepTime={0}
              cookTime={recipe.totalTimeMinutes || 0}
              category={recipe.category}
              cuisine={recipe.cuisine}
              difficulty={recipe.difficulty as any}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && collection.recipes.length > 0 && (
        <div className="space-y-3">
          {collection.recipes.map((recipe) => (
            <Link key={recipe.id} to={`/recipes/${recipe.id}`}>
              <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex-shrink-0 overflow-hidden">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-8 h-8 text-primary-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 truncate">{recipe.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                    {recipe.category && (
                      <Badge variant="secondary" className="text-xs">
                        {recipe.category.toLowerCase().replace('_', ' ')}
                      </Badge>
                    )}
                    {recipe.cuisine && (
                      <span className="truncate">{recipe.cuisine}</span>
                    )}
                    {recipe.totalTimeMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {recipe.totalTimeMinutes} min
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="smart-collection"
        itemId={collection.id}
        itemName={collection.name}
      />
    </div>
  );
}
