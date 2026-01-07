import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reactionsService, type ReactionType } from '../../services/public.service';
import { useToast } from '../ui';
import { useAuthStore } from '../../stores/authStore';

interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  activeClass: string;
}

const REACTIONS: ReactionConfig[] = [
  { type: 'FIRE', emoji: '🔥', label: 'Fire', activeClass: 'bg-orange-100 border-orange-400 text-orange-700' },
  { type: 'WANT', emoji: '😍', label: 'Want', activeClass: 'bg-pink-100 border-pink-400 text-pink-700' },
  { type: 'DROOLING', emoji: '🤤', label: 'Yum', activeClass: 'bg-yellow-100 border-yellow-400 text-yellow-700' },
  { type: 'MADE_IT', emoji: '👨‍🍳', label: 'Made It', activeClass: 'bg-green-100 border-green-400 text-green-700' },
];

interface ReactionBarProps {
  recipeId: string;
  variant?: 'compact' | 'full';
  showCounts?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ReactionBar({
  recipeId,
  variant = 'full',
  showCounts = true,
  disabled = false,
  className = '',
}: ReactionBarProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [optimisticReactions, setOptimisticReactions] = useState<ReactionType[]>([]);

  // Query for reaction stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['reactions', recipeId],
    queryFn: () => reactionsService.getReactionStats(recipeId),
    staleTime: 30000, // 30 seconds
  });

  // Mutation for toggling reactions
  const toggleMutation = useMutation({
    mutationFn: async ({ type, isActive }: { type: ReactionType; isActive: boolean }) => {
      await reactionsService.toggleReaction(recipeId, type, isActive);
    },
    onMutate: async ({ type, isActive }) => {
      // Optimistically update
      if (isActive) {
        setOptimisticReactions((prev) => prev.filter((r) => r !== type));
      } else {
        setOptimisticReactions((prev) => [...prev, type]);
      }
    },
    onError: (_, { type, isActive }) => {
      // Rollback on error
      if (isActive) {
        setOptimisticReactions((prev) => [...prev, type]);
      } else {
        setOptimisticReactions((prev) => prev.filter((r) => r !== type));
      }
      toast.error('Failed to update reaction');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['reactions', recipeId] });
    },
  });

  const handleReaction = useCallback(
    (type: ReactionType) => {
      if (!isAuthenticated) {
        toast.info('Sign in to react to recipes');
        return;
      }
      if (disabled || toggleMutation.isPending) return;

      const userReactions = stats?.userReactions || [];
      const isActive = userReactions.includes(type) || optimisticReactions.includes(type);
      toggleMutation.mutate({ type, isActive });
    },
    [isAuthenticated, disabled, toggleMutation, stats?.userReactions, optimisticReactions, toast],
  );

  const getCount = (type: ReactionType): number => {
    if (!stats) return 0;
    switch (type) {
      case 'FIRE':
        return stats.counts.fire;
      case 'WANT':
        return stats.counts.want;
      case 'DROOLING':
        return stats.counts.drooling;
      case 'MADE_IT':
        return stats.counts.madeIt;
      default:
        return 0;
    }
  };

  const isActive = (type: ReactionType): boolean => {
    const fromServer = stats?.userReactions?.includes(type) || false;
    const fromOptimistic = optimisticReactions.includes(type);
    // XOR logic: if server says active and we toggled off, or vice versa
    return fromServer !== fromOptimistic ? fromOptimistic : fromServer;
  };

  if (isLoading) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {REACTIONS.map((r) => (
          <div
            key={r.type}
            className="h-8 w-16 bg-gray-100 rounded-full animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {REACTIONS.map((reaction) => {
          const count = getCount(reaction.type);
          const active = isActive(reaction.type);
          if (count === 0 && !active) return null;
          return (
            <button
              key={reaction.type}
              onClick={() => handleReaction(reaction.type)}
              disabled={disabled || toggleMutation.isPending}
              className={`
                flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs
                transition-all duration-200
                ${active ? reaction.activeClass : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span>{reaction.emoji}</span>
              {showCounts && count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {REACTIONS.map((reaction) => {
        const count = getCount(reaction.type);
        const active = isActive(reaction.type);
        return (
          <button
            key={reaction.type}
            onClick={() => handleReaction(reaction.type)}
            disabled={disabled || toggleMutation.isPending}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full border
              transition-all duration-200 font-medium text-sm
              ${active
                ? reaction.activeClass + ' border-2'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
            `}
          >
            <span className="text-base">{reaction.emoji}</span>
            <span>{reaction.label}</span>
            {showCounts && count > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 bg-white/50 rounded-full text-xs">
                {count}
              </span>
            )}
          </button>
        );
      })}
      {stats && stats.counts.total > 0 && (
        <span className="text-xs text-gray-500 ml-2">
          {stats.counts.total} reaction{stats.counts.total !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

// Export for use in other components
export { REACTIONS, type ReactionConfig };
