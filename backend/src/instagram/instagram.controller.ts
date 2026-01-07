import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InstagramService, SyncProgress } from './instagram.service';
import { CollectionInfo } from './instagram-api.service';
import {
  SyncInstagramDto,
  GetSavedPostsQueryDto,
  GetFiltersQueryDto,
  DismissPostsDto,
  ImportSinglePostDto,
  BulkImportDto,
  GenerateStepsDto,
  ReloadImageDto,
  BulkReloadImagesDto,
} from './dto';

@Controller('instagram')
@UseGuards(JwtAuthGuard)
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  /**
   * Sync saved posts from Instagram
   * POST /api/instagram/sync
   */
  @Post('sync')
  async syncSavedPosts(@Request() req: any, @Body() dto: SyncInstagramDto) {
    return this.instagramService.syncSavedPosts(req.user.id, dto);
  }

  /**
   * Get current sync progress
   * GET /api/instagram/sync/status
   */
  @Get('sync/status')
  async getSyncStatus(@Request() req: any): Promise<SyncProgress | { status: 'idle' }> {
    const progress = this.instagramService.getSyncProgress(req.user.id);
    if (!progress) {
      return { status: 'idle' };
    }
    return progress;
  }

  /**
   * Get user's Instagram saved collections
   * POST /api/instagram/collections
   */
  @Post('collections')
  async getCollections(@Body() dto: SyncInstagramDto): Promise<CollectionInfo[]> {
    return this.instagramService.getCollections(dto);
  }

  /**
   * Get saved posts with filters
   * GET /api/instagram/saved-posts
   */
  @Get('saved-posts')
  async getSavedPosts(@Request() req: any, @Query() query: GetSavedPostsQueryDto) {
    return this.instagramService.getSavedPosts(req.user.id, query);
  }

  /**
   * Get filter options (usernames, collections, status counts)
   * GET /api/instagram/saved-posts/filters
   */
  @Get('saved-posts/filters')
  async getFilters(@Request() req: any, @Query() query: GetFiltersQueryDto) {
    return this.instagramService.getFilters(req.user.id, query.status);
  }

  /**
   * Get all post IDs by filters (for mass selection)
   * GET /api/instagram/saved-posts/ids
   * NOTE: Must be before :id route to avoid conflict
   */
  @Get('saved-posts/ids')
  async getPostIdsByFilters(
    @Request() req: any,
    @Query('status') status?: 'PENDING' | 'DISMISSED' | 'IMPORTED' | 'FAILED',
    @Query('search') search?: string,
    @Query('ownerUsername') ownerUsername?: string,
    @Query('collectionName') collectionName?: string,
  ) {
    return this.instagramService.getPostIdsByFilters(req.user.id, {
      status: status as any,
      search,
      ownerUsername,
      collectionName,
    });
  }

  /**
   * Get a single saved post
   * GET /api/instagram/saved-posts/:id
   */
  @Get('saved-posts/:id')
  async getSavedPost(@Request() req: any, @Param('id') id: string) {
    return this.instagramService.getSavedPost(req.user.id, id);
  }

  /**
   * Parse post with AI to extract recipe
   * POST /api/instagram/saved-posts/:id/parse
   */
  @Post('saved-posts/:id/parse')
  async parsePost(@Request() req: any, @Param('id') id: string) {
    return this.instagramService.parsePost(req.user.id, id);
  }

  /**
   * Translate post caption to English
   * POST /api/instagram/saved-posts/:id/translate
   */
  @Post('saved-posts/:id/translate')
  async translateCaption(@Request() req: any, @Param('id') id: string) {
    return this.instagramService.translateCaption(req.user.id, id);
  }

  /**
   * Generate cooking steps with AI
   * POST /api/instagram/saved-posts/:id/generate-steps
   */
  @Post('saved-posts/:id/generate-steps')
  async generateSteps(@Request() req: any, @Body() dto: GenerateStepsDto) {
    return this.instagramService.generateSteps(dto.title, dto.ingredients);
  }

  /**
   * Import single post as recipe
   * POST /api/instagram/saved-posts/:id/import
   */
  @Post('saved-posts/:id/import')
  async importSinglePost(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ImportSinglePostDto,
  ) {
    return this.instagramService.importSinglePost(req.user.id, id, dto);
  }

  /**
   * Queue bulk import job
   * POST /api/instagram/import/bulk
   */
  @Post('import/bulk')
  async queueBulkImport(@Request() req: any, @Body() dto: BulkImportDto) {
    return this.instagramService.queueBulkImport(req.user.id, dto);
  }

  /**
   * Get import job status
   * GET /api/instagram/import-jobs/:id
   */
  @Get('import-jobs/:id')
  async getImportJobStatus(@Request() req: any, @Param('id') id: string) {
    return this.instagramService.getImportJobStatus(req.user.id, id);
  }

  /**
   * Dismiss multiple posts
   * PATCH /api/instagram/saved-posts/dismiss
   */
  @Patch('saved-posts/dismiss')
  async dismissPosts(@Request() req: any, @Body() dto: DismissPostsDto) {
    return this.instagramService.dismissPosts(req.user.id, dto.postIds);
  }

  /**
   * Restore a dismissed post
   * PATCH /api/instagram/saved-posts/:id/restore
   */
  @Patch('saved-posts/:id/restore')
  async restorePost(@Request() req: any, @Param('id') id: string) {
    return this.instagramService.restorePost(req.user.id, id);
  }

  /**
   * Reload image for a single post
   * POST /api/instagram/saved-posts/:id/reload-image
   */
  @Post('saved-posts/:id/reload-image')
  async reloadPostImage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReloadImageDto,
  ) {
    return this.instagramService.reloadPostImage(req.user.id, id, {
      sessionId: dto.sessionId,
      csrfToken: dto.csrfToken,
      dsUserId: dto.dsUserId,
      igWwwClaim: dto.igWwwClaim,
    });
  }

  /**
   * Bulk reload images for multiple posts
   * POST /api/instagram/saved-posts/reload-images
   */
  @Post('saved-posts/reload-images')
  async bulkReloadImages(@Request() req: any, @Body() dto: BulkReloadImagesDto) {
    return this.instagramService.bulkReloadImages(req.user.id, dto.postIds, {
      sessionId: dto.sessionId,
      csrfToken: dto.csrfToken,
      dsUserId: dto.dsUserId,
      igWwwClaim: dto.igWwwClaim,
    });
  }

  /**
   * Download video for a recipe
   * POST /api/instagram/recipes/:id/download-video
   */
  @Post('recipes/:id/download-video')
  async downloadVideoForRecipe(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReloadImageDto,
  ) {
    return this.instagramService.downloadVideoForRecipe(req.user.id, id, {
      sessionId: dto.sessionId,
      csrfToken: dto.csrfToken,
      dsUserId: dto.dsUserId,
      igWwwClaim: dto.igWwwClaim,
    });
  }

  /**
   * Upload image for a recipe (from extension with base64 data)
   * POST /api/instagram/recipes/:id/upload-image
   */
  @Post('recipes/:id/upload-image')
  async uploadImageForRecipe(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { imageData: string; contentType: string },
  ) {
    return this.instagramService.uploadImageForRecipe(req.user.id, id, dto.imageData, dto.contentType);
  }

  /**
   * Delete multiple posts permanently
   * DELETE /api/instagram/saved-posts
   */
  @Delete('saved-posts')
  async deletePosts(@Request() req: any, @Body() dto: DismissPostsDto) {
    return this.instagramService.deletePosts(req.user.id, dto.postIds);
  }

  /**
   * Delete all posts by status
   * DELETE /api/instagram/saved-posts/by-status/:status
   */
  @Delete('saved-posts/by-status/:status')
  async deleteAllByStatus(
    @Request() req: any,
    @Param('status') status: 'PENDING' | 'DISMISSED' | 'IMPORTED' | 'FAILED',
  ) {
    return this.instagramService.deleteAllByStatus(req.user.id, status as any);
  }
}
