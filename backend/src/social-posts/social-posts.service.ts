import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSocialPostDto,
  UpdateSocialPostDto,
  CreateSocialPostCommentDto,
  SocialFeedQueryDto,
  UserPostsQueryDto,
  SocialPostResponseDto,
  SocialPostCommentResponseDto,
  PaginatedFeedDto,
  PaginatedPostsDto,
  PaginatedCommentsDto,
} from './dto/social-post.dto';
import { RecipeVisibility } from '@prisma/client';

@Injectable()
export class SocialPostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new social post
   */
  async create(
    userId: string,
    dto: CreateSocialPostDto,
  ): Promise<SocialPostResponseDto> {
    const post = await this.prisma.socialPost.create({
      data: {
        userId,
        postType: dto.postType,
        content: dto.content,
        imageUrl: dto.imageUrl,
        recipeId: dto.recipeId,
        visibility: dto.visibility || RecipeVisibility.PUBLIC,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        recipe: {
          select: { id: true, title: true, imageUrl: true },
        },
      },
    });

    return this.mapToResponse(post, userId);
  }

  /**
   * Get social feed (posts from followed users + own posts)
   */
  async getFeed(
    userId: string,
    query: SocialFeedQueryDto,
  ): Promise<PaginatedFeedDto> {
    const { limit = 20, cursor, postType } = query;

    // Get users the current user follows
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    });
    const followedUserIds = following.map((f) => f.followeeId);

    // Build where clause
    const where: any = {
      OR: [
        // Own posts
        { userId },
        // Posts from followed users that are PUBLIC or FOLLOWERS
        {
          userId: { in: followedUserIds },
          visibility: { in: [RecipeVisibility.PUBLIC, RecipeVisibility.FOLLOWERS] },
        },
        // All PUBLIC posts
        { visibility: RecipeVisibility.PUBLIC },
      ],
    };

    // Filter by post type if provided
    if (postType) {
      where.postType = postType;
    }

    // Add cursor-based pagination
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const posts = await this.prisma.socialPost.findMany({
      where,
      take: limit + 1, // Get one extra to check if there are more
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        recipe: {
          select: { id: true, title: true, imageUrl: true },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor =
      hasMore && data.length > 0
        ? data[data.length - 1].createdAt.toISOString()
        : undefined;

    return {
      data: data.map((p) => this.mapToResponse(p, userId)),
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get posts by a specific user
   */
  async getUserPosts(
    userId: string,
    targetUserId: string,
    query: UserPostsQueryDto,
  ): Promise<PaginatedPostsDto> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Check if current user follows target user
    const isFollowing =
      userId === targetUserId ||
      (await this.prisma.userFollow.findUnique({
        where: {
          followerId_followeeId: { followerId: userId, followeeId: targetUserId },
        },
      }));

    // Build visibility filter
    const visibilityFilter = isFollowing
      ? { in: [RecipeVisibility.PUBLIC, RecipeVisibility.FOLLOWERS] }
      : RecipeVisibility.PUBLIC;

    const where = {
      userId: targetUserId,
      visibility: visibilityFilter,
    };

    const [posts, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          recipe: {
            select: { id: true, title: true, imageUrl: true },
          },
          likes: {
            where: { userId },
            select: { id: true },
          },
        },
      }),
      this.prisma.socialPost.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: posts.map((p) => this.mapToResponse(p, userId)),
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Get a single post by ID
   */
  async findOne(userId: string, postId: string): Promise<SocialPostResponseDto> {
    const post = await this.prisma.socialPost.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        recipe: {
          select: { id: true, title: true, imageUrl: true },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check visibility
    if (post.visibility !== RecipeVisibility.PUBLIC && post.userId !== userId) {
      const isFollowing = await this.prisma.userFollow.findUnique({
        where: {
          followerId_followeeId: { followerId: userId, followeeId: post.userId },
        },
      });

      if (!isFollowing && post.visibility === RecipeVisibility.FOLLOWERS) {
        throw new ForbiddenException('You do not have access to this post');
      }

      if (post.visibility === RecipeVisibility.PRIVATE) {
        throw new ForbiddenException('You do not have access to this post');
      }
    }

    return this.mapToResponse(post, userId);
  }

  /**
   * Update a post
   */
  async update(
    userId: string,
    postId: string,
    dto: UpdateSocialPostDto,
  ): Promise<SocialPostResponseDto> {
    const post = await this.prisma.socialPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const updated = await this.prisma.socialPost.update({
      where: { id: postId },
      data: {
        ...(dto.postType && { postType: dto.postType }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.recipeId !== undefined && { recipeId: dto.recipeId }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        recipe: {
          select: { id: true, title: true, imageUrl: true },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    return this.mapToResponse(updated, userId);
  }

  /**
   * Delete a post
   */
  async remove(userId: string, postId: string): Promise<void> {
    const post = await this.prisma.socialPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.socialPost.delete({
      where: { id: postId },
    });
  }

  /**
   * Like a post
   */
  async likePost(userId: string, postId: string): Promise<void> {
    const post = await this.prisma.socialPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Create like and increment counter in transaction
    await this.prisma.$transaction([
      this.prisma.socialPostLike.upsert({
        where: {
          postId_userId: { postId, userId },
        },
        create: { postId, userId },
        update: {},
      }),
      this.prisma.socialPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
  }

  /**
   * Unlike a post
   */
  async unlikePost(userId: string, postId: string): Promise<void> {
    const existingLike = await this.prisma.socialPostLike.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (!existingLike) {
      return; // Already not liked
    }

    await this.prisma.$transaction([
      this.prisma.socialPostLike.delete({
        where: { id: existingLike.id },
      }),
      this.prisma.socialPost.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
  }

  /**
   * Get comments for a post
   */
  async getComments(
    userId: string,
    postId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedCommentsDto> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.socialPostComment.findMany({
        where: { postId, parentId: null }, // Only top-level comments
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          replies: {
            take: 3, // Preview of replies
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.socialPostComment.count({ where: { postId, parentId: null } }),
    ]);

    return {
      data: comments.map((c) => this.mapCommentToResponse(c, userId)),
      total,
      hasMore: skip + limit < total,
    };
  }

  /**
   * Add a comment to a post
   */
  async addComment(
    userId: string,
    postId: string,
    dto: CreateSocialPostCommentDto,
  ): Promise<SocialPostCommentResponseDto> {
    const post = await this.prisma.socialPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If replying, verify parent exists
    if (dto.parentId) {
      const parent = await this.prisma.socialPostComment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.postId !== postId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    // Create comment and increment counter
    const [comment] = await this.prisma.$transaction([
      this.prisma.socialPostComment.create({
        data: {
          postId,
          userId,
          content: dto.content,
          parentId: dto.parentId,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.socialPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    return this.mapCommentToResponse(comment, userId);
  }

  /**
   * Delete a comment
   */
  async deleteComment(
    userId: string,
    postId: string,
    commentId: string,
  ): Promise<void> {
    const comment = await this.prisma.socialPostComment.findUnique({
      where: { id: commentId },
      include: { _count: { select: { replies: true } } },
    });

    if (!comment || comment.postId !== postId) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete comment and decrement counter (including replies count)
    const deletionCount = 1 + comment._count.replies;
    await this.prisma.$transaction([
      this.prisma.socialPostComment.delete({
        where: { id: commentId },
      }),
      this.prisma.socialPost.update({
        where: { id: postId },
        data: { commentCount: { decrement: deletionCount } },
      }),
    ]);
  }

  // Private helper methods

  private mapToResponse(post: any, currentUserId: string): SocialPostResponseDto {
    return {
      id: post.id,
      postType: post.postType,
      content: post.content,
      imageUrl: post.imageUrl,
      recipe: post.recipe
        ? {
            id: post.recipe.id,
            title: post.recipe.title,
            imageUrl: post.recipe.imageUrl,
          }
        : undefined,
      author: {
        id: post.user.id,
        firstName: post.user.firstName,
        lastName: post.user.lastName,
        avatarUrl: post.user.avatarUrl,
      },
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      isLikedByMe: post.likes?.length > 0,
      visibility: post.visibility,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private mapCommentToResponse(
    comment: any,
    currentUserId: string,
  ): SocialPostCommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.user.id,
        firstName: comment.user.firstName,
        lastName: comment.user.lastName,
        avatarUrl: comment.user.avatarUrl,
      },
      parentId: comment.parentId,
      likeCount: comment.likeCount || 0,
      isLikedByMe: false, // TODO: Implement comment likes if needed
      replyCount: comment._count?.replies || 0,
      createdAt: comment.createdAt,
      replies: comment.replies?.map((r: any) =>
        this.mapCommentToResponse(r, currentUserId),
      ),
    };
  }
}
