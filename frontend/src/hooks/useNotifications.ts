import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import type { MarkReadDto } from '../types/notifications';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (limit?: number, offset?: number, unreadOnly?: boolean) =>
    [...notificationKeys.all, 'list', { limit, offset, unreadOnly }] as const,
  count: () => [...notificationKeys.all, 'count'] as const,
};

export function useNotifications(limit = 20, offset = 0, unreadOnly = false) {
  return useQuery({
    queryKey: notificationKeys.list(limit, offset, unreadOnly),
    queryFn: () => notificationService.getNotifications(limit, offset, unreadOnly),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: () => notificationService.getNotificationCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: MarkReadDto) => notificationService.markAsRead(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkSingleNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markSingleAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteAllReadNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.deleteAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
