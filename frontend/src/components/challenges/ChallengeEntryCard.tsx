import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChefHat, Trophy } from 'lucide-react';
import type { ChallengeEntry } from '../../types/challenges.types';
import { Card, Avatar, AvatarFallback, AvatarImage } from '../ui';
import { cn, getImageUrl } from '../../lib/utils';

interface ChallengeEntryCardProps {
  entry: ChallengeEntry;
  challengeId: string;
  rank?: number;
  canVote?: boolean;
  onVote: (entryId: string) => void;
  onUnvote: (entryId: string) => void;
}

export function ChallengeEntryCard({
  entry,
  challengeId,
  rank,
  canVote = false,
  onVote,
  onUnvote,
}: ChallengeEntryCardProps) {
  const handleVoteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (entry.isVotedByMe) {
      onUnvote(entry.id);
    } else {
      onVote(entry.id);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const getRankBadge = () => {
    if (!rank) return null;
    const colors: Record<number, string> = {
      1: 'bg-yellow-500 text-white',
      2: 'bg-neutral-400 text-white',
      3: 'bg-amber-600 text-white',
    };
    return (
      <div className={cn(
        'absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md',
        colors[rank] || 'bg-neutral-200 text-neutral-700'
      )}>
        {rank <= 3 ? <Trophy className="h-4 w-4" /> : rank}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden relative">
      {getRankBadge()}

      {/* Photo */}
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={getImageUrl(entry.photoUrl)}
          alt={entry.caption || 'Challenge entry'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Author */}
        {entry.author && (
          <Link
            to={`/profile/${entry.author.id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={entry.author.avatarUrl} alt={entry.author.firstName} />
              <AvatarFallback className="text-xs">
                {getInitials(entry.author.firstName, entry.author.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">
              {entry.author.firstName} {entry.author.lastName}
            </span>
          </Link>
        )}

        {/* Caption */}
        {entry.caption && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {entry.caption}
          </p>
        )}

        {/* Recipe link */}
        {entry.recipe && (
          <Link
            to={`/recipes/${entry.recipe.id}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChefHat className="h-3.5 w-3.5" />
            <span className="truncate">{entry.recipe.title}</span>
          </Link>
        )}

        {/* Vote button */}
        <div className="flex items-center justify-between pt-2 border-t">
          <button
            onClick={handleVoteToggle}
            disabled={!canVote}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              !canVote && 'cursor-default',
              entry.isVotedByMe
                ? 'text-red-500'
                : canVote
                  ? 'text-muted-foreground hover:text-red-500'
                  : 'text-muted-foreground'
            )}
          >
            <Heart
              className={cn('h-5 w-5', entry.isVotedByMe && 'fill-current')}
            />
            <span className="font-medium">{entry.voteCount}</span>
          </button>

          {rank && rank <= 3 && (
            <span className="text-xs font-medium text-muted-foreground">
              #{rank}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
