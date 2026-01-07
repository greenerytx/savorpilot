import { Link } from 'react-router-dom';
import { GitFork, ChevronRight, Users } from 'lucide-react';
import { Card } from '../ui';
import { useRecipeForks } from '../../hooks/useRecipes';
import { getImageUrl } from '../../lib/utils';
import type { Recipe } from '../../types/recipe';

interface ForksListProps {
  recipeId: string;
}

interface ForkItemProps {
  fork: Recipe;
}

function ForkItem({ fork }: ForkItemProps) {
  // Get author name from the recipe if user data is available
  const authorName = fork.userId ? 'A user' : 'Unknown';

  return (
    <Link to={`/recipes/${fork.id}`}>
      <Card className="p-4 hover:shadow-md hover:border-primary-200 transition-all group">
        <div className="flex items-start gap-3">
          {fork.imageUrl ? (
            <img
              src={getImageUrl(fork.imageUrl)}
              alt={fork.title}
              className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <GitFork className="w-6 h-6 text-neutral-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
              {fork.title}
            </h4>

            {fork.forkNote && (
              <p className="text-sm text-neutral-500 italic line-clamp-1 mt-0.5">
                "{fork.forkNote}"
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
              <span>by {authorName}</span>
              {fork.forkCount > 0 && (
                <span className="flex items-center gap-1">
                  <GitFork className="w-3 h-3" />
                  {fork.forkCount}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
}

export function ForksList({ recipeId }: ForksListProps) {
  const { data, isLoading, error } = useRecipeForks(recipeId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-neutral-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-neutral-500">Failed to load forks</p>
      </Card>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-neutral-400" />
        </div>
        <p className="text-neutral-600 font-medium">No forks yet</p>
        <p className="text-sm text-neutral-500 mt-1">
          Be the first to fork this recipe and make it your own!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.data.map((fork) => (
        <ForkItem key={fork.id} fork={fork} />
      ))}

      {data.total > data.data.length && (
        <p className="text-sm text-neutral-500 text-center pt-2">
          Showing {data.data.length} of {data.total} forks
        </p>
      )}
    </div>
  );
}
