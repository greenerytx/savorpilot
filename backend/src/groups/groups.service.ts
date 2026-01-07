import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  GroupQueryDto,
  GroupResponseDto,
  GroupDetailResponseDto,
  PaginatedGroupsDto,
} from './dto/group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new recipe group
   */
  async create(userId: string, dto: CreateGroupDto): Promise<GroupResponseDto> {
    const group = await this.prisma.recipeGroup.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        coverImage: dto.coverImage,
        isPublic: dto.isPublic || false,
      },
    });

    return this.mapToResponse(group);
  }

  /**
   * Get all groups for a user
   */
  async findAll(userId: string, query: GroupQueryDto): Promise<PaginatedGroupsDto> {
    const { page = 1, limit = 20, search, includeRecipeCount } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [groups, total] = await Promise.all([
      this.prisma.recipeGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          recipes: includeRecipeCount
            ? {
                take: 4,
                orderBy: { sortOrder: 'asc' },
                include: {
                  recipe: {
                    select: { id: true, title: true, imageUrl: true },
                  },
                },
              }
            : false,
          _count: includeRecipeCount ? { select: { recipes: true } } : false,
        },
      }),
      this.prisma.recipeGroup.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: groups.map((g) => this.mapToResponse(g, includeRecipeCount)),
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Get a group by ID with all recipes
   */
  async findOne(userId: string, groupId: string): Promise<GroupDetailResponseDto> {
    const group = await this.prisma.recipeGroup.findUnique({
      where: { id: groupId },
      include: {
        recipes: {
          orderBy: { sortOrder: 'asc' },
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                category: true,
                cuisine: true,
                totalTimeMinutes: true,
              },
            },
          },
        },
        _count: { select: { recipes: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check ownership or if shared
    if (group.userId !== userId && !group.isPublic) {
      const isShared = await this.prisma.sharedRecipeGroup.findFirst({
        where: { groupId, sharedWithUserId: userId },
      });

      if (!isShared) {
        throw new ForbiddenException('You do not have access to this group');
      }
    }

    return this.mapToDetailResponse(group);
  }

  /**
   * Update a group
   */
  async update(
    userId: string,
    groupId: string,
    dto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    const group = await this.prisma.recipeGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.userId !== userId) {
      throw new ForbiddenException('You can only update your own groups');
    }

    const updated = await this.prisma.recipeGroup.update({
      where: { id: groupId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Delete a group
   */
  async remove(userId: string, groupId: string): Promise<void> {
    const group = await this.prisma.recipeGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.userId !== userId) {
      throw new ForbiddenException('You can only delete your own groups');
    }

    await this.prisma.recipeGroup.delete({
      where: { id: groupId },
    });
  }

  /**
   * Add recipes to a group
   */
  async addRecipes(
    userId: string,
    groupId: string,
    recipeIds: string[],
  ): Promise<GroupDetailResponseDto> {
    const group = await this.prisma.recipeGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.userId !== userId) {
      throw new ForbiddenException('You can only modify your own groups');
    }

    // Verify all recipes belong to user
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds }, userId },
      select: { id: true },
    });

    if (recipes.length !== recipeIds.length) {
      throw new BadRequestException('Some recipes were not found or do not belong to you');
    }

    // Get current max sort order
    const maxOrder = await this.prisma.recipeGroupMembership.aggregate({
      where: { groupId },
      _max: { sortOrder: true },
    });

    let nextOrder = (maxOrder._max.sortOrder || 0) + 1;

    // Add recipes (ignore duplicates)
    await this.prisma.recipeGroupMembership.createMany({
      data: recipeIds.map((recipeId) => ({
        recipeId,
        groupId,
        sortOrder: nextOrder++,
      })),
      skipDuplicates: true,
    });

    return this.findOne(userId, groupId);
  }

  /**
   * Remove recipes from a group
   */
  async removeRecipes(
    userId: string,
    groupId: string,
    recipeIds: string[],
  ): Promise<GroupDetailResponseDto> {
    const group = await this.prisma.recipeGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.userId !== userId) {
      throw new ForbiddenException('You can only modify your own groups');
    }

    await this.prisma.recipeGroupMembership.deleteMany({
      where: {
        groupId,
        recipeId: { in: recipeIds },
      },
    });

    return this.findOne(userId, groupId);
  }

  /**
   * Reorder recipes in a group
   */
  async reorderRecipes(
    userId: string,
    groupId: string,
    recipes: { recipeId: string; sortOrder: number }[],
  ): Promise<GroupDetailResponseDto> {
    const group = await this.prisma.recipeGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.userId !== userId) {
      throw new ForbiddenException('You can only modify your own groups');
    }

    // Update sort orders in transaction
    await this.prisma.$transaction(
      recipes.map(({ recipeId, sortOrder }) =>
        this.prisma.recipeGroupMembership.update({
          where: {
            recipeId_groupId: { recipeId, groupId },
          },
          data: { sortOrder },
        }),
      ),
    );

    return this.findOne(userId, groupId);
  }

  /**
   * Get groups shared with user
   */
  async findSharedWithMe(userId: string, query: GroupQueryDto): Promise<PaginatedGroupsDto> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [sharedGroups, total] = await Promise.all([
      this.prisma.sharedRecipeGroup.findMany({
        where: { sharedWithUserId: userId },
        skip,
        take: limit,
        orderBy: { sharedAt: 'desc' },
        include: {
          group: {
            include: {
              recipes: {
                take: 4,
                include: {
                  recipe: {
                    select: { id: true, title: true, imageUrl: true },
                  },
                },
              },
              _count: { select: { recipes: true } },
              user: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      this.prisma.sharedRecipeGroup.count({ where: { sharedWithUserId: userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: sharedGroups.map((sg) => this.mapToResponse(sg.group, true)),
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  // Private helper methods

  private mapToResponse(group: any, includeRecipeInfo = false): GroupResponseDto {
    const response: GroupResponseDto = {
      id: group.id,
      userId: group.userId,
      name: group.name,
      description: group.description,
      coverImage: group.coverImage,
      isPublic: group.isPublic,
      visibility: group.visibility || 'PRIVATE',
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };

    if (includeRecipeInfo && group._count) {
      response.recipeCount = group._count.recipes;
    }

    if (includeRecipeInfo && group.recipes) {
      response.recipePreview = group.recipes.map((rm: any) => ({
        id: rm.recipe.id,
        title: rm.recipe.title,
        imageUrl: rm.recipe.imageUrl,
      }));
    }

    return response;
  }

  private mapToDetailResponse(group: any): GroupDetailResponseDto {
    return {
      ...this.mapToResponse(group, true),
      recipes: group.recipes.map((rm: any) => ({
        id: rm.recipe.id,
        title: rm.recipe.title,
        imageUrl: rm.recipe.imageUrl,
        category: rm.recipe.category,
        cuisine: rm.recipe.cuisine,
        totalTimeMinutes: rm.recipe.totalTimeMinutes,
        sortOrder: rm.sortOrder,
      })),
    };
  }
}
