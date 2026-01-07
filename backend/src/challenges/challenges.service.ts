import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateChallengeDto, UpdateChallengeDto, CreateEntryDto, ChallengeQueryDto } from './dto/challenge.dto';
import { ChallengeStatus } from '@prisma/client';

@Injectable()
export class ChallengesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createChallenge(userId: string, dto: CreateChallengeDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const votingEndDate = new Date(dto.votingEndDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }
    if (votingEndDate <= endDate) {
      throw new BadRequestException('Voting end date must be after challenge end date');
    }

    // Determine initial status
    const now = new Date();
    let status: ChallengeStatus = 'UPCOMING';
    if (now >= startDate && now < endDate) {
      status = 'ACTIVE';
    }

    return this.prisma.cookingChallenge.create({
      data: {
        title: dto.title,
        description: dto.description,
        theme: dto.theme,
        emoji: dto.emoji,
        coverImage: dto.coverImage,
        startDate,
        endDate,
        votingEndDate,
        status,
        createdById: userId,
      },
    });
  }

  async getChallenges(query: ChallengeQueryDto) {
    const limit = query.limit || 10;

    const challenges = await this.prisma.cookingChallenge.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { startDate: 'desc' },
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    const hasMore = challenges.length > limit;
    const items = hasMore ? challenges.slice(0, -1) : challenges;

    return {
      items: items.map((c) => ({
        ...c,
        entryCount: c._count.entries,
        _count: undefined,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async getActiveChallenge() {
    // First try to get an active challenge
    let challenge = await this.prisma.cookingChallenge.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: { entries: true },
        },
        entries: {
          take: 3,
          orderBy: { voteCount: 'desc' },
          include: {
            votes: true,
          },
        },
      },
    });

    // If no active, get the most recent one in voting phase
    if (!challenge) {
      challenge = await this.prisma.cookingChallenge.findFirst({
        where: { status: 'VOTING' },
        include: {
          _count: {
            select: { entries: true },
          },
          entries: {
            take: 3,
            orderBy: { voteCount: 'desc' },
            include: {
              votes: true,
            },
          },
        },
      });
    }

    if (!challenge) {
      return null;
    }

    return {
      ...challenge,
      entryCount: challenge._count.entries,
      _count: undefined,
      topEntries: challenge.entries,
      entries: undefined,
    };
  }

  async getChallengeById(challengeId: string, userId?: string) {
    const challenge = await this.prisma.cookingChallenge.findUnique({
      where: { id: challengeId },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Check if user has already entered
    let userEntry = null;
    if (userId) {
      userEntry = await this.prisma.challengeEntry.findUnique({
        where: {
          challengeId_userId: {
            challengeId,
            userId,
          },
        },
      });
    }

    return {
      ...challenge,
      entryCount: challenge._count.entries,
      _count: undefined,
      hasUserEntered: !!userEntry,
      userEntry,
    };
  }

  async updateChallenge(challengeId: string, userId: string, dto: UpdateChallengeDto) {
    const challenge = await this.prisma.cookingChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.createdById !== userId) {
      throw new ForbiddenException('You can only update challenges you created');
    }

    return this.prisma.cookingChallenge.update({
      where: { id: challengeId },
      data: dto,
    });
  }

  async submitEntry(challengeId: string, userId: string, dto: CreateEntryDto) {
    const challenge = await this.prisma.cookingChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.status !== 'ACTIVE') {
      throw new BadRequestException('Challenge is not accepting entries');
    }

    // Check if user already has an entry
    const existingEntry = await this.prisma.challengeEntry.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId,
        },
      },
    });

    if (existingEntry) {
      throw new BadRequestException('You have already submitted an entry to this challenge');
    }

    // Verify recipe belongs to user if provided
    if (dto.recipeId) {
      const recipe = await this.prisma.recipe.findFirst({
        where: {
          id: dto.recipeId,
          userId,
        },
      });

      if (!recipe) {
        throw new BadRequestException('Recipe not found or does not belong to you');
      }
    }

    return this.prisma.challengeEntry.create({
      data: {
        challengeId,
        userId,
        recipeId: dto.recipeId,
        photoUrl: dto.photoUrl,
        caption: dto.caption,
      },
    });
  }

  async getEntries(challengeId: string, userId?: string, cursor?: string, limit = 20) {
    const challenge = await this.prisma.cookingChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const entries = await this.prisma.challengeEntry.findMany({
      where: { challengeId },
      orderBy: { voteCount: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        votes: userId
          ? {
              where: { userId },
              take: 1,
            }
          : false,
      },
    });

    const hasMore = entries.length > limit;
    const items = hasMore ? entries.slice(0, -1) : entries;

    // Fetch user info for entries
    const userIds = [...new Set(items.map((e) => e.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Fetch recipes if needed
    const recipeIds = items.filter((e) => e.recipeId).map((e) => e.recipeId as string);
    const recipes =
      recipeIds.length > 0
        ? await this.prisma.recipe.findMany({
            where: { id: { in: recipeIds } },
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          })
        : [];
    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    return {
      items: items.map((entry) => ({
        id: entry.id,
        challengeId: entry.challengeId,
        photoUrl: entry.photoUrl,
        caption: entry.caption,
        voteCount: entry.voteCount,
        createdAt: entry.createdAt,
        isVotedByMe: Array.isArray(entry.votes) && entry.votes.length > 0,
        author: userMap.get(entry.userId),
        recipe: entry.recipeId ? recipeMap.get(entry.recipeId) : null,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async voteForEntry(entryId: string, userId: string) {
    const entry = await this.prisma.challengeEntry.findUnique({
      where: { id: entryId },
      include: { challenge: true },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.challenge.status !== 'VOTING' && entry.challenge.status !== 'ACTIVE') {
      throw new BadRequestException('Voting is not open for this challenge');
    }

    if (entry.userId === userId) {
      throw new BadRequestException('You cannot vote for your own entry');
    }

    // Check if already voted
    const existingVote = await this.prisma.challengeVote.findUnique({
      where: {
        entryId_userId: {
          entryId,
          userId,
        },
      },
    });

    if (existingVote) {
      throw new BadRequestException('You have already voted for this entry');
    }

    // Create vote and increment counter in transaction
    await this.prisma.$transaction([
      this.prisma.challengeVote.create({
        data: {
          entryId,
          userId,
        },
      }),
      this.prisma.challengeEntry.update({
        where: { id: entryId },
        data: {
          voteCount: { increment: 1 },
        },
      }),
    ]);

    // Notify entry author
    await this.notificationsService.createNotification({
      userId: entry.userId,
      type: 'RECIPE_FORKED', // Reuse existing type for challenge notifications
      title: 'New vote on your challenge entry!',
      message: 'Someone voted for your challenge entry!',
      data: entry.recipeId ? { recipeId: entry.recipeId } : undefined,
    });

    return { success: true };
  }

  async removeVote(entryId: string, userId: string) {
    const vote = await this.prisma.challengeVote.findUnique({
      where: {
        entryId_userId: {
          entryId,
          userId,
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    await this.prisma.$transaction([
      this.prisma.challengeVote.delete({
        where: { id: vote.id },
      }),
      this.prisma.challengeEntry.update({
        where: { id: entryId },
        data: {
          voteCount: { decrement: 1 },
        },
      }),
    ]);

    return { success: true };
  }

  async getLeaderboard(challengeId: string, limit = 10) {
    const challenge = await this.prisma.cookingChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const entries = await this.prisma.challengeEntry.findMany({
      where: { challengeId },
      orderBy: { voteCount: 'desc' },
      take: limit,
    });

    // Fetch user info
    const userIds = entries.map((e) => e.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return entries.map((entry, index) => ({
      rank: index + 1,
      id: entry.id,
      photoUrl: entry.photoUrl,
      caption: entry.caption,
      voteCount: entry.voteCount,
      author: userMap.get(entry.userId),
    }));
  }

  async deleteEntry(entryId: string, userId: string) {
    const entry = await this.prisma.challengeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only delete your own entries');
    }

    await this.prisma.challengeEntry.delete({
      where: { id: entryId },
    });

    return { success: true };
  }

  // Called by a cron job or manually to update challenge statuses
  async updateChallengeStatuses() {
    const now = new Date();

    // Move UPCOMING to ACTIVE
    await this.prisma.cookingChallenge.updateMany({
      where: {
        status: 'UPCOMING',
        startDate: { lte: now },
      },
      data: { status: 'ACTIVE' },
    });

    // Move ACTIVE to VOTING
    await this.prisma.cookingChallenge.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: now },
      },
      data: { status: 'VOTING' },
    });

    // Move VOTING to COMPLETED
    await this.prisma.cookingChallenge.updateMany({
      where: {
        status: 'VOTING',
        votingEndDate: { lte: now },
      },
      data: { status: 'COMPLETED' },
    });
  }
}
