import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '../ui';
import { useFollowUser, useUnfollowUser } from '../../hooks/useSocial';
import { useToast } from '../ui';
import { cn } from '../../lib/utils';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  userName,
  size = 'md',
  showIcon = true,
  className,
  onFollowChange,
}: FollowButtonProps) {
  const toast = useToast();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovered, setIsHovered] = useState(false);

  const isLoading = followUser.isPending || unfollowUser.isPending;

  const handleClick = async () => {
    try {
      if (isFollowing) {
        await unfollowUser.mutateAsync(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
        toast.success(userName ? `Unfollowed ${userName}` : 'Unfollowed');
      } else {
        await followUser.mutateAsync(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
        toast.success(userName ? `Following ${userName}` : 'Following');
      }
    } catch {
      toast.error(isFollowing ? 'Failed to unfollow' : 'Failed to follow');
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return isFollowing ? 'Unfollowing...' : 'Following...';
    }
    if (isFollowing) {
      return isHovered ? 'Unfollow' : 'Following';
    }
    return 'Follow';
  };

  const getButtonVariant = () => {
    if (isFollowing) {
      return isHovered ? 'danger' : 'outline';
    }
    return 'primary';
  };

  return (
    <Button
      variant={getButtonVariant()}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'min-w-[100px] transition-all',
        isFollowing && isHovered && 'border-red-300',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : showIcon && (
        isFollowing ? (
          isHovered ? <UserMinus className="w-4 h-4" /> : null
        ) : (
          <UserPlus className="w-4 h-4" />
        )
      )}
      {getButtonText()}
    </Button>
  );
}

export default FollowButton;
