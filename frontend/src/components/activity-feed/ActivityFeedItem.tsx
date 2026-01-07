import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ChefHat,
  Share2,
  GitFork,
  MessageCircle,
  UserPlus,
  Trophy,
  PartyPopper,
  BookOpen,
} from 'lucide-react';
import type {
  ActivityFeedItem as ActivityFeedItemType,
  ActivityType,
} from '../../types/activity-feed.types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui';
import { cn } from '../../lib/utils';
import { getImageUrl } from '../../lib/utils';

interface ActivityFeedItemProps {
  item: ActivityFeedItemType;
}

const activityIcons: Record<ActivityType, React.ReactNode> = {
  COOKED_RECIPE: <ChefHat className="h-4 w-4 text-orange-500" />,
  SHARED_RECIPE: <Share2 className="h-4 w-4 text-blue-500" />,
  FORKED_RECIPE: <GitFork className="h-4 w-4 text-purple-500" />,
  COMMENTED: <MessageCircle className="h-4 w-4 text-green-500" />,
  STARTED_FOLLOWING: <UserPlus className="h-4 w-4 text-pink-500" />,
  JOINED_CHALLENGE: <Trophy className="h-4 w-4 text-yellow-500" />,
  HOSTED_EVENT: <PartyPopper className="h-4 w-4 text-red-500" />,
  PUBLISHED_RECIPE: <BookOpen className="h-4 w-4 text-teal-500" />,
};

const activityVerbs: Record<ActivityType, string> = {
  COOKED_RECIPE: 'made',
  SHARED_RECIPE: 'shared',
  FORKED_RECIPE: 'forked',
  COMMENTED: 'commented on',
  STARTED_FOLLOWING: 'started following',
  JOINED_CHALLENGE: 'joined',
  HOSTED_EVENT: 'is hosting',
  PUBLISHED_RECIPE: 'published',
};

function getTargetLink(item: ActivityFeedItemType): string {
  switch (item.targetType) {
    case 'RECIPE':
      return `/recipes/${item.targetId}`;
    case 'COOKING_POST':
      return `/cooking-posts/${item.targetId}`;
    case 'USER':
      return `/profile/${item.targetId}`;
    case 'PARTY_EVENT':
      return `/party/${item.targetId}`;
    case 'CHALLENGE':
      return `/challenges/${item.targetId}`;
    default:
      return '#';
  }
}

export function ActivityFeedItemComponent({ item }: ActivityFeedItemProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4 hover:bg-muted/50 transition-colors',
        !item.isRead && 'bg-primary/5'
      )}
    >
      {/* Avatar */}
      <Link to={`/profile/${item.actor.id}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={item.actor.avatarUrl} alt={item.actor.firstName} />
          <AvatarFallback>
            {getInitials(item.actor.firstName, item.actor.lastName)}
          </AvatarFallback>
        </Avatar>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-1">
            {activityIcons[item.activityType]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <Link
                to={`/profile/${item.actor.id}`}
                className="font-medium hover:underline"
              >
                {item.actor.firstName} {item.actor.lastName}
              </Link>{' '}
              {activityVerbs[item.activityType]}{' '}
              {item.target && (
                <Link
                  to={getTargetLink(item)}
                  className="font-medium text-primary hover:underline"
                >
                  {item.target.title}
                </Link>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Target preview */}
        {item.target?.imageUrl && (
          <Link
            to={getTargetLink(item)}
            className="block mt-2 ml-6"
          >
            <div className="flex items-center gap-3 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <img
                src={getImageUrl(item.target.imageUrl)}
                alt={item.target.title}
                className="w-12 h-12 rounded object-cover"
              />
              <span className="text-sm font-medium truncate">
                {item.target.title}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Unread indicator */}
      {!item.isRead && (
        <div className="flex-shrink-0 self-center">
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
