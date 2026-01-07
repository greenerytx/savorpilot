import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, PostVisibility } from '@prisma/client';
import {
  CreateCookingPostDto,
  UpdateCookingPostDto,
  CookingPostResponseDto,
  CookingPostListResponseDto,
} from './dto/cooking-post.dto';

@Injectable()
export class CookingPostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createPost(
    userId: string,
    dto: CreateCookingPostDto,
  ): Promise<CookingPostResponseDto> {
    // Verify recipe exists
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: dto.recipeId },
      select: { id: true, title: true, imageUrl: true, userId: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const post = await this.prisma.cookingPost.create({
      data: {
        userId,
        recipeId: dto.recipeId,
        photoUrl: dto.photoUrl,
        caption: dto.caption,
        rating: dto.rating,
        visibility: dto.visibility || PostVisibility.FOLLOWERS,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });

    return this.mapToResponse(post, user!, recipe, 0, false);
  }

  async getPost(
    postId: string,
    currentUserId: string,
  ): Promise<CookingPostResponseDto> {
    const post = await this.prisma.cookingPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Cooking post not found');
    }

    // Check visibility
    if (post.userId !== currentUserId) {
      const canView = await this.canUserViewPost(post, currentUserId);
      if (!canView) {
        throw new ForbiddenException('You do not have permission to view this post');
      }
    }

    const [user, recipe, likeCount, isLikedByMe] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: post.userId },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      }),
      this.prisma.recipe.findUnique({
        where: { id: post.recipeId },
        select: { id: true, title: true, imageUrl: true },
      }),
      this.prisma.cookingPostLike.count({ where: { postId } }),
      this.prisma.cookingPostLike
        .findUnique({
          where: { postId_userId: { postId, userId: currentUserId } },
        })
        .then((like) => !!like),
    ]);

    return this.mapToResponse(post, user!, recipe!, likeCount, isLikedByMe);
  }

  async getUserPosts(
    userId: string,
    currentUserId: string,
    limit = 20,
    offset = 0,
  ): Promise<CookingPostListResponseDto> {
    const isOwn = userId === currentUserId;

    // Determine visibility filter
    let visibilityFilter: PostVisibility[] = [PostVisibility.PUBLIC];
    if (isOwn) {
      visibilityFilter = [
        PostVisibility.PUBLIC,
        PostVisibility.FOLLOWERS,
        PostVisibility.CIRCLES,
        PostVisibility.PRIVATE,
      ];
    } else {
      // Check if current user follows this user
      const isFollowing = await this.prisma.userFollow.findUnique({
        where: {
          followerId_followeeId: { followerId: currentUserId, followeeId: userId },
        },
      });
      if (isFollowing) {
        visibilityFilter.push(PostVisibility.FOLLOWERS);
      }
    }

    const [posts, total] = await Promise.all([
      this.prisma.cookingPost.findMany({
        where: {
          userId,
          visibility: { in: visibilityFilter },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.cookingPost.count({
        where: {
          userId,
          visibility: { in: visibilityFilter },
        },
      }),
    ]);

    const postsWithDetails = await this.enrichPosts(posts, currentUserId);

    return { data: postsWithDetails, total };
  }

  async getRecipePosts(
    recipeId: string,
    currentUserId: string,
    limit = 20,
    offset = 0,
  ): Promise<CookingPostListResponseDto> {
    // Get IDs of users the current user follows
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: currentUserId },
      select: { followeeId: true },
    });
    const followingIds = following.map((f) => f.followeeId);

    // Build visibility conditions
    const [posts, total] = await Promise.all([
      this.prisma.cookingPost.findMany({
        where: {
          recipeId,
          OR: [
            { visibility: PostVisibility.PUBLIC },
            { userId: currentUserId },
            {
              AND: [
                { visibility: PostVisibility.FOLLOWERS },
                { userId: { in: followingIds } },
              ],
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.cookingPost.count({
        where: {
          recipeId,
          OR: [
            { visibility: PostVisibility.PUBLIC },
            { userId: currentUserId },
            {
              AND: [
                { visibility: PostVisibility.FOLLOWERS },
                { userId: { in: followingIds } },
              ],
            },
          ],
        },
      }),
    ]);

    const postsWithDetails = await this.enrichPosts(posts, currentUserId);

    return { data: postsWithDetails, total };
  }

  async getFeed(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<CookingPostListResponseDto> {
    // Get IDs of users the current user follows
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    });
    const followingIds = following.map((f) => f.followeeId);

    // Include own posts + posts from followed users (respecting visibility)
    const [posts, total] = await Promise.all([
      this.prisma.cookingPost.findMany({
        where: {
          OR: [
            { userId }, // Own posts
            {
              AND: [
                { userId: { in: followingIds } },
                { visibility: { in: [PostVisibility.PUBLIC, PostVisibility.FOLLOWERS] } },
              ],
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.cookingPost.count({
        where: {
          OR: [
            { userId },
            {
              AND: [
                { userId: { in: followingIds } },
                { visibility: { in: [PostVisibility.PUBLIC, PostVisibility.FOLLOWERS] } },
              ],
            },
          ],
        },
      }),
    ]);

    const postsWithDetails = await this.enrichPosts(posts, userId);

    return { data: postsWithDetails, total };
  }

  async updatePost(
    postId: string,
    userId: string,
    dto: UpdateCookingPostDto,
  ): Promise<CookingPostResponseDto> {
    const post = await this.prisma.cookingPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Cooking post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const updated = await this.prisma.cookingPost.update({
      where: { id: postId },
      data: {
        caption: dto.caption,
        rating: dto.rating,
        visibility: dto.visibility,
      },
    });

    const [user, recipe, likeCount, isLikedByMe] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: post.userId },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      }),
      this.prisma.recipe.findUnique({
        where: { id: post.recipeId },
        select: { id: true, title: true, imageUrl: true },
      }),
      this.prisma.cookingPostLike.count({ where: { postId } }),
      this.prisma.cookingPostLike
        .findUnique({
          where: { postId_userId: { postId, userId } },
        })
        .then((like) => !!like),
    ]);

    return this.mapToResponse(updated, user!, recipe!, likeCount, isLikedByMe);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await this.prisma.cookingPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Cooking post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.cookingPost.delete({ where: { id: postId } });
  }

  async likePost(postId: string, userId: string): Promise<void> {
    const post = await this.prisma.cookingPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Cooking post not found');
    }

    // Check if user can view the post
    if (post.userId !== userId) {
      const canView = await this.canUserViewPost(post, userId);
      if (!canView) {
        throw new ForbiddenException('You cannot like this post');
      }
    }

    // Check if already liked
    const existingLike = await this.prisma.cookingPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existingLike) {
      return; // Already liked
    }

    await this.prisma.cookingPostLike.create({
      data: { postId, userId },
    });

    // Send notification to post owner (if not self)
    if (post.userId !== userId) {
      const liker = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      await this.notifications.createNotification({
        userId: post.userId,
        type: NotificationType.COOKING_POST_LIKE,
        title: 'New like on your post',
        message: `${liker?.firstName} ${liker?.lastName} liked your cooking post`,
        data: { postId, likerId: userId },
      });
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    const post = await this.prisma.cookingPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Cooking post not found');
    }

    await this.prisma.cookingPostLike.deleteMany({
      where: { postId, userId },
    });
  }

  // ==================== HELPERS ====================

  private async canUserViewPost(
    post: { userId: string; visibility: PostVisibility },
    viewerId: string,
  ): Promise<boolean> {
    if (post.visibility === PostVisibility.PUBLIC) {
      return true;
    }

    if (post.visibility === PostVisibility.PRIVATE) {
      return false;
    }

    if (post.visibility === PostVisibility.FOLLOWERS) {
      const isFollowing = await this.prisma.userFollow.findUnique({
        where: {
          followerId_followeeId: { followerId: viewerId, followeeId: post.userId },
        },
      });
      return !!isFollowing;
    }

    // CIRCLES visibility - TODO: implement when circles are added to posts
    return false;
  }

  private async enrichPosts(
    posts: any[],
    currentUserId: string,
  ): Promise<CookingPostResponseDto[]> {
    if (posts.length === 0) return [];

    const postIds = posts.map((p) => p.id);
    const userIds = [...new Set(posts.map((p) => p.userId))];
    const recipeIds = [...new Set(posts.map((p) => p.recipeId))];

    const [users, recipes, likeCounts, userLikes] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      }),
      this.prisma.recipe.findMany({
        where: { id: { in: recipeIds } },
        select: { id: true, title: true, imageUrl: true },
      }),
      this.prisma.cookingPostLike.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: true,
      }),
      this.prisma.cookingPostLike.findMany({
        where: { postId: { in: postIds }, userId: currentUserId },
        select: { postId: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const recipeMap = new Map(recipes.map((r) => [r.id, r]));
    const likeCountMap = new Map(likeCounts.map((l) => [l.postId, l._count]));
    const userLikeSet = new Set(userLikes.map((l) => l.postId));

    return posts.map((post) =>
      this.mapToResponse(
        post,
        userMap.get(post.userId)!,
        recipeMap.get(post.recipeId)!,
        likeCountMap.get(post.id) || 0,
        userLikeSet.has(post.id),
      ),
    );
  }

  private mapToResponse(
    post: any,
    user: { id: string; firstName: string; lastName: string; avatarUrl?: string | null },
    recipe: { id: string; title: string; imageUrl?: string | null },
    likeCount: number,
    isLikedByMe: boolean,
  ): CookingPostResponseDto {
    return {
      id: post.id,
      userId: post.userId,
      recipeId: post.recipeId,
      photoUrl: post.photoUrl,
      caption: post.caption,
      rating: post.rating,
      visibility: post.visibility,
      createdAt: post.createdAt.toISOString(),
      likeCount,
      isLikedByMe,
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl || undefined,
      },
      recipe: {
        id: recipe.id,
        title: recipe.title,
        imageUrl: recipe.imageUrl || undefined,
      },
    };
  }
}
