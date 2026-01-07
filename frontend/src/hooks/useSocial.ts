import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialService } from '../services/social.service';
import type {
  UserProfile,
  FollowListResponse,
  FollowSuggestion,
} from '../services/social.service';

// Query keys
export const socialKeys = {
  all: ['social'] as const,
  followers: () => [...socialKeys.all, 'followers'] as const,
  following: () => [...socialKeys.all, 'following'] as const,
  suggestions: () => [...socialKeys.all, 'suggestions'] as const,
  profile: (userId: string) => [...socialKeys.all, 'profile', userId] as const,
  userFollowers: (userId: string) => [...socialKeys.all, 'user', userId, 'followers'] as const,
  userFollowing: (userId: string) => [...socialKeys.all, 'user', userId, 'following'] as const,
  isFollowing: (userId: string) => [...socialKeys.all, 'isFollowing', userId] as const,
};

// ==================== FOLLOWERS/FOLLOWING ====================

export function useMyFollowers(limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...socialKeys.followers(), limit, offset],
    queryFn: () => socialService.getMyFollowers(limit, offset),
  });
}

export function useMyFollowing(limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...socialKeys.following(), limit, offset],
    queryFn: () => socialService.getMyFollowing(limit, offset),
  });
}

export function useUserFollowers(userId: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...socialKeys.userFollowers(userId), limit, offset],
    queryFn: () => socialService.getUserFollowers(userId, limit, offset),
    enabled: !!userId,
  });
}

export function useUserFollowing(userId: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...socialKeys.userFollowing(userId), limit, offset],
    queryFn: () => socialService.getUserFollowing(userId, limit, offset),
    enabled: !!userId,
  });
}

// ==================== FOLLOW/UNFOLLOW ====================

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => socialService.followUser(userId),
    onSuccess: (_, userId) => {
      // Invalidate all social queries that might be affected
      queryClient.invalidateQueries({ queryKey: socialKeys.all });

      // Optimistically update the profile if it exists in cache
      queryClient.setQueryData<UserProfile>(
        socialKeys.profile(userId),
        (old) => old ? { ...old, isFollowing: true, followerCount: old.followerCount + 1 } : old
      );
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => socialService.unfollowUser(userId),
    onSuccess: (_, userId) => {
      // Invalidate all social queries that might be affected
      queryClient.invalidateQueries({ queryKey: socialKeys.all });

      // Optimistically update the profile if it exists in cache
      queryClient.setQueryData<UserProfile>(
        socialKeys.profile(userId),
        (old) => old ? { ...old, isFollowing: false, followerCount: Math.max(0, old.followerCount - 1) } : old
      );
    },
  });
}

// ==================== USER PROFILES ====================

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: socialKeys.profile(userId),
    queryFn: () => socialService.getUserProfile(userId),
    enabled: !!userId,
  });
}

// ==================== SUGGESTIONS ====================

export function useFollowSuggestions(limit = 10) {
  return useQuery({
    queryKey: [...socialKeys.suggestions(), limit],
    queryFn: () => socialService.getFollowSuggestions(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== CHECK STATUS ====================

export function useIsFollowing(userId: string) {
  return useQuery({
    queryKey: socialKeys.isFollowing(userId),
    queryFn: () => socialService.isFollowing(userId),
    enabled: !!userId,
  });
}

// ==================== UTILITY FUNCTIONS ====================

export function getFullName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function getInitials(user: { firstName: string; lastName: string }): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

export function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function getMemberSinceText(createdAt: string): string {
  const date = new Date(createdAt);
  return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
}
