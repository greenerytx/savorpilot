import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { RecipeVisibility as PrismaRecipeVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  RecipeQueryDto,
  RecipeResponseDto,
  PaginatedRecipesDto,
  ForkRecipeDto,
  RecipeLineageDto,
  RecipeDiffDto,
  IngredientDto,
  StepDto,
  RecipeVisibility,
} from './dto/recipe.dto';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Create a new recipe
   */
  async create(userId: string, dto: CreateRecipeDto): Promise<RecipeResponseDto> {
    const totalTime = this.calculateTotalTime(dto.prepTimeMinutes, dto.cookTimeMinutes);

    // Truncate fields to match database column limits
    const truncate = (str: string | undefined, maxLen: number) =>
      str ? str.substring(0, maxLen) : str;

    const recipe = await this.prisma.recipe.create({
      data: {
        userId,
        title: truncate(dto.title, 500)!,
        description: dto.description,
        imageUrl: dto.imageUrl,
        videoUrl: dto.videoUrl,
        prepTimeMinutes: dto.prepTimeMinutes,
        cookTimeMinutes: dto.cookTimeMinutes,
        totalTimeMinutes: totalTime,
        difficulty: dto.difficulty,
        category: dto.category,
        cuisine: truncate(dto.cuisine, 100),
        tags: dto.tags || [],
        servings: dto.servings || 4,
        servingUnit: truncate(dto.servingUnit, 50),
        source: dto.source || 'TEXT',
        sourceUrl: truncate(dto.sourceUrl, 1000),
        sourceAuthor: truncate(dto.sourceAuthor, 500),
        visibility: dto.visibility ?? 'PRIVATE',
        components: dto.components as any,
      },
    });

    return this.mapToResponse(recipe);
  }

  /**
   * Get all recipes for a user with pagination and filters
   */
  async findAll(userId: string, query: RecipeQueryDto): Promise<PaginatedRecipesDto> {
    const { page = 1, limit = 20, search, category, difficulty, cuisine, maxTime, sortBy, sortOrder, tags } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { cuisine: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (cuisine) {
      where.cuisine = { contains: cuisine, mode: 'insensitive' };
    }

    if (maxTime) {
      where.totalTimeMinutes = { lte: maxTime };
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy || 'createdAt'] = sortOrder || 'desc';

    // Execute queries
    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          notes: true,
          nutrition: true,
          user: { select: { firstName: true, lastName: true } },
          parentRecipe: {
            select: {
              id: true,
              title: true,
              userId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: recipes.map((r) => this.mapToResponse(r)),
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Get a single recipe by ID
   */
  async findOne(userId: string, recipeId: string): Promise<RecipeResponseDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        notes: true,
        nutrition: true,
        user: { select: { firstName: true, lastName: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5,
        },
        parentRecipe: {
          select: {
            id: true,
            title: true,
            userId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Check access based on visibility
    if (recipe.userId !== userId) {
      const hasAccess = await this.checkRecipeAccess(userId, recipe);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this recipe');
      }
    }

    return this.mapToResponse(recipe);
  }

  /**
   * Update a recipe
   */
  async update(
    userId: string,
    recipeId: string,
    dto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.userId !== userId) {
      throw new ForbiddenException('You can only update your own recipes');
    }

    // Save current version before updating
    await this.createVersion(recipe);

    const totalTime = this.calculateTotalTime(
      dto.prepTimeMinutes ?? recipe.prepTimeMinutes,
      dto.cookTimeMinutes ?? recipe.cookTimeMinutes,
    );

    const updated = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.prepTimeMinutes !== undefined && { prepTimeMinutes: dto.prepTimeMinutes }),
        ...(dto.cookTimeMinutes !== undefined && { cookTimeMinutes: dto.cookTimeMinutes }),
        ...(totalTime !== null && { totalTimeMinutes: totalTime }),
        ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.cuisine !== undefined && { cuisine: dto.cuisine }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.servings !== undefined && { servings: dto.servings }),
        ...(dto.servingUnit !== undefined && { servingUnit: dto.servingUnit }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.sourceUrl !== undefined && { sourceUrl: dto.sourceUrl }),
        ...(dto.sourceAuthor !== undefined && { sourceAuthor: dto.sourceAuthor }),
        ...(dto.components !== undefined && { components: dto.components as any }),
      },
      include: {
        notes: true,
        nutrition: true,
      },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Delete a recipe
   */
  async remove(userId: string, recipeId: string): Promise<void> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.userId !== userId) {
      throw new ForbiddenException('You can only delete your own recipes');
    }

    await this.prisma.recipe.delete({
      where: { id: recipeId },
    });
  }

  /**
   * Update or create recipe notes
   */
  async updateNotes(
    userId: string,
    recipeId: string,
    personalNotes?: string,
    sharedNotes?: string,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.findOne(userId, recipeId);

    await this.prisma.recipeNotes.upsert({
      where: { recipeId },
      create: {
        recipeId,
        personalNotes,
        sharedNotes,
      },
      update: {
        ...(personalNotes !== undefined && { personalNotes }),
        ...(sharedNotes !== undefined && { sharedNotes }),
      },
    });

    return this.findOne(userId, recipeId);
  }

  /**
   * Get recipes shared with user
   */
  async findSharedWithMe(userId: string, query: RecipeQueryDto): Promise<PaginatedRecipesDto> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [sharedRecipes, total] = await Promise.all([
      this.prisma.sharedRecipe.findMany({
        where: { sharedWithUserId: userId },
        skip,
        take: limit,
        orderBy: { sharedAt: 'desc' },
        include: {
          recipe: {
            include: {
              notes: true,
              nutrition: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.sharedRecipe.count({ where: { sharedWithUserId: userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: sharedRecipes.map((sr) => this.mapToResponse(sr.recipe)),
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Get recipe statistics for a user
   */
  async getStatistics(userId: string) {
    const [
      totalRecipes,
      byCategory,
      byCuisine,
      recentRecipes,
    ] = await Promise.all([
      this.prisma.recipe.count({ where: { userId } }),
      this.prisma.recipe.groupBy({
        by: ['category'],
        where: { userId, category: { not: null } },
        _count: { category: true },
      }),
      this.prisma.recipe.groupBy({
        by: ['cuisine'],
        where: { userId, cuisine: { not: null } },
        _count: { cuisine: true },
        orderBy: { _count: { cuisine: 'desc' } },
        take: 10,
      }),
      this.prisma.recipe.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, imageUrl: true, createdAt: true },
      }),
    ]);

    return {
      totalRecipes,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
      topCuisines: byCuisine.map((c) => ({
        cuisine: c.cuisine,
        count: c._count.cuisine,
      })),
      recentRecipes,
    };
  }

  /**
   * Translate a recipe to English and Arabic
   * Creates translations and saves them to the database
   */
  async translateRecipe(userId: string, recipeId: string): Promise<{
    english: { title: string; description: string | null };
    arabic: { title: string; description: string | null };
  }> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { translations: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.userId !== userId) {
      throw new ForbiddenException('You can only translate your own recipes');
    }

    this.logger.log(`Translating recipe: ${recipe.title}`);

    const recipeData = {
      title: recipe.title,
      description: recipe.description || undefined,
      components: (recipe.components as any[]) || [],
    };

    // Translate to both English and Arabic in parallel
    const [englishTranslation, arabicTranslation] = await Promise.all([
      this.aiService.translateRecipe(recipeData, 'en'),
      this.aiService.translateRecipe(recipeData, 'ar'),
    ]);

    // Save translations to database
    await Promise.all([
      this.prisma.recipeTranslation.upsert({
        where: {
          recipeId_language: { recipeId, language: 'en' },
        },
        create: {
          recipeId,
          language: 'en',
          title: englishTranslation.title,
          description: englishTranslation.description,
          components: englishTranslation.components as any,
        },
        update: {
          title: englishTranslation.title,
          description: englishTranslation.description,
          components: englishTranslation.components as any,
        },
      }),
      this.prisma.recipeTranslation.upsert({
        where: {
          recipeId_language: { recipeId, language: 'ar' },
        },
        create: {
          recipeId,
          language: 'ar',
          title: arabicTranslation.title,
          description: arabicTranslation.description,
          components: arabicTranslation.components as any,
        },
        update: {
          title: arabicTranslation.title,
          description: arabicTranslation.description,
          components: arabicTranslation.components as any,
        },
      }),
    ]);

    this.logger.log(`Recipe translated successfully: ${recipe.title}`);

    return {
      english: {
        title: englishTranslation.title,
        description: englishTranslation.description,
      },
      arabic: {
        title: arabicTranslation.title,
        description: arabicTranslation.description,
      },
    };
  }

  /**
   * Get translations for a recipe
   */
  async getTranslations(userId: string, recipeId: string): Promise<{
    english?: { title: string; description: string | null; components: any[] };
    arabic?: { title: string; description: string | null; components: any[] };
  }> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { translations: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Use the standard access check which handles visibility
    const hasAccess = await this.checkRecipeAccess(userId, recipe);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this recipe');
    }

    const englishTranslation = recipe.translations.find(t => t.language === 'en');
    const arabicTranslation = recipe.translations.find(t => t.language === 'ar');

    return {
      english: englishTranslation ? {
        title: englishTranslation.title,
        description: englishTranslation.description,
        components: englishTranslation.components as any[],
      } : undefined,
      arabic: arabicTranslation ? {
        title: arabicTranslation.title,
        description: arabicTranslation.description,
        components: arabicTranslation.components as any[],
      } : undefined,
    };
  }

  // ==================== VISIBILITY METHODS ====================

  /**
   * Update recipe visibility (PRIVATE/FOLLOWERS/PUBLIC)
   */
  async updateVisibility(
    userId: string,
    recipeId: string,
    visibility: RecipeVisibility,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.userId !== userId) {
      throw new ForbiddenException('You can only update visibility of your own recipes');
    }

    const updatedRecipe = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { visibility },
      include: {
        notes: true,
        nutrition: true,
        parentRecipe: {
          select: {
            id: true,
            title: true,
            userId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    this.logger.log(`Recipe visibility updated: ${recipeId} -> ${visibility}`);

    return this.mapToResponse(updatedRecipe);
  }

  /**
   * Bulk update recipe visibility
   */
  async bulkUpdateVisibility(
    userId: string,
    recipeIds: string[],
    visibility: RecipeVisibility,
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    // Verify ownership of all recipes
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: { id: true, userId: true },
    });

    const ownedRecipeIds = recipes
      .filter((r) => r.userId === userId)
      .map((r) => r.id);

    // Track recipes that user doesn't own
    const notOwnedIds = recipeIds.filter((id) => !ownedRecipeIds.includes(id));
    failed.push(...notOwnedIds);

    if (ownedRecipeIds.length > 0) {
      const result = await this.prisma.recipe.updateMany({
        where: { id: { in: ownedRecipeIds } },
        data: { visibility },
      });
      updated = result.count;
    }

    this.logger.log(`Bulk visibility update: ${updated} recipes updated to ${visibility}, ${failed.length} failed`);

    return { updated, failed };
  }

  // ==================== FORKING METHODS ====================

  /**
   * Fork a recipe - create a copy linked to the original
   */
  async forkRecipe(
    userId: string,
    recipeId: string,
    dto: ForkRecipeDto,
  ): Promise<RecipeResponseDto> {
    // Get the source recipe
    const sourceRecipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        notes: true,
        nutrition: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!sourceRecipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Check access: must be public, owned by user, or shared with user
    const hasAccess = await this.checkRecipeAccess(userId, sourceRecipe);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to fork this recipe');
    }

    // Determine root recipe ID (for nested forks)
    const rootRecipeId = sourceRecipe.rootRecipeId || sourceRecipe.id;

    // Create the forked recipe
    const forkedRecipe = await this.prisma.$transaction(async (tx) => {
      // Create new recipe as a copy
      const newRecipe = await tx.recipe.create({
        data: {
          userId,
          title: sourceRecipe.title,
          description: sourceRecipe.description,
          imageUrl: sourceRecipe.imageUrl,
          videoUrl: sourceRecipe.videoUrl,
          prepTimeMinutes: sourceRecipe.prepTimeMinutes,
          cookTimeMinutes: sourceRecipe.cookTimeMinutes,
          totalTimeMinutes: sourceRecipe.totalTimeMinutes,
          difficulty: sourceRecipe.difficulty,
          category: sourceRecipe.category,
          cuisine: sourceRecipe.cuisine,
          tags: sourceRecipe.tags,
          servings: sourceRecipe.servings,
          servingUnit: sourceRecipe.servingUnit,
          source: sourceRecipe.source,
          sourceUrl: sourceRecipe.sourceUrl,
          sourceAuthor: sourceRecipe.sourceAuthor,
          components: sourceRecipe.components as any,
          // Fork-specific fields
          parentRecipeId: sourceRecipe.id,
          rootRecipeId,
          forkNote: dto.forkNote,
          visibility: dto.visibility ?? 'PRIVATE',
          forkCount: 0,
        },
        include: {
          notes: true,
          nutrition: true,
          parentRecipe: {
            select: {
              id: true,
              title: true,
              userId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      // Copy nutrition if exists
      if (sourceRecipe.nutrition) {
        await tx.recipeNutrition.create({
          data: {
            recipeId: newRecipe.id,
            caloriesPerServing: sourceRecipe.nutrition.caloriesPerServing,
            proteinGrams: sourceRecipe.nutrition.proteinGrams,
            carbsGrams: sourceRecipe.nutrition.carbsGrams,
            fatGrams: sourceRecipe.nutrition.fatGrams,
            fiberGrams: sourceRecipe.nutrition.fiberGrams,
            sugarGrams: sourceRecipe.nutrition.sugarGrams,
            sodiumMg: sourceRecipe.nutrition.sodiumMg,
            isEstimated: sourceRecipe.nutrition.isEstimated,
          },
        });
      }

      // Increment fork count on parent
      await tx.recipe.update({
        where: { id: sourceRecipe.id },
        data: { forkCount: { increment: 1 } },
      });

      return newRecipe;
    });

    this.logger.log(`Recipe forked: ${sourceRecipe.id} -> ${forkedRecipe.id} by user ${userId}`);

    return this.mapToResponse(forkedRecipe);
  }

  /**
   * Get all forks of a recipe
   */
  async getRecipeForks(
    userId: string,
    recipeId: string,
    query: { page?: number; limit?: number } = {},
  ): Promise<{
    data: RecipeResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Verify access to the parent recipe
    const parentRecipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!parentRecipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Get forks - only show public forks or user's own forks
    const where = {
      parentRecipeId: recipeId,
      OR: [
        { visibility: PrismaRecipeVisibility.PUBLIC },
        { userId },
      ],
    };

    const [forks, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          notes: true,
          nutrition: true,
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return {
      data: forks.map((f) => this.mapToResponse(f)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get lineage (ancestors and descendants) of a recipe
   */
  async getRecipeLineage(userId: string, recipeId: string): Promise<RecipeLineageDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        parentRecipe: {
          select: {
            id: true,
            title: true,
            userId: true,
            parentRecipeId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Build ancestors chain (walk up the tree)
    const ancestors: RecipeLineageDto['ancestors'] = [];
    let currentParent = recipe.parentRecipe;

    while (currentParent) {
      ancestors.push({
        id: currentParent.id,
        title: currentParent.title,
        userId: currentParent.userId,
        user: currentParent.user || undefined,
      });

      // Get next parent
      if (currentParent.parentRecipeId) {
        currentParent = await this.prisma.recipe.findUnique({
          where: { id: currentParent.parentRecipeId },
          select: {
            id: true,
            title: true,
            userId: true,
            parentRecipeId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        });
      } else {
        currentParent = null;
      }
    }

    // Get direct forks (children) - only public or user's own
    const forks = await this.prisma.recipe.findMany({
      where: {
        parentRecipeId: recipeId,
        OR: [{ visibility: PrismaRecipeVisibility.PUBLIC }, { userId }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        userId: true,
        forkNote: true,
        forkCount: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      ancestors,
      forks: forks.map((f) => ({
        id: f.id,
        title: f.title,
        userId: f.userId,
        forkNote: f.forkNote || undefined,
        forkCount: f.forkCount,
        createdAt: f.createdAt,
        user: f.user || undefined,
      })),
      forkCount: recipe.forkCount,
    };
  }

  /**
   * Compare two recipes and generate a diff
   */
  async compareRecipes(
    userId: string,
    recipeId1: string,
    recipeId2: string,
  ): Promise<RecipeDiffDto> {
    // Fetch both recipes
    const [recipe1, recipe2] = await Promise.all([
      this.prisma.recipe.findUnique({ where: { id: recipeId1 } }),
      this.prisma.recipe.findUnique({ where: { id: recipeId2 } }),
    ]);

    if (!recipe1 || !recipe2) {
      throw new NotFoundException('One or both recipes not found');
    }

    // Check access to both recipes
    const [hasAccess1, hasAccess2] = await Promise.all([
      this.checkRecipeAccess(userId, recipe1),
      this.checkRecipeAccess(userId, recipe2),
    ]);

    if (!hasAccess1 || !hasAccess2) {
      throw new ForbiddenException('You do not have access to one or both recipes');
    }

    // Compare ingredients
    const ingredientsDiff = this.compareIngredients(
      this.extractAllIngredients(recipe1.components as any[]),
      this.extractAllIngredients(recipe2.components as any[]),
    );

    // Compare steps
    const stepsDiff = this.compareSteps(
      this.extractAllSteps(recipe1.components as any[]),
      this.extractAllSteps(recipe2.components as any[]),
    );

    // Compare metadata
    const metadataDiff = this.compareMetadata(recipe1, recipe2);

    return {
      ingredients: ingredientsDiff,
      steps: stepsDiff,
      metadata: metadataDiff,
    };
  }

  /**
   * Check if user has access to a recipe based on visibility
   * PRIVATE: Only owner
   * FOLLOWERS: Owner + followers of the recipe owner
   * PUBLIC: Everyone
   */
  private async checkRecipeAccess(userId: string, recipe: any): Promise<boolean> {
    // Owner always has access
    if (recipe.userId === userId) {
      return true;
    }

    // Public recipes are accessible to everyone
    if (recipe.visibility === 'PUBLIC') {
      return true;
    }

    // Followers-only recipes: check if user follows the recipe owner
    if (recipe.visibility === 'FOLLOWERS') {
      const isFollowing = await this.prisma.userFollow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: userId,
            followeeId: recipe.userId,
          },
        },
      });
      if (isFollowing) {
        return true;
      }
    }

    // Check if shared directly with user (applies to all visibility levels)
    const isShared = await this.prisma.sharedRecipe.findFirst({
      where: {
        recipeId: recipe.id,
        sharedWithUserId: userId,
      },
    });

    return !!isShared;
  }

  /**
   * Extract all ingredients from recipe components
   */
  private extractAllIngredients(components: any[]): IngredientDto[] {
    if (!components) return [];
    return components.flatMap((c) => c.ingredients || []);
  }

  /**
   * Extract all steps from recipe components
   */
  private extractAllSteps(components: any[]): StepDto[] {
    if (!components) return [];
    return components.flatMap((c) => c.steps || []);
  }

  /**
   * Compare two ingredient lists and return diff
   */
  private compareIngredients(
    original: IngredientDto[],
    modified: IngredientDto[],
  ): RecipeDiffDto['ingredients'] {
    const added: IngredientDto[] = [];
    const removed: IngredientDto[] = [];
    const modifiedItems: { original: IngredientDto; modified: IngredientDto }[] = [];

    // Create maps for O(1) lookup by normalized name
    const originalMap = new Map(
      original.map((i) => [this.normalizeIngredientName(i.name), i]),
    );
    const modifiedMap = new Map(
      modified.map((i) => [this.normalizeIngredientName(i.name), i]),
    );

    // Find added and modified
    for (const [name, ing] of modifiedMap) {
      const orig = originalMap.get(name);
      if (!orig) {
        added.push(ing);
      } else if (this.ingredientsDiffer(orig, ing)) {
        modifiedItems.push({ original: orig, modified: ing });
      }
    }

    // Find removed
    for (const [name, ing] of originalMap) {
      if (!modifiedMap.has(name)) {
        removed.push(ing);
      }
    }

    return { added, removed, modified: modifiedItems };
  }

  /**
   * Compare two step lists and return diff
   */
  private compareSteps(
    original: StepDto[],
    modified: StepDto[],
  ): RecipeDiffDto['steps'] {
    const added: StepDto[] = [];
    const removed: StepDto[] = [];
    const modifiedItems: { original: StepDto; modified: StepDto }[] = [];

    // Compare by order position
    const maxLen = Math.max(original.length, modified.length);

    for (let i = 0; i < maxLen; i++) {
      const origStep = original[i];
      const modStep = modified[i];

      if (!origStep && modStep) {
        added.push(modStep);
      } else if (origStep && !modStep) {
        removed.push(origStep);
      } else if (origStep && modStep && this.stepsDiffer(origStep, modStep)) {
        modifiedItems.push({ original: origStep, modified: modStep });
      }
    }

    return { added, removed, modified: modifiedItems };
  }

  /**
   * Compare recipe metadata
   */
  private compareMetadata(recipe1: any, recipe2: any): RecipeDiffDto['metadata'] {
    const fieldsToCompare = [
      'title',
      'description',
      'servings',
      'servingUnit',
      'prepTimeMinutes',
      'cookTimeMinutes',
      'difficulty',
      'category',
      'cuisine',
    ];

    const diffs: RecipeDiffDto['metadata'] = [];

    for (const field of fieldsToCompare) {
      const val1 = recipe1[field];
      const val2 = recipe2[field];

      if (val1 !== val2) {
        diffs.push({ field, original: val1, modified: val2 });
      }
    }

    // Compare tags (array)
    const tags1 = (recipe1.tags || []).sort().join(',');
    const tags2 = (recipe2.tags || []).sort().join(',');
    if (tags1 !== tags2) {
      diffs.push({ field: 'tags', original: recipe1.tags, modified: recipe2.tags });
    }

    return diffs;
  }

  /**
   * Normalize ingredient name for comparison
   */
  private normalizeIngredientName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/s$/, '') // Remove trailing 's' for plurals
      .replace(/[^\w\s]/g, ''); // Remove special characters
  }

  /**
   * Check if two ingredients differ (ignoring name)
   */
  private ingredientsDiffer(a: IngredientDto, b: IngredientDto): boolean {
    return (
      a.quantity !== b.quantity ||
      a.unit !== b.unit ||
      a.notes !== b.notes ||
      a.optional !== b.optional
    );
  }

  /**
   * Check if two steps differ
   */
  private stepsDiffer(a: StepDto, b: StepDto): boolean {
    return (
      a.instruction !== b.instruction ||
      a.duration !== b.duration ||
      a.temperature !== b.temperature ||
      a.tips !== b.tips
    );
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private calculateTotalTime(prepTime?: number | null, cookTime?: number | null): number | null {
    if (prepTime == null && cookTime == null) return null;
    return (prepTime || 0) + (cookTime || 0);
  }

  private async createVersion(recipe: any): Promise<void> {
    const lastVersion = await this.prisma.recipeVersion.findFirst({
      where: { recipeId: recipe.id },
      orderBy: { versionNumber: 'desc' },
    });

    const newVersionNumber = (lastVersion?.versionNumber || 0) + 1;

    await this.prisma.recipeVersion.create({
      data: {
        recipeId: recipe.id,
        versionNumber: newVersionNumber,
        snapshot: {
          title: recipe.title,
          description: recipe.description,
          components: recipe.components,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          servings: recipe.servings,
        },
        createdBy: recipe.userId,
      },
    });
  }

  private mapToResponse(recipe: any): RecipeResponseDto {
    return {
      id: recipe.id,
      userId: recipe.userId,
      user: recipe.user,
      title: recipe.title,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      videoUrl: recipe.videoUrl,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      totalTimeMinutes: recipe.totalTimeMinutes,
      difficulty: recipe.difficulty,
      category: recipe.category,
      cuisine: recipe.cuisine,
      tags: recipe.tags || [],
      servings: recipe.servings,
      servingUnit: recipe.servingUnit,
      source: recipe.source,
      sourceUrl: recipe.sourceUrl,
      sourceAuthor: recipe.sourceAuthor,
      components: recipe.components || [],
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      // Forking fields
      parentRecipeId: recipe.parentRecipeId,
      rootRecipeId: recipe.rootRecipeId,
      forkCount: recipe.forkCount ?? 0,
      forkNote: recipe.forkNote,
      visibility: recipe.visibility ?? 'PRIVATE',
      parentRecipe: recipe.parentRecipe
        ? {
            id: recipe.parentRecipe.id,
            title: recipe.parentRecipe.title,
            userId: recipe.parentRecipe.userId,
            user: recipe.parentRecipe.user,
          }
        : undefined,
      notes: recipe.notes
        ? {
            personalNotes: recipe.notes.personalNotes,
            sharedNotes: recipe.notes.sharedNotes,
          }
        : undefined,
      nutrition: recipe.nutrition
        ? {
            caloriesPerServing: recipe.nutrition.caloriesPerServing,
            proteinGrams: recipe.nutrition.proteinGrams,
            carbsGrams: recipe.nutrition.carbsGrams,
            fatGrams: recipe.nutrition.fatGrams,
            fiberGrams: recipe.nutrition.fiberGrams,
            sugarGrams: recipe.nutrition.sugarGrams,
            sodiumMg: recipe.nutrition.sodiumMg,
            saturatedFatGrams: recipe.nutrition.saturatedFatGrams,
            cholesterolMg: recipe.nutrition.cholesterolMg,
            isEstimated: recipe.nutrition.isEstimated,
            ingredientBreakdown: recipe.nutrition.ingredientBreakdown as any,
          }
        : undefined,
    };
  }
}
