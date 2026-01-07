export type ActivityType =
  | 'COOKED_RECIPE'
  | 'SHARED_RECIPE'
  | 'FORKED_RECIPE'
  | 'COMMENTED'
  | 'STARTED_FOLLOWING'
  | 'JOINED_CHALLENGE'
  | 'HOSTED_EVENT'
  | 'PUBLISHED_RECIPE';

export type TargetType =
  | 'RECIPE'
  | 'COOKING_POST'
  | 'COMMENT'
  | 'CHALLENGE'
  | 'PARTY_EVENT'
  | 'USER';

export type ActivityActor = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
};

export type ActivityTarget = {
  id: string;
  type: TargetType;
  title?: string;
  imageUrl?: string;
};

export type ActivityFeedItem = {
  id: string;
  activityType: ActivityType;
  targetType: TargetType;
  targetId: string;
  createdAt: string;
  isRead: boolean;
  actor: ActivityActor;
  target?: ActivityTarget;
  metadata?: Record<string, unknown>;
};

export type ActivityFeedResponse = {
  data: ActivityFeedItem[];
  total: number;
  unreadCount: number;
};
