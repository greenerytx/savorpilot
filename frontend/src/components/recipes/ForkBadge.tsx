import { Link } from 'react-router-dom';
import { GitFork } from 'lucide-react';

interface ForkBadgeProps {
  parentRecipe?: {
    id: string;
    title: string;
    userId: string;
    user?: { firstName: string; lastName: string };
  };
  /** Original source author (e.g., @instagram_user) */
  sourceAuthor?: string;
  /** The user who forked (current recipe owner) */
  forkedBy?: { firstName: string; lastName: string };
  forkNote?: string;
  className?: string;
}

export function ForkBadge({ parentRecipe, sourceAuthor, forkedBy, forkNote, className = '' }: ForkBadgeProps) {
  if (!parentRecipe) return null;

  const forkerName = forkedBy
    ? `${forkedBy.firstName} ${forkedBy.lastName}`.trim()
    : null;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <GitFork className="w-4 h-4 text-terracotta-500" />
        <span>
          Forked from{' '}
          <Link
            to={`/recipes/${parentRecipe.id}`}
            className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            {parentRecipe.title}
          </Link>
          {sourceAuthor && (
            <span className="text-neutral-500"> by {sourceAuthor}</span>
          )}
        </span>
      </div>
      {forkerName && (
        <p className="text-xs text-terracotta-600 ml-6">
          Forked by {forkerName}
        </p>
      )}
      {forkNote && (
        <p className="text-xs text-neutral-500 italic ml-6">
          "{forkNote}"
        </p>
      )}
    </div>
  );
}
