import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RecipeVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  TrackInteractionDto,
  InteractionResponseDto,
  InteractionType,
  InteractionStatsDto,
} from './dto/interaction.dto';
import {
  CreateCookingReviewDto,
  UpdateCookingReviewDto,
  CookingReviewResponseDto,
  RecipeReviewStatsDto,
} from './dto/cooking-review.dto';
import {
  CreateSeasoningFeedbackDto,
  SeasoningFeedbackResponseDto,
  SeasoningDimension,
  SeasoningLevel,
  UserSeasoningPreferencesDto,
} from './dto/seasoning-feedback.dto';
import {
  FlavorProfileResponseDto,
  FlavorProfileSummaryDto,
} from './dto/flavor-profile.dto';

const RATING_EMOJIS = ['', '😕', '😐', '🙂', '😍'];

@Injectable()
export class FlavorDnaService {
  private readonly logger = new Logger(FlavorDnaService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== INTERACTION TRACKING ====================

  async trackInteraction(
    userId: string,
    dto: TrackInteractionDto,
  ): Promise<InteractionResponseDto> {
    const interaction = await this.prisma.recipeInteraction.create({
      data: {
        userId,
        recipeId: dto.recipeId,
        type: dto.type,
        duration: dto.duration,
        metadata: dto.metadata || undefined,
      },
    });

    this.logger.debug(
      `Tracked ${dto.type} interaction for user ${userId} on recipe ${dto.recipeId}`,
    );

    // Trigger async profile update for significant interactions
    if (this.isSignificantInteraction(dto.type)) {
      this.updateFlavorProfileAsync(userId).catch((err) =>
        this.logger.error(`Failed to update flavor profile: ${err.message}`),
      );
    }

    return this.mapInteraction(interaction);
  }

  async getRecipeInteractionStats(
    recipeId: string,
  ): Promise<InteractionStatsDto> {
    const [viewCount, saveCount, cookCount, shareCount, forkCount, avgDuration] =
      await Promise.all([
        this.prisma.recipeInteraction.count({
          where: { recipeId, type: 'VIEW' },
        }),
        this.prisma.recipeInteraction.count({
          where: { recipeId, type: 'SAVE' },
        }),
        this.prisma.recipeInteraction.count({
          where: { recipeId, type: 'COOK_COMPLETE' },
        }),
        this.prisma.recipeInteraction.count({
          where: { recipeId, type: 'SHARE' },
        }),
        this.prisma.recipeInteraction.count({
          where: { recipeId, type: 'FORK' },
        }),
        this.prisma.recipeInteraction.aggregate({
          where: { recipeId, type: 'VIEW', duration: { not: null } },
          _avg: { duration: true },
        }),
      ]);

    return {
      recipeId,
      viewCount,
      saveCount,
      cookCount,
      shareCount,
      forkCount,
      avgViewDuration: avgDuration._avg.duration ?? undefined,
    };
  }

  async getUserRecentInteractions(
    userId: string,
    limit = 50,
  ): Promise<InteractionResponseDto[]> {
    const interactions = await this.prisma.recipeInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return interactions.map((i) => this.mapInteraction(i));
  }

  // ==================== COOKING REVIEWS ====================

  async createCookingReview(
    userId: string,
    dto: CreateCookingReviewDto,
  ): Promise<CookingReviewResponseDto> {
    const review = await this.prisma.cookingReview.create({
      data: {
        userId,
        recipeId: dto.recipeId,
        rating: dto.rating,
        wouldMakeAgain: dto.wouldMakeAgain,
        tags: dto.tags || [],
        notes: dto.notes,
        photoUrl: dto.photoUrl,
      },
    });

    this.logger.log(
      `User ${userId} reviewed recipe ${dto.recipeId} with rating ${dto.rating}`,
    );

    // Update flavor profile asynchronously
    this.updateFlavorProfileAsync(userId).catch((err) =>
      this.logger.error(`Failed to update flavor profile: ${err.message}`),
    );

    return this.mapCookingReview(review);
  }

  async updateCookingReview(
    reviewId: string,
    userId: string,
    dto: UpdateCookingReviewDto,
  ): Promise<CookingReviewResponseDto> {
    const existing = await this.prisma.cookingReview.findFirst({
      where: { id: reviewId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Review not found');
    }

    const updated = await this.prisma.cookingReview.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating,
        wouldMakeAgain: dto.wouldMakeAgain,
        tags: dto.tags,
        notes: dto.notes,
        photoUrl: dto.photoUrl,
      },
    });

    return this.mapCookingReview(updated);
  }

  async getUserReviewForRecipe(
    userId: string,
    recipeId: string,
  ): Promise<CookingReviewResponseDto | null> {
    const review = await this.prisma.cookingReview.findFirst({
      where: { userId, recipeId },
      orderBy: { cookedAt: 'desc' },
    });

    return review ? this.mapCookingReview(review) : null;
  }

