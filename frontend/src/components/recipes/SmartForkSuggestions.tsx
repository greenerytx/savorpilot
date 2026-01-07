import { Link } from 'react-router-dom';
import { Sparkles, ChefHat, Heart, TrendingUp, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { cn } from '../../lib/utils';
import { useSmartForkSuggestions } from '../../hooks';
import { ForkTagBadges } from './ForkTagSelector';

interface SmartForkSuggestionsProps {
  recipeId: string;
  className?: string;
}

export function SmartForkSuggestions({
  recipeId,
  className,
}: SmartForkSuggestionsProps) {
  const { data: suggestions, isLoading, error } = useSmartForkSuggestions(recipeId);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  if (error || !suggestions || suggestions.length === 0) {
    return null; // Don't show anything if no suggestions
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">Forks For You</h3>
        </div>
        <p className="text-sm text-white/80 mt-1">
          Based on your Flavor DNA profile
        </p>
      </div>

      {/* Suggestions List */}
      <div className="divide-y">
        {suggestions.map((suggestion, idx) => (
          <Link
            key={suggestion.id}
            to={`/recipes/${suggestion.id}`}
            className="block p-4 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex gap-4">
              {/* Rank Badge */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  idx === 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-neutral-100 text-neutral-600',
                )}
              >
                {idx + 1}
              </div>

              {/* Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                {suggestion.imageUrl ? (
                  <img
                    src={suggestion.imageUrl}
                    alt={suggestion.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-50 to-amber-50 flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-primary-200" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-neutral-800 line-clamp-1">
                    {suggestion.title}
                  </h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Match Score */}
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        suggestion.matchScore >= 80
                          ? 'bg-green-100 text-green-700'
                          : suggestion.matchScore >= 60
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-neutral-100 text-neutral-600',
                      )}
                    >
                      {suggestion.matchScore}% match
                    </span>
                  </div>
                </div>

                <p className="text-sm text-neutral-500">
                  by {suggestion.author.firstName} {suggestion.author.lastName}
                </p>

                {/* Match Reasons */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {suggestion.matchReasons.slice(0, 2).map((reason, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded"
                    >
                      {reason}
                    </span>
                  ))}
                </div>

                {/* Tags and Votes */}
                <div className="flex items-center gap-3 mt-2">
                  <ForkTagBadges
                    tags={suggestion.forkTags.slice(0, 2)}
                  />
                  {suggestion.voteCount > 0 && (
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {suggestion.voteCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 bg-neutral-50 text-center">
        <p className="text-xs text-neutral-500">
          Suggestions improve as you cook more recipes
        </p>
      </div>
    </Card>
  );
}
