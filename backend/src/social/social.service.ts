import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NotificationType, RecipeVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  UserProfileResponseDto,
  UserSummaryDto,
  FollowResponseDto,
  FollowListResponseDto,
  FollowSuggestionDto,
} from './dto/social.dto';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Follow a user
   */
  async followUser(userId: string, targetUserId: string): Promise<FollowResponseDto> {
    if (userId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followeeId: {
          followerId: userId,
          followeeId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('You are already following this user');
    }

    // Create the follow relationship
    const follow = await this.prisma.userFollow.create({
      data: {
        followerId: userId,
        followeeId: targetUserId,
      },
      include: {
        follower: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        followee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(`User ${userId} followed user ${targetUserId}`);

    // Create notification for the followed user
    const followerName = `${follow.follower.firstName} ${follow.follower.lastName}`;
    await this.notificationsService.createNotification({
      userId: targetUserId,
      type: NotificationType.NEW_FOLLOWER,
      title: 'New Follower',
      message: `${followerName} started following you`,
      data: { followerId: userId, followerName },
    });

    return this.mapToFollowResponse(follow, userId);
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followeeId: {
          followerId: userId,
          followeeId: targetUserId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('You are not following this user');
    }

    await this.prisma.userFollow.delete({
      where: { id: follow.id },
    });

    this.logger.log(`User ${userId} unfollowed user ${targetUserId}`);
  }

  /**
   * Get current user's followers
   */
  async getFollowers(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<FollowListResponseDto> {
    const [followers, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followeeId: userId },
        include: {
          follower: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.userFollow.count({ where: { followeeId: userId } }),
    ]);

    // Check which followers the current user is following back
    const followerIds = followers.map((f) => f.followerId);
    const following = await this.prisma.userFollow.findMany({
      where: {
        followerId: userId,
        followeeId: { in: followerIds },
      },
      select: { followeeId: true },
    });
    const followingSet = new Set(following.map((f) => f.followeeId));

    const data: UserSummaryDto[] = followers.map((f) => ({
      id: f.follower.id,
      firstName: f.follower.firstName,
      lastName: f.follower.lastName,
      avatarUrl: f.follower.avatarUrl ?? undefined,
      isFollowing: followingSet.has(f.follower.id),
    }));

    return { data, total };
  }

  /**
   * Get users the current user is following
   */
  async getFollowing(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<FollowListResponseDto> {
    const [following, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followerId: userId },
        include: {
          followee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.userFollow.count({ where: { followerId: userId } }),
    ]);

    const data: UserSummaryDto[] = following.map((f) => ({
      id: f.followee.id,
      firstName: f.followee.firstName,
      lastName: f.followee.lastName,
      avatarUrl: f.followee.avatarUrl ?? undefined,
      isFollowing: true, // By definition, we're following these users
    }));

    return { data, total };
  }

  /**
   * Get a user's public profile
   */
  async getUserProfile(
    targetUserId: string,
    currentUserId: string,
  ): Promise<UserProfileResponseDto> {
    // Get user and counts separately
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get counts
    const [followerCount, followingCount, recipeCount] = await Promise.all([
      this.prisma.userFollow.count({ where: { followeeId: targetUserId } }),
      this.prisma.userFollow.count({ where: { followerId: targetUserId } }),
      this.prisma.recipe.count({ where: { userId: targetUserId, visibility: RecipeVisibility.PUBLIC } }),
    ]);

    // Check follow status
    const [isFollowing, isFollowedBy] = await Promise.all([
      this.prisma.userFollow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: currentUserId,
            followeeId: targetUserId,
          },
        },
      }),
      this.prisma.userFollow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: targetUserId,
            followeeId: currentUserId,
          },
        },
      }),
    ]);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl ?? undefined,
      followerCount,
      followingCount,
      recipeCount,
      isFollowing: !!isFollowing,
      isFollowedBy: !!isFollowedBy,
      createdAt: user.createdAt,
    };
  }

  /**
   * Get follow suggestions for the current user
   */
  async getFollowSuggestions(
    userId: string,
    limit = 20,
  ): Promise<FollowSuggestionDto[]> {
    // Get users the current user is already following
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    });
    const followingIds = new Set(following.map((f) => f.followeeId));

    // Get ALL users with public recipes (excluding current user only)
    const activeUsers = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        status: 'ACTIVE',
        recipes: {
          some: { visibility: RecipeVisibility.PUBLIC },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
      orderBy: {
        recipes: { _count: 'desc' },
      },
      take: limit,
    });

    // Get recipe counts for these users
    const recipeCounts = new Map<string, number>();
    for (const user of activeUsers) {
      const count = await this.prisma.recipe.count({
        where: { userId: user.id, visibility: RecipeVisibility.PUBLIC },
      });
      recipeCounts.set(user.id, count);
    }

    // Get mutual follower counts (users who follow people you follow)
    const mutualCounts = await this.getMutualFollowerCounts(
      userId,
      activeUsers.map((u) => u.id),
    );

    // Map users and mark following status
    const results = activeUsers.map((user) => {
      const isFollowing = followingIds.has(user.id);
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl ?? undefined,
        recipeCount: recipeCounts.get(user.id) || 0,
        isFollowing,
        mutualFollowerCount: mutualCounts.get(user.id) || 0,
        reason: isFollowing
          ? 'Following'
          : this.getSuggestionReason(recipeCounts.get(user.id) || 0, mutualCounts.get(user.id) || 0),
      };
    });

    // Sort: following users first, then by recipe count
    return results.sort((a, b) => {
      if (a.isFollowing !== b.isFollowing) {
        return a.isFollowing ? -1 : 1;
      }
      return b.recipeCount - a.recipeCount;
    });
  }

  /**
   * Check if current user is following a specific user
   */
  async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followeeId: {
          followerId: userId,
          followeeId: targetUserId,
        },
      },
    });
    return !!follow;
  }

  /**
   * Get recipes from users the current user follows
   * Includes both PUBLIC and FOLLOWERS-visible recipes
   */
  async getFollowingRecipes(
    userId: string,
    limit = 20,
    offset = 0,
  ) {
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    });
    const followingIds = following.map((f) => f.followeeId);

    // Include both PUBLIC and FOLLOWERS-visible recipes from followed users
    const recipes = await this.prisma.recipe.findMany({
      where: {
        userId: { in: followingIds },
        visibility: { in: [RecipeVisibility.PUBLIC, RecipeVisibility.FOLLOWERS] },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return recipes;
  }

  // Helper methods

  private async getMutualFollowerCounts(
    userId: string,
    targetUserIds: string[],
  ): Promise<Map<string, number>> {
    // Get users that userId follows
    const myFollowing = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    });
    const myFollowingIds = myFollowing.map((f) => f.followeeId);

    // For each target user, count how many of their followers are in myFollowing
    const mutualCounts = new Map<string, number>();

    for (const targetId of targetUserIds) {
      const count = await this.prisma.userFollow.count({
        where: {
          followeeId: targetId,
          followerId: { in: myFollowingIds },
        },
      });
      mutualCounts.set(targetId, count);
    }

    return mutualCounts;
  }

  private getSuggestionReason(recipeCount: number, mutualCount: number): string {
    if (mutualCount > 0) {
      return `${mutualCount} people you follow also follow them`;
    }
    if (recipeCount >= 10) {
      return 'Active recipe creator';
    }
    if (recipeCount >= 5) {
      return 'Popular chef';
    }
    return 'Suggested for you';
  }

  private mapToFollowResponse(follow: any, currentUserId: string): FollowResponseDto {
    return {
      id: follow.id,
      followerId: follow.followerId,
      followeeId: follow.followeeId,
      createdAt: follow.createdAt,
      follower: follow.follower
        ? {
            id: follow.follower.id,
            firstName: follow.follower.firstName,
            lastName: follow.follower.lastName,
            avatarUrl: follow.follower.avatarUrl ?? undefined,
            isFollowing: follow.followerId === currentUserId,
          }
        : undefined,
      followee: follow.followee
        ? {
            id: follow.followee.id,
            firstName: follow.followee.firstName,
            lastName: follow.followee.lastName,
            avatarUrl: follow.followee.avatarUrl ?? undefined,
            isFollowing: true,
          }
        : undefined,
    };
  }
}
