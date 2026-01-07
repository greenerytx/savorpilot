import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '../ui';
import { cn } from '../../lib/utils';
import { useForkVoteStats, useVoteFork, useUnvoteFork } from '../../hooks';

interface ForkVoteButtonProps {
  recipeId: string;
  className?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ForkVoteButton({
  recipeId,
  className,
  showCount = true,
  size = 'md',
}: ForkVoteButtonProps) {
  const { data: stats, isLoading } = useForkVoteStats(recipeId);
  const voteMutation = useVoteFork();
  const unvoteMutation = useUnvoteFork();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async () => {
    if (!stats) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (stats.hasUserVoted) {
      await unvoteMutation.mutateAsync(recipeId);
    } else {
      await voteMutation.mutateAsync(recipeId);
    }
  };

  const isPending = voteMutation.isPending || unvoteMutation.isPending;

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={cn(sizeClasses[size], className)}
      >
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
      </Button>
    );
  }

  return (
    <Button
      variant={stats?.hasUserVoted ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        sizeClasses[size],
        stats?.hasUserVoted
          ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
          : 'hover:border-rose-300 hover:text-rose-600',
        isAnimating && 'scale-110',
        'transition-all duration-200',
        className,
      )}
    >
      {isPending ? (
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
      ) : (
        <Heart
          className={cn(
            iconSizes[size],
            stats?.hasUserVoted && 'fill-current',
            isAnimating && 'animate-pulse',
          )}
        />
      )}
      {showCount && stats && (
        <span className="ml-1.5">{stats.voteCount}</span>
      )}
    </Button>
  );
}
