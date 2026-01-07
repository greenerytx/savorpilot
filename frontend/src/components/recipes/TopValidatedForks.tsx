import React from 'react';
import { Link } from 'react-router-dom';
import { useTopValidatedForks } from '../../hooks/useForkEnhancements';
import type { ValidatedFork } from '../../services/fork-enhancements.service';

interface TopValidatedForksProps {
  recipeId: string;
  limit?: number;
}

export function TopValidatedForks({ recipeId, limit = 5 }: TopValidatedForksProps) {
  const { data: forks, isLoading } = useTopValidatedForks(recipeId, limit);

  if (isLoading) {
    return <TopValidatedForksSkeleton />;
  }

  if (!forks || forks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
        <span>🏆</span> Community Favorites
      </h3>
      <p className="text-sm text-neutral-500">
        Top-rated forks based on cook trials
      </p>

      <div className="space-y-2">
        {forks.map((fork, index) => (
          <ValidatedForkCard key={fork.id} fork={fork} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}

function TopValidatedForksSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-40 bg-neutral-200 rounded animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-neutral-200 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function ValidatedForkCard({ fork, rank }: { fork: ValidatedFork; rank: number }) {
  const rankEmojis = ['🥇', '🥈', '🥉'];
  const rankEmoji = rankEmojis[rank - 1] || `#${rank}`;

  return (
    <Link
      to={`/recipes/${fork.id}`}
      className="block bg-white border border-neutral-200 rounded-lg p-3 hover:border-primary-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{rankEmoji}</span>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-neutral-800 truncate">{fork.title}</h4>

          {fork.forkNote && (
            <p className="text-sm text-neutral-500 line-clamp-1">{fork.forkNote}</p>
          )}

          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="text-green-600 font-medium">
              {Math.round(fork.successRate)}% success
            </span>
            <span className="text-neutral-400">|</span>
            <span className="text-amber-600">
              ⭐ {fork.averageRating.toFixed(1)}
            </span>
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-500">
              {fork.totalCooks} cooks
            </span>
          </div>

          {fork.badges.length > 0 && (
            <div className="flex gap-1 mt-2">
              {fork.badges.slice(0, 4).map((badge) => (
                <span
                  key={badge.type}
                  className="text-sm"
                  title={`${badge.label}: ${badge.description}`}
                >
                  {badge.icon}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
