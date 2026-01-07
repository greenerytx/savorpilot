export enum NotificationType {
  RECIPE_SHARED = 'RECIPE_SHARED',
  GROUP_SHARED = 'GROUP_SHARED',
  RECIPE_UPDATED = 'RECIPE_UPDATED',
  IMPORT_COMPLETE = 'IMPORT_COMPLETE',
  SYSTEM = 'SYSTEM',
}

export interface NotificationData {
  recipeId?: string;
  groupId?: string;
  senderName?: string;
  successCount?: number;
  totalCount?: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationCount {
  total: number;
  unread: number;
}

export interface MarkReadDto {
  notificationIds?: string[];
  all?: boolean;
}
