import { api } from './api';
import type { ActivityFeedResponse } from '../types/activity-feed.types';

// Re-export types
export type { ActivityType, TargetType, ActivityActor, ActivityTarget, ActivityFeedItem, ActivityFeedResponse } from '../types/activity-feed.types';

export const activityFeedService = {
  async getFeed(limit = 20, offset = 0): Promise<ActivityFeedResponse> {
    const response = await api.get<ActivityFeedResponse>(
      '/activity-feed',
      { params: { limit, offset } }
    );
    return response.data;
  },

  async getUserActivity(userId: string, limit = 20, offset = 0): Promise<ActivityFeedResponse> {
    const response = await api.get<ActivityFeedResponse>(
      `/activity-feed/user/${userId}`,
      { params: { limit, offset } }
    );
    return response.data;
  },

  async markAsRead(itemIds: string[]): Promise<void> {
    await api.post('/activity-feed/mark-read', { itemIds });
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/activity-feed/mark-all-read');
  },
};
