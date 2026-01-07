import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSmartCollectionDto,
  UpdateSmartCollectionDto,
  FilterRulesDto,
} from './dto/smart-collection.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SmartCollectionsService {
  constructor(private prisma: PrismaService) {}

  // Create a new smart collection
  async create(userId: string, dto: CreateSmartCollectionDto) {
    return this.prisma.smartCollection.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        filterRules: dto.filterRules as any,
      },
    });
  }

  // Get all smart collections for a user
  async findAll(userId: string) {
    const collections = await this.prisma.smartCollection.findMany({
      where: { userId },
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Get recipe counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const count = await this.countRecipesForFilter(
          userId,
          collection.filterRules as FilterRulesDto,
        );
        return {
          ...collection,
          recipeCount: count,
        };
      }),
    );

    return collectionsWithCounts;
  }

  // Get a single smart collection with recipes
  async findOne(userId: string, id: string) {
    const collection = await this.prisma.smartCollection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('Smart collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const recipes = await this.getRecipesForFilter(
      userId,
      collection.filterRules as FilterRulesDto,
    );

    return {
      ...collection,
      recipeCount: recipes.length,
      recipes,
    };
  }

  // Update a smart collection
  async update(userId: string, id: string, dto: UpdateSmartCollectionDto) {
    const collection = await this.prisma.smartCollection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('Smart collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (collection.isSystem && dto.filterRules) {
      throw new ForbiddenException('Cannot modify filter rules of system collections');
    }

    // Update the collection
    const updatedCollection = await this.prisma.smartCollection.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        visibility: dto.visibility,
        filterRules: dto.filterRules ? (dto.filterRules as any) : undefined,
      },
    });

    // If visibility is being changed, propagate to all recipes in this collection
    if (dto.visibility && dto.visibility !== collection.visibility) {
      const filterRules = dto.filterRules || (collection.filterRules as FilterRulesDto);
      const where = this.buildWhereClause(userId, filterRules);

      // Update all matching recipes to the new visibility
      await this.prisma.recipe.updateMany({
        where,
        data: { visibility: dto.visibility as any },
      });
    }

    return updatedCollection;
  }

  // Delete a smart collection
  async remove(userId: string, id: string) {
    const collection = await this.prisma.smartCollection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('Smart collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (collection.isSystem) {
      throw new ForbiddenException('Cannot delete system collections');
    }

    await this.prisma.smartCollection.delete({ where: { id } });
    return { success: true };
  }

  // Create default system collections for a new user
  async createSystemCollections(userId: string) {
    const systemCollections = [
      {
        name: 'Quick Meals',
        description: 'Ready in 30 minutes or less',
        icon: 'clock',
        color: 'amber',
        filterRules: { maxTime: 30 },
      },
      {
        name: 'Easy Recipes',
        description: 'Simple recipes for beginners',
        icon: 'smile',
        color: 'green',
        filterRules: { difficulty: ['EASY'] },
      },
      {
        name: 'Recently Added',
        description: 'Recipes from the last 7 days',
        icon: 'calendar',
        color: 'blue',
        filterRules: { recentDays: 7 },
      },
      {
        name: 'Dinner Ideas',
        description: 'All your dinner recipes',
        icon: 'utensils',
        color: 'orange',
        filterRules: { category: ['DINNER', 'MAIN_COURSE'] },
      },
      {
        name: 'Desserts',
        description: 'Sweet treats and baked goods',
        icon: 'cake',
        color: 'pink',
        filterRules: { category: ['DESSERT', 'BAKING'] },
      },
      {
        name: 'From Instagram',
        description: 'Recipes imported from Instagram',
        icon: 'instagram',
        color: 'purple',
        filterRules: { source: ['INSTAGRAM_URL', 'INSTAGRAM_SHARE'] },
      },
    ];

    for (let i = 0; i < systemCollections.length; i++) {
      const sc = systemCollections[i];
      await this.prisma.smartCollection.create({
        data: {
          userId,
          name: sc.name,
          description: sc.description,
          icon: sc.icon,
          color: sc.color,
          isSystem: true,
          sortOrder: i,
          filterRules: sc.filterRules as any,
        },
      });
    }
  }

  // Build Prisma where clause from filter rules
  private buildWhereClause(
    userId: string,
    filters: FilterRulesDto,
  ): Prisma.RecipeWhereInput {
    const where: Prisma.RecipeWhereInput = {
      userId,
    };

    if (filters.category && filters.category.length > 0) {
      where.category = { in: filters.category as any };
    }

    if (filters.cuisine && filters.cuisine.length > 0) {
      where.cuisine = { in: filters.cuisine };
    }

    if (filters.difficulty && filters.difficulty.length > 0) {
      where.difficulty = { in: filters.difficulty as any };
    }

    if (filters.maxTime) {
      where.totalTimeMinutes = { lte: filters.maxTime };
    }

    if (filters.minTime) {
      where.totalTimeMinutes = {
        ...((where.totalTimeMinutes as any) || {}),
        gte: filters.minTime,
      };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasEvery: filters.tags };
    }

    if (filters.source && filters.source.length > 0) {
      where.source = { in: filters.source as any };
    }

    if (filters.recentDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.recentDays);
      where.createdAt = { gte: cutoffDate };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  // Get recipes matching filter rules
  private async getRecipesForFilter(userId: string, filters: FilterRulesDto) {
    const where = this.buildWhereClause(userId, filters);

    return this.prisma.recipe.findMany({
      where,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        category: true,
        cuisine: true,
        totalTimeMinutes: true,
        difficulty: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit preview
    });
  }

  // Count recipes matching filter rules
  private async countRecipesForFilter(
    userId: string,
    filters: FilterRulesDto,
  ): Promise<number> {
    const where = this.buildWhereClause(userId, filters);
    return this.prisma.recipe.count({ where });
  }

  // Preview filter results (for creating/editing)
  async previewFilter(userId: string, filters: FilterRulesDto) {
    const count = await this.countRecipesForFilter(userId, filters);
    const recipes = await this.getRecipesForFilter(userId, filters);

    return {
      count,
      recipes: recipes.slice(0, 10), // Preview first 10
    };
  }
}
