import { api } from './api';

// ==================== INTERFACES ====================

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  followerCount: number;
  followingCount: number;
  recipeCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isFollowing: boolean;
}

export interface FollowResponse {
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: string;
  follower?: UserSummary;
  followee?: UserSummary;
}

export interface FollowListResponse {
  data: UserSummary[];
  total: number;
}

export interface FollowSuggestion {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  recipeCount: number;
  isFollowing: boolean;
  mutualFollowerCount?: number;
  reason?: string;
}

// ==================== SERVICE ====================

class SocialService {
  // Follow/Unfollow
  async followUser(userId: string): Promise<FollowResponse> {
    const response = await api.post<FollowResponse>(`/social/follow/${userId}`);
    return response.data;
  }

  async unfollowUser(userId: string): Promise<void> {
    await api.delete(`/social/follow/${userId}`);
  }

  // Followers/Following Lists
  async getMyFollowers(limit = 50, offset = 0): Promise<FollowListResponse> {
    const response = await api.get<FollowListResponse>('/social/followers', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getMyFollowing(limit = 50, offset = 0): Promise<FollowListResponse> {
    const response = await api.get<FollowListResponse>('/social/following', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getUserFollowers(userId: string, limit = 50, offset = 0): Promise<FollowListResponse> {
    const response = await api.get<FollowListResponse>(`/social/users/${userId}/followers`, {
      params: { limit, offset },
    });
    return response.data;
  }

  async getUserFollowing(userId: string, limit = 50, offset = 0): Promise<FollowListResponse> {
    const response = await api.get<FollowListResponse>(`/social/users/${userId}/following`, {
      params: { limit, offset },
    });
    return response.data;
  }

  // User Profiles
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await api.get<UserProfile>(`/social/users/${userId}/profile`);
    return response.data;
  }

  // Suggestions
  async getFollowSuggestions(limit = 10): Promise<FollowSuggestion[]> {
    const response = await api.get<FollowSuggestion[]>('/social/suggestions', {
      params: { limit },
    });
    return response.data;
  }

  // Check Status
  async isFollowing(userId: string): Promise<boolean> {
    const response = await api.get<{ isFollowing: boolean }>(`/social/is-following/${userId}`);
    return response.data.isFollowing;
  }
}

export const socialService = new SocialService();
