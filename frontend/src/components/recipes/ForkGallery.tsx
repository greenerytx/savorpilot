import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Grid3X3, List, ChefHat, Heart, Clock, ArrowUpDown } from 'lucide-react';
import { Card, Button } from '../ui';
import { cn } from '../../lib/utils';
import { useForkGallery } from '../../hooks';
import { ForkTagBadges } from './ForkTagSelector';
import { ForkVoteButton } from './ForkVoteButton';

interface ForkGalleryProps {
  recipeId: string;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'votes' | 'newest';

export function ForkGallery({ recipeId, className }: ForkGalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('votes');
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error } = useForkGallery(recipeId, {
    limit,
    offset,
    sortBy,
  });

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn('text-center py-12 text-neutral-500', className)}>
        Failed to load fork gallery
      </div>
    );
  }

  if (data.forks.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <ChefHat className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
        <h3 className="font-medium text-neutral-700 mb-2">No forks yet</h3>
        <p className="text-sm text-neutral-500">
          Be the first to create a variation of this recipe!
        </p>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-neutral-500">
          {data.total} fork{data.total !== 1 ? 's' : ''}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === 'votes' ? 'newest' : 'votes')}
          >
            <ArrowUpDown className="w-4 h-4 mr-1" />
            {sortBy === 'votes' ? 'Top Voted' : 'Newest'}
          </Button>

          {/* View Mode */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white text-neutral-500 hover:bg-neutral-50',
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white text-neutral-500 hover:bg-neutral-50',
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.forks.map((fork) => (
            <Link key={fork.id} to={`/recipes/${fork.id}`} className="group">
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="aspect-square relative bg-neutral-100">
                  {fork.imageUrl ? (
                    <img
                      src={fork.imageUrl}
                      alt={fork.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-50 to-amber-50 flex items-center justify-center">
                      <ChefHat className="w-12 h-12 text-primary-200" />
                    </div>
                  )}

                  {/* Vote count badge */}
                  {fork.voteCount > 0 && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                      {fork.voteCount}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  <h4 className="font-medium text-neutral-800 text-sm line-clamp-1 group-hover:text-primary-600">
                    {fork.title}
                  </h4>

                  <p className="text-xs text-neutral-500 mt-1">
                    by {fork.author.firstName} {fork.author.lastName}
                  </p>

                  {fork.forkNote && (
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-1 italic">
                      "{fork.forkNote}"
                    </p>
                  )}

                  <ForkTagBadges tags={fork.forkTags} className="mt-2" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data.forks.map((fork) => (
            <Link key={fork.id} to={`/recipes/${fork.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                    {fork.imageUrl ? (
                      <img
                        src={fork.imageUrl}
                        alt={fork.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-50 to-amber-50 flex items-center justify-center">
                        <ChefHat className="w-8 h-8 text-primary-200" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-800 hover:text-primary-600">
                          {fork.title}
                        </h4>
                        <p className="text-sm text-neutral-500">
                          by {fork.author.firstName} {fork.author.lastName}
                        </p>
                      </div>

                      <ForkVoteButton recipeId={fork.id} size="sm" />
                    </div>

                    {fork.forkNote && (
                      <p className="text-sm text-neutral-600 mt-2 italic">
                        "{fork.forkNote}"
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <ForkTagBadges tags={fork.forkTags} />
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(fork.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      {data.hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => setOffset((prev) => prev + limit)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
