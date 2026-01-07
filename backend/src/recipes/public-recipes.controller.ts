import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RecipeVisibility } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface PublicRecipeQueryDto {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  cuisine?: string;
  sortBy?: 'createdAt' | 'forkCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

@Controller('public')
export class PublicRecipesController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get trending public recipes (most reactions/forks in last 7 days)
   * NOTE: This route MUST be defined before /recipes/:id to avoid route collision
   */
  @Public()
  @Get('recipes/trending')
  async getTrendingRecipes(@Query('limit') limitStr?: string) {
    const limit = Math.min(parseInt(limitStr || '10', 10), 20);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get recipes with most reactions in the last 7 days
    // Note: groupBy doesn't support nested relation filters, so we filter after
    const trendingRecipeIds = await this.prisma.recipeReaction.groupBy({
      by: ['recipeId'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { recipeId: true },
      orderBy: { _count: { recipeId: 'desc' } },
      take: limit * 2, // Get extra to filter out non-public
    });

    if (trendingRecipeIds.length === 0) {
      // Fall back to most forked public recipes
      return this.prisma.recipe.findMany({
        where: { visibility: RecipeVisibility.PUBLIC },
        orderBy: { forkCount: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          difficulty: true,
          category: true,
          cuisine: true,
          forkCount: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { reactions: true },
          },
        },
      });
    }

    // Fetch public recipes that match trending IDs
    const recipes = await this.prisma.recipe.findMany({
      where: {
        id: { in: trendingRecipeIds.map((r) => r.recipeId) },
        visibility: RecipeVisibility.PUBLIC,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        difficulty: true,
        category: true,
        cuisine: true,
        forkCount: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { reactions: true },
        },
      },
    });

    // Sort by trending order and limit
    const orderMap = new Map(
      trendingRecipeIds.map((r, i) => [r.recipeId, i]),
    );
    return recipes
      .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
      .slice(0, limit);
  }

  /**
   * Get a single public recipe by ID
   * URL: /public/recipes/:id or /r/:id (frontend routes to this)
   */
  @Public()
  @Get('recipes/:id')
  async getPublicRecipe(@Param('id', ParseUUIDPipe) id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id,
        visibility: RecipeVisibility.PUBLIC,
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
        parentRecipe: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        nutrition: true,
        _count: {
          select: {
            forks: true,
            comments: true,
            reactions: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found or is not public');
    }

    // Get reaction counts by type
    const reactionCounts = await this.prisma.recipeReaction.groupBy({
      by: ['type'],
      where: { recipeId: id },
      _count: { type: true },
    });

    const reactions = {
      fire: 0,
      want: 0,
      drooling: 0,
      madeIt: 0,
      total: 0,
    };

    reactionCounts.forEach((r) => {
      const count = r._count.type;
      reactions.total += count;
      switch (r.type) {
        case 'FIRE':
          reactions.fire = count;
          break;
        case 'WANT':
          reactions.want = count;
          break;
        case 'DROOLING':
          reactions.drooling = count;
          break;
        case 'MADE_IT':
          reactions.madeIt = count;
          break;
      }
    });

    return {
      ...recipe,
      reactions,
    };
  }

  /**
   * Get list of public recipes (explore/discover)
   */
  @Public()
  @Get('recipes')
  async getPublicRecipes(@Query() query: PublicRecipeQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 50);
    const skip = (page - 1) * limit;

    const where: any = {
      visibility: RecipeVisibility.PUBLIC,
    };

    // Search filter
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { cuisine: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search.toLowerCase() } },
      ];
    }

    // Category filter
    if (query.category) {
      where.category = query.category;
    }

    // Cuisine filter
    if (query.cuisine) {
      where.cuisine = { contains: query.cuisine, mode: 'insensitive' };
    }

    // Sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy = { [sortBy]: sortOrder };

    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          prepTimeMinutes: true,
          cookTimeMinutes: true,
          totalTimeMinutes: true,
          difficulty: true,
          category: true,
          cuisine: true,
          tags: true,
          servings: true,
          forkCount: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return {
      data: recipes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + recipes.length < total,
    };
  }

  /**
   * Get public recipes by a specific user (chef profile)
   */
  @Public()
  @Get('chefs/:userId/recipes')
  async getChefRecipes(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: PublicRecipeQueryDto,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 50);
    const skip = (page - 1) * limit;

    const [recipes, total, chef] = await Promise.all([
      this.prisma.recipe.findMany({
        where: {
          userId,
          visibility: RecipeVisibility.PUBLIC,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          prepTimeMinutes: true,
          cookTimeMinutes: true,
          difficulty: true,
          category: true,
          cuisine: true,
          forkCount: true,
          createdAt: true,
          _count: {
            select: { reactions: true },
          },
        },
      }),
      this.prisma.recipe.count({
        where: { userId, visibility: RecipeVisibility.PUBLIC },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          _count: {
            select: {
              recipes: { where: { visibility: RecipeVisibility.PUBLIC } },
              followers: true,
            },
          },
        },
      }),
    ]);

    return {
      chef,
      recipes: {
        data: recipes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + recipes.length < total,
      },
    };
  }
}
