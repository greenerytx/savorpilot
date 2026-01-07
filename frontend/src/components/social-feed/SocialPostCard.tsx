import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Clock,
  ChefHat,
  HelpCircle,
  Lightbulb,
  Camera,
  MessageSquare,
  Trash2,
  Edit,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn, getImageUrl } from '../../lib/utils';
import type { SocialPost, SocialPostType, SocialPostComment } from '../../types/social-post';
import { postTypeConfig } from '../../types/social-post';
import {
  useLikeSocialPost,
  useUnlikeSocialPost,
  useDeleteSocialPost,
  useSocialPostComments,
  useAddSocialPostComment,
  useDeleteSocialPostComment,
} from '../../hooks/useSocialPosts';
import { useAuthStore } from '../../stores/authStore';

const postTypeIcons: Record<SocialPostType, React.FC<{ className?: string }>> = {
  COOKING_UPDATE: ChefHat,
  QUESTION: HelpCircle,
  TIP: Lightbulb,
  PHOTO: Camera,
  GENERAL: MessageSquare,
};

interface SocialPostCardProps {
  post: SocialPost;
  onShareClick?: () => void;
}

export function SocialPostCard({
  post,
  onShareClick,
}: SocialPostCardProps) {
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const likeMutation = useLikeSocialPost();
  const unlikeMutation = useUnlikeSocialPost();
  const deleteMutation = useDeleteSocialPost();
  const addCommentMutation = useAddSocialPostComment();
  const deleteCommentMutation = useDeleteSocialPostComment();

  // Only fetch comments when expanded
  const {
    data: commentsData,
    isLoading: commentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSocialPostComments(post.id, showComments);

  const allComments = commentsData?.pages.flatMap((page) => page.data) ?? [];

  const isOwner = user?.id === post.author.id;
  const config = postTypeConfig[post.postType];
  const PostTypeIcon = postTypeIcons[post.postType];

  const handleLikeToggle = () => {
    if (post.isLikedByMe) {
      unlikeMutation.mutate(post.id);
    } else {
      likeMutation.mutate(post.id);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(post.id);
    }
    setShowMenu(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        postId: post.id,
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

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await deleteCommentMutation.mutateAsync({ postId: post.id, commentId });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const getAuthorInitials = () => {
    return `${post.author.firstName[0]}${post.author.lastName[0]}`.toUpperCase();
  };

  const getCommentAuthorInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getUserInitials = () => {
    if (!user) return '??';
    return `${user.firstName?.[0] || '?'}${user.lastName?.[0] || '?'}`.toUpperCase();
  };

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: SocialPostComment;
    isReply?: boolean;
  }) => {
    const isCommentOwner = user?.id === comment.author.id;

    return (
      <div className={cn('flex gap-2', isReply && 'ml-8')}>
        {comment.author.avatarUrl ? (
          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
            <img
              src={comment.author.avatarUrl}
              alt={`${comment.author.firstName} ${comment.author.lastName}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-coral-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getCommentAuthorInitials(comment.author.firstName, comment.author.lastName)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="bg-primary-50 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${comment.author.id}`}
                className="font-semibold text-xs text-primary-900 hover:text-coral-600"
              >
                {comment.author.firstName} {comment.author.lastName}
              </Link>
              <span className="text-xs text-primary-400">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-primary-700 mt-0.5 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1 ml-2">
            {!isReply && (
              <button
                onClick={() => {
                  setReplyingTo(comment.id);
                  setShowComments(true);
                }}
                className="text-xs text-primary-500 hover:text-coral-600 font-medium"
              >
                Reply
              </button>
            )}
            {isCommentOwner && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs text-primary-400 hover:text-red-500"
              >
                Delete
              </button>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-start justify-between">
        <div className="flex gap-3">
          {post.author.avatarUrl ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img
                src={post.author.avatarUrl}
                alt={`${post.author.firstName} ${post.author.lastName}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-coral-600 flex items-center justify-center text-white font-bold">
              {getAuthorInitials()}
            </div>
          )}
          <div>
            <Link
              to={`/profile/${post.author.id}`}
              className="font-bold text-primary-900 hover:text-coral-600 transition-colors"
            >
              {post.author.firstName} {post.author.lastName}
            </Link>
            <p className="text-xs text-primary-500 mt-0.5 flex items-center gap-2">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              {post.postType !== 'GENERAL' && (
                <>
                  <span>•</span>
                  <span
                    className={cn(
                      'font-semibold px-1.5 py-0.5 rounded flex items-center gap-1',
                      `bg-${config.color}-50 text-${config.color}-600`
                    )}
                  >
                    <PostTypeIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-primary-400 hover:text-primary-600 p-1"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-primary-100 py-1 z-20">
                {isOwner && (
                  <>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                      onClick={() => {
                        // TODO: Implement edit
                        setShowMenu(false);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
                <button
                  className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                  onClick={() => {
                    // TODO: Implement report
                    setShowMenu(false);
                  }}
                >
                  Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <p className="text-primary-800 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="mx-5 mb-4 rounded-xl overflow-hidden aspect-video relative group cursor-pointer">
          <img
            src={post.imageUrl.startsWith('/') ? getImageUrl(post.imageUrl) : post.imageUrl}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            alt="Post content"
          />
        </div>
      )}

      {/* Linked Recipe */}
      {post.recipe && (
        <Link
          to={`/recipes/${post.recipe.id}`}
          className="mx-5 mb-4 rounded-xl overflow-hidden relative group cursor-pointer block"
        >
          <div className="aspect-[21/9] bg-primary-100">
            {post.recipe.imageUrl ? (
              <img
                src={getImageUrl(post.recipe.imageUrl)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt={post.recipe.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ChefHat className="w-12 h-12 text-primary-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="font-bold text-sm">{post.recipe.title}</p>
              <div className="flex items-center gap-2 text-xs opacity-90 mt-1">
                <Clock className="w-3 h-3" /> View Recipe
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Actions */}
      <div className="px-5 py-3 border-t border-primary-50 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={handleLikeToggle}
            disabled={likeMutation.isPending || unlikeMutation.isPending}
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              post.isLikedByMe
                ? 'text-coral-500'
                : 'text-primary-500 hover:text-coral-500'
            )}
          >
            <Heart
              className={cn('w-5 h-5', post.isLikedByMe && 'fill-current')}
            />
            {post.likeCount > 0 && post.likeCount}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              showComments
                ? 'text-blue-500'
                : 'text-primary-500 hover:text-blue-500'
            )}
          >
            <MessageCircle className={cn('w-5 h-5', showComments && 'fill-blue-100')} />
            {post.commentCount > 0 && post.commentCount}
          </button>
        </div>
        <button
          onClick={onShareClick}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-green-600 transition-colors"
        >
          <Share2 className="w-5 h-5" /> Share
        </button>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="border-t border-primary-50">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="px-5 py-2 bg-primary-50 flex items-center justify-between">
              <span className="text-xs text-primary-600">
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

          {/* Comment Input */}
          <form
            onSubmit={handleSubmitComment}
            className="px-5 py-3 flex gap-2 items-center border-b border-primary-50"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-coral-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {getUserInitials()}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
              className="flex-1 bg-primary-50 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className={cn(
                'p-2 rounded-full transition-colors',
                newComment.trim() && !addCommentMutation.isPending
                  ? 'text-coral-500 hover:bg-coral-50'
                  : 'text-primary-300 cursor-not-allowed'
              )}
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {/* Comments List */}
          <div className="px-5 py-3 space-y-3">
            {commentsLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
              </div>
            )}

            {!commentsLoading && allComments.length === 0 && (
              <p className="text-center text-sm text-primary-400 py-4">
                No comments yet. Be the first to comment!
              </p>
            )}

            {allComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-2 text-sm text-coral-600 hover:text-coral-700 font-medium flex items-center justify-center gap-1"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load more comments
                  </>
                )}
              </button>
            )}
          </div>

          {/* Collapse comments button */}
          <button
            onClick={() => setShowComments(false)}
            className="w-full py-2 text-xs text-primary-400 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-1 border-t border-primary-50"
          >
            <ChevronUp className="w-3 h-3" />
            Hide comments
          </button>
        </div>
      )}
    </div>
  );
}
