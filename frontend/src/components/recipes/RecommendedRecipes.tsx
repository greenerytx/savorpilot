import { Link } from 'react-router-dom';
import { useRecommendedRecipes } from '../../hooks';
import { Card } from '../ui';
import { cn } from '../../lib/utils';
import { Loader2, Sparkles, Clock, ChefHat, ArrowRight } from 'lucide-react';

interface RecommendedRecipesProps {
  className?: string;
  limit?: number;
  compact?: boolean;
}

export function RecommendedRecipes({
  className,
  limit = 6,
  compact = false,
}: RecommendedRecipesProps) {
  const { data: recipes, isLoading, error } = useRecommendedRecipes(limit);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  if (error || !recipes || recipes.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-neutral-500 py-8">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No recommendations yet</p>
          <p className="text-sm mt-1">
            Cook more recipes to get personalized recommendations!
          </p>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            For You
          </h3>
          <Link
            to="/recipes?filter=recommended"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {recipes.slice(0, 3).map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              {recipe.imageUrl ? (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-amber-100 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-primary-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-800 truncate">
                  {recipe.title}
                </p>
                <p className="text-xs text-neutral-500">
                  {recipe.matchReasons[0]}
                </p>
              </div>
              <div className="text-xs text-neutral-400">
                {recipe.score}% match
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Recommended for You
        </h2>
        <Link
          to="/recipes?filter=recommended"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            to={`/recipes/${recipe.id}`}
            className="group"
          >
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="aspect-video relative bg-neutral-100">
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-amber-100 flex items-center justify-center">
                    <ChefHat className="w-12 h-12 text-primary-300" />
                  </div>
                )}

                {/* Match score badge */}
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-primary-700">
                  {recipe.score}% match
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {recipe.title}
                </h3>

                {recipe.description && (
                  <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                    {recipe.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-3 mt-3 text-xs text-neutral-400">
                  {recipe.cuisine && (
                    <span className="px-2 py-0.5 bg-neutral-100 rounded">
                      {recipe.cuisine}
                    </span>
                  )}
                  {recipe.totalTimeMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {recipe.totalTimeMinutes} min
                    </span>
                  )}
                </div>

                {/* Match reasons */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex flex-wrap gap-1">
                    {recipe.matchReasons.slice(0, 2).map((reason, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
