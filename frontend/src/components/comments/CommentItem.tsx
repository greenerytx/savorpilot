import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { RecipeComment } from '../../types/recipe-comments.types';
import { Button, Avatar, AvatarFallback, AvatarImage, useConfirm } from '../ui';
import { CommentInput } from './CommentInput';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

interface CommentItemProps {
  comment: RecipeComment;
  recipeId: string;
  onLike: (commentId: string) => void;
  onUnlike: (commentId: string) => void;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLoadReplies?: (commentId: string) => void;
  replies?: RecipeComment[];
  isLoadingReplies?: boolean;
  depth?: number;
}

export function CommentItem({
  comment,
  recipeId,
  onLike,
  onUnlike,
  onReply,
  onEdit,
  onDelete,
  onLoadReplies,
  replies,
  isLoadingReplies,
  depth = 0,
}: CommentItemProps) {
  const { user } = useAuthStore();
  const confirm = useConfirm();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isOwner = user?.id === comment.author.id;
  const maxDepth = 2; // Limit nesting depth

  const handleLikeToggle = () => {
    if (comment.isLikedByMe) {
      onUnlike(comment.id);
    } else {
      onLike(comment.id);
    }
  };

  const handleReplySubmit = (content: string) => {
    onReply(comment.id, content);
    setIsReplying(false);
  };

  const handleEditSubmit = (content: string) => {
    onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleDeleteClick = async () => {
    const confirmed = await confirm({
      title: 'Delete comment?',
      message: 'This action cannot be undone. This will permanently delete your comment.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      onDelete(comment.id);
    }
  };

  const handleToggleReplies = () => {
    if (!showReplies && comment.replyCount > 0 && onLoadReplies) {
      onLoadReplies(comment.id);
    }
    setShowReplies(!showReplies);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  return (
    <div className={cn('group', depth > 0 && 'ml-8 mt-3')}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author.avatarUrl} alt={comment.author.firstName} />
          <AvatarFallback className="text-xs">
            {getInitials(comment.author.firstName, comment.author.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-lg px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.author.firstName} {comment.author.lastName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}
              </div>

              {isOwner && !isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2">
                <CommentInput
                  onSubmit={handleEditSubmit}
                  onCancel={() => setIsEditing(false)}
                  initialValue={comment.content}
                  submitLabel="Save"
                  showCancel
                  autoFocus
                />
              </div>
            ) : (
              <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-1 px-1">
              <button
                onClick={handleLikeToggle}
                className={cn(
                  'flex items-center gap-1 text-xs transition-colors',
                  comment.isLikedByMe
                    ? 'text-red-500'
                    : 'text-muted-foreground hover:text-red-500'
                )}
              >
                <Heart
                  className={cn('h-3.5 w-3.5', comment.isLikedByMe && 'fill-current')}
                />
                {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
              </button>

              {depth < maxDepth && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}

              {comment.replyCount > 0 && depth < maxDepth && (
                <button
                  onClick={handleToggleReplies}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showReplies ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          )}

          {/* Reply input */}
          {isReplying && (
            <div className="mt-2">
              <CommentInput
                onSubmit={handleReplySubmit}
                onCancel={() => setIsReplying(false)}
                placeholder={`Reply to ${comment.author.firstName}...`}
                showCancel
                autoFocus
              />
            </div>
          )}

          {/* Nested replies */}
          {showReplies && (
            <div className="mt-2">
              {isLoadingReplies ? (
                <div className="ml-8 text-sm text-muted-foreground">Loading replies...</div>
              ) : (
                replies?.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    recipeId={recipeId}
                    onLike={onLike}
                    onUnlike={onUnlike}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    depth={depth + 1}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
