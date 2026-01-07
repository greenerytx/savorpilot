import React, { useEffect, useRef, useCallback } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { useActivityFeed, useMarkAllFeedAsRead } from '../../hooks/useActivityFeed';
import { ActivityFeedItemComponent } from '../../components/activity-feed/ActivityFeedItem';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export function ActivityFeedPage() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityFeed();

  const markAllAsRead = useMarkAllFeedAsRead();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  const allItems = data?.pages.flatMap((page) => page.data) || [];
  const unreadCount = data?.pages[0]?.unreadCount || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">Failed to load activity feed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Activity Feed</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Feed */}
      {allItems.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium">No activity yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Follow some cooks to see their activity here!
          </p>
        </Card>
      ) : (
        <Card className="divide-y overflow-hidden">
          {allItems.map((item) => (
            <ActivityFeedItemComponent key={item.id} item={item} />
          ))}
        </Card>
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
        {!hasNextPage && allItems.length > 0 && (
          <p className="text-sm text-muted-foreground">No more activity</p>
        )}
      </div>
    </div>
  );
}
