import React from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { Trophy, Users, Clock, CheckCircle } from 'lucide-react';
import type { Challenge, ChallengeStatus } from '../../types/challenges.types';
import { Card, Badge } from '../ui';
import { cn, getImageUrl } from '../../lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
}

const statusConfig: Record<ChallengeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  UPCOMING: {
    label: 'Starting Soon',
    color: 'bg-blue-100 text-blue-700',
    icon: <Clock className="h-3 w-3" />,
  },
  ACTIVE: {
    label: 'Active',
    color: 'bg-green-100 text-green-700',
    icon: <Trophy className="h-3 w-3" />,
  },
  VOTING: {
    label: 'Voting Open',
    color: 'bg-purple-100 text-purple-700',
    icon: <Users className="h-3 w-3" />,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-neutral-100 text-neutral-700',
    icon: <CheckCircle className="h-3 w-3" />,
  },
};

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const status = statusConfig[challenge.status];
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const votingEndDate = new Date(challenge.votingEndDate);

  const getTimeInfo = () => {
    const now = new Date();
    if (challenge.status === 'UPCOMING' && isFuture(startDate)) {
      return `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`;
    }
    if (challenge.status === 'ACTIVE' && isFuture(endDate)) {
      return `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    }
    if (challenge.status === 'VOTING' && isFuture(votingEndDate)) {
      return `Voting ends ${formatDistanceToNow(votingEndDate, { addSuffix: true })}`;
    }
    if (challenge.status === 'COMPLETED') {
      return `Ended ${format(votingEndDate, 'MMM d, yyyy')}`;
    }
    return '';
  };

  return (
    <Link to={`/challenges/${challenge.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-br from-primary-500 to-primary-600">
          {challenge.coverImage ? (
            <img
              src={getImageUrl(challenge.coverImage)}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {challenge.emoji ? (
                <span className="text-5xl">{challenge.emoji}</span>
              ) : (
                <Trophy className="h-12 w-12 text-white/50" />
              )}
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
              {status.icon}
              {status.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">{challenge.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{challenge.theme}</p>
            </div>
          </div>

          {challenge.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {challenge.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{challenge.entryCount} {challenge.entryCount === 1 ? 'entry' : 'entries'}</span>
            </div>
            <span className="text-xs text-muted-foreground">{getTimeInfo()}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