  async getRecipeReviewStats(recipeId: string): Promise<RecipeReviewStatsDto> {
    const reviews = await this.prisma.cookingReview.findMany({
      where: { recipeId },
    });

    if (reviews.length === 0) {
      return {
        recipeId,
        totalReviews: 0,
        averageRating: 0,
        wouldMakeAgainPercent: 0,
        ratingDistribution: { rating1: 0, rating2: 0, rating3: 0, rating4: 0 },
        topTags: [],
      };
    }

    const totalReviews = reviews.length;
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    const reviewsWithWouldMakeAgain = reviews.filter(
      (r) => r.wouldMakeAgain !== null,
    );
    const wouldMakeAgainPercent =
      reviewsWithWouldMakeAgain.length > 0
        ? (reviewsWithWouldMakeAgain.filter((r) => r.wouldMakeAgain).length /
            reviewsWithWouldMakeAgain.length) *
          100
        : 0;

    const ratingDistribution = {
      rating1: reviews.filter((r) => r.rating === 1).length,
      rating2: reviews.filter((r) => r.rating === 2).length,
      rating3: reviews.filter((r) => r.rating === 3).length,
      rating4: reviews.filter((r) => r.rating === 4).length,
    };

    // Count tags
    const tagCounts = new Map<string, number>();
    reviews.forEach((r) => {
      r.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      recipeId,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      wouldMakeAgainPercent: Math.round(wouldMakeAgainPercent),
      ratingDistribution,
      topTags,
    };
  }

  // ==================== SEASONING FEEDBACK (SALT SENSE) ====================

  async recordSeasoningFeedback(
    userId: string,
    dto: CreateSeasoningFeedbackDto,
  ): Promise<SeasoningFeedbackResponseDto> {
    const feedback = await this.prisma.seasoningFeedback.create({
      data: {
        userId,
        recipeId: dto.recipeId,
        stepIndex: dto.stepIndex,
        dimension: dto.dimension,
        feedback: dto.feedback,
      },
    });

    this.logger.debug(
      `Recorded ${dto.dimension} feedback (${dto.feedback}) for user ${userId}`,
    );

    // Update flavor profile asynchronously
    this.updateFlavorProfileAsync(userId).catch((err) =>
      this.logger.error(`Failed to update flavor profile: ${err.message}`),
    );

    return this.mapSeasoningFeedback(feedback);
  }

  async getUserSeasoningPreferences(
    userId: string,
  ): Promise<UserSeasoningPreferencesDto> {
    const feedbacks = await this.prisma.seasoningFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Last 100 feedbacks
    });

    const dimensionStats = new Map<
      SeasoningDimension,
      { total: number; tooLittle: number; perfect: number; tooMuch: number }
    >();

    // Initialize all dimensions
    Object.values(SeasoningDimension).forEach((dim) => {
      dimensionStats.set(dim, {
        total: 0,
        tooLittle: 0,
        perfect: 0,
        tooMuch: 0,
      });
    });

    // Count feedbacks
    feedbacks.forEach((f) => {
      const stats = dimensionStats.get(f.dimension as SeasoningDimension)!;
      stats.total++;
      if (f.feedback === 'TOO_LITTLE') stats.tooLittle++;
      else if (f.feedback === 'PERFECT') stats.perfect++;
      else if (f.feedback === 'TOO_MUCH') stats.tooMuch++;
    });

    // Calculate preferences
    const preferences = Array.from(dimensionStats.entries()).map(
      ([dimension, stats]) => {
        let preference = 0.5; // default neutral

        if (stats.total > 0) {
          // If user often says "too little", they prefer more (higher preference)
          // If user often says "too much", they prefer less (lower preference)
          const tooLittleRatio = stats.tooLittle / stats.total;
          const tooMuchRatio = stats.tooMuch / stats.total;

          preference = 0.5 + (tooLittleRatio - tooMuchRatio) * 0.4;
          preference = Math.max(0, Math.min(1, preference)); // clamp to 0-1
        }

        // Confidence based on data points
        const confidence = Math.min(1, stats.total / 10);

        return {
          dimension,
          preference: Math.round(preference * 100) / 100,
          confidence: Math.round(confidence * 100) / 100,
          dataPoints: stats.total,
        };
      },
    );

    // Generate summary
    const getPref = (dim: SeasoningDimension) =>
      preferences.find((p) => p.dimension === dim)?.preference ?? 0.5;

