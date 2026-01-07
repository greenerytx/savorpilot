import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { InstagramApiService, CollectionInfo } from './instagram-api.service';
import {
  SyncInstagramDto,
  SyncResponseDto,
  GetSavedPostsQueryDto,
  SavedPostsListResponseDto,
  FiltersResponseDto,
  ParsedPostDto,
  ImportSinglePostDto,
  BulkImportDto,
  BulkImportResponseDto,
  ImportJobStatusDto,
} from './dto';
import { SavedPostStatus, ImportJobStatus, RecipeSource, RecipeDifficulty, RecipeCategory } from '@prisma/client';

// In-memory sync progress tracking
export interface SyncProgress {
  status: 'syncing' | 'complete' | 'error';
  phase: 1 | 2;
  totalFetched: number;
  newPosts: number;
  skippedPosts: number;
  message: string;
  startedAt: Date;
  updatedAt: Date;
}

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private readonly syncProgress = new Map<string, SyncProgress>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly instagramApiService: InstagramApiService,
  ) {}

  /**
   * Get current sync progress for a user
   */
  getSyncProgress(userId: string): SyncProgress | null {
    return this.syncProgress.get(userId) || null;
  }

  /**
   * Update sync progress
   */
  private updateProgress(userId: string, update: Partial<SyncProgress>) {
    const current = this.syncProgress.get(userId);
    if (current) {
      this.syncProgress.set(userId, {
        ...current,
        ...update,
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Sync saved posts from Instagram
   * Two-phase approach:
   * 1. Always start from beginning to catch NEW posts (stop when we hit consecutive existing)
   * 2. If we have a saved cursor from interrupted sync, resume from there for remaining OLD posts
   */
  async syncSavedPosts(userId: string, dto: SyncInstagramDto): Promise<SyncResponseDto> {
    const forceRefresh = dto.forceRefresh || false;
    const collections = dto.collections || [];

    // Filter to get specific collections (non-ALL_MEDIA)
    const specificCollections = collections.filter(c => c.id !== 'ALL_MEDIA_AUTO_COLLECTION');
    const includesAllSaved = collections.some(c => c.id === 'ALL_MEDIA_AUTO_COLLECTION');

    this.logger.log(`Starting sync for user ${userId} (forceRefresh: ${forceRefresh}, collections: ${collections.length}, includesAllSaved: ${includesAllSaved})`);

    let newPosts = 0;
    let skippedPosts = 0;
    let totalFetched = 0;

    const startMessage = specificCollections.length > 0
      ? `Syncing ${specificCollections.length} collection${specificCollections.length > 1 ? 's' : ''}...`
      : forceRefresh
        ? 'Starting full refresh...'
        : 'Starting sync...';

    // Initialize sync progress
    this.syncProgress.set(userId, {
      status: 'syncing',
      phase: 1,
      totalFetched: 0,
      newPosts: 0,
      skippedPosts: 0,
      message: startMessage,
      startedAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      // Get user with sync cursor state
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { instagramSyncCursor: true, instagramSyncCompletedAt: true },
      });

      const existingCount = await this.prisma.savedInstagramPost.count({
        where: { userId },
      });

      // Has the initial full sync ever completed?
      const hasCompletedFullSync = !!user?.instagramSyncCompletedAt;
      const hasResumeCursor = !!user?.instagramSyncCursor;

      this.logger.log(`Existing posts: ${existingCount}, hasCompletedFullSync: ${hasCompletedFullSync}, hasResumeCursor: ${hasResumeCursor}`);

      const cookies = {
        sessionId: dto.sessionId,
        csrfToken: dto.csrfToken,
        dsUserId: dto.dsUserId,
        igWwwClaim: dto.igWwwClaim,
      };

      // ========== SYNC SPECIFIC COLLECTIONS ==========
      if (specificCollections.length > 0) {
        for (let i = 0; i < specificCollections.length; i++) {
          const collection = specificCollections[i];
          this.logger.log(`Syncing collection ${i + 1}/${specificCollections.length}: ${collection.name} (${collection.id})`);
          this.updateProgress(userId, {
            message: `[${i + 1}/${specificCollections.length}] Fetching "${collection.name}"...`,
          });

          let endCursor: string | undefined;
          let hasMore = true;
          const maxPostsPerCollection = 10000;
          let collectionFetched = 0;

          while (hasMore && collectionFetched < maxPostsPerCollection) {
            const result = await this.instagramApiService.fetchCollectionPosts(
              cookies,
              collection.id,
              collection.name,
              endCursor,
            );

            if (result.posts.length === 0) {
              this.logger.log(`No more posts in collection ${collection.name}`);
              break;
            }

            for (const post of result.posts) {
              totalFetched++;
              collectionFetched++;

              const existing = await this.prisma.savedInstagramPost.findUnique({
                where: {
                  userId_instagramPostId: { userId, instagramPostId: post.id },
                },
              });

              if (existing) {
                skippedPosts++;
                continue;
              }

              await this.createSavedPost(userId, post);
              newPosts++;
            }

            // Update progress after each batch
            this.updateProgress(userId, {
              totalFetched,
              newPosts,
              skippedPosts,
              message: `[${i + 1}/${specificCollections.length}] "${collection.name}": ${collectionFetched} fetched (${newPosts} new total)...`,
            });

            hasMore = result.hasMore;
            endCursor = result.endCursor;

            if (hasMore) {
              await this.delay(1000 + Math.random() * 1000);
            }
          }

          // Delay between collections
          if (i < specificCollections.length - 1) {
            await this.delay(500);
          }
        }

        // If only specific collections were selected (no "All Saved"), we're done
        if (!includesAllSaved) {
          const collectionNames = specificCollections.map(c => c.name).join(', ');
          this.syncProgress.set(userId, {
            status: 'complete',
            phase: 1,
            totalFetched,
            newPosts,
            skippedPosts,
            message: `Complete! ${newPosts} new posts from ${specificCollections.length} collection${specificCollections.length > 1 ? 's' : ''}.`,
            startedAt: this.syncProgress.get(userId)?.startedAt || new Date(),
            updatedAt: new Date(),
          });

          setTimeout(() => this.syncProgress.delete(userId), 5 * 60 * 1000);

          return {
            success: true,
            totalFetched,
            newPosts,
            skippedPosts,
            message: `Synced ${newPosts} new posts from: ${collectionNames}`,
          };
        }
      }

      // ========== SYNC "ALL SAVED POSTS" ==========
      // Only runs if "All Saved Posts" was selected
      if (!includesAllSaved) {
        // No collections to sync
        this.syncProgress.set(userId, {
          status: 'complete',
          phase: 1,
          totalFetched,
          newPosts,
          skippedPosts,
          message: 'No collections selected.',
          startedAt: this.syncProgress.get(userId)?.startedAt || new Date(),
          updatedAt: new Date(),
        });

        setTimeout(() => this.syncProgress.delete(userId), 5 * 60 * 1000);

        return {
          success: true,
          totalFetched,
          newPosts,
          skippedPosts,
          message: 'No collections selected',
        };
      }

      this.updateProgress(userId, {
        message: forceRefresh
          ? `Force refresh: Scanning all ${existingCount > 0 ? existingCount + '+ ' : ''}posts...`
          : `Found ${existingCount} existing posts. Syncing All Saved Posts...`,
      });

      const STOP_AFTER_CONSECUTIVE = 10;

      // ========== FORCE REFRESH MODE ==========
      // Scan ALL posts, insert new ones, skip existing
      if (forceRefresh) {
        this.logger.log('Force refresh mode: Scanning all posts...');
        this.updateProgress(userId, {
          phase: 1,
          message: 'Scanning all Instagram saved posts...',
        });

        let endCursor: string | undefined;
        let hasMore = true;
        const maxPosts = 10000;

        while (hasMore && totalFetched < maxPosts) {
          const result = await this.instagramApiService.fetchSavedPosts(cookies, endCursor);

          if (result.posts.length === 0) {
            this.logger.log('Empty batch received - ending scan');
            break;
          }

          for (const post of result.posts) {
            totalFetched++;

            const existing = await this.prisma.savedInstagramPost.findUnique({
              where: {
                userId_instagramPostId: { userId, instagramPostId: post.id },
              },
            });

            if (existing) {
              skippedPosts++;
              continue;
            }

            await this.createSavedPost(userId, post);
            newPosts++;
          }

          // Update progress after each batch
          this.updateProgress(userId, {
            totalFetched,
            newPosts,
            skippedPosts,
            message: `Scanned ${totalFetched} posts (${newPosts} new)...`,
          });

          hasMore = result.hasMore;
          endCursor = result.endCursor;

          if (totalFetched % 100 === 0) {
            this.logger.log(`Force refresh progress: ${totalFetched} scanned, ${newPosts} new, ${skippedPosts} skipped`);
          }

          if (hasMore) {
            await this.delay(1000 + Math.random() * 1000);
          }
        }

        this.logger.log(`Force refresh done: ${newPosts} new, ${skippedPosts} skipped, ${totalFetched} total`);

        // Update progress to complete
        this.syncProgress.set(userId, {
          status: 'complete',
          phase: 1,
          totalFetched,
          newPosts,
          skippedPosts,
          message: `Complete! ${newPosts} new posts found.`,
          startedAt: this.syncProgress.get(userId)?.startedAt || new Date(),
          updatedAt: new Date(),
        });

        setTimeout(() => this.syncProgress.delete(userId), 5 * 60 * 1000);

        return {
          success: true,
          totalFetched,
          newPosts,
          skippedPosts,
          message: `Force refresh: Found ${newPosts} new posts`,
        };
      }

      // ========== PHASE 1: Catch new posts ==========
      // Always start from beginning to catch any newly saved posts
      if (existingCount > 0) {
        this.logger.log('Phase 1: Checking for new posts from beginning...');
        this.updateProgress(userId, {
          phase: 1,
          message: 'Checking for new posts...',
        });

        let endCursor: string | undefined;
        let hasMore = true;
        let consecutiveExisting = 0;
        let phase1Fetched = 0;

        while (hasMore && phase1Fetched < 500) { // Limit phase 1 to avoid re-fetching too much
          const result = await this.instagramApiService.fetchSavedPosts(cookies, endCursor);

          if (result.posts.length === 0) break;

          for (const post of result.posts) {
            phase1Fetched++;
            totalFetched++;

            const existing = await this.prisma.savedInstagramPost.findUnique({
              where: {
                userId_instagramPostId: { userId, instagramPostId: post.id },
              },
            });

            if (existing) {
              skippedPosts++;
              consecutiveExisting++;

              // Found consecutive existing posts = caught up with new posts
              if (consecutiveExisting >= STOP_AFTER_CONSECUTIVE) {
                this.logger.log(`Phase 1 complete: Found ${STOP_AFTER_CONSECUTIVE} consecutive existing posts`);
                hasMore = false;
                break;
              }
              continue;
            }

            consecutiveExisting = 0;
            await this.createSavedPost(userId, post);
            newPosts++;

            // Update progress every post
            this.updateProgress(userId, {
              totalFetched,
              newPosts,
              skippedPosts,
              message: `Phase 1: ${newPosts} new posts found...`,
            });
          }

          hasMore = result.hasMore && hasMore;
          endCursor = result.endCursor;

          if (hasMore) {
            await this.delay(1000 + Math.random() * 1000);
          }
        }

        this.logger.log(`Phase 1 done: ${newPosts} new posts found`);
      }

      // ========== PHASE 2: Complete the full sync ==========
      // Runs if full sync never completed (first time or interrupted)
      if (!hasCompletedFullSync) {
        let phase2Message = 'Fetching all posts...';
        if (existingCount === 0) {
          this.logger.log('Phase 2: First sync - fetching all posts...');
          phase2Message = 'First sync - fetching all posts...';
        } else if (hasResumeCursor) {
          this.logger.log('Phase 2: Resuming from saved cursor for remaining old posts...');
          phase2Message = 'Resuming sync from where we left off...';
        } else {
          this.logger.log('Phase 2: No cursor but sync incomplete - fetching all posts (will skip existing)...');
          phase2Message = 'Completing full sync...';
        }

        this.updateProgress(userId, {
          phase: 2,
          message: phase2Message,
        });

        // Start from cursor if we have one, otherwise from beginning
        let endCursor: string | undefined = hasResumeCursor ? user!.instagramSyncCursor! : undefined;
        let hasMore = true;
        let reachedEnd = false; // Track if we genuinely reached the end
        const maxPosts = 10000;

        while (hasMore && totalFetched < maxPosts) {
          const result = await this.instagramApiService.fetchSavedPosts(cookies, endCursor);

          // If empty posts returned, it's likely rate limit - don't mark as complete
          if (result.posts.length === 0) {
            this.logger.log('Empty batch received (possible rate limit) - will resume next sync');
            break;
          }

          for (const post of result.posts) {
            totalFetched++;

            const existing = await this.prisma.savedInstagramPost.findUnique({
              where: {
                userId_instagramPostId: { userId, instagramPostId: post.id },
              },
            });

            if (existing) {
              skippedPosts++;
              continue;
            }

            await this.createSavedPost(userId, post);
            newPosts++;
          }

          // Update progress after each batch
          this.updateProgress(userId, {
            totalFetched,
            newPosts,
            skippedPosts,
            message: `Fetched ${totalFetched} posts (${newPosts} new)...`,
          });

          hasMore = result.hasMore;
          endCursor = result.endCursor;

          // Only mark as reached end if we got posts AND hasMore is false
          if (!hasMore && result.posts.length > 0) {
            reachedEnd = true;
          }

          // Save cursor after each batch for resume
          if (endCursor) {
            await this.prisma.user.update({
              where: { id: userId },
              data: { instagramSyncCursor: endCursor },
            });
          }

          if (totalFetched % 100 === 0) {
            this.logger.log(`Phase 2 progress: ${totalFetched} fetched, ${newPosts} new, ${skippedPosts} skipped`);
          }

          if (hasMore) {
            await this.delay(1000 + Math.random() * 1000);
          }
        }

        // Only mark complete if we genuinely reached the end
        if (reachedEnd) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              instagramSyncCursor: null,
              instagramSyncCompletedAt: new Date(),
            },
          });
          this.logger.log('Full sync completed!');
        } else {
          this.logger.log('Sync interrupted - will continue from cursor next time');
        }
      }

      this.logger.log(`Sync done: ${newPosts} new, ${skippedPosts} skipped, ${totalFetched} total`);

      // Update progress to complete
      this.syncProgress.set(userId, {
        status: 'complete',
        phase: 2,
        totalFetched,
        newPosts,
        skippedPosts,
        message: `Complete! ${newPosts} new posts synced.`,
        startedAt: this.syncProgress.get(userId)?.startedAt || new Date(),
        updatedAt: new Date(),
      });

      // Clean up after 5 minutes
      setTimeout(() => this.syncProgress.delete(userId), 5 * 60 * 1000);

      return {
        success: true,
        totalFetched,
        newPosts,
        skippedPosts,
        message: `Synced ${newPosts} new posts`,
      };
    } catch (error) {
      this.logger.error('Sync failed', error);
      this.logger.log(`Cursor saved for resume. Fetched ${totalFetched} posts before error.`);

      // Update progress to error
      this.syncProgress.set(userId, {
        status: 'error',
        phase: this.syncProgress.get(userId)?.phase || 1,
        totalFetched,
        newPosts,
        skippedPosts,
        message: error instanceof Error ? error.message : 'Sync failed',
        startedAt: this.syncProgress.get(userId)?.startedAt || new Date(),
        updatedAt: new Date(),
      });

      return {
        success: false,
        totalFetched,
        newPosts,
        skippedPosts,
        message: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }

  /**
   * Helper to create a saved post record
   */
  private async createSavedPost(userId: string, post: any) {
    await this.prisma.savedInstagramPost.create({
      data: {
        userId,
        instagramPostId: post.id,
        shortcode: post.shortcode,
        caption: post.caption,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        ownerUsername: post.ownerUsername,
        ownerFullName: post.ownerFullName,
        ownerId: post.ownerId,
        postedAt: post.postedAt,
        isVideo: post.isVideo,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        status: SavedPostStatus.PENDING,
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch user's Instagram saved collections
   */
  async getCollections(dto: SyncInstagramDto): Promise<CollectionInfo[]> {
    const cookies = {
      sessionId: dto.sessionId,
      csrfToken: dto.csrfToken,
      dsUserId: dto.dsUserId,
      igWwwClaim: dto.igWwwClaim,
    };

    return this.instagramApiService.fetchCollections(cookies);
  }

  /**
   * Get saved posts with filtering and pagination
   */
  async getSavedPosts(userId: string, query: GetSavedPostsQueryDto): Promise<SavedPostsListResponseDto> {
    const { status, ownerUsername, collectionName, search, sortBy = 'fetchedAt', sortOrder = 'desc', page = 1, limit = 20 } = query;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (ownerUsername) {
      where.ownerUsername = ownerUsername;
    }

    if (collectionName) {
      where.collectionName = collectionName;
    }

    if (search) {
      where.OR = [
        { caption: { contains: search, mode: 'insensitive' } },
        { ownerUsername: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy dynamically
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [posts, total] = await Promise.all([
      this.prisma.savedInstagramPost.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.savedInstagramPost.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single saved post
   */
  async getSavedPost(userId: string, postId: string) {
    const post = await this.prisma.savedInstagramPost.findFirst({
      where: { id: postId, userId },
      include: { importedRecipe: true },
    });

    if (!post) {
      throw new NotFoundException('Saved post not found');
    }

    return post;
  }

  /**
   * Get filter options for saved posts
   */
  async getFilters(userId: string, status?: SavedPostStatus): Promise<FiltersResponseDto> {
    // Base where clause for usernames/collections - optionally filtered by status
    const filteredWhere = status ? { userId, status } : { userId };

    const [usernames, collections, statusCounts] = await Promise.all([
      this.prisma.savedInstagramPost.groupBy({
        by: ['ownerUsername'],
        where: filteredWhere,
        _count: true,
        orderBy: { _count: { ownerUsername: 'desc' } },
        take: 50,
      }),
      this.prisma.savedInstagramPost.groupBy({
        by: ['collectionName'],
        where: { ...filteredWhere, collectionName: { not: null } },
        _count: true,
        orderBy: { _count: { collectionName: 'desc' } },
      }),
      // Status counts always show totals (not filtered by status)
      this.prisma.savedInstagramPost.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
    ]);

    return {
      usernames: usernames.map(u => ({
        username: u.ownerUsername,
        count: u._count,
      })),
      collections: collections.map(c => ({
        name: c.collectionName!,
        count: c._count,
      })),
      statusCounts: statusCounts.map(s => ({
        status: s.status,
        count: s._count,
      })),
    };
  }

  /**
   * Parse a saved post with AI to extract recipe
   */
  async parsePost(userId: string, postId: string): Promise<ParsedPostDto> {
    const post = await this.getSavedPost(userId, postId);

    if (!post.caption) {
      throw new BadRequestException('Post has no caption to parse');
    }

    // Detect language
    const detectedLanguage = await this.detectLanguage(post.caption);

    // Update post with detected language
    await this.prisma.savedInstagramPost.update({
      where: { id: postId },
      data: { detectedLanguage },
    });

    // Parse with AI
    const parsed = await this.aiService.parseRecipeFromText(post.caption);

    // Check if steps exist
    const hasSteps = parsed.components?.some(c => c.steps && c.steps.length > 0) || false;

    return {
      ...parsed,
      confidence: parsed.confidence ?? 0.5,
      detectedLanguage,
      needsTranslation: detectedLanguage !== 'en',
      hasSteps,
    };
  }

  /**
   * Translate a post's caption to English
   */
  async translateCaption(userId: string, postId: string): Promise<{ translatedCaption: string }> {
    const post = await this.getSavedPost(userId, postId);

    if (!post.caption) {
      throw new BadRequestException('Post has no caption to translate');
    }

    const translated = await this.translateToEnglish(post.caption, post.detectedLanguage || 'auto');

    await this.prisma.savedInstagramPost.update({
      where: { id: postId },
      data: { captionTranslated: translated },
    });

    return { translatedCaption: translated };
  }

  /**
   * Generate cooking steps using AI
   */
  async generateSteps(
    title: string,
    ingredients: { quantity?: number; unit?: string; name: string }[],
  ): Promise<{ steps: { order: number; instruction: string; duration?: number; tips?: string }[] }> {
    const ingredientList = ingredients
      .map(i => {
        const qty = i.quantity ? `${i.quantity} ` : '';
        const unit = i.unit ? `${i.unit} ` : '';
        return `${qty}${unit}${i.name}`;
      })
      .join(', ');

    const prompt = `Generate cooking steps for "${title}" using these ingredients: ${ingredientList}`;

    // Use AI service to generate steps
    const result = await this.aiService.parseRecipeFromText(prompt);

    return {
      steps: result.components?.[0]?.steps || [],
    };
  }

  /**
   * Import a single post as a recipe
   */
  async importSinglePost(
    userId: string,
    postId: string,
    dto: ImportSinglePostDto,
  ): Promise<{ recipeId: string }> {
    const post = await this.getSavedPost(userId, postId);

    if (post.status === SavedPostStatus.IMPORTED) {
      throw new BadRequestException('Post already imported');
    }

    // Detect language from caption if not already detected
    const detectedLanguage = post.detectedLanguage ||
      (post.caption ? await this.detectLanguage(post.caption) : 'en');

    // Create recipe
    const recipe = await this.prisma.recipe.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        prepTimeMinutes: dto.prepTimeMinutes,
        cookTimeMinutes: dto.cookTimeMinutes,
        totalTimeMinutes: (dto.prepTimeMinutes || 0) + (dto.cookTimeMinutes || 0) || null,
        difficulty: dto.difficulty as RecipeDifficulty || null,
        category: dto.category as RecipeCategory || null,
        cuisine: dto.cuisine,
        tags: dto.tags || [],
        servings: dto.servings || 4,
        source: RecipeSource.INSTAGRAM_URL,
        sourceUrl: `https://www.instagram.com/p/${post.shortcode}/`,
        sourceAuthor: post.ownerUsername,
        instagramPostId: post.instagramPostId,
        instagramCaption: post.caption,
        components: dto.components as any,
        languageDetected: detectedLanguage,
        originalLanguage: detectedLanguage,
      },
    });

    // Update saved post status
    await this.prisma.savedInstagramPost.update({
      where: { id: postId },
      data: {
        status: SavedPostStatus.IMPORTED,
        importedRecipeId: recipe.id,
        importedAt: new Date(),
      },
    });

    this.logger.log(`Imported post ${postId} as recipe ${recipe.id}`);

    return { recipeId: recipe.id };
  }

  /**
   * Queue bulk import job
   */
  async queueBulkImport(userId: string, dto: BulkImportDto): Promise<BulkImportResponseDto> {
    if (dto.postIds.length === 0) {
      throw new BadRequestException('No posts selected for import');
    }

    if (dto.postIds.length > 50) {
      throw new BadRequestException('Maximum 50 posts per bulk import');
    }

    // Verify all posts exist and belong to user
    const posts = await this.prisma.savedInstagramPost.findMany({
      where: {
        id: { in: dto.postIds },
        userId,
      },
    });

    // Check for missing posts
    if (posts.length !== dto.postIds.length) {
      const foundIds = new Set(posts.map(p => p.id));
      const missingCount = dto.postIds.filter(id => !foundIds.has(id)).length;
      throw new BadRequestException(`${missingCount} posts not found or don't belong to you`);
    }

    // Check for posts that aren't in PENDING status
    const pendingPosts = posts.filter(p => p.status === SavedPostStatus.PENDING);
    if (pendingPosts.length !== posts.length) {
      const notPendingCount = posts.length - pendingPosts.length;
      const statuses = posts.filter(p => p.status !== SavedPostStatus.PENDING)
        .map(p => p.status)
        .filter((v, i, a) => a.indexOf(v) === i);
      throw new BadRequestException(
        `${notPendingCount} posts already processed (status: ${statuses.join(', ')}). Please deselect them and try again.`
      );
    }

    // Create import job with only pending posts
    const pendingPostIds = pendingPosts.map(p => p.id);
    const job = await this.prisma.importJob.create({
      data: {
        userId,
        status: ImportJobStatus.PENDING,
        totalPosts: pendingPosts.length,
        postIds: pendingPostIds,
      },
    });

    // Start processing in background
    this.processBulkImport(job.id).catch(err => {
      this.logger.error(`Bulk import job ${job.id} failed`, err);
    });

    return {
      jobId: job.id,
      status: 'PENDING',
      totalPosts: pendingPosts.length,
      message: `Import job created for ${pendingPosts.length} posts`,
    };
  }

  /**
   * Process bulk import job with parallel processing
   */
  private async processBulkImport(jobId: string): Promise<void> {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Update job status
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.PROCESSING,
        startedAt: new Date(),
      },
    });

    let processedPosts = 0;
    let successfulPosts = 0;
    let failedPosts = 0;

    // Concurrency limit for parallel processing
    const CONCURRENCY_LIMIT = 4;

    // Process posts in parallel batches
    const postIds = [...job.postIds];

    while (postIds.length > 0) {
      // Take up to CONCURRENCY_LIMIT posts for parallel processing
      const batch = postIds.splice(0, CONCURRENCY_LIMIT);

      const results = await Promise.allSettled(
        batch.map(async (postId) => {
          const post = await this.prisma.savedInstagramPost.findUnique({
            where: { id: postId },
          });

          if (!post || !post.caption) {
            throw new Error('Post not found or has no caption');
          }

          // Parse the post
          const parsed = await this.aiService.parseRecipeFromText(post.caption);

          // Import as recipe
          await this.importSinglePost(job.userId, postId, {
            title: parsed.title || `Recipe from ${post.ownerUsername}`,
            description: parsed.description,
            prepTimeMinutes: parsed.prepTimeMinutes,
            cookTimeMinutes: parsed.cookTimeMinutes,
            servings: parsed.servings,
            difficulty: parsed.difficulty,
            category: parsed.category,
            cuisine: parsed.cuisine,
            tags: parsed.tags,
            components: parsed.components || [],
          });

          return postId;
        })
      );

      // Process results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const postId = batch[i];

        if (result.status === 'fulfilled') {
          successfulPosts++;
        } else {
          this.logger.warn(`Failed to import post ${postId}`, result.reason);

          // Mark post as failed
          await this.prisma.savedInstagramPost.update({
            where: { id: postId },
            data: { status: SavedPostStatus.FAILED },
          });

          failedPosts++;
        }
        processedPosts++;
      }

      // Update job progress after each batch
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          processedPosts,
          successfulPosts,
          failedPosts,
        },
      });

      // Small delay between batches to avoid overwhelming the API
      if (postIds.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Complete job
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    this.logger.log(`Bulk import job ${jobId} completed: ${successfulPosts} success, ${failedPosts} failed`);
  }

  /**
   * Get import job status
   */
  async getImportJobStatus(userId: string, jobId: string): Promise<ImportJobStatusDto> {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Import job not found');
    }

    return {
      id: job.id,
      status: job.status,
      totalPosts: job.totalPosts,
      processedPosts: job.processedPosts,
      successfulPosts: job.successfulPosts,
      failedPosts: job.failedPosts,
      errorMessage: job.errorMessage || undefined,
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
    };
  }

  /**
   * Dismiss posts
   */
  async dismissPosts(userId: string, postIds: string[]): Promise<{ dismissed: number }> {
    const result = await this.prisma.savedInstagramPost.updateMany({
      where: {
        id: { in: postIds },
        userId,
        status: SavedPostStatus.PENDING,
      },
      data: { status: SavedPostStatus.DISMISSED },
    });

    return { dismissed: result.count };
  }

  /**
   * Restore a dismissed post
   */
  async restorePost(userId: string, postId: string): Promise<{ success: boolean }> {
    const post = await this.prisma.savedInstagramPost.findFirst({
      where: { id: postId, userId, status: SavedPostStatus.DISMISSED },
    });

    if (!post) {
      throw new NotFoundException('Dismissed post not found');
    }

    await this.prisma.savedInstagramPost.update({
      where: { id: postId },
      data: { status: SavedPostStatus.PENDING },
    });

    return { success: true };
  }

  /**
   * Permanently delete posts
   */
  async deletePosts(userId: string, postIds: string[]): Promise<{ deleted: number }> {
    const result = await this.prisma.savedInstagramPost.deleteMany({
      where: {
        id: { in: postIds },
        userId,
      },
    });

    this.logger.log(`Deleted ${result.count} posts for user ${userId}`);
    return { deleted: result.count };
  }

  /**
   * Delete all posts by status
   */
  async deleteAllByStatus(userId: string, status: SavedPostStatus): Promise<{ deleted: number }> {
    const result = await this.prisma.savedInstagramPost.deleteMany({
      where: {
        userId,
        status,
      },
    });

    this.logger.log(`Deleted ${result.count} ${status} posts for user ${userId}`);
    return { deleted: result.count };
  }

  /**
   * Get all post IDs by filters (for mass selection)
   */
  async getPostIdsByFilters(
    userId: string,
    filters: {
      status?: SavedPostStatus;
      search?: string;
      ownerUsername?: string;
      collectionName?: string;
    },
  ): Promise<{ ids: string[]; count: number }> {
    const where: any = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.ownerUsername) {
      where.ownerUsername = filters.ownerUsername;
    }

    if (filters.collectionName) {
      where.collectionName = filters.collectionName;
    }

    if (filters.search) {
      where.caption = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const posts = await this.prisma.savedInstagramPost.findMany({
      where,
      select: { id: true },
      orderBy: { fetchedAt: 'desc' },  // Match grid ordering
    });

    console.log(`[getPostIdsByFilters] Found ${posts.length} posts for filters:`, filters);

    return {
      ids: posts.map(p => p.id),
      count: posts.length,
    };
  }

  /**
   * Detect language of text using pattern matching
   */
  private async detectLanguage(text: string): Promise<string> {
    // Non-Latin script detection
    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4E00-\u9FFF]/;
    const japanesePattern = /[\u3040-\u30FF]/;
    const koreanPattern = /[\uAC00-\uD7AF]/;
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const hebrewPattern = /[\u0590-\u05FF]/;
    const thaiPattern = /[\u0E00-\u0E7F]/;
    const greekPattern = /[\u0370-\u03FF]/;

    if (arabicPattern.test(text)) return 'ar';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    if (koreanPattern.test(text)) return 'ko';
    if (cyrillicPattern.test(text)) return 'ru';
    if (hebrewPattern.test(text)) return 'he';
    if (thaiPattern.test(text)) return 'th';
    if (greekPattern.test(text)) return 'el';

    // Latin-script languages with unique character patterns
    // Turkish: ğ, ş, ı (dotless i), İ (dotted I), ç, ö, ü
    const turkishPattern = /[ğĞşŞıİçÇöÖüÜ]/;
    if (turkishPattern.test(text)) return 'tr';

    // Polish: ą, ć, ę, ł, ń, ó, ś, ź, ż
    const polishPattern = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
    if (polishPattern.test(text)) return 'pl';

    // Vietnamese: ă, â, đ, ê, ô, ơ, ư + tone marks
    const vietnamesePattern = /[ăâđêôơưĂÂĐÊÔƠƯ]/;
    if (vietnamesePattern.test(text)) return 'vi';

    // Czech/Slovak: ř, ů, ě, ď, ť, ň
    const czechPattern = /[řůěďťňŘŮĚĎŤŇ]/;
    if (czechPattern.test(text)) return 'cs';

    // Hungarian: ő, ű
    const hungarianPattern = /[őűŐŰ]/;
    if (hungarianPattern.test(text)) return 'hu';

    // Romanian: ș, ț, ă, â, î
    const romanianPattern = /[șțăâîȘȚĂÂÎ]/;
    if (romanianPattern.test(text)) return 'ro';

    // Default to English for standard Latin text
    return 'en';
  }

  /**
   * Translate text to English using AI
   */
  private async translateToEnglish(text: string, sourceLanguage: string): Promise<string> {
    // This would use the AI service for translation
    // For now, return original text with a note
    const systemPrompt = `Translate the following text to English. Return only the translated text, no explanations.`;

    // Would call AI service here
    // return await this.aiService.translate(text, sourceLanguage, 'en');

    return text; // Placeholder - implement with AI service
  }

  /**
   * Reload image for a single post (fetch fresh URL from Instagram)
   */
  async reloadPostImage(
    userId: string,
    postId: string,
    cookies: { sessionId: string; csrfToken: string; dsUserId?: string; igWwwClaim?: string },
  ): Promise<{ success: boolean; imageUrl?: string; message?: string }> {
    const post = await this.prisma.savedInstagramPost.findFirst({
      where: { id: postId, userId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const freshPost = await this.instagramApiService.fetchPostByShortcode(cookies, post.shortcode);

    if (!freshPost || !freshPost.imageUrl) {
      return { success: false, message: 'Could not fetch fresh image from Instagram' };
    }

    // Update the post with fresh image URL
    await this.prisma.savedInstagramPost.update({
      where: { id: postId },
      data: {
        imageUrl: freshPost.imageUrl,
        videoUrl: freshPost.videoUrl || post.videoUrl,
      },
    });

    this.logger.log(`Reloaded image for post ${postId}`);
    return { success: true, imageUrl: freshPost.imageUrl };
  }

  /**
   * Bulk reload images for multiple posts
   */
  async bulkReloadImages(
    userId: string,
    postIds: string[],
    cookies: { sessionId: string; csrfToken: string; dsUserId?: string; igWwwClaim?: string },
  ): Promise<{ success: number; failed: number; results: { postId: string; success: boolean; message?: string }[] }> {
    if (postIds.length === 0) {
      throw new BadRequestException('No posts selected');
    }

    if (postIds.length > 50) {
      throw new BadRequestException('Maximum 50 posts per bulk reload');
    }

    // Verify all posts exist and belong to user
    const posts = await this.prisma.savedInstagramPost.findMany({
      where: { id: { in: postIds }, userId },
      select: { id: true, shortcode: true },
    });

    const postMap = new Map(posts.map(p => [p.id, p]));
    const results: { postId: string; success: boolean; message?: string }[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Process in batches to avoid rate limiting
    const BATCH_SIZE = 5;
    for (let i = 0; i < postIds.length; i += BATCH_SIZE) {
      const batch = postIds.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (postId) => {
          const post = postMap.get(postId);
          if (!post) {
            results.push({ postId, success: false, message: 'Post not found' });
            failedCount++;
            return;
          }

          try {
            const result = await this.reloadPostImage(userId, postId, cookies);
            results.push({ postId, ...result });
            if (result.success) {
              successCount++;
            } else {
              failedCount++;
            }
          } catch (error) {
            results.push({
              postId,
              success: false,
              message: error instanceof Error ? error.message : 'Unknown error',
            });
            failedCount++;
          }
        })
      );

      // Delay between batches
      if (i + BATCH_SIZE < postIds.length) {
        await this.delay(1000);
      }
    }

    this.logger.log(`Bulk reload complete: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount, results };
  }

  /**
   * Download video for a recipe using Instagram cookies
   */
  async downloadVideoForRecipe(
    userId: string,
    recipeId: string,
    cookies: { sessionId: string; csrfToken: string; dsUserId?: string; igWwwClaim?: string },
  ): Promise<{ success: boolean; videoUrl?: string; message?: string }> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (!recipe.sourceUrl) {
      throw new BadRequestException('Recipe has no Instagram source URL');
    }

    // Extract shortcode from source URL
    const shortcodeMatch = recipe.sourceUrl.match(/\/(p|reel|reels)\/([A-Za-z0-9_-]+)/);
    if (!shortcodeMatch) {
      throw new BadRequestException('Could not extract Instagram shortcode from source URL');
    }
    const shortcode = shortcodeMatch[2];

    this.logger.log(`Fetching fresh video for recipe ${recipeId} from shortcode ${shortcode}`);

    // Fetch fresh post data from Instagram
    const freshPost = await this.instagramApiService.fetchPostByShortcode(cookies, shortcode);

    this.logger.log(`Fresh post result: ${JSON.stringify({
      found: !!freshPost,
      isVideo: freshPost?.isVideo,
      hasVideoUrl: !!freshPost?.videoUrl,
      videoUrl: freshPost?.videoUrl?.substring(0, 100),
    })}`);

    if (!freshPost) {
      return { success: false, message: 'Could not fetch post data from Instagram. Please make sure you are logged in.' };
    }

    if (!freshPost.videoUrl) {
      return {
        success: false,
        message: freshPost.isVideo
          ? 'Post is a video but URL could not be extracted. Instagram may have changed their API.'
          : 'This post is not a video (it appears to be an image).'
      };
    }

    // Download the video
    try {
      const response = await fetch(freshPost.videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Video fetch failed with status ${response.status}`);
        return { success: false, message: `Failed to download video: ${response.status}` };
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'video/mp4';

      // Determine file extension
      const ext = contentType.includes('mp4') ? '.mp4' : contentType.includes('webm') ? '.webm' : '.mp4';
      const filename = `${require('crypto').randomUUID()}${ext}`;

      // Ensure videos directory exists
      const videosDir = require('path').join(process.cwd(), 'uploads', 'videos');
      if (!require('fs').existsSync(videosDir)) {
        require('fs').mkdirSync(videosDir, { recursive: true });
      }

      // Save the video
      const filePath = require('path').join(videosDir, filename);
      require('fs').writeFileSync(filePath, buffer);

      // Update recipe with local video URL
      const localVideoUrl = `/uploads/videos/${filename}`;
      await this.prisma.recipe.update({
        where: { id: recipeId },
        data: { videoUrl: localVideoUrl },
      });

      this.logger.log(`Downloaded video for recipe ${recipeId}: ${localVideoUrl}`);
      return { success: true, videoUrl: localVideoUrl };
    } catch (error) {
      this.logger.error(`Failed to download video for recipe ${recipeId}`, error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to download video' };
    }
  }

  /**
   * Upload image for a recipe (from extension, already downloaded with cookies)
   */
  async uploadImageForRecipe(
    userId: string,
    recipeId: string,
    base64Data: string,
    contentType: string,
  ): Promise<{ success: boolean; imageUrl?: string; message?: string }> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Determine file extension
      const extMap: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
      };
      const ext = extMap[contentType] || '.jpg';

      // Generate unique filename
      const filename = `${require('crypto').randomUUID()}${ext}`;

      // Ensure images directory exists
      const imagesDir = require('path').join(process.cwd(), 'uploads', 'images');
      if (!require('fs').existsSync(imagesDir)) {
        require('fs').mkdirSync(imagesDir, { recursive: true });
      }

      // Save the image
      const filePath = require('path').join(imagesDir, filename);
      require('fs').writeFileSync(filePath, buffer);

      // Update recipe with local image URL
      const localImageUrl = `/uploads/images/${filename}`;
      await this.prisma.recipe.update({
        where: { id: recipeId },
        data: { imageUrl: localImageUrl },
      });

      this.logger.log(`Uploaded image for recipe ${recipeId}: ${localImageUrl} (${buffer.length} bytes)`);
      return { success: true, imageUrl: localImageUrl };
    } catch (error) {
      this.logger.error(`Failed to upload image for recipe ${recipeId}`, error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to upload image' };
    }
  }
}
