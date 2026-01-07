import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CookingStatusType } from '@prisma/client';
import {
  CookingStatusResponseDto,
  CookingStatusWithUserDto,
} from './dto/cooking-status.dto';

@Injectable()
export class CookingStatusService {
  private readonly STATUS_EXPIRY_HOURS = 3;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update user's cooking status
   */
  async updateStatus(
    userId: string,
    status: CookingStatusType,
    recipeId?: string,
  ): Promise<CookingStatusResponseDto> {
    const now = new Date();
    const expiresAt =
      status === 'IDLE'
        ? null
        : new Date(now.getTime() + this.STATUS_EXPIRY_HOURS * 60 * 60 * 1000);

    const cookingStatus = await this.prisma.cookingStatus.upsert({
      where: { userId },
      create: {
        userId,
        status,
        recipeId: status !== 'IDLE' ? recipeId : null,
        startedAt: status !== 'IDLE' ? now : null,
        expiresAt,
      },
      update: {
        status,
        recipeId: status !== 'IDLE' ? recipeId : null,
        startedAt: status !== 'IDLE' ? now : null,
        expiresAt,
      },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });

    return cookingStatus;
  }

  /**
   * Get user's current cooking status
   */
  async getMyStatus(userId: string): Promise<CookingStatusResponseDto | null> {
    const status = await this.prisma.cookingStatus.findUnique({
      where: { userId },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!status) {
      return null;
    }

    // Check if expired
    if (status.expiresAt && status.expiresAt < new Date()) {
      // Auto-clear expired status
      await this.prisma.cookingStatus.update({
        where: { userId },
        data: {
          status: 'IDLE',
          recipeId: null,
          startedAt: null,
          expiresAt: null,
        },
      });

      return {
        ...status,
        status: 'IDLE' as CookingStatusType,
        recipeId: null,
        startedAt: null,
        expiresAt: null,
        recipe: null,
      };
    }

    return status;
  }

  /**
   * Clear user's cooking status (set to IDLE)
   */
  async clearStatus(userId: string): Promise<void> {
    await this.prisma.cookingStatus.upsert({
      where: { userId },
      create: {
        userId,
        status: 'IDLE',
      },
      update: {
        status: 'IDLE',
        recipeId: null,
        startedAt: null,
        expiresAt: null,
      },
    });
  }

  /**
   * Get friends who are currently cooking
   */
  async getFriendsCooking(
    userId: string,
  ): Promise<CookingStatusWithUserDto[]> {
    // Get users the current user follows
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    });
    const followingIds = following.map((f) => f.followeeId);

    if (followingIds.length === 0) {
      return [];
    }

    const now = new Date();
    const statuses = await this.prisma.cookingStatus.findMany({
      where: {
        userId: { in: followingIds },
        status: { not: 'IDLE' },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
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
        recipe: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return statuses;
  }

  /**
   * Get users currently cooking a specific recipe
   */
  async getRecipeCookingNow(
    recipeId: string,
    userId?: string,
    limit = 10,
  ): Promise<{
    users: CookingStatusWithUserDto[];
    totalCount: number;
  }> {
    const now = new Date();
    const where = {
      recipeId,
      status: { not: 'IDLE' as CookingStatusType },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    };

    const [statuses, totalCount] = await Promise.all([
      this.prisma.cookingStatus.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          recipe: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
      }),
      this.prisma.cookingStatus.count({ where }),
    ]);

    return {
      users: statuses,
      totalCount,
    };
  }

  /**
   * Get cooking activity summary for a user's network
   */
  async getCookingActivitySummary(
    userId: string,
  ): Promise<{
    friendsCooking: number;
    popularRecipes: Array<{
      recipeId: string;
      recipeTitle: string;
      cookingCount: number;
    }>;
  }> {
    // Get users the current user follows
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    });
    const followingIds = following.map((f) => f.followeeId);

    const now = new Date();

    // Count friends currently cooking
    const friendsCooking = await this.prisma.cookingStatus.count({
      where: {
        userId: { in: followingIds },
        status: { not: 'IDLE' },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    });

    // Get popular recipes being cooked
    const popularRecipes = await this.prisma.cookingStatus.groupBy({
      by: ['recipeId'],
      where: {
        recipeId: { not: null },
        status: { not: 'IDLE' },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      _count: { recipeId: true },
      orderBy: { _count: { recipeId: 'desc' } },
      take: 5,
    });

    // Get recipe details
    const recipeIds = popularRecipes
      .filter((r) => r.recipeId !== null)
      .map((r) => r.recipeId as string);

    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: { id: true, title: true },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r.title]));

    return {
      friendsCooking,
      popularRecipes: popularRecipes
        .filter((r) => r.recipeId !== null)
        .map((r) => ({
          recipeId: r.recipeId as string,
          recipeTitle: recipeMap.get(r.recipeId as string) || 'Unknown Recipe',
          cookingCount: r._count.recipeId,
        })),
    };
  }
}
