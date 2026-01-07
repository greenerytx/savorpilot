import { useState } from 'react';
import { X, Send, Loader2, MessageCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import {
  useSocialPostComments,
  useAddSocialPostComment,
  useDeleteSocialPostComment,
} from '../../hooks/useSocialPosts';
import { useAuthStore } from '../../stores/authStore';
import type { SocialPostComment } from '../../types/social-post';

interface PostCommentSectionProps {
  postId: string;
  onClose: () => void;
}

export function PostCommentSection({ postId, onClose }: PostCommentSectionProps) {
  const { user } = useAuthStore();
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSocialPostComments(postId);

  const addCommentMutation = useAddSocialPostComment();
  const deleteCommentMutation = useDeleteSocialPostComment();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const allComments = data?.pages.flatMap((page) => page.data) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        postId,
        dto: {
          content: newComment.trim(),
          parentId: replyingTo || undefined,
        },
      });
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await deleteCommentMutation.mutateAsync({ postId, commentId });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const getAuthorInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: SocialPostComment;
    isReply?: boolean;
  }) => {
    const isOwner = user?.id === comment.author.id;

    return (
      <div className={cn('flex gap-3', isReply && 'ml-10')}>
        {comment.author.avatarUrl ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <img
              src={comment.author.avatarUrl}
              alt={`${comment.author.firstName} ${comment.author.lastName}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-coral-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getAuthorInitials(comment.author.firstName, comment.author.lastName)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="bg-primary-50 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm text-primary-900">
                {comment.author.firstName} {comment.author.lastName}
              </span>
              <span className="text-xs text-primary-400">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-sm text-primary-700 mt-1 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-1 ml-2">
            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="text-xs text-primary-500 hover:text-coral-600 font-medium"
              >
                Reply
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-xs text-primary-400 hover:text-red-500 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}

          {/* Reply count indicator */}
          {comment.replyCount > (comment.replies?.length || 0) && (
            <button className="text-xs text-coral-600 hover:text-coral-700 font-medium mt-2 ml-2">
              View {comment.replyCount - (comment.replies?.length || 0)} more{' '}
              {comment.replyCount - (comment.replies?.length || 0) === 1
                ? 'reply'
                : 'replies'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary-100">
          <h3 className="font-bold text-primary-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary-500" />
            Comments
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary-500" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
            </div>
          )}

          {!isLoading && allComments.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-primary-200 mx-auto mb-3" />
              <p className="text-primary-500 text-sm">
                No comments yet. Be the first to comment!
              </p>
            </div>
          )}

          {allComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-2 text-sm text-coral-600 hover:text-coral-700 font-medium"
            >
              {isFetchingNextPage ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Load more comments'
              )}
            </button>
          )}
        </div>

        {/* Reply indicator */}
        {replyingTo && (
          <div className="px-4 py-2 bg-primary-50 border-t border-primary-100 flex items-center justify-between">
            <span className="text-sm text-primary-600">
              Replying to a comment...
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-primary-500 hover:text-primary-700"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-primary-100 flex gap-2"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
            className="flex-1 bg-primary-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              newComment.trim() && !addCommentMutation.isPending
                ? 'bg-primary-900 text-white hover:bg-primary-800'
                : 'bg-primary-200 text-primary-400 cursor-not-allowed'
            )}
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
