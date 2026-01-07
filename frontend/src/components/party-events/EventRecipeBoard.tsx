import { Link } from 'react-router-dom';
import { Loader2, ChefHat, Hand, X, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../ui';
import {
  usePartyEvent,
  useClaimRecipe,
  useUnclaimRecipe,
  useUnpinRecipe,
  useRecipeCompatibility,
} from '../../hooks/usePartyEvents';
import { useToast } from '../ui';
import { getImageUrl, cn } from '../../lib/utils';

// Compatibility badge component for each recipe
function CompatibilityBadge({ eventId, recipeId }: { eventId: string; recipeId: string }) {
  const { data: compatibility, isLoading } = useRecipeCompatibility(eventId, recipeId);

  if (isLoading) {
    return null;
  }

  if (!compatibility) {
    return null;
  }

  if (compatibility.safeForAll) {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
        <CheckCircle className="w-3 h-3" />
        <span>Safe for all</span>
      </div>
    );
  }

  const allergenCount = compatibility.issues.filter(i => i.type === 'allergen').length;
  const restrictionCount = compatibility.issues.filter(i => i.type === 'restriction').length;

  return (
    <div className="group/compat relative">
      <div className={cn(
        'flex items-center gap-1 text-xs px-2 py-1 rounded-full cursor-help',
        allergenCount > 0
          ? 'text-red-600 bg-red-50'
          : 'text-amber-600 bg-amber-50'
      )}>
        <AlertTriangle className="w-3 h-3" />
        <span>
          {allergenCount > 0
            ? `${allergenCount} allergen${allergenCount > 1 ? 's' : ''}`
            : `${restrictionCount} issue${restrictionCount > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Tooltip with details */}
      <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover/compat:opacity-100 group-hover/compat:visible transition-all z-10">
        <p className="text-xs font-medium text-neutral-700 mb-2">{compatibility.summary}</p>
        <div className="space-y-1">
          {compatibility.issues.slice(0, 3).map((issue, idx) => (
            <div key={idx} className="text-xs text-neutral-600">
              <span className={issue.type === 'allergen' ? 'text-red-600' : 'text-amber-600'}>
                {issue.item}
              </span>
              {' - '}
              {issue.affectedMembers.slice(0, 2).join(', ')}
              {issue.affectedMembers.length > 2 && ` +${issue.affectedMembers.length - 2} more`}
            </div>
          ))}
          {compatibility.issues.length > 3 && (
            <p className="text-xs text-neutral-400">+{compatibility.issues.length - 3} more issues</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface EventRecipeBoardProps {
  eventId: string;
  compact?: boolean;
}

export function EventRecipeBoard({ eventId, compact }: EventRecipeBoardProps) {
  const toast = useToast();
  const { data: event, isLoading } = usePartyEvent(eventId);
  const claimRecipe = useClaimRecipe();
  const unclaimRecipe = useUnclaimRecipe();
  const unpinRecipe = useUnpinRecipe();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  const recipes = event?.recipes || [];
  const displayRecipes = compact ? recipes.slice(0, 4) : recipes;

  if (recipes.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <ChefHat className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
        <p>No recipes yet</p>
        <p className="text-sm">Add recipes to plan the menu!</p>
      </div>
    );
  }

  const handleClaim = async (recipeId: string) => {
    try {
      await claimRecipe.mutateAsync({ eventId, recipeId });
      toast.success("You're making this dish!");
    } catch {
      toast.error('Failed to claim recipe');
    }
  };

  const handleUnclaim = async (recipeId: string) => {
    try {
      await unclaimRecipe.mutateAsync({ eventId, recipeId });
      toast.success('Claim removed');
    } catch {
      toast.error('Failed to unclaim');
    }
  };

  const handleUnpin = async (recipeId: string) => {
    if (!confirm('Remove this recipe from the event?')) return;

    try {
      await unpinRecipe.mutateAsync({ eventId, recipeId });
      toast.success('Recipe removed');
    } catch {
      toast.error('Failed to remove recipe');
    }
  };

  // Group by category
  const categories = [...new Set(recipes.map((r) => r.category || 'Other'))];
  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = recipes.filter((r) => (r.category || 'Other') === cat);
    return acc;
  }, {} as Record<string, typeof recipes>);

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {displayRecipes.map((item) => (
          <Link
            key={item.id}
            to={`/recipes/${item.recipeId}`}
            className="group"
          >
            <div className="aspect-square rounded-lg bg-neutral-100 overflow-hidden relative">
              {item.recipe?.imageUrl ? (
                <img
                  src={getImageUrl(item.recipe.imageUrl)}
                  alt={item.recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-neutral-300" />
                </div>
              )}

              {item.claimedBy && (
                <div className="absolute bottom-1 right-1 bg-white/90 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                  <span>{item.claimedBy.avatarEmoji || '👤'}</span>
                </div>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-800 line-clamp-1">
              {item.recipe?.title || 'Recipe'}
            </p>
            {item.category && (
              <p className="text-xs text-neutral-500">{item.category}</p>
            )}
          </Link>
        ))}
        {recipes.length > 4 && (
          <div className="col-span-2 text-center pt-2">
            <p className="text-sm text-neutral-500">+{recipes.length - 4} more recipes</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, categoryRecipes]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-neutral-600 mb-3 uppercase tracking-wide">
            {category}
          </h4>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryRecipes.map((item) => (
              <div
                key={item.id}
                className="bg-white border rounded-xl overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <Link to={`/recipes/${item.recipeId}`}>
                  <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                    {item.recipe?.imageUrl ? (
                      <img
                        src={getImageUrl(item.recipe.imageUrl)}
                        alt={item.recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-12 h-12 text-neutral-300" />
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleUnpin(item.recipeId);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-3">
                  <Link to={`/recipes/${item.recipeId}`}>
                    <h5 className="font-medium text-neutral-800 hover:text-primary-600 line-clamp-1">
                      {item.recipe?.title || 'Recipe'}
                    </h5>
                  </Link>

                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-neutral-500">
                      <Users className="w-3 h-3" />
                      {item.servings}
                    </span>
                    {(item.recipe?.prepTimeMinutes || item.recipe?.cookTimeMinutes) && (
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Clock className="w-3 h-3" />
                        {(item.recipe.prepTimeMinutes || 0) + (item.recipe.cookTimeMinutes || 0)}m
                      </span>
                    )}
                    <CompatibilityBadge eventId={eventId} recipeId={item.recipeId} />
                  </div>

                  {item.notes && (
                    <p className="mt-2 text-xs text-neutral-600 line-clamp-2">
                      {item.notes}
                    </p>
                  )}

                  {/* Claim Section */}
                  <div className="mt-3 pt-3 border-t">
                    {item.claimedBy ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.claimedBy.avatarEmoji || '👤'}</span>
                          <span className="text-sm text-neutral-700">
                            {item.claimedBy.name}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnclaim(item.recipeId)}
                        >
                          Unclaim
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleClaim(item.recipeId)}
                      >
                        <Hand className="w-4 h-4" />
                        I'll make this!
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default EventRecipeBoard;
