import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Star, ChefHat, Globe, Users, Lock } from 'lucide-react';
import type { CookingPost, PostVisibility } from '../../types/cooking-posts.types';
import { Card, Avatar, AvatarFallback, AvatarImage, Badge } from '../ui';
import { cn, getImageUrl } from '../../lib/utils';

interface CookingPostCardProps {
  post: CookingPost;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
}

const visibilityIcons: Record<PostVisibility, React.ReactNode> = {
  PUBLIC: <Globe className="h-3 w-3" />,
  FOLLOWERS: <Users className="h-3 w-3" />,
  CIRCLES: <Users className="h-3 w-3" />,
  PRIVATE: <Lock className="h-3 w-3" />,
};

export function CookingPostCard({ post, onLike, onUnlike }: CookingPostCardProps) {
  const handleLikeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (post.isLikedByMe) {
      onUnlike(post.id);
    } else {
      onLike(post.id);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      {/* Author header */}
      <div className="p-4 flex items-center justify-between">
        <Link
          to={`/profile/${post.author.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatarUrl} alt={post.author.firstName} />
            <AvatarFallback>
              {getInitials(post.author.firstName, post.author.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {post.author.firstName} {post.author.lastName}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              <span className="mx-1">·</span>
              {visibilityIcons[post.visibility]}
            </p>
          </div>
        </Link>
        <Link
          to={`/recipes/${post.recipe.id}`}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChefHat className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{post.recipe.title}</span>
        </Link>
      </div>

      {/* Photo */}
      {post.photoUrl && (
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={getImageUrl(post.photoUrl)}
            alt={`${post.author.firstName}'s cooking`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLikeToggle}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              post.isLikedByMe
                ? 'text-red-500'
                : 'text-muted-foreground hover:text-red-500'
            )}
          >
            <Heart
              className={cn('h-5 w-5', post.isLikedByMe && 'fill-current')}
            />
            <span className="text-sm font-medium">{post.likeCount}</span>
          </button>

          {post.rating && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-4 w-4',
                    star <= post.rating!
                      ? 'text-yellow-500 fill-current'
                      : 'text-muted-foreground'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm">
            <Link
              to={`/profile/${post.author.id}`}
              className="font-medium hover:underline"
            >
              {post.author.firstName}
            </Link>{' '}
            {post.caption}
          </p>
        )}

        {/* Recipe link card */}
        <Link
          to={`/recipes/${post.recipe.id}`}
          className="block mt-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            {post.recipe.imageUrl ? (
              <img
                src={getImageUrl(post.recipe.imageUrl)}
                alt={post.recipe.title}
                className="w-12 h-12 rounded-md object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{post.recipe.title}</p>
              <p className="text-xs text-muted-foreground">View recipe</p>
            </div>
          </div>
        </Link>
      </div>
    </Card>
  );
}
