import { Link } from 'react-router-dom';
import { ChefHat, Users } from 'lucide-react';
import { FollowButton } from './FollowButton';
import { Card } from '../ui';
import { cn } from '../../lib/utils';
import { getFullName, getInitials, formatFollowerCount } from '../../hooks/useSocial';
import { useAuthStore } from '../../stores/authStore';
import type { UserSummary, FollowSuggestion } from '../../services/social.service';

interface UserCardProps {
  user: UserSummary | FollowSuggestion;
  showFollowButton?: boolean;
  showStats?: boolean;
  variant?: 'default' | 'compact' | 'suggestion';
  className?: string;
}

export function UserCard({
  user,
  showFollowButton = true,
  showStats = false,
  variant = 'default',
  className,
}: UserCardProps) {
  const { user: currentUser } = useAuthStore();
  const fullName = getFullName(user);
  const initials = getInitials(user);
  const isSuggestion = 'reason' in user;
  const isOwnProfile = currentUser?.id === user.id;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Link to={`/profile/${user.id}`}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
              {initials}
            </div>
          )}
        </Link>
        <Link to={`/profile/${user.id}`} className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">{fullName}</p>
        </Link>
        {showFollowButton && !isOwnProfile && (
          <FollowButton
            userId={user.id}
            isFollowing={user.isFollowing}
            userName={fullName}
            size="sm"
            showIcon={false}
          />
        )}
      </div>
    );
  }

  if (variant === 'suggestion' && isSuggestion) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-start gap-3">
          <Link to={`/profile/${user.id}`}>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={fullName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-medium text-primary-700">
                {initials}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${user.id}`}>
              <p className="text-sm font-semibold text-neutral-900 truncate hover:text-primary-600 transition-colors">
                {fullName}
              </p>
            </Link>
            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <ChefHat className="w-3 h-3" />
                {user.recipeCount} recipes
              </span>
              {user.mutualFollowerCount && user.mutualFollowerCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {user.mutualFollowerCount} mutual
                </span>
              )}
            </div>
            {user.reason && (
              <p className="text-xs text-neutral-400 mt-1 truncate">{user.reason}</p>
            )}
          </div>
          {!isOwnProfile && (
            <FollowButton
              userId={user.id}
              isFollowing={false}
              userName={fullName}
              size="sm"
            />
          )}
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center gap-4">
        <Link to={`/profile/${user.id}`}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={fullName}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-medium text-primary-700">
              {initials}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${user.id}`}>
            <p className="text-base font-semibold text-neutral-900 truncate hover:text-primary-600 transition-colors">
              {fullName}
            </p>
          </Link>
          {showStats && isSuggestion && (
            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
              <span className="flex items-center gap-1">
                <ChefHat className="w-4 h-4" />
                {user.recipeCount} recipes
              </span>
            </div>
          )}
        </div>
        {showFollowButton && !isOwnProfile && (
          <FollowButton
            userId={user.id}
            isFollowing={user.isFollowing}
            userName={fullName}
          />
        )}
      </div>
    </Card>
  );
}

export default UserCard;
