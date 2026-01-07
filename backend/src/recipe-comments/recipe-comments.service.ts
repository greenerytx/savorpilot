import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
  CommentListResponseDto,
} from './dto/recipe-comment.dto';

@Injectable()
export class RecipeCommentsService {
  private readonly logger = new Logger(RecipeCommentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get comments for a recipe (top-level only, with replies)
   */
  async getComments(
    recipeId: string,
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<CommentListResponseDto> {
    // Verify recipe exists
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const [comments, total] = await Promise.all([
      this.prisma.recipeComment.findMany({
        where: { recipeId, parentId: null },
        include: {
          likes: { select: { userId: true } },
          replies: {
            include: {
              likes: { select: { userId: true } },
              _count: { select: { replies: true } },
            },
            orderBy: { createdAt: 'asc' },
            take: 3, // Show first 3 replies inline
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.recipeComment.count({ where: { recipeId, parentId: null } }),
    ]);

    // Get user info for all comments
    const userIds = new Set<string>();
    comments.forEach((c) => {
      userIds.add(c.userId);
      c.replies.forEach((r) => userIds.add(r.userId));
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = comments.map((comment) =>
      this.mapToResponse(comment, userMap, userId),
    );

    return { data, total };
  }

  /**
   * Get replies to a comment
   */
  async getReplies(
    commentId: string,
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<CommentListResponseDto> {
    const [replies, total] = await Promise.all([
      this.prisma.recipeComment.findMany({
        where: { parentId: commentId },
        include: {
          likes: { select: { userId: true } },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.recipeComment.count({ where: { parentId: commentId } }),
    ]);

    const userIds = replies.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = replies.map((reply) =>
      this.mapToResponse(reply, userMap, userId),
    );

    return { data, total };
  }

  /**
   * Create a comment on a recipe
   */
  async createComment(
    recipeId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    // Verify recipe exists and is public (or owned by user)
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, userId: true, visibility: true, title: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.visibility === 'PRIVATE' && recipe.userId !== userId) {
      throw new ForbiddenException('Cannot comment on private recipes');
    }

    // If replying, verify parent exists
    if (dto.parentId) {
      const parent = await this.prisma.recipeComment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, recipeId: true, userId: true },
      });

      if (!parent || parent.recipeId !== recipeId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.recipeComment.create({
      data: {
        recipeId,
        userId,
        parentId: dto.parentId,
        content: dto.content,
      },
      include: {
        likes: { select: { userId: true } },
        _count: { select: { replies: true } },
      },
    });

    // Get author info
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });

    this.logger.log(`Comment created on recipe ${recipeId} by user ${userId}`);

    // Notify recipe owner (if not commenting on own recipe)
    if (recipe.userId !== userId) {
      const commenterName = `${author?.firstName} ${author?.lastName}`;
      await this.notificationsService.createNotification({
        userId: recipe.userId,
        type: NotificationType.RECIPE_COMMENT,
        title: 'New Comment',
        message: `${commenterName} commented on your recipe "${recipe.title}"`,
        data: { recipeId, commentId: comment.id, commenterName },
      });
    }

    // If replying, notify the parent comment author
    if (dto.parentId) {
      const parent = await this.prisma.recipeComment.findUnique({
        where: { id: dto.parentId },
        select: { userId: true },
      });

      if (parent && parent.userId !== userId) {
        const commenterName = `${author?.firstName} ${author?.lastName}`;
        await this.notificationsService.createNotification({
          userId: parent.userId,
          type: NotificationType.COMMENT_REPLY,
          title: 'New Reply',
          message: `${commenterName} replied to your comment`,
          data: { recipeId, commentId: comment.id, parentId: dto.parentId },
        });
      }
    }

    const userMap = new Map([[userId, author!]]);
    return this.mapToResponse(comment, userMap, userId);
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.prisma.recipeComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.recipeComment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
        isEdited: true,
      },
      include: {
        likes: { select: { userId: true } },
        _count: { select: { replies: true } },
      },
    });

    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });

    const userMap = new Map([[userId, author!]]);
    return this.mapToResponse(updated, userMap, userId);
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.recipeComment.findUnique({
      where: { id: commentId },
      include: { recipe: { select: { userId: true } } },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Allow deletion by comment author or recipe owner
    if (comment.userId !== userId && comment.recipe.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this comment');
    }

    await this.prisma.recipeComment.delete({ where: { id: commentId } });
    this.logger.log(`Comment ${commentId} deleted by user ${userId}`);
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.recipeComment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, recipeId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if already liked
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId },
      },
    });

    if (existingLike) {
      return; // Already liked
    }

    await this.prisma.commentLike.create({
      data: { commentId, userId },
    });

    // Notify comment author (if not liking own comment)
    if (comment.userId !== userId) {
      const liker = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      const likerName = `${liker?.firstName} ${liker?.lastName}`;
      await this.notificationsService.createNotification({
        userId: comment.userId,
        type: NotificationType.COMMENT_LIKE,
        title: 'Comment Liked',
        message: `${likerName} liked your comment`,
        data: { commentId, recipeId: comment.recipeId },
      });
    }
  }

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string, userId: string): Promise<void> {
    await this.prisma.commentLike.deleteMany({
      where: { commentId, userId },
    });
  }

  /**
   * Get comment count for a recipe
   */
  async getCommentCount(recipeId: string): Promise<number> {
    return this.prisma.recipeComment.count({ where: { recipeId } });
  }

  // Helper methods

  private mapToResponse(
    comment: any,
    userMap: Map<string, any>,
    currentUserId: string,
  ): CommentResponseDto {
    const author = userMap.get(comment.userId);
    const likes = comment.likes || [];
    const isLikedByMe = likes.some((l: any) => l.userId === currentUserId);

    return {
      id: comment.id,
      recipeId: comment.recipeId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isEdited: comment.isEdited,
      parentId: comment.parentId ?? undefined,
      author: {
        id: author?.id || comment.userId,
        firstName: author?.firstName || 'Unknown',
        lastName: author?.lastName || 'User',
        avatarUrl: author?.avatarUrl ?? undefined,
      },
      likeCount: likes.length,
      isLikedByMe,
      replyCount: comment._count?.replies || 0,
      replies: comment.replies?.map((r: any) =>
        this.mapToResponse(r, userMap, currentUserId),
      ),
    };
  }
}
