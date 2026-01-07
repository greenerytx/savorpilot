import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ForkVoteResponseDto,
  ForkVoteStatsDto,
  SmartForkSuggestionDto,
  ForkChangelogDto,
  ForkGalleryItemDto,
  ForkGalleryResponseDto,
  ForkAnalyticsDto,
  ForkComparisonItemDto,
  ForkComparisonMatrixDto,
  FORK_TAG_OPTIONS,
} from './dto/fork-enhancements.dto';
import {
  ForkValidationStatsDto,
  ValidationBadgeDto,
  ValidationBadgeType,
  VALIDATION_BADGES,
  CookTrialDto,
} from './dto/cook-trials.dto';
import {
  AutoForkTemplate,
  AUTO_FORK_TEMPLATES,
  AutoForkPreviewDto,
  AutoForkResultDto,
} from './dto/auto-fork-templates.dto';
import {
  ForkOutcomePredictionDto,
  RiskFactor,
  RiskLevel,
  RISK_FACTORS,
  POSITIVE_FACTORS,
} from './dto/outcome-prediction.dto';

@Injectable()
export class ForkEnhancementsService {
  private readonly logger = new Logger(ForkEnhancementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== FORK LINEAGE ====================

  async getForkLineage(recipeId: string): Promise<{
    ancestors: any[];
    current: any;
    descendants: any[];
    totalForkCount: number;
  }> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Get ancestors (walk up the parent chain)
    const ancestors: any[] = [];
    let currentAncestorId = recipe.parentRecipeId;

    while (currentAncestorId) {
      const ancestor = await this.prisma.recipe.findUnique({
        where: { id: currentAncestorId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      });

      if (!ancestor) break;

      ancestors.unshift({
        id: ancestor.id,
        title: ancestor.title,
        imageUrl: ancestor.imageUrl,
        forkNote: ancestor.forkNote,
        forkTags: ancestor.forkTags,
        author: ancestor.user,
        createdAt: ancestor.createdAt,
        forkCount: ancestor.forkCount,
      });

      currentAncestorId = ancestor.parentRecipeId;
    }

    // Get direct descendants (children)
    const descendants = await this.prisma.recipe.findMany({
      where: { parentRecipeId: recipeId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        forkVotes: true,
      },
      orderBy: { forkVotes: { _count: 'desc' } },
      take: 20,
    });

    const descendantItems = descendants.map((fork) => ({
      id: fork.id,
      title: fork.title,
      imageUrl: fork.imageUrl,
      forkNote: fork.forkNote,
      forkTags: fork.forkTags,
      author: fork.user,
      createdAt: fork.createdAt,
      voteCount: fork.forkVotes.length,
      forkCount: fork.forkCount,
    }));

    // Calculate total fork count in tree
    const totalForkCount = await this.prisma.recipe.count({
      where: { rootRecipeId: recipe.rootRecipeId || recipeId },
    });

    return {
      ancestors,
      current: {
        id: recipe.id,
        title: recipe.title,
        imageUrl: recipe.imageUrl,
        forkNote: recipe.forkNote,
        forkTags: recipe.forkTags,
        author: recipe.user,
        createdAt: recipe.createdAt,
        forkCount: recipe.forkCount,
      },
      descendants: descendantItems,
      totalForkCount,
    };
  }

  // ==================== GENEALOGY TREE ====================

  /**
   * Get the full genealogy tree for a recipe, starting from the root.
   * Returns a hierarchical tree structure with all descendants recursively.
   */
  async getGenealogyTree(recipeId: string, maxDepth = 5): Promise<{
    root: any;
    currentPath: string[];
    totalNodes: number;
    maxDepthReached: boolean;
  }> {
    // First, find the recipe and its root
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, rootRecipeId: true, parentRecipeId: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Determine the root recipe ID
    const rootId = recipe.rootRecipeId || (recipe.parentRecipeId ? await this.findRootRecipe(recipeId) : recipeId);

    // Build the path from root to current recipe
    const currentPath = await this.buildPathToRecipe(rootId, recipeId);

    // Recursively build the tree from root
    let nodeCount = 0;
    let depthReached = false;

    const buildTreeNode = async (nodeId: string, depth: number): Promise<any> => {
      if (depth > maxDepth) {
        depthReached = true;
        return null;
      }

      const node = await this.prisma.recipe.findUnique({
        where: { id: nodeId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          forkVotes: { select: { id: true } },
        },
      });

      if (!node) return null;

      nodeCount++;

      // Get direct children (forks)
      const children = await this.prisma.recipe.findMany({
        where: { parentRecipeId: nodeId },
        select: { id: true },
        orderBy: [
          { forkCount: 'desc' },
          { createdAt: 'asc' },
        ],
        take: 20, // Limit children per node to prevent huge trees
      });

      // Recursively build children
      const childNodes = await Promise.all(
        children.map((child) => buildTreeNode(child.id, depth + 1))
      );

      return {
        id: node.id,
        title: node.title,
        imageUrl: node.imageUrl,
        forkNote: node.forkNote,
        forkTags: node.forkTags || [],
        author: {
          id: node.user.id,
          firstName: node.user.firstName,
          lastName: node.user.lastName,
          avatarUrl: node.user.avatarUrl,
        },
        createdAt: node.createdAt,
        forkCount: node.forkCount,
        voteCount: node.forkVotes.length,
        depth,
        children: childNodes.filter(Boolean),
        hasMoreChildren: children.length >= 20,
      };
    };

    const root = await buildTreeNode(rootId, 0);

    return {
      root,
      currentPath,
      totalNodes: nodeCount,
      maxDepthReached: depthReached,
    };
  }

  /**
   * Find the root recipe by walking up the parent chain
   */
  private async findRootRecipe(recipeId: string): Promise<string> {
    let currentId = recipeId;
    let iterations = 0;
    const maxIterations = 50; // Safety limit

    while (iterations < maxIterations) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: currentId },
        select: { id: true, parentRecipeId: true },
      });

      if (!recipe || !recipe.parentRecipeId) {
        return currentId;
      }

      currentId = recipe.parentRecipeId;
      iterations++;
    }

    return currentId;
  }

  /**
   * Build the path from root to a specific recipe
   */
  private async buildPathToRecipe(rootId: string, targetId: string): Promise<string[]> {
    if (rootId === targetId) {
      return [rootId];
    }

    // Walk up from target to root and reverse
    const path: string[] = [targetId];
    let currentId = targetId;
    let iterations = 0;
    const maxIterations = 50;

    while (currentId !== rootId && iterations < maxIterations) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: currentId },
        select: { parentRecipeId: true },
      });

      if (!recipe || !recipe.parentRecipeId) {
        break;
      }

      path.unshift(recipe.parentRecipeId);
      currentId = recipe.parentRecipeId;
      iterations++;
    }

    return path;
  }

  async getInspiredRecipes(recipeId: string, limit = 10, offset = 0) {
    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { parentRecipeId: recipeId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          forkVotes: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.recipe.count({ where: { parentRecipeId: recipeId } }),
    ]);

    return {
      items: recipes.map((r) => ({
        id: r.id,
        title: r.title,
        imageUrl: r.imageUrl,
        forkNote: r.forkNote,
        forkTags: r.forkTags,
        author: {
          id: r.user.id,
          firstName: r.user.firstName,
          lastName: r.user.lastName,
          avatarUrl: r.user.avatarUrl,
        },
        voteCount: r.forkVotes.length,
        createdAt: r.createdAt,
      })),
      total,
      hasMore: offset + limit < total,
    };
  }

  async getTrendingForks(limit = 10) {
    // Get forks with most votes in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get recipes that are forks and have votes
    const forks = await this.prisma.recipe.findMany({
      where: {
        parentRecipeId: { not: null },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        parentRecipe: { select: { id: true, title: true } },
        forkVotes: {
          where: { createdAt: { gte: thirtyDaysAgo } },
        },
        _count: {
          select: { forkVotes: true },
        },
      },
      orderBy: { forkVotes: { _count: 'desc' } },
      take: limit * 2, // Get more to filter
    });

    // Filter to only those with recent votes and sort
    const trending = forks
      .filter((f) => f.forkVotes.length > 0)
      .sort((a, b) => b.forkVotes.length - a.forkVotes.length)
      .slice(0, limit);

    return trending.map((fork) => ({
      id: fork.id,
      title: fork.title,
      imageUrl: fork.imageUrl,
      forkNote: fork.forkNote,
      forkTags: fork.forkTags,
      author: fork.user,
      parentRecipe: fork.parentRecipe,
      recentVotes: fork.forkVotes.length,
      totalVotes: fork._count.forkVotes,
      createdAt: fork.createdAt,
    }));
  }

  // ==================== FORK TAGS ====================

  async updateForkTags(
    recipeId: string,
    userId: string,
    tags: string[],
  ): Promise<{ forkTags: string[] }> {
    // Validate tags
    const validTags = tags.filter((tag) =>
      FORK_TAG_OPTIONS.includes(tag as any),
    );

    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found or not owned by user');
    }

    if (!recipe.parentRecipeId) {
      throw new Error('Only forked recipes can have fork tags');
    }

    const updated = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { forkTags: validTags },
      select: { forkTags: true },
    });

    return { forkTags: updated.forkTags };
  }

  getForkTagOptions() {
    return FORK_TAG_OPTIONS.map((tag) => ({
      value: tag,
      label: this.formatTagLabel(tag),
    }));
  }

  private formatTagLabel(tag: string): string {
    return tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // ==================== FORK VOTING ====================

  async voteFork(recipeId: string, userId: string): Promise<ForkVoteResponseDto> {
    // Check if recipe exists and is a fork
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, parentRecipeId: true, userId: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Create or find existing vote
    const vote = await this.prisma.forkVote.upsert({
      where: {
        userId_recipeId: { userId, recipeId },
      },
      create: { userId, recipeId },
      update: {}, // No update needed, just return existing
    });

    // Send notification to fork author (if not self-voting)
    if (recipe.userId !== userId) {
      await this.createForkVoteNotification(recipe.userId, recipeId);
    }

    return vote;
  }

  async unvoteFork(recipeId: string, userId: string): Promise<void> {
    await this.prisma.forkVote.delete({
      where: {
        userId_recipeId: { userId, recipeId },
      },
    });
  }

  async getForkVoteStats(
    recipeId: string,
    userId?: string,
  ): Promise<ForkVoteStatsDto> {
    const [voteCount, userVote] = await Promise.all([
      this.prisma.forkVote.count({ where: { recipeId } }),
      userId
        ? this.prisma.forkVote.findUnique({
            where: { userId_recipeId: { userId, recipeId } },
          })
        : null,
    ]);

    return {
      recipeId,
      voteCount,
      hasUserVoted: !!userVote,
    };
  }

  // ==================== SMART FORK SUGGESTIONS ====================

  async getSmartForkSuggestions(
    recipeId: string,
    userId: string,
  ): Promise<SmartForkSuggestionDto[]> {
    // Get user's flavor profile
    const flavorProfile = await this.prisma.flavorProfile.findUnique({
      where: { userId },
    });

    // Get all forks of this recipe
    const forks = await this.prisma.recipe.findMany({
      where: { parentRecipeId: recipeId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        forkVotes: true,
      },
    });

    if (forks.length === 0) {
      return [];
    }

    // Score each fork based on user's preferences
    const scoredForks = forks.map((fork) => {
      let score = 50; // Base score
      const reasons: string[] = [];

      // Match fork tags with user preferences
      if (flavorProfile) {
        // Spicy preference matching
        if (
          fork.forkTags.includes('spicier') &&
          flavorProfile.heatPreference > 0.6
        ) {
          score += 20;
          reasons.push('More heat - matches your spicy preference');
        }
        if (
          fork.forkTags.includes('milder') &&
          flavorProfile.heatPreference < 0.4
        ) {
          score += 20;
          reasons.push('Milder version - better for your taste');
        }

        // Complexity preference
        if (
          fork.forkTags.includes('simplified') &&
          flavorProfile.preferredComplexity < 0.4
        ) {
          score += 15;
          reasons.push('Simplified - matches your cooking style');
        }
        if (
          fork.forkTags.includes('elevated') &&
          flavorProfile.preferredComplexity > 0.6
        ) {
          score += 15;
          reasons.push('More complex - suits your skill level');
        }
      }

      // Popularity boost
      const voteCount = fork.forkVotes.length;
      if (voteCount >= 5) {
        score += 15;
        reasons.push(`Community favorite (${voteCount} votes)`);
      } else if (voteCount >= 2) {
        score += 5;
        reasons.push(`Well received (${voteCount} votes)`);
      }

      // Health-focused tags
      if (
        fork.forkTags.some((t) =>
          ['healthier', 'low-carb', 'keto'].includes(t),
        )
      ) {
        reasons.push('Healthier alternative');
      }

      // Dietary restriction tags
      if (fork.forkTags.includes('vegan')) {
        reasons.push('Vegan version');
      }
      if (fork.forkTags.includes('gluten-free')) {
        reasons.push('Gluten-free option');
      }

      if (reasons.length === 0) {
        reasons.push('Alternative version');
      }

      return {
        fork,
        score: Math.min(100, score),
        reasons,
        voteCount,
      };
    });

    // Sort by score and return top suggestions
    return scoredForks
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ fork, score, reasons, voteCount }) => ({
        id: fork.id,
        title: fork.title,
        description: fork.description ?? undefined,
        imageUrl: fork.imageUrl ?? undefined,
        forkNote: fork.forkNote ?? undefined,
        forkTags: fork.forkTags,
        matchScore: score,
        matchReasons: reasons,
        author: fork.user,
        voteCount,
        createdAt: fork.createdAt,
      }));
  }

  // ==================== FORK CHANGELOG ====================

  async generateForkChangelog(
    forkId: string,
    parentId: string,
  ): Promise<ForkChangelogDto> {
    const [fork, parent] = await Promise.all([
      this.prisma.recipe.findUnique({
        where: { id: forkId },
        include: { nutrition: true },
      }),
      this.prisma.recipe.findUnique({
        where: { id: parentId },
        include: { nutrition: true },
      }),
    ]);

    if (!fork || !parent) {
      throw new NotFoundException('Recipe not found');
    }

    const forkComponents = fork.components as any[];
    const parentComponents = parent.components as any[];

    // Extract ingredients from components
    const forkIngredients = this.extractIngredients(forkComponents);
    const parentIngredients = this.extractIngredients(parentComponents);

    // Compare ingredients
    const ingredientsAdded = forkIngredients.filter(
      (fi) => !parentIngredients.some((pi) => this.ingredientsMatch(fi, pi)),
    );
    const ingredientsRemoved = parentIngredients.filter(
      (pi) => !forkIngredients.some((fi) => this.ingredientsMatch(pi, fi)),
    );
    const ingredientsModified = this.findModifiedIngredients(
      parentIngredients,
      forkIngredients,
    );

    // Compare steps
    const forkSteps = this.extractSteps(forkComponents);
    const parentSteps = this.extractSteps(parentComponents);

    const stepsAdded = Math.max(0, forkSteps.length - parentSteps.length);
    const stepsRemoved = Math.max(0, parentSteps.length - forkSteps.length);
    const stepsModified = this.countModifiedSteps(parentSteps, forkSteps);

    // Compare metadata
    const metadataChanges = this.compareMetadata(parent, fork);

    // Generate summary
    const summary = this.generateChangelogSummary({
      ingredientsAdded,
      ingredientsRemoved,
      ingredientsModified,
      stepsAdded,
      stepsRemoved,
      stepsModified,
      metadataChanges,
    });

    return {
      ingredientsAdded: ingredientsAdded.map((i) => i.name),
      ingredientsRemoved: ingredientsRemoved.map((i) => i.name),
      ingredientsModified: ingredientsModified.map((m) => ({
        original: `${m.original.quantity || ''} ${m.original.unit || ''} ${m.original.name}`.trim(),
        modified: `${m.modified.quantity || ''} ${m.modified.unit || ''} ${m.modified.name}`.trim(),
      })),
      stepsAdded,
      stepsRemoved,
      stepsModified,
      metadataChanges,
      summary,
    };
  }

  private extractIngredients(components: any[]): any[] {
    const ingredients: any[] = [];
    for (const comp of components) {
      if (comp.ingredients) {
        ingredients.push(...comp.ingredients);
      }
    }
    return ingredients;
  }

  private extractSteps(components: any[]): any[] {
    const steps: any[] = [];
    for (const comp of components) {
      if (comp.steps) {
        steps.push(...comp.steps);
      }
    }
    return steps;
  }

  private ingredientsMatch(a: any, b: any): boolean {
    return a.name?.toLowerCase().trim() === b.name?.toLowerCase().trim();
  }

  private findModifiedIngredients(original: any[], modified: any[]): any[] {
    const changes: any[] = [];
    for (const origIng of original) {
      const modIng = modified.find((m) => this.ingredientsMatch(origIng, m));
      if (modIng) {
        if (
          origIng.quantity !== modIng.quantity ||
          origIng.unit !== modIng.unit
        ) {
          changes.push({ original: origIng, modified: modIng });
        }
      }
    }
    return changes;
  }

  private countModifiedSteps(original: any[], modified: any[]): number {
    let count = 0;
    const minLen = Math.min(original.length, modified.length);
    for (let i = 0; i < minLen; i++) {
      if (original[i]?.instruction !== modified[i]?.instruction) {
        count++;
      }
    }
    return count;
  }

  private compareMetadata(parent: any, fork: any): any[] {
    const changes: any[] = [];
    const fields = [
      { key: 'prepTimeMinutes', label: 'Prep Time' },
      { key: 'cookTimeMinutes', label: 'Cook Time' },
      { key: 'servings', label: 'Servings' },
      { key: 'difficulty', label: 'Difficulty' },
    ];

    for (const field of fields) {
      if (parent[field.key] !== fork[field.key]) {
        changes.push({
          field: field.label,
          original: parent[field.key],
          modified: fork[field.key],
        });
      }
    }

    return changes;
  }

  private generateChangelogSummary(changelog: any): string {
    const parts: string[] = [];

    if (changelog.ingredientsAdded.length > 0) {
      parts.push(
        `Added ${changelog.ingredientsAdded.length} ingredient${changelog.ingredientsAdded.length > 1 ? 's' : ''}`,
      );
    }
    if (changelog.ingredientsRemoved.length > 0) {
      parts.push(
        `Removed ${changelog.ingredientsRemoved.length} ingredient${changelog.ingredientsRemoved.length > 1 ? 's' : ''}`,
      );
    }
    if (changelog.ingredientsModified.length > 0) {
      parts.push(
        `Modified ${changelog.ingredientsModified.length} ingredient${changelog.ingredientsModified.length > 1 ? 's' : ''}`,
      );
    }
    if (changelog.stepsAdded > 0) {
      parts.push(
        `Added ${changelog.stepsAdded} step${changelog.stepsAdded > 1 ? 's' : ''}`,
      );
    }
    if (changelog.stepsRemoved > 0) {
      parts.push(
        `Removed ${changelog.stepsRemoved} step${changelog.stepsRemoved > 1 ? 's' : ''}`,
      );
    }

    return parts.length > 0 ? parts.join(', ') : 'Minor adjustments';
  }

  // ==================== FORK GALLERY ====================

  async getForkGallery(
    recipeId: string,
    options: { limit?: number; offset?: number; sortBy?: string } = {},
  ): Promise<ForkGalleryResponseDto> {
    const { limit = 12, offset = 0, sortBy = 'votes' } = options;

    const orderBy =
      sortBy === 'votes'
        ? { forkVotes: { _count: 'desc' as const } }
        : sortBy === 'newest'
          ? { createdAt: 'desc' as const }
          : { createdAt: 'desc' as const };

    const [forks, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { parentRecipeId: recipeId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          forkVotes: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.recipe.count({ where: { parentRecipeId: recipeId } }),
    ]);

    const forkItems: ForkGalleryItemDto[] = forks.map((fork) => ({
      id: fork.id,
      title: fork.title,
      imageUrl: fork.imageUrl ?? undefined,
      forkNote: fork.forkNote ?? undefined,
      forkTags: fork.forkTags,
      voteCount: fork.forkVotes.length,
      author: {
        id: fork.user.id,
        firstName: fork.user.firstName,
        lastName: fork.user.lastName,
        avatarUrl: fork.user.avatarUrl ?? undefined,
      },
      createdAt: fork.createdAt,
    }));

    return {
      forks: forkItems,
      total,
      hasMore: offset + limit < total,
    };
  }

  // ==================== FORK ANALYTICS ====================

  async getForkAnalytics(userId: string): Promise<ForkAnalyticsDto> {
    // Get user's recipes
    const userRecipes = await this.prisma.recipe.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        forkCount: true,
        parentRecipeId: true,
        forkTags: true,
        createdAt: true,
      },
    });

    const recipeIds = userRecipes.map((r) => r.id);

    // Count forks created (recipes user forked from others)
    const forksCreated = userRecipes.filter((r) => r.parentRecipeId).length;

    // Count forks received (total fork count on user's original recipes)
    const forksReceived = userRecipes
      .filter((r) => !r.parentRecipeId)
      .reduce((sum, r) => sum + r.forkCount, 0);

    // Count votes received on user's forks
    const votesReceived = await this.prisma.forkVote.count({
      where: { recipeId: { in: recipeIds } },
    });

    // Calculate influence score
    const forkInfluenceScore = Math.round(
      forksReceived * 10 + votesReceived * 5 + forksCreated * 2,
    );

    // Top forked recipes
    const topForkedRecipes = userRecipes
      .filter((r) => !r.parentRecipeId && r.forkCount > 0)
      .sort((a, b) => b.forkCount - a.forkCount)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        title: r.title,
        forkCount: r.forkCount,
        imageUrl: r.imageUrl ?? undefined,
      }));

    // Fork activity by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentForks = userRecipes.filter(
      (r) => r.parentRecipeId && r.createdAt >= sixMonthsAgo,
    );

    const monthlyActivity = new Map<string, { created: number; received: number }>();

    for (const fork of recentForks) {
      const month = fork.createdAt.toISOString().slice(0, 7);
      const existing = monthlyActivity.get(month) || { created: 0, received: 0 };
      existing.created++;
      monthlyActivity.set(month, existing);
    }

    const forkActivityByMonth = Array.from(monthlyActivity.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        forksCreated: data.created,
        forksReceived: data.received,
      }));

    // Top fork tags used
    const tagCounts = new Map<string, number>();
    for (const recipe of userRecipes) {
      for (const tag of recipe.forkTags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    const topForkTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalForksCreated: forksCreated,
      totalForksReceived: forksReceived,
      totalVotesReceived: votesReceived,
      forkInfluenceScore,
      topForkedRecipes,
      forkActivityByMonth,
      topForkTags,
    };
  }

  // ==================== FORK COMPARISON MATRIX ====================

  async getForkComparisonMatrix(recipeId: string): Promise<ForkComparisonMatrixDto> {
    // Get original recipe and all its forks
    const [original, forks] = await Promise.all([
      this.prisma.recipe.findUnique({
        where: { id: recipeId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          nutrition: true,
          forkVotes: true,
        },
      }),
      this.prisma.recipe.findMany({
        where: { parentRecipeId: recipeId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          nutrition: true,
          forkVotes: true,
        },
        orderBy: { forkVotes: { _count: 'desc' } },
        take: 10,
      }),
    ]);

    if (!original) {
      throw new NotFoundException('Recipe not found');
    }

    const mapToComparisonItem = (recipe: any): ForkComparisonItemDto => {
      const components = recipe.components as any[];
      const ingredientCount = components.reduce(
        (sum: number, c: any) => sum + (c.ingredients?.length || 0),
        0,
      );
      const stepCount = components.reduce(
        (sum: number, c: any) => sum + (c.steps?.length || 0),
        0,
      );

      return {
        id: recipe.id,
        title: recipe.title,
        forkNote: recipe.forkNote ?? undefined,
        author: recipe.user,
        voteCount: recipe.forkVotes?.length || 0,
        totalTimeMinutes: recipe.totalTimeMinutes ?? undefined,
        servings: recipe.servings ?? undefined,
        difficulty: recipe.difficulty ?? undefined,
        ingredientCount,
        stepCount,
        calories: recipe.nutrition?.caloriesPerServing ?? undefined,
      };
    };

    const originalItem = mapToComparisonItem(original);
    const forkItems = forks.map(mapToComparisonItem);

    // Build comparison fields
    const allItems = [originalItem, ...forkItems];
    const fields = [
      {
        key: 'totalTimeMinutes',
        label: 'Total Time',
        values: allItems.map((i) =>
          i.totalTimeMinutes ? `${i.totalTimeMinutes} min` : null,
        ),
      },
      {
        key: 'servings',
        label: 'Servings',
        values: allItems.map((i) => i.servings ?? null),
      },
      {
        key: 'difficulty',
        label: 'Difficulty',
        values: allItems.map((i) => i.difficulty ?? null),
      },
      {
        key: 'ingredientCount',
        label: 'Ingredients',
        values: allItems.map((i) => i.ingredientCount),
      },
      {
        key: 'stepCount',
        label: 'Steps',
        values: allItems.map((i) => i.stepCount),
      },
      {
        key: 'calories',
        label: 'Calories',
        values: allItems.map((i) => (i.calories ? `${i.calories} cal` : null)),
      },
      {
        key: 'voteCount',
        label: 'Votes',
        values: allItems.map((i) => i.voteCount),
      },
    ];

    return {
      original: originalItem,
      forks: forkItems,
      fields,
    };
  }

  // ==================== NOTIFICATIONS ====================

  private async createForkVoteNotification(
    recipientUserId: string,
    recipeId: string,
  ): Promise<void> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { title: true },
    });

    if (!recipe) return;

    await this.prisma.notification.create({
      data: {
        userId: recipientUserId,
        type: 'FORK_VOTED',
        title: 'New vote on your fork!',
        message: `Someone voted for your fork "${recipe.title}"`,
        data: { recipeId, recipeTitle: recipe.title },
      },
    });
  }

  async createForkNotification(
    originalRecipeUserId: string,
    originalRecipeId: string,
    forkId: string,
    forkerUserId: string,
  ): Promise<void> {
    if (originalRecipeUserId === forkerUserId) return;

    const [originalRecipe, forker] = await Promise.all([
      this.prisma.recipe.findUnique({
        where: { id: originalRecipeId },
        select: { title: true },
      }),
      this.prisma.user.findUnique({
        where: { id: forkerUserId },
        select: { firstName: true, lastName: true },
      }),
    ]);

    if (!originalRecipe || !forker) return;

    await this.prisma.notification.create({
      data: {
        userId: originalRecipeUserId,
        type: 'RECIPE_FORKED',
        title: 'Your recipe was forked!',
        message: `${forker.firstName} ${forker.lastName} forked your recipe "${originalRecipe.title}"`,
        data: {
          recipeId: originalRecipeId,
          recipeTitle: originalRecipe.title,
          forkId,
          forkerId: forkerUserId,
          forkerName: `${forker.firstName} ${forker.lastName}`,
        },
      },
    });
  }

  // ==================== COOK TRIALS + VALIDATION BADGES ====================

  private readonly RATING_EMOJIS = ['', '😕', '😐', '🙂', '😍'];

  async getForkValidationStats(recipeId: string): Promise<ForkValidationStatsDto> {
    // Get recipe info
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        parentRecipeId: true,
        totalTimeMinutes: true,
        difficulty: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Get all cook trials (CookingReviews) for this recipe
    const cookTrials = await this.prisma.cookingReview.findMany({
      where: { recipeId },
      // Note: CookingReview doesn't have user relation in schema
      // We'll need to fetch user separately
      orderBy: { cookedAt: 'desc' },
    });

    // Get user info for trials
    const userIds = [...new Set(cookTrials.map((t) => t.userId))];
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

    // Calculate stats
    const totalCooks = cookTrials.length;
    const successfulCooks = cookTrials.filter((t) => t.rating >= 3).length;
    const successRate = totalCooks > 0 ? Math.round((successfulCooks / totalCooks) * 100) : 0;

    // Rating distribution
    const ratingDistribution = {
      rating1: cookTrials.filter((t) => t.rating === 1).length,
      rating2: cookTrials.filter((t) => t.rating === 2).length,
      rating3: cookTrials.filter((t) => t.rating === 3).length,
      rating4: cookTrials.filter((t) => t.rating === 4).length,
    };

    const averageRating = totalCooks > 0
      ? cookTrials.reduce((sum, t) => sum + t.rating, 0) / totalCooks
      : 0;

    // Would make again stats
    const wouldMakeAgainTrials = cookTrials.filter((t) => t.wouldMakeAgain !== null);
    const wouldMakeAgainCount = wouldMakeAgainTrials.filter((t) => t.wouldMakeAgain).length;
    const wouldMakeAgainRate = wouldMakeAgainTrials.length > 0
      ? Math.round((wouldMakeAgainCount / wouldMakeAgainTrials.length) * 100)
      : 0;

    // Time accuracy (check for "time_consuming" or similar tags)
    const timeAccuracyReports = cookTrials.filter(
      (t) => t.tags.includes('quick_easy') || t.tags.includes('time_consuming'),
    ).length;
    const timeAccurateCount = cookTrials.filter((t) => t.tags.includes('quick_easy')).length;
    const timeAccuracyRate = timeAccuracyReports > 0
      ? Math.round((timeAccurateCount / timeAccuracyReports) * 100)
      : 0;

    // Photo verification
    const photosCount = cookTrials.filter((t) => t.photoUrl).length;
    const hasPhotoVerification = photosCount >= 3;

    // Compute badges
    const badges = this.computeValidationBadges({
      totalCooks,
      successfulCooks,
      successRate,
      averageRating,
      wouldMakeAgainRate,
      timeAccuracyRate,
      photosCount,
      timeAccuracyReports,
    });

    // Recent trials
    const recentTrials: CookTrialDto[] = cookTrials.slice(0, 5).map((trial) => {
      const user = userMap.get(trial.userId);
      return {
        id: trial.id,
        recipeId: trial.recipeId,
        userId: trial.userId,
        rating: trial.rating,
        ratingEmoji: this.RATING_EMOJIS[trial.rating] || '',
        wouldMakeAgain: trial.wouldMakeAgain,
        tags: trial.tags,
        notes: trial.notes,
        photoUrl: trial.photoUrl,
        cookedAt: trial.cookedAt,
        user: {
          firstName: user?.firstName || 'Unknown',
          lastName: user?.lastName || '',
          avatarUrl: user?.avatarUrl || null,
        },
      };
    });

    // Compare with parent if this is a fork
    let comparedToParent: ForkValidationStatsDto['comparedToParent'];
    if (recipe.parentRecipeId) {
      const parentTrials = await this.prisma.cookingReview.findMany({
        where: { recipeId: recipe.parentRecipeId },
      });

      if (parentTrials.length >= 3 && totalCooks >= 3) {
        const parentAvgRating = parentTrials.reduce((s, t) => s + t.rating, 0) / parentTrials.length;
        const parentSuccessRate = (parentTrials.filter((t) => t.rating >= 3).length / parentTrials.length) * 100;

        const ratingDiff = averageRating - parentAvgRating;
        const successRateDiff = successRate - parentSuccessRate;
        const cookCountDiff = totalCooks - parentTrials.length;

        let verdict: 'better' | 'similar' | 'worse' | 'insufficient_data' = 'similar';
        if (ratingDiff > 0.3 || successRateDiff > 10) {
          verdict = 'better';
        } else if (ratingDiff < -0.3 || successRateDiff < -10) {
          verdict = 'worse';
        }

        comparedToParent = { ratingDiff, successRateDiff, cookCountDiff, verdict };
      } else {
        comparedToParent = {
          ratingDiff: 0,
          successRateDiff: 0,
          cookCountDiff: totalCooks - parentTrials.length,
          verdict: 'insufficient_data',
        };
      }
    }

    return {
      recipeId,
      isFork: !!recipe.parentRecipeId,
      parentRecipeId: recipe.parentRecipeId,
      totalCooks,
      successfulCooks,
      successRate,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      wouldMakeAgainCount,
      wouldMakeAgainRate,
      timeAccuracyReports,
      timeAccurateCount,
      timeAccuracyRate,
      photosCount,
      hasPhotoVerification,
      badges,
      recentTrials,
      comparedToParent,
    };
  }

  private computeValidationBadges(stats: {
    totalCooks: number;
    successfulCooks: number;
    successRate: number;
    averageRating: number;
    wouldMakeAgainRate: number;
    timeAccuracyRate: number;
    photosCount: number;
    timeAccuracyReports: number;
  }): ValidationBadgeDto[] {
    const badges: ValidationBadgeDto[] = [];
    const now = new Date();

    // Verified: 5+ successful cooks
    if (stats.successfulCooks >= 5) {
      badges.push({ ...VALIDATION_BADGES.verified, earnedAt: now });
    } else {
      badges.push({
        ...VALIDATION_BADGES.verified,
        progress: Math.round((stats.successfulCooks / 5) * 100),
        threshold: 5,
      });
    }

    // Highly Rated: Average rating >= 3.5
    if (stats.averageRating >= 3.5 && stats.totalCooks >= 3) {
      badges.push({ ...VALIDATION_BADGES.highly_rated, earnedAt: now });
    }

    // Time Accurate: 70%+ time accuracy
    if (stats.timeAccuracyRate >= 70 && stats.timeAccuracyReports >= 3) {
      badges.push({ ...VALIDATION_BADGES.time_accurate, earnedAt: now });
    }

    // Crowd Favorite: 80%+ would make again
    if (stats.wouldMakeAgainRate >= 80 && stats.totalCooks >= 5) {
      badges.push({ ...VALIDATION_BADGES.crowd_favorite, earnedAt: now });
    }

    // Photo Verified: 3+ photos
    if (stats.photosCount >= 3) {
      badges.push({ ...VALIDATION_BADGES.photo_verified, earnedAt: now });
    }

    // Quick Win: Fast + high success
    if (stats.successRate >= 85 && stats.totalCooks >= 5 && stats.averageRating >= 3.5) {
      badges.push({ ...VALIDATION_BADGES.quick_win, earnedAt: now });
    }

    return badges;
  }

  async getTopValidatedForks(recipeId: string, limit = 5): Promise<
    Array<{
      id: string;
      title: string;
      forkNote: string | null;
      successRate: number;
      totalCooks: number;
      averageRating: number;
      badges: ValidationBadgeDto[];
    }>
  > {
    // Get all forks
    const forks = await this.prisma.recipe.findMany({
      where: { parentRecipeId: recipeId },
      select: { id: true, title: true, forkNote: true },
    });

    if (forks.length === 0) return [];

    // Get validation stats for each fork
    const forksWithStats = await Promise.all(
      forks.map(async (fork) => {
        const stats = await this.getForkValidationStats(fork.id);
        return {
          id: fork.id,
          title: fork.title,
          forkNote: fork.forkNote,
          successRate: stats.successRate,
          totalCooks: stats.totalCooks,
          averageRating: stats.averageRating,
          badges: stats.badges.filter((b) => b.earnedAt), // Only earned badges
        };
      }),
    );

    // Sort by success rate, then by total cooks
    return forksWithStats
      .filter((f) => f.totalCooks >= 1) // Only forks with at least 1 cook
      .sort((a, b) => {
        if (b.successRate !== a.successRate) return b.successRate - a.successRate;
        return b.totalCooks - a.totalCooks;
      })
      .slice(0, limit);
  }

  // ==================== AUTO-FORK TEMPLATES ====================

  getAutoForkTemplates(): AutoForkTemplate[] {
    return AUTO_FORK_TEMPLATES;
  }

  getAutoForkTemplatesByCategory(): Record<string, AutoForkTemplate[]> {
    const grouped: Record<string, AutoForkTemplate[]> = {};
    for (const template of AUTO_FORK_TEMPLATES) {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    }
    return grouped;
  }

  async previewAutoFork(
    recipeId: string,
    templateId: string,
  ): Promise<AutoForkPreviewDto> {
    const template = AUTO_FORK_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { nutrition: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const components = recipe.components as any[];
    const ingredients = this.extractIngredients(components);
    const steps = this.extractSteps(components);

    // Analyze what changes would be made
    const ingredientChanges: AutoForkPreviewDto['suggestedChanges']['ingredientChanges'] = [];
    const stepChanges: AutoForkPreviewDto['suggestedChanges']['stepChanges'] = [];
    const metadataChanges: AutoForkPreviewDto['suggestedChanges']['metadataChanges'] = [];
    const warnings: string[] = [];

    for (const mod of template.modifications) {
      switch (mod.type) {
        case 'substitute_ingredient': {
          const matchingIngredients = this.findMatchingIngredients(
            ingredients,
            mod.target || '',
          );
          if (matchingIngredients.length > 0) {
            for (const ing of matchingIngredients) {
              ingredientChanges.push({
                action: 'substitute',
                original: `${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`.trim(),
                replacement: mod.replacement,
                reason: mod.reason,
              });
            }
          } else {
            // No matching ingredients - might be a warning or the template doesn't apply
            this.logger.debug(`No ingredients matching "${mod.target}" found`);
          }
          break;
        }
        case 'remove_ingredient': {
          const toRemove = this.findMatchingIngredients(ingredients, mod.target || '');
          for (const ing of toRemove) {
            ingredientChanges.push({
              action: 'remove',
              original: `${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`.trim(),
              reason: mod.reason,
            });
          }
          break;
        }
        case 'reduce_quantity': {
          const toReduce = this.findMatchingIngredients(ingredients, mod.target || '');
          for (const ing of toReduce) {
            ingredientChanges.push({
              action: 'reduce',
              original: `${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`.trim(),
              replacement: `Reduced ${ing.name}`,
              reason: mod.reason,
            });
          }
          break;
        }
        case 'change_cooking_method': {
          stepChanges.push({
            action: 'modify',
            description: `Change ${mod.target} to ${mod.replacement}: ${mod.reason}`,
          });
          break;
        }
        case 'simplify_steps': {
          stepChanges.push({
            action: 'modify',
            description: mod.reason,
          });
          break;
        }
        case 'reduce_time': {
          if (recipe.totalTimeMinutes) {
            metadataChanges.push({
              field: 'Cook Time',
              oldValue: recipe.totalTimeMinutes,
              newValue: Math.round(recipe.totalTimeMinutes * 0.6),
            });
          }
          break;
        }
        case 'add_instruction': {
          stepChanges.push({
            action: 'add',
            description: mod.reason,
          });
          break;
        }
      }
    }

    // Determine difficulty
    let estimatedDifficulty: 'easy' | 'medium' | 'hard' = 'easy';
    if (ingredientChanges.length > 3 || stepChanges.length > 3) {
      estimatedDifficulty = 'medium';
    }
    if (ingredientChanges.some((c) => c.action === 'substitute')) {
      // Substitutions can be tricky
      estimatedDifficulty = 'medium';
    }

    // Add warnings for potential issues
    if (template.id === 'gluten-free' && !ingredients.some((i) =>
      i.name?.toLowerCase().includes('flour') ||
      i.name?.toLowerCase().includes('pasta') ||
      i.name?.toLowerCase().includes('bread')
    )) {
      warnings.push('This recipe may already be gluten-free');
    }

    if (template.id === 'vegan' && !ingredients.some((i) =>
      i.name?.toLowerCase().includes('meat') ||
      i.name?.toLowerCase().includes('chicken') ||
      i.name?.toLowerCase().includes('beef') ||
      i.name?.toLowerCase().includes('egg') ||
      i.name?.toLowerCase().includes('milk') ||
      i.name?.toLowerCase().includes('butter') ||
      i.name?.toLowerCase().includes('cheese')
    )) {
      warnings.push('This recipe may already be vegan');
    }

    return {
      template,
      suggestedChanges: {
        ingredientChanges,
        stepChanges,
        metadataChanges,
      },
      estimatedDifficulty,
      warnings,
    };
  }

  async applyAutoFork(
    recipeId: string,
    templateId: string,
    userId: string,
  ): Promise<AutoForkResultDto> {
    // Validate inputs
    if (!userId) {
      this.logger.error('applyAutoFork: userId is missing');
      return { success: false, error: 'User not authenticated', changes: { ingredientsModified: 0, stepsModified: 0 } };
    }
    if (!recipeId) {
      this.logger.error('applyAutoFork: recipeId is missing');
      return { success: false, error: 'Recipe ID is required', changes: { ingredientsModified: 0, stepsModified: 0 } };
    }

    const template = AUTO_FORK_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return { success: false, error: 'Template not found', changes: { ingredientsModified: 0, stepsModified: 0 } };
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { nutrition: true },
    });

    if (!recipe) {
      return { success: false, error: 'Recipe not found', changes: { ingredientsModified: 0, stepsModified: 0 } };
    }

    try {
      // Deep clone components
      const components = JSON.parse(JSON.stringify(recipe.components)) as any[];
      let ingredientsModified = 0;
      let stepsModified = 0;

      // Apply modifications
      for (const mod of template.modifications) {
        switch (mod.type) {
          case 'substitute_ingredient': {
            for (const comp of components) {
              if (comp.ingredients) {
                for (const ing of comp.ingredients) {
                  if (this.ingredientMatchesTarget(ing, mod.target || '')) {
                    // Add note about substitution
                    ing.notes = `${ing.notes ? ing.notes + ' - ' : ''}Substituted: ${mod.replacement}`;
                    ing.name = `${mod.replacement} (originally ${ing.name})`;
                    ingredientsModified++;
                  }
                }
              }
            }
            break;
          }
          case 'remove_ingredient': {
            for (const comp of components) {
              if (comp.ingredients) {
                const originalLen = comp.ingredients.length;
                comp.ingredients = comp.ingredients.filter(
                  (ing: any) => !this.ingredientMatchesTarget(ing, mod.target || ''),
                );
                ingredientsModified += originalLen - comp.ingredients.length;
              }
            }
            break;
          }
          case 'reduce_quantity': {
            for (const comp of components) {
              if (comp.ingredients) {
                for (const ing of comp.ingredients) {
                  if (this.ingredientMatchesTarget(ing, mod.target || '')) {
                    if (ing.quantity && typeof ing.quantity === 'number') {
                      ing.quantity = ing.quantity * 0.5;
                      ing.notes = `${ing.notes ? ing.notes + ' - ' : ''}Reduced by half`;
                    }
                    ingredientsModified++;
                  }
                }
              }
            }
            break;
          }
          case 'add_instruction': {
            // Add a note to the first step
            if (components[0]?.steps?.length > 0) {
              const firstStep = components[0].steps[0];
              firstStep.instruction = `${mod.reason}\n\n${firstStep.instruction}`;
              stepsModified++;
            }
            break;
          }
          case 'simplify_steps':
          case 'change_cooking_method': {
            // Add note to steps about the change
            for (const comp of components) {
              if (comp.steps?.length > 0) {
                comp.steps[0].instruction = `[${template.name}] ${comp.steps[0].instruction}`;
                stepsModified++;
              }
            }
            break;
          }
        }
      }

      // Create the fork
      const newRecipe = await this.prisma.recipe.create({
        data: {
          user: { connect: { id: userId } },
          title: `${recipe.title} (${template.name})`,
          description: recipe.description,
          imageUrl: recipe.imageUrl,
          components,
          servings: recipe.servings,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          totalTimeMinutes: recipe.totalTimeMinutes,
          difficulty: recipe.difficulty,
          cuisine: recipe.cuisine,
          tags: recipe.tags,
          visibility: 'PRIVATE', // Start as private
          parentRecipe: { connect: { id: recipeId } },
          rootRecipe: recipe.rootRecipeId ? { connect: { id: recipe.rootRecipeId } } : { connect: { id: recipeId } },
          forkNote: template.forkNote,
          forkTags: template.forkTags,
        },
      });

      // Increment fork count on original
      await this.prisma.recipe.update({
        where: { id: recipeId },
        data: { forkCount: { increment: 1 } },
      });

      // Send notification to original author
      await this.createForkNotification(recipe.userId, recipeId, newRecipe.id, userId);

      return {
        success: true,
        newRecipeId: newRecipe.id,
        changes: {
          ingredientsModified,
          stepsModified,
        },
      };
    } catch (error) {
      this.logger.error('Error applying auto-fork:', error);
      return { success: false, error: 'Failed to create fork', changes: { ingredientsModified: 0, stepsModified: 0 } };
    }
  }

  private findMatchingIngredients(ingredients: any[], target: string): any[] {
    const targetLower = target.toLowerCase();
    const targetWords = targetLower.split(/[_\s]+/);

    return ingredients.filter((ing) => {
      const name = (ing.name || '').toLowerCase();
      // Match if any target word is in the ingredient name
      return targetWords.some((word) => name.includes(word));
    });
  }

  private ingredientMatchesTarget(ing: any, target: string): boolean {
    const name = (ing.name || '').toLowerCase();
    const targetLower = target.toLowerCase();
    const targetWords = targetLower.split(/[_\s]+/);
    return targetWords.some((word) => name.includes(word));
  }

  // ==================== FORK OUTCOME PREDICTION ====================

  async getForkOutcomePrediction(recipeId: string): Promise<ForkOutcomePredictionDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        parentRecipeId: true,
        forkChangelog: true,
        components: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Get cook trials
    const cookTrials = await this.prisma.cookingReview.findMany({
      where: { recipeId },
    });

    const totalCooks = cookTrials.length;
    const successfulCooks = cookTrials.filter((t) => t.rating >= 3).length;
    const successRate = totalCooks > 0 ? (successfulCooks / totalCooks) * 100 : 0;
    const averageRating = totalCooks > 0
      ? cookTrials.reduce((sum, t) => sum + t.rating, 0) / totalCooks
      : 0;

    // Get changelog data
    let ingredientChanges = 0;
    let stepChanges = 0;
    let comparedToParent: { ratingDiff: number; successRateDiff: number } | undefined;

    if (recipe.parentRecipeId) {
      try {
        const changelog = await this.generateForkChangelog(recipeId, recipe.parentRecipeId);
        ingredientChanges =
          changelog.ingredientsAdded.length +
          changelog.ingredientsRemoved.length +
          changelog.ingredientsModified.length;
        stepChanges = changelog.stepsAdded + changelog.stepsRemoved + changelog.stepsModified;
      } catch {
        // Use stored changelog if available
        const storedChangelog = recipe.forkChangelog as any;
        if (storedChangelog) {
          ingredientChanges =
            (storedChangelog.ingredientsAdded?.length || 0) +
            (storedChangelog.ingredientsRemoved?.length || 0) +
            (storedChangelog.ingredientsModified?.length || 0);
          stepChanges =
            (storedChangelog.stepsAdded || 0) +
            (storedChangelog.stepsRemoved || 0) +
            (storedChangelog.stepsModified || 0);
        }
      }

      // Compare with parent
      const parentTrials = await this.prisma.cookingReview.findMany({
        where: { recipeId: recipe.parentRecipeId },
      });

      if (parentTrials.length >= 3 && totalCooks >= 3) {
        const parentAvgRating =
          parentTrials.reduce((s, t) => s + t.rating, 0) / parentTrials.length;
        const parentSuccessRate =
          (parentTrials.filter((t) => t.rating >= 3).length / parentTrials.length) * 100;

        comparedToParent = {
          ratingDiff: averageRating - parentAvgRating,
          successRateDiff: successRate - parentSuccessRate,
        };
      }
    }

    // Analyze risks
    const riskFactors: RiskFactor[] = [];
    const positiveFactors: RiskFactor[] = [];

    // No cook trials
    if (totalCooks === 0) {
      riskFactors.push({ id: 'no_cook_trials', ...RISK_FACTORS.no_cook_trials });
    } else if (totalCooks < 3) {
      riskFactors.push({ id: 'few_cook_trials', ...RISK_FACTORS.few_cook_trials });
    } else if (totalCooks >= 5) {
      positiveFactors.push({ id: 'well_tested', ...POSITIVE_FACTORS.well_tested });
    }

    // Success rate
    if (totalCooks >= 3) {
      if (successRate < 50) {
        riskFactors.push({ id: 'low_success_rate', ...RISK_FACTORS.low_success_rate });
      } else if (successRate < 70) {
        riskFactors.push({ id: 'moderate_success_rate', ...RISK_FACTORS.moderate_success_rate });
      } else if (successRate >= 85) {
        positiveFactors.push({ id: 'high_success_rate', ...POSITIVE_FACTORS.high_success_rate });
      }
    }

    // Rating
    if (totalCooks >= 3) {
      if (averageRating < 2.5) {
        riskFactors.push({ id: 'low_rating', ...RISK_FACTORS.low_rating });
      } else if (averageRating >= 3.5) {
        positiveFactors.push({ id: 'highly_rated', ...POSITIVE_FACTORS.highly_rated });
      }
    }

    // Modification complexity
    if (ingredientChanges >= 5) {
      riskFactors.push({ id: 'major_substitutions', ...RISK_FACTORS.major_substitutions });
    } else if (ingredientChanges <= 2) {
      positiveFactors.push({ id: 'minimal_changes', ...POSITIVE_FACTORS.minimal_changes });
    }

    if (stepChanges >= 5) {
      riskFactors.push({ id: 'complex_modifications', ...RISK_FACTORS.complex_modifications });
    }

    // Comparison with parent
    if (comparedToParent) {
      if (comparedToParent.ratingDiff < -0.3 || comparedToParent.successRateDiff < -10) {
        riskFactors.push({ id: 'worse_than_parent', ...RISK_FACTORS.worse_than_parent });
      } else if (comparedToParent.ratingDiff > 0.3 || comparedToParent.successRateDiff > 10) {
        positiveFactors.push({ id: 'better_than_parent', ...POSITIVE_FACTORS.better_than_parent });
      }
    }

    // Would make again
    const wouldMakeAgainTrials = cookTrials.filter((t) => t.wouldMakeAgain !== null);
    const wouldMakeAgainRate =
      wouldMakeAgainTrials.length > 0
        ? (wouldMakeAgainTrials.filter((t) => t.wouldMakeAgain).length /
            wouldMakeAgainTrials.length) *
          100
        : 0;
    if (wouldMakeAgainTrials.length >= 3 && wouldMakeAgainRate >= 80) {
      positiveFactors.push({ id: 'crowd_favorite', ...POSITIVE_FACTORS.crowd_favorite });
    }

    // Photo verification
    const photosCount = cookTrials.filter((t) => t.photoUrl).length;
    if (photosCount >= 3) {
      positiveFactors.push({ id: 'photo_verified', ...POSITIVE_FACTORS.photo_verified });
    }

    // Calculate overall risk level and confidence
    const totalRiskScore = riskFactors.reduce((sum, f) => sum + f.severity, 0);
    const totalPositiveScore = positiveFactors.reduce((sum, f) => sum + Math.abs(f.severity), 0);
    const netScore = totalRiskScore - totalPositiveScore;

    let overallRiskLevel: RiskLevel = 'low';
    if (netScore >= 10) {
      overallRiskLevel = 'high';
    } else if (netScore >= 5) {
      overallRiskLevel = 'medium';
    }

    // Confidence based on data availability
    let confidenceScore = 0;
    if (totalCooks >= 10) confidenceScore = 90;
    else if (totalCooks >= 5) confidenceScore = 70;
    else if (totalCooks >= 3) confidenceScore = 50;
    else if (totalCooks >= 1) confidenceScore = 30;
    else confidenceScore = 10;

    // Generate recommendation
    let recommendation: ForkOutcomePredictionDto['recommendation'];
    if (overallRiskLevel === 'high') {
      recommendation = {
        action: 'not_recommended',
        message:
          'This fork has significant risk factors. Consider trying the original recipe or a better-rated fork instead.',
      };
    } else if (overallRiskLevel === 'medium' || totalCooks < 3) {
      recommendation = {
        action: 'proceed_with_caution',
        message:
          totalCooks < 3
            ? 'This fork has limited testing. Be prepared to adjust as you cook.'
            : 'This fork has some mixed results. Pay close attention to the notes and modifications.',
      };
    } else {
      recommendation = {
        action: 'proceed',
        message: 'This fork has good track record. Enjoy cooking!',
      };
    }

    return {
      recipeId,
      isFork: !!recipe.parentRecipeId,
      overallRiskLevel,
      confidenceScore,
      riskFactors,
      positiveFactors,
      recommendation,
      stats: {
        totalCooks,
        successRate: Math.round(successRate),
        averageRating: Math.round(averageRating * 10) / 10,
        ingredientChanges,
        stepChanges,
        comparedToParent,
      },
    };
  }
}
