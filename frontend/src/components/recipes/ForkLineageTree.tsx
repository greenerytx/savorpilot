import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GitFork, ChevronRight, Users, Star, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { Card, Avatar, AvatarFallback, AvatarImage, Badge } from '../ui';
import { cn, getImageUrl } from '../../lib/utils';

interface LineageItem {
  id: string;
  title: string;
  imageUrl?: string;
  forkNote?: string;
  forkTags: string[];
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  forkCount: number;
  voteCount?: number;
}

interface ForkLineageResponse {
  ancestors: LineageItem[];
  current: LineageItem;
  descendants: LineageItem[];
  totalForkCount: number;
}

interface ForkLineageTreeProps {
  recipeId: string;
}

async function fetchForkLineage(recipeId: string): Promise<ForkLineageResponse> {
  const { data } = await api.get(`/fork-enhancements/recipes/${recipeId}/lineage`);
  return data;
}

function LineageCard({ item, isHighlighted = false }: { item: LineageItem; isHighlighted?: boolean }) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  return (
    <Link
      to={`/recipes/${item.id}`}
      className={cn(
        'block p-3 rounded-lg border transition-all hover:shadow-md',
        isHighlighted
          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
          : 'border-neutral-200 hover:border-neutral-300 bg-white'
      )}
    >
      <div className="flex gap-3">
        {item.imageUrl ? (
          <img
            src={getImageUrl(item.imageUrl)}
            alt={item.title}
            className="w-12 h-12 rounded-md object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <GitFork className="h-5 w-5 text-neutral-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{item.title}</h4>

          <div className="flex items-center gap-2 mt-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={item.author.avatarUrl} alt={item.author.firstName} />
              <AvatarFallback className="text-[10px]">
                {getInitials(item.author.firstName, item.author.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {item.author.firstName} {item.author.lastName}
            </span>
          </div>

          {item.forkNote && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              "{item.forkNote}"
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {item.forkCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <GitFork className="h-3 w-3" />
                {item.forkCount}
              </span>
            )}
            {item.voteCount !== undefined && item.voteCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3" />
                {item.voteCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {item.forkTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.forkTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}

export function ForkLineageTree({ recipeId }: ForkLineageTreeProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fork-lineage', recipeId],
    queryFn: () => fetchForkLineage(recipeId),
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const hasAncestors = data.ancestors.length > 0;
  const hasDescendants = data.descendants.length > 0;

  if (!hasAncestors && !hasDescendants) {
    return null; // No lineage to show
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <GitFork className="h-5 w-5 text-purple-500" />
          Recipe Lineage
        </h3>
        <span className="text-sm text-muted-foreground">
          {data.totalForkCount} total forks
        </span>
      </div>

      <div className="space-y-4">
        {/* Ancestors */}
        {hasAncestors && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Original & Parent Recipes
            </p>
            <div className="space-y-2">
              {data.ancestors.map((ancestor, index) => (
                <div key={ancestor.id} className="flex items-center gap-2">
                  {index > 0 && (
                    <div className="flex items-center justify-center w-6">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className={cn('flex-1', index > 0 && 'ml-2')}>
                    <LineageCard item={ancestor} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Recipe */}
        <div>
          {hasAncestors && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-6">
                <ChevronRight className="h-4 w-4 text-primary-500" />
              </div>
              <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                This Recipe
              </p>
            </div>
          )}
          <div className={hasAncestors ? 'ml-8' : ''}>
            <LineageCard item={data.current} isHighlighted />
          </div>
        </div>

        {/* Descendants */}
        {hasDescendants && (
          <div className={hasAncestors ? 'ml-8' : ''}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-6">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Inspired Recipes ({data.descendants.length})
              </p>
            </div>

            <div className="ml-8 grid gap-2">
              {data.descendants.slice(0, 5).map((descendant) => (
                <LineageCard key={descendant.id} item={descendant} />
              ))}

              {data.descendants.length > 5 && (
                <Link
                  to={`/recipes/${recipeId}?tab=forks`}
                  className="text-sm text-primary-600 hover:underline mt-1"
                >
                  View all {data.descendants.length} inspired recipes
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
