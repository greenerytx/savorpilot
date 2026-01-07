import { useEffect, useRef, useCallback } from 'react';
import { Loader2, RefreshCw, MessageSquare } from 'lucide-react';
import { SocialPostCard } from './SocialPostCard';
import { SocialPostComposer } from './SocialPostComposer';
import { useSocialFeed } from '../../hooks/useSocialPosts';
import type { SocialPostType } from '../../types/social-post';
import { cn } from '../../lib/utils';

interface SocialFeedProps {
  showComposer?: boolean;
  postType?: SocialPostType;
  limit?: number;
  className?: string;
}

export function SocialFeed({
  showComposer = true,
  postType,
  limit = 20,
  className,
}: SocialFeedProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useSocialFeed(postType, limit);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll intersection observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    const option = { threshold: 0.1 };

    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  // Flatten all pages into a single array
  const allPosts = data?.pages.flatMap((page) => page.data) ?? [];

  // Loading skeleton
  const PostSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden animate-pulse">
      <div className="p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-200" />
        <div className="flex-1">
          <div className="h-4 bg-primary-200 rounded w-32 mb-2" />
          <div className="h-3 bg-primary-100 rounded w-20" />
        </div>
      </div>
      <div className="px-5 pb-4 space-y-2">
        <div className="h-4 bg-primary-100 rounded w-full" />
        <div className="h-4 bg-primary-100 rounded w-3/4" />
      </div>
      <div className="mx-5 mb-4 rounded-xl bg-primary-100 aspect-video" />
      <div className="px-5 py-3 border-t border-primary-50 flex justify-between">
        <div className="flex gap-4">
          <div className="h-5 w-12 bg-primary-100 rounded" />
          <div className="h-5 w-12 bg-primary-100 rounded" />
        </div>
        <div className="h-5 w-16 bg-primary-100 rounded" />
      </div>
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-primary-400" />
      </div>
      <h3 className="text-lg font-bold text-primary-900 mb-2">No posts yet</h3>
      <p className="text-primary-500 text-sm max-w-xs mx-auto">
        Be the first to share something with the community! Start by creating a post above.
      </p>
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Composer */}
      {showComposer && <SocialPostComposer onPostCreated={() => refetch()} />}

      {/* Refresh button */}
      {!isLoading && allPosts.length > 0 && (
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="w-full py-2 text-sm text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw
            className={cn('w-4 h-4', isRefetching && 'animate-spin')}
          />
          {isRefetching ? 'Refreshing...' : 'Refresh feed'}
        </button>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-6">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {/* Posts */}
      {!isLoading && allPosts.length === 0 && <EmptyState />}

      {allPosts.map((post) => (
        <SocialPostCard
          key={post.id}
          post={post}
          onShareClick={() => {
            // TODO: Implement share
            navigator.clipboard.writeText(
              `${window.location.origin}/post/${post.id}`
            );
          }}
        />
      ))}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-10">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
          </div>
        )}
      </div>

      {/* End of feed */}
      {!hasNextPage && allPosts.length > 0 && (
        <p className="text-center text-sm text-primary-400 py-4">
          You've reached the end of the feed
        </p>
      )}
    </div>
  );
}
