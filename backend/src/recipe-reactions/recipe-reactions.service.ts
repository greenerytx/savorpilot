import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReactionType } from '@prisma/client';
import {
  ReactionStatsDto,
  ReactionResponseDto,
  ReactionWithUserDto,
} from './dto/reaction.dto';

@Injectable()
export class RecipeReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a reaction to a recipe
   */
  async addReaction(
    recipeId: string,
    userId: string,
    type: ReactionType,
  ): Promise<ReactionResponseDto> {
    // Verify recipe exists and is accessible
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, visibility: true, userId: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Only allow reactions on public recipes or own recipes
    if (recipe.visibility === 'PRIVATE' && recipe.userId !== userId) {
      throw new ForbiddenException('Cannot react to private recipes');
    }

    // Upsert the reaction (create if doesn't exist, return existing if it does)
    const reaction = await this.prisma.recipeReaction.upsert({
      where: {
        userId_recipeId_type: { userId, recipeId, type },
      },
      create: { userId, recipeId, type },
      update: {}, // No update needed, just return existing
    });

    return reaction;
  }

  /**
   * Remove a reaction from a recipe
   */
  async removeReaction(
    recipeId: string,
    userId: string,
    type: ReactionType,
  ): Promise<void> {
    await this.prisma.recipeReaction.deleteMany({
      where: { userId, recipeId, type },
    });
  }

  /**
   * Get reaction stats for a recipe
   */
  async getReactionStats(
    recipeId: string,
    userId?: string,
  ): Promise<ReactionStatsDto> {
    const [reactionCounts, userReactions] = await Promise.all([
      // Get counts by type
      this.prisma.recipeReaction.groupBy({
        by: ['type'],
        where: { recipeId },
        _count: { type: true },
      }),
      // Get user's reactions if authenticated
      userId
        ? this.prisma.recipeReaction.findMany({
            where: { recipeId, userId },
            select: { type: true },
          })
        : [],
    ]);

    const counts = {
      fire: 0,
      want: 0,
      drooling: 0,
      madeIt: 0,
      total: 0,
    };

    reactionCounts.forEach((r) => {
      const count = r._count.type;
      counts.total += count;
      switch (r.type) {
        case 'FIRE':
          counts.fire = count;
          break;
        case 'WANT':
          counts.want = count;
          break;
        case 'DROOLING':
          counts.drooling = count;
          break;
        case 'MADE_IT':
          counts.madeIt = count;
          break;
      }
    });

    return {
      recipeId,
      counts,
      userReactions: userReactions.map((r) => r.type),
    };
  }

  /**
   * Get users who reacted to a recipe (with pagination)
   */
  async getReactionUsers(
    recipeId: string,
    type?: ReactionType,
    page = 1,
    limit = 20,
  ): Promise<{ data: ReactionWithUserDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: any = { recipeId };
    if (type) {
      where.type = type;
    }

    const [reactions, total] = await Promise.all([
      this.prisma.recipeReaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.prisma.recipeReaction.count({ where }),
    ]);

    return { data: reactions, total };
  }

  /**
   * Get all reactions for multiple recipes (for batch loading)
   */
  async getBatchReactionStats(
    recipeIds: string[],
    userId?: string,
  ): Promise<Map<string, ReactionStatsDto>> {
    const [reactionCounts, userReactions] = await Promise.all([
      this.prisma.recipeReaction.groupBy({
        by: ['recipeId', 'type'],
        where: { recipeId: { in: recipeIds } },
        _count: { type: true },
      }),
      userId
        ? this.prisma.recipeReaction.findMany({
            where: { recipeId: { in: recipeIds }, userId },
            select: { recipeId: true, type: true },
          })
        : ([] as { recipeId: string; type: ReactionType }[]),
    ]);

    // Initialize stats map
    const statsMap = new Map<string, ReactionStatsDto>();
    recipeIds.forEach((id) => {
      statsMap.set(id, {
        recipeId: id,
        counts: { fire: 0, want: 0, drooling: 0, madeIt: 0, total: 0 },
        userReactions: [],
      });
    });

    // Populate counts
    reactionCounts.forEach((r) => {
      const stats = statsMap.get(r.recipeId);
      if (stats) {
        const count = r._count.type;
        stats.counts.total += count;
        switch (r.type) {
          case 'FIRE':
            stats.counts.fire = count;
            break;
          case 'WANT':
            stats.counts.want = count;
            break;
          case 'DROOLING':
            stats.counts.drooling = count;
            break;
          case 'MADE_IT':
            stats.counts.madeIt = count;
            break;
        }
      }
    });

    // Populate user reactions
    userReactions.forEach((r) => {
      const stats = statsMap.get(r.recipeId);
      if (stats) {
        stats.userReactions.push(r.type);
      }
    });

    return statsMap;
  }
}