    return {
      userId,
      preferences,
      summary: {
        likesItSalty: getPref(SeasoningDimension.SALT) > 0.6,
        likesItSpicy: getPref(SeasoningDimension.HEAT) > 0.6,
        likesItSour: getPref(SeasoningDimension.ACID) > 0.6,
        likesItSweet: getPref(SeasoningDimension.SWEET) > 0.6,
      },
    };
  }

  // ==================== FLAVOR PROFILE ====================

  async getFlavorProfile(userId: string): Promise<FlavorProfileResponseDto> {
    let profile = await this.prisma.flavorProfile.findUnique({
      where: { userId },
    });

    // Create default profile if it doesn't exist
    if (!profile) {
      profile = await this.prisma.flavorProfile.create({
        data: { userId },
      });
    }

    const cuisineAffinities = (profile.cuisineAffinities as Record<string, number>) || {};
    const ingredientScores = (profile.ingredientScores as Record<string, number>) || {};

    // Get top cuisines
    const topCuisines = Object.entries(cuisineAffinities)
      .map(([cuisine, score]) => ({ cuisine, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Get loved/disliked ingredients
    const lovedIngredients = Object.entries(ingredientScores)
      .filter(([_, score]) => score > 0.7)
      .map(([ing]) => ing)
      .slice(0, 10);

    const dislikedIngredients = Object.entries(ingredientScores)
      .filter(([_, score]) => score < -0.3)
      .map(([ing]) => ing)
      .slice(0, 10);

    return {
      id: profile.id,
      userId: profile.userId,
      saltPreference: profile.saltPreference,
      heatPreference: profile.heatPreference,
      acidPreference: profile.acidPreference,
      sweetPreference: profile.sweetPreference,
      umamiPreference: profile.umamiPreference,
      cuisineAffinities,
      topCuisines,
      ingredientScores,
      lovedIngredients,
      dislikedIngredients,
      preferredComplexity: profile.preferredComplexity,
      preferredCookTime: profile.preferredCookTime ?? undefined,
      preferredServings: profile.preferredServings ?? undefined,
      dataPoints: profile.dataPoints,
      confidence: profile.confidence,
      updatedAt: profile.updatedAt,
    };
  }

  async getFlavorProfileSummary(
    userId: string,
  ): Promise<FlavorProfileSummaryDto> {
    const profile = await this.getFlavorProfile(userId);

    // Convert numeric preferences to labels
    const prefToLabel = (
      value: number,
      labels: [string, string, string],
    ): string => {
      if (value < 0.35) return labels[0];
      if (value > 0.65) return labels[2];
      return labels[1];
    };

    const tasteProfile = {
      salt: prefToLabel(profile.saltPreference, ['low', 'moderate', 'high']) as
        | 'low'
        | 'moderate'
        | 'high',
      heat: prefToLabel(profile.heatPreference, [
        'mild',
        'moderate',
        'spicy',
      ]) as 'mild' | 'moderate' | 'spicy',
      acid: prefToLabel(profile.acidPreference, [
        'low',
        'balanced',
        'tangy',
      ]) as 'low' | 'balanced' | 'tangy',
      sweet: prefToLabel(profile.sweetPreference, [
        'savory',
        'balanced',
        'sweet',
      ]) as 'savory' | 'balanced' | 'sweet',
      umami: prefToLabel(profile.umamiPreference, [
        'light',
        'moderate',
        'rich',
      ]) as 'light' | 'moderate' | 'rich',
    };

    // Profile strength based on data points
    let profileStrength: 'new' | 'developing' | 'established' | 'strong';
    let recipesNeededForNextLevel: number;

    if (profile.dataPoints < 5) {
      profileStrength = 'new';
      recipesNeededForNextLevel = 5 - profile.dataPoints;
    } else if (profile.dataPoints < 20) {
      profileStrength = 'developing';
      recipesNeededForNextLevel = 20 - profile.dataPoints;
    } else if (profile.dataPoints < 50) {
      profileStrength = 'established';
      recipesNeededForNextLevel = 50 - profile.dataPoints;
    } else {
      profileStrength = 'strong';
      recipesNeededForNextLevel = 0;
    }

    // Cook time summary
    let typicalCookTime: string;
    if (!profile.preferredCookTime || profile.preferredCookTime < 30) {
      typicalCookTime = 'under 30 min';
    } else if (profile.preferredCookTime <= 60) {
      typicalCookTime = '30-60 min';
    } else {
      typicalCookTime = 'over 1 hour';
    }

    return {
      userId,
      tasteProfile,
      favoriteCuisines: profile.topCuisines.slice(0, 3).map((c) => c.cuisine),
      cookingStyle: {
        complexity: prefToLabel(profile.preferredComplexity, [
          'simple',
          'moderate',
          'complex',
        ]) as 'simple' | 'moderate' | 'complex',
        typicalCookTime,
      },
      profileStrength,
      recipesNeededForNextLevel,
    };
  }

  // ==================== PROFILE COMPUTATION ====================

  private async updateFlavorProfileAsync(userId: string): Promise<void> {
    this.logger.debug(`Updating flavor profile for user ${userId}`);

    // Get all relevant data
    const [interactions, reviews, seasoningFeedback] = await Promise.all([
      this.prisma.recipeInteraction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.cookingReview.findMany({
        where: { userId },
        orderBy: { cookedAt: 'desc' },
        take: 50,
      }),
      this.prisma.seasoningFeedback.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // Get recipe details for interactions
    const recipeIds = [
      ...new Set([
        ...interactions.map((i) => i.recipeId),
        ...reviews.map((r) => r.recipeId),
      ]),
    ];

    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: {
        id: true,
        cuisine: true,
        category: true,
        difficulty: true,
        totalTimeMinutes: true,
        tags: true,
      },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    // Calculate cuisine affinities
    const cuisineCounts = new Map<string, number>();
    interactions
      .filter((i) => i.type === 'COOK_COMPLETE' || i.type === 'SAVE')
      .forEach((i) => {
        const recipe = recipeMap.get(i.recipeId);
        if (recipe?.cuisine) {
          const weight = i.type === 'COOK_COMPLETE' ? 2 : 1;
          cuisineCounts.set(
            recipe.cuisine,
            (cuisineCounts.get(recipe.cuisine) || 0) + weight,
          );
        }
      });

    // Normalize cuisine scores to 0-1
    const maxCuisineCount = Math.max(...cuisineCounts.values(), 1);
    const cuisineAffinities: Record<string, number> = {};
    cuisineCounts.forEach((count, cuisine) => {
      cuisineAffinities[cuisine] =
        Math.round((count / maxCuisineCount) * 100) / 100;
    });

    // Calculate seasoning preferences from feedback
    const seasoningPrefs = this.calculateSeasoningPreferences(seasoningFeedback);

    // Calculate complexity preference from recipes cooked
    const cookedRecipes = interactions
      .filter((i) => i.type === 'COOK_COMPLETE')
      .map((i) => recipeMap.get(i.recipeId))
      .filter(Boolean);

    let preferredComplexity = 0.5;
    if (cookedRecipes.length > 0) {
      const difficultyScores = {
        EASY: 0.2,
        MEDIUM: 0.5,
        HARD: 0.8,
        EXPERT: 1.0,
      };
      const avgComplexity =
        cookedRecipes.reduce((sum, r) => {
          return sum + (difficultyScores[r!.difficulty as keyof typeof difficultyScores] || 0.5);
        }, 0) / cookedRecipes.length;
      preferredComplexity = avgComplexity;
    }

    // Calculate preferred cook time
    const cookTimes = cookedRecipes
      .map((r) => r!.totalTimeMinutes)
      .filter((t): t is number => t !== null);
    const preferredCookTime =
      cookTimes.length > 0
        ? Math.round(cookTimes.reduce((a, b) => a + b, 0) / cookTimes.length)
        : null;

    // Count total data points
    const dataPoints =
      interactions.length + reviews.length + seasoningFeedback.length;
    const confidence = Math.min(1, dataPoints / 100);

    // Upsert the profile
    await this.prisma.flavorProfile.upsert({
      where: { userId },
      create: {
        userId,
        saltPreference: seasoningPrefs.salt,
        heatPreference: seasoningPrefs.heat,
        acidPreference: seasoningPrefs.acid,
        sweetPreference: seasoningPrefs.sweet,
        umamiPreference: seasoningPrefs.umami,
        cuisineAffinities,
        ingredientScores: {},
        preferredComplexity,
        preferredCookTime,
        dataPoints,
        confidence,
      },
      update: {
        saltPreference: seasoningPrefs.salt,
        heatPreference: seasoningPrefs.heat,
        acidPreference: seasoningPrefs.acid,
        sweetPreference: seasoningPrefs.sweet,
        umamiPreference: seasoningPrefs.umami,
        cuisineAffinities,
        preferredComplexity,
        preferredCookTime,
        dataPoints,
        confidence,
      },
    });

    this.logger.debug(
      `Updated flavor profile for user ${userId}: ${dataPoints} data points, ${confidence} confidence`,
    );
  }

  private calculateSeasoningPreferences(
    feedbacks: { dimension: string; feedback: string }[],
  ): Record<string, number> {
    const prefs: Record<string, number> = {
      salt: 0.5,
      heat: 0.5,
      acid: 0.5,
      sweet: 0.5,
      umami: 0.5,
    };

    const dimensionMap: Record<string, string> = {
      SALT: 'salt',
      HEAT: 'heat',
      ACID: 'acid',
      SWEET: 'sweet',
      UMAMI: 'umami',
    };

    const counts: Record<string, { total: number; delta: number }> = {};
    Object.values(dimensionMap).forEach((dim) => {
      counts[dim] = { total: 0, delta: 0 };
    });

    feedbacks.forEach((f) => {
      const dim = dimensionMap[f.dimension];
      if (dim) {
        counts[dim].total++;
        if (f.feedback === 'TOO_LITTLE') counts[dim].delta += 1;
        else if (f.feedback === 'TOO_MUCH') counts[dim].delta -= 1;
      }
    });

    Object.entries(counts).forEach(([dim, { total, delta }]) => {
      if (total > 0) {
        const adjustment = (delta / total) * 0.4;
        prefs[dim] = Math.max(0, Math.min(1, 0.5 + adjustment));
        prefs[dim] = Math.round(prefs[dim] * 100) / 100;
      }
    });

    return prefs;
  }

  // ==================== HELPERS ====================

  private isSignificantInteraction(type: InteractionType): boolean {
    return [
      InteractionType.SAVE,
      InteractionType.COOK_COMPLETE,
      InteractionType.FORK,
    ].includes(type);
  }

  private mapInteraction(interaction: any): InteractionResponseDto {
    return {
      id: interaction.id,
      userId: interaction.userId,
      recipeId: interaction.recipeId,
      type: interaction.type as InteractionType,
      duration: interaction.duration ?? undefined,
      metadata: interaction.metadata as Record<string, any> | undefined,
      createdAt: interaction.createdAt,
    };
  }

  private mapCookingReview(review: any): CookingReviewResponseDto {
    return {
      id: review.id,
      userId: review.userId,
      recipeId: review.recipeId,
      rating: review.rating,
      ratingEmoji: RATING_EMOJIS[review.rating] || '',
      wouldMakeAgain: review.wouldMakeAgain ?? undefined,
      tags: review.tags || [],
      notes: review.notes ?? undefined,
      photoUrl: review.photoUrl ?? undefined,
      cookedAt: review.cookedAt,
    };
  }

  private mapSeasoningFeedback(feedback: any): SeasoningFeedbackResponseDto {
    return {
      id: feedback.id,
      userId: feedback.userId,
      recipeId: feedback.recipeId,
      stepIndex: feedback.stepIndex,
      dimension: feedback.dimension as SeasoningDimension,
      feedback: feedback.feedback as SeasoningLevel,
      createdAt: feedback.createdAt,
    };
  }

  // ==================== RECIPE MATCH SCORE ====================

  async getRecipeMatchScore(userId: string, recipeId: string) {
    // Get user's flavor profile
    const profile = await this.prisma.flavorProfile.findUnique({
      where: { userId },
    });

    // Get the recipe
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return {
        recipeId,
        score: null,
        matchReasons: [],
        hasProfile: false,
        message: 'Recipe not found',
      };
    }

    if (!profile || profile.dataPoints < 3) {
      return {
        recipeId,
        score: null,
        matchReasons: [],
        hasProfile: false,
        message: 'Cook more recipes to unlock personalized match scores',
        recipesNeeded: profile ? 3 - profile.dataPoints : 3,
      };
    }

    // Calculate match score using the same algorithm as recommendations
    const { score, reasons, breakdown } = this.calculateRecipeScore(
      recipe,
      profile,
    );

    return {
      recipeId,
      score,
      matchReasons: reasons,
      hasProfile: true,
      breakdown,
    };
  }

  /**
   * Calculate match score for a recipe based on user's flavor profile
   */
  private calculateRecipeScore(
    recipe: any,
    profile: any,
  ): { score: number; reasons: string[]; breakdown: Record<string, number> } {
    let score = 0;
    const reasons: string[] = [];
    const breakdown: Record<string, number> = {};

    const cuisineAffinities =
      (profile.cuisineAffinities as Record<string, number>) || {};

    // Cuisine match (0-40 points)
    if (recipe.cuisine && cuisineAffinities[recipe.cuisine]) {
      const cuisineScore = Math.round(cuisineAffinities[recipe.cuisine] * 40);
      score += cuisineScore;
      breakdown.cuisine = cuisineScore;
      if (cuisineScore > 20) {
        reasons.push(`Matches your love for ${recipe.cuisine} cuisine`);
      }
    } else {
      breakdown.cuisine = 0;
    }

    // Complexity match (0-20 points)
    const difficultyScores: Record<string, number> = {
      EASY: 0.2,
      MEDIUM: 0.5,
      HARD: 0.8,
      EXPERT: 1.0,
    };
    if (recipe.difficulty) {
      const recipeDifficulty = difficultyScores[recipe.difficulty] || 0.5;
      const complexityDiff = Math.abs(
        recipeDifficulty - profile.preferredComplexity,
      );
      const complexityScore = Math.round((1 - complexityDiff) * 20);
      score += complexityScore;
      breakdown.complexity = complexityScore;
      if (complexityScore > 15) {
        reasons.push('Matches your preferred complexity');
      }
    } else {
      breakdown.complexity = 10; // Default mid-range
      score += 10;
    }

    // Cook time match (0-20 points)
    if (recipe.totalTimeMinutes && profile.preferredCookTime) {
      const timeDiff = Math.abs(
        recipe.totalTimeMinutes - profile.preferredCookTime,
      );
      const timeScore = Math.round(Math.max(0, 20 - timeDiff / 3));
      score += timeScore;
      breakdown.cookTime = timeScore;
      if (timeScore > 15) {
        reasons.push('Fits your typical cook time');
      }
    } else {
      breakdown.cookTime = 10; // Default mid-range
      score += 10;
    }

    // Popularity boost (0-10 points)
    const popularityScore = Math.min(10, recipe.forkCount * 2);
    score += popularityScore;
    breakdown.popularity = popularityScore;
    if (popularityScore > 5) {
      reasons.push('Popular with other chefs');
    }

    // Freshness boost (0-10 points)
    const daysSinceCreated =
      (Date.now() - new Date(recipe.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);
    const freshnessScore = Math.round(Math.max(0, 10 - daysSinceCreated / 7));
    score += freshnessScore;
    breakdown.freshness = freshnessScore;

    if (reasons.length === 0) {
      reasons.push('Recommended for you');
    }

    return { score: Math.min(100, score), reasons, breakdown };
  }

  // ==================== RECOMMENDATIONS ====================

  async getRecommendedRecipes(userId: string, limit = 10) {
    // Get user's flavor profile
    const profile = await this.prisma.flavorProfile.findUnique({
      where: { userId },
    });

    // Get recipes user has already interacted with
    const viewedRecipeIds = await this.prisma.recipeInteraction
      .findMany({
        where: { userId, type: 'VIEW' },
        select: { recipeId: true },
        distinct: ['recipeId'],
      })
      .then((interactions) => interactions.map((i) => i.recipeId));

    // Get candidate recipes (public or user's own, not already viewed heavily)
    const candidates = await this.prisma.recipe.findMany({
      where: {
        OR: [{ visibility: RecipeVisibility.PUBLIC }, { userId }],
        id: { notIn: viewedRecipeIds.slice(0, 50) }, // Exclude recently viewed
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 100, // Get more candidates for scoring
    });

    if (!profile || profile.dataPoints < 3) {
      // Not enough data - return popular/recent recipes
      const popularRecipes = candidates
        .sort((a, b) => b.forkCount - a.forkCount)
        .slice(0, limit);

      return popularRecipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        cuisine: recipe.cuisine,
        totalTimeMinutes: recipe.totalTimeMinutes,
        difficultyLevel: recipe.difficulty,
        score: 50, // Default score for popular recipes
        matchReasons: ['Popular recipe'],
        user: recipe.user,
      }));
    }

    // Score each recipe based on flavor profile match
    const cuisineAffinities =
      (profile.cuisineAffinities as Record<string, number>) || {};

    const scoredRecipes = candidates.map((recipe) => {
      let score = 0;
      const reasons: string[] = [];

      // Cuisine match (0-40 points)
      if (recipe.cuisine && cuisineAffinities[recipe.cuisine]) {
        const cuisineScore = cuisineAffinities[recipe.cuisine] * 40;
        score += cuisineScore;
        if (cuisineScore > 20) {
          reasons.push(`Matches your love for ${recipe.cuisine} cuisine`);
        }
      }

      // Complexity match (0-20 points)
      const difficultyScores: Record<string, number> = {
        EASY: 0.2,
        MEDIUM: 0.5,
        HARD: 0.8,
        EXPERT: 1.0,
      };
      if (recipe.difficulty) {
        const recipeDifficulty = difficultyScores[recipe.difficulty] || 0.5;
        const complexityDiff = Math.abs(
          recipeDifficulty - profile.preferredComplexity,
        );
        const complexityScore = (1 - complexityDiff) * 20;
        score += complexityScore;
        if (complexityScore > 15) {
          reasons.push('Matches your preferred complexity');
        }
      }

      // Cook time match (0-20 points)
      if (recipe.totalTimeMinutes && profile.preferredCookTime) {
        const timeDiff = Math.abs(
          recipe.totalTimeMinutes - profile.preferredCookTime,
        );
        const timeScore = Math.max(0, 20 - timeDiff / 3);
        score += timeScore;
        if (timeScore > 15) {
          reasons.push('Fits your typical cook time');
        }
      }

      // Popularity boost (0-10 points)
      const popularityScore = Math.min(10, recipe.forkCount * 2);
      score += popularityScore;
      if (popularityScore > 5) {
        reasons.push('Popular with other chefs');
      }

      // Freshness boost (0-10 points) - newer recipes get slight boost
      const daysSinceCreated =
        (Date.now() - new Date(recipe.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      const freshnessScore = Math.max(0, 10 - daysSinceCreated / 7);
      score += freshnessScore;

      return { recipe, score: Math.round(score), reasons };
    });

    // Sort by score and take top results
    const topRecipes = scoredRecipes
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return topRecipes.map(({ recipe, score, reasons }) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      cuisine: recipe.cuisine,
      totalTimeMinutes: recipe.totalTimeMinutes,
      difficultyLevel: recipe.difficulty,
      score,
      matchReasons: reasons.length > 0 ? reasons : ['Recommended for you'],
      user: recipe.user,
    }));
  }

  // ==================== TASTE TWIN MATCHING ====================

  /**
   * Find users with similar taste profiles (Taste Twins)
   */
  async findTasteTwins(
    userId: string,
    limit = 10,
  ): Promise<{
    tasteTwins: Array<{
      user: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
      };
      matchScore: number;
      sharedCuisines: string[];
      matchReasons: string[];
    }>;
    hasProfile: boolean;
    message?: string;
  }> {
    // Get user's profile
    const userProfile = await this.prisma.flavorProfile.findUnique({
      where: { userId },
    });

    if (!userProfile || userProfile.dataPoints < 5) {
      return {
        tasteTwins: [],
        hasProfile: false,
        message: 'Cook more recipes to discover your taste twins',
      };
    }

    // Get all other users with established profiles
    const otherProfiles = await this.prisma.flavorProfile.findMany({
      where: {
        userId: { not: userId },
        dataPoints: { gte: 5 }, // Only users with enough data
      },
    });

    // Get user details for the profiles
    const profileUserIds = otherProfiles.map((p) => p.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: profileUserIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Combine profiles with users
    const profilesWithUsers = otherProfiles.map((profile) => ({
      ...profile,
      user: userMap.get(profile.userId)!,
    }));

    // Calculate compatibility scores
    const scoredProfiles = profilesWithUsers.map((profile) => {
      const { score, sharedCuisines, reasons } = this.calculateTasteTwinScore(
        userProfile,
        profile,
      );
      return {
        user: profile.user,
        matchScore: score,
        sharedCuisines,
        matchReasons: reasons,
      };
    });

    // Sort by score and take top matches
    const topTwins = scoredProfiles
      .filter((p) => p.matchScore >= 50) // Only show good matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return {
      tasteTwins: topTwins,
      hasProfile: true,
    };
  }

  /**
   * Get compatibility score between two users
   */
  async getTasteCompatibility(
    userId: string,
    targetUserId: string,
  ): Promise<{
    userId: string;
    targetUserId: string;
    score: number | null;
    breakdown: {
      seasoningMatch: number;
      cuisineMatch: number;
      complexityMatch: number;
    } | null;
    sharedCuisines: string[];
    matchReasons: string[];
    hasProfile: boolean;
    message?: string;
  }> {
    const [userProfile, targetProfile] = await Promise.all([
      this.prisma.flavorProfile.findUnique({ where: { userId } }),
      this.prisma.flavorProfile.findUnique({ where: { userId: targetUserId } }),
    ]);

    if (!userProfile || userProfile.dataPoints < 3) {
      return {
        userId,
        targetUserId,
        score: null,
        breakdown: null,
        sharedCuisines: [],
        matchReasons: [],
        hasProfile: false,
        message: 'Your taste profile needs more data',
      };
    }

    if (!targetProfile || targetProfile.dataPoints < 3) {
      return {
        userId,
        targetUserId,
        score: null,
        breakdown: null,
        sharedCuisines: [],
        matchReasons: [],
        hasProfile: false,
        message: "This user's taste profile is not yet established",
      };
    }

    const { score, sharedCuisines, reasons, breakdown } =
      this.calculateTasteTwinScore(userProfile, targetProfile);

    return {
      userId,
      targetUserId,
      score,
      breakdown,
      sharedCuisines,
      matchReasons: reasons,
      hasProfile: true,
    };
  }

  /**
   * Get suggested users to follow based on taste profile
   */
  async getSuggestedUsers(
    userId: string,
    limit = 10,
  ): Promise<{
    suggestions: Array<{
      user: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
      };
      matchScore: number;
      reason: string;
      sharedCuisines: string[];
      recipeCount: number;
    }>;
    hasProfile: boolean;
  }> {
    // Get user's profile
    const userProfile = await this.prisma.flavorProfile.findUnique({
      where: { userId },
    });

    // Get users the current user is already following
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    });
    const followingIds = following.map((f) => f.followeeId);

    // Get flavor profiles with enough data points (excluding already followed and self)
    const profiles = await this.prisma.flavorProfile.findMany({
      where: {
        userId: { notIn: [userId, ...followingIds] },
        dataPoints: { gte: 3 },
      },
      take: 50,
    });

    // Get user details and recipe counts for these profiles
    const profileUserIds = profiles.map((p) => p.userId);
    const [users, recipeCounts] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: profileUserIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      }),
      this.prisma.recipe.groupBy({
        by: ['userId'],
        where: { userId: { in: profileUserIds } },
        _count: { id: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const recipeCountMap = new Map(recipeCounts.map((r) => [r.userId, r._count.id]));

    // Combine data
    const candidates = profiles.map((profile) => ({
      profile,
      user: userMap.get(profile.userId)!,
      recipeCount: recipeCountMap.get(profile.userId) || 0,
    })).filter((c) => c.user);

    if (!userProfile || userProfile.dataPoints < 3) {
      // Without profile, suggest popular users with recipes
      const popularUsers = candidates
        .filter((c) => c.recipeCount >= 2)
        .sort((a, b) => b.recipeCount - a.recipeCount)
        .slice(0, limit);

      return {
        suggestions: popularUsers.map((c) => ({
          user: c.user,
          matchScore: 50,
          reason: 'Active recipe creator',
          sharedCuisines: [],
          recipeCount: c.recipeCount,
        })),
        hasProfile: false,
      };
    }

    // Score candidates based on taste compatibility
    const scoredCandidates = candidates.map((candidate) => {
      const { score, sharedCuisines, reasons } = this.calculateTasteTwinScore(
        userProfile,
        candidate.profile,
      );

      return {
        user: candidate.user,
        matchScore: score,
        reason: reasons[0] || 'Similar taste profile',
        sharedCuisines,
        recipeCount: candidate.recipeCount,
      };
    });

    // Sort by combined score (taste match + activity)
    const suggestions = scoredCandidates
      .sort((a, b) => {
        const scoreA = a.matchScore + Math.min(20, a.recipeCount * 2);
        const scoreB = b.matchScore + Math.min(20, b.recipeCount * 2);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return {
      suggestions,
      hasProfile: true,
    };
  }

  /**
   * Calculate taste twin score between two profiles
   */
  private calculateTasteTwinScore(
    profile1: any,
    profile2: any,
  ): {
    score: number;
    sharedCuisines: string[];
    reasons: string[];
    breakdown: {
      seasoningMatch: number;
      cuisineMatch: number;
      complexityMatch: number;
    };
  } {
    const reasons: string[] = [];

    // 1. Seasoning Preferences Match (0-40 points)
    const seasoningDims = ['salt', 'heat', 'acid', 'sweet', 'umami'];
    let seasoningMatch = 0;

    seasoningDims.forEach((dim) => {
      const pref1 = profile1[`${dim}Preference`] || 0.5;
      const pref2 = profile2[`${dim}Preference`] || 0.5;
      const diff = Math.abs(pref1 - pref2);
      seasoningMatch += (1 - diff) * 8; // 8 points per dimension = 40 max
    });

    if (seasoningMatch > 32) {
      reasons.push('Similar seasoning preferences');
    }

    // 2. Cuisine Affinities Match (0-40 points)
    const cuisines1 = (profile1.cuisineAffinities as Record<string, number>) || {};
    const cuisines2 = (profile2.cuisineAffinities as Record<string, number>) || {};

    const allCuisines = new Set([
      ...Object.keys(cuisines1),
      ...Object.keys(cuisines2),
    ]);

    let cuisineMatch = 0;
    const sharedCuisines: string[] = [];

    allCuisines.forEach((cuisine) => {
      const score1 = cuisines1[cuisine] || 0;
      const score2 = cuisines2[cuisine] || 0;

      // If both have affinity for this cuisine
      if (score1 > 0.3 && score2 > 0.3) {
        sharedCuisines.push(cuisine);
        cuisineMatch += Math.min(score1, score2) * 10;
      }
    });

    cuisineMatch = Math.min(40, cuisineMatch);

    if (sharedCuisines.length >= 2) {
      reasons.push(`Both love ${sharedCuisines.slice(0, 2).join(' and ')} cuisine`);
    } else if (sharedCuisines.length === 1) {
      reasons.push(`Both love ${sharedCuisines[0]} cuisine`);
    }

    // 3. Complexity Preference Match (0-20 points)
    const complexityDiff = Math.abs(
      profile1.preferredComplexity - profile2.preferredComplexity,
    );
    const complexityMatch = Math.round((1 - complexityDiff) * 20);

    if (complexityMatch > 15) {
      const complexityLevel =
        profile1.preferredComplexity < 0.4
          ? 'simple'
          : profile1.preferredComplexity > 0.6
            ? 'complex'
            : 'balanced';
      reasons.push(`Both prefer ${complexityLevel} recipes`);
    }

    // Calculate total score
    const totalScore = Math.round(seasoningMatch + cuisineMatch + complexityMatch);

    return {
      score: Math.min(100, totalScore),
      sharedCuisines,
      reasons,
      breakdown: {
        seasoningMatch: Math.round(seasoningMatch),
        cuisineMatch: Math.round(cuisineMatch),
        complexityMatch,
      },
    };
  }
}
