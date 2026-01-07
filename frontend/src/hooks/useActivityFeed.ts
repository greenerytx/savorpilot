import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { activityFeedService } from '../services/activity-feed.service';

// ==================== QUERY KEYS ====================

export const activityFeedKeys = {
  all: ['activityFeed'] as const,
  feed: () => [...activityFeedKeys.all, 'feed'] as const,
  user: (userId: string) => [...activityFeedKeys.all, 'user', userId] as const,
};

// ==================== HOOKS ====================

export function useActivityFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: activityFeedKeys.feed(),
    queryFn: ({ pageParam = 0 }) => activityFeedService.getFeed(limit, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return totalFetched < lastPage.total ? totalFetched : undefined;
    },
    initialPageParam: 0,
  });
}

export function useUserActivity(userId: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: activityFeedKeys.user(userId),
    queryFn: ({ pageParam = 0 }) => activityFeedService.getUserActivity(userId, limit, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return totalFetched < lastPage.total ? totalFetched : undefined;
    },
    initialPageParam: 0,
    enabled: !!userId,
  });
}

export function useMarkFeedAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemIds: string[]) => activityFeedService.markAsRead(itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityFeedKeys.feed() });
    },
  });
}

export function useMarkAllFeedAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => activityFeedService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: activityFeedKeys.feed() });

      // Optimistically mark all as read
      queryClient.setQueriesData(
        { queryKey: activityFeedKeys.feed() },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((item: any) => ({ ...item, isRead: true })),
              unreadCount: 0,
            })),
          };
        }
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: activityFeedKeys.feed() });
    },
  });
}

export function useUnreadCount() {
  const { data } = useActivityFeed(1); // Fetch minimal data just to get count

  if (!data?.pages?.[0]) return 0;
  return data.pages[0].unreadCount;
}
