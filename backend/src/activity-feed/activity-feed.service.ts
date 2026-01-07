import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType, TargetType } from '@prisma/client';
import {
  ActivityFeedItemDto,
  ActivityFeedResponseDto,
  ActivityActorDto,
  ActivityTargetDto,
} from './dto/activity-feed.dto';

@Injectable()
export class ActivityFeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<ActivityFeedResponseDto> {
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.activityFeedItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activityFeedItem.count({ where: { userId } }),
      this.prisma.activityFeedItem.count({ where: { userId, isRead: false } }),
    ]);

    const enrichedItems = await this.enrichActivityItems(items);

    return {
      data: enrichedItems,
      total,
      unreadCount,
    };
  }

  async getUserActivity(
    targetUserId: string,
    viewerId: string,
    limit = 20,
    offset = 0,
  ): Promise<ActivityFeedResponseDto> {
    // Get public activity of a user (what they've done, not their feed)
    const [items, total] = await Promise.all([
      this.prisma.activityFeedItem.findMany({
        where: {
          actorId: targetUserId,
          // Only show certain activity types publicly
          activityType: {
            in: [
              ActivityType.COOKED_RECIPE,
              ActivityType.SHARED_RECIPE,
              ActivityType.FORKED_RECIPE,
              ActivityType.PUBLISHED_RECIPE,
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        distinct: ['activityType', 'targetId'], // Avoid duplicates
      }),
      this.prisma.activityFeedItem.count({
        where: {
          actorId: targetUserId,
          activityType: {
            in: [
              ActivityType.COOKED_RECIPE,
              ActivityType.SHARED_RECIPE,
              ActivityType.FORKED_RECIPE,
              ActivityType.PUBLISHED_RECIPE,
            ],
          },
        },
      }),
    ]);

    const enrichedItems = await this.enrichActivityItems(items);

    return {
      data: enrichedItems,
      total,
      unreadCount: 0, // Not relevant for viewing others' activity
    };
  }

  async markAsRead(userId: string, itemIds: string[]): Promise<void> {
    await this.prisma.activityFeedItem.updateMany({
      where: {
        id: { in: itemIds },
        userId, // Security: only mark own items as read
      },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.activityFeedItem.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // Create activity and fan out to followers
  async createActivity(
    actorId: string,
    activityType: ActivityType,
    targetType: TargetType,
    targetId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // Get actor's followers
    const followers = await this.prisma.userFollow.findMany({
      where: { followeeId: actorId },
      select: { followerId: true },
    });

    const followerIds = followers.map((f) => f.followerId);

    // Also add to actor's own feed
    const userIds = [...followerIds, actorId];

    // Create activity items for all users
    await this.prisma.activityFeedItem.createMany({
      data: userIds.map((userId) => ({
        userId,
        actorId,
        activityType,
        targetType,
        targetId,
        metadata,
        isRead: userId === actorId, // Mark as read for the actor
      })),
    });
  }

  // ==================== HELPERS ====================

  private async enrichActivityItems(
    items: any[],
  ): Promise<ActivityFeedItemDto[]> {
    if (items.length === 0) return [];

    // Get unique actor IDs
    const actorIds = [...new Set(items.map((i) => i.actorId))];

    // Get actors
    const actors = await this.prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });
    const actorMap = new Map(actors.map((a) => [a.id, a]));

    // Get targets by type
    const targetsByType = new Map<TargetType, string[]>();
    for (const item of items) {
      const ids = targetsByType.get(item.targetType) || [];
      ids.push(item.targetId);
      targetsByType.set(item.targetType, ids);
    }

    // Fetch targets
    const targetMap = new Map<string, ActivityTargetDto>();

    // Recipes
    const recipeIds = targetsByType.get(TargetType.RECIPE) || [];
    if (recipeIds.length > 0) {
      const recipes = await this.prisma.recipe.findMany({
        where: { id: { in: recipeIds } },
        select: { id: true, title: true, imageUrl: true },
      });
      for (const recipe of recipes) {
        targetMap.set(recipe.id, {
          id: recipe.id,
          type: TargetType.RECIPE,
          title: recipe.title,
          imageUrl: recipe.imageUrl || undefined,
        });
      }
    }

    // Cooking posts
    const postIds = targetsByType.get(TargetType.COOKING_POST) || [];
    if (postIds.length > 0) {
      const posts = await this.prisma.cookingPost.findMany({
        where: { id: { in: postIds } },
        select: { id: true, photoUrl: true, caption: true },
      });
      for (const post of posts) {
        targetMap.set(post.id, {
          id: post.id,
          type: TargetType.COOKING_POST,
          title: post.caption?.substring(0, 50) || 'Cooking post',
          imageUrl: post.photoUrl || undefined,
        });
      }
    }

    // Users (for follow activities)
    const userTargetIds = targetsByType.get(TargetType.USER) || [];
    if (userTargetIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userTargetIds } },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      });
      for (const user of users) {
        targetMap.set(user.id, {
          id: user.id,
          type: TargetType.USER,
          title: `${user.firstName} ${user.lastName}`,
          imageUrl: user.avatarUrl || undefined,
        });
      }
    }

    // Party events
    const eventIds = targetsByType.get(TargetType.PARTY_EVENT) || [];
    if (eventIds.length > 0) {
      const events = await this.prisma.partyEvent.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, name: true, coverImage: true },
      });
      for (const event of events) {
        targetMap.set(event.id, {
          id: event.id,
          type: TargetType.PARTY_EVENT,
          title: event.name,
          imageUrl: event.coverImage || undefined,
        });
      }
    }

    return items.map((item) => {
      const actor = actorMap.get(item.actorId);
      return {
        id: item.id,
        activityType: item.activityType,
        targetType: item.targetType,
        targetId: item.targetId,
        createdAt: item.createdAt.toISOString(),
        isRead: item.isRead,
        actor: {
          id: actor?.id || item.actorId,
          firstName: actor?.firstName || 'Unknown',
          lastName: actor?.lastName || 'User',
          avatarUrl: actor?.avatarUrl || undefined,
        },
        target: targetMap.get(item.targetId),
        metadata: item.metadata,
      };
    });
  }
}
