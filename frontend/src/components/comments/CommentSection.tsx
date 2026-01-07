import React, { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';
import {
  useRecipeComments,
  useCommentReplies,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useLikeComment,
  useUnlikeComment,
} from '../../hooks/useRecipeComments';
import type { RecipeComment } from '../../types/recipe-comments.types';

interface CommentSectionProps {
  recipeId: string;
}

export function CommentSection({ recipeId }: CommentSectionProps) {
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const { data: commentsData, isLoading, error } = useRecipeComments(recipeId);
  const createComment = useCreateComment(recipeId);
  const updateComment = useUpdateComment(recipeId);
  const deleteComment = useDeleteComment(recipeId);
  const likeComment = useLikeComment(recipeId);
  const unlikeComment = useUnlikeComment(recipeId);

  const handleCreateComment = (content: string) => {
    createComment.mutate({ content });
  };

  const handleReply = (parentId: string, content: string) => {
    createComment.mutate({ content, parentId });
  };

  const handleEdit = (commentId: string, content: string) => {
    updateComment.mutate({ commentId, dto: { content } });
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate(commentId);
  };

  const handleLike = (commentId: string) => {
    likeComment.mutate(commentId);
  };

  const handleUnlike = (commentId: string) => {
    unlikeComment.mutate(commentId);
  };

  const handleLoadReplies = (commentId: string) => {
    setExpandedReplies((prev) => new Set(prev).add(commentId));
  };

  // Filter to only show top-level comments (no parentId)
  const topLevelComments = commentsData?.data.filter((c) => !c.parentId) || [];
  const total = commentsData?.total || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load comments. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-semibold">
          Comments {total > 0 && <span className="text-muted-foreground">({total})</span>}
        </h3>
      </div>

      {/* New comment input */}
      <CommentInput
        onSubmit={handleCreateComment}
        isLoading={createComment.isPending}
        placeholder="Share your thoughts on this recipe..."
      />

      {/* Comments list */}
      {topLevelComments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <CommentWithReplies
              key={comment.id}
              comment={comment}
              recipeId={recipeId}
              onLike={handleLike}
              onUnlike={handleUnlike}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLoadReplies={handleLoadReplies}
              isExpanded={expandedReplies.has(comment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Separate component to handle reply loading for each comment
interface CommentWithRepliesProps {
  comment: RecipeComment;
  recipeId: string;
  onLike: (commentId: string) => void;
  onUnlike: (commentId: string) => void;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLoadReplies: (commentId: string) => void;
  isExpanded: boolean;
}

function CommentWithReplies({
  comment,
  recipeId,
  onLike,
  onUnlike,
  onReply,
  onEdit,
  onDelete,
  onLoadReplies,
  isExpanded,
}: CommentWithRepliesProps) {
  const { data: repliesData, isLoading: isLoadingReplies } = useCommentReplies(
    recipeId,
    comment.id,
    isExpanded && comment.replyCount > 0
  );

  return (
    <CommentItem
      comment={comment}
      recipeId={recipeId}
      onLike={onLike}
      onUnlike={onUnlike}
      onReply={onReply}
      onEdit={onEdit}
      onDelete={onDelete}
      onLoadReplies={onLoadReplies}
      replies={repliesData?.data}
      isLoadingReplies={isLoadingReplies}
    />
  );
}
