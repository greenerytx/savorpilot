import { api } from './api';
import type { AppNotification, NotificationCount, MarkReadDto } from '../types/notifications';

export const notificationService = {
  async getNotifications(
    limit = 20,
    offset = 0,
    unreadOnly = false,
  ): Promise<AppNotification[]> {
    const response = await api.get<AppNotification[]>('/notifications', {
      params: { limit, offset, unreadOnly },
    });
    return response.data;
  },

  async getNotificationCount(): Promise<NotificationCount> {
    const response = await api.get<NotificationCount>('/notifications/count');
    return response.data;
  },

  async markAsRead(dto: MarkReadDto): Promise<{ updated: number }> {
    const response = await api.post<{ updated: number }>('/notifications/mark-read', dto);
    return response.data;
  },

  async markSingleAsRead(notificationId: string): Promise<AppNotification> {
    const response = await api.post<AppNotification>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },

  async deleteAllRead(): Promise<{ deleted: number }> {
    const response = await api.delete<{ deleted: number }>('/notifications/read/all');
    return response.data;
  },
};
