import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ForkEnhancementsService } from './fork-enhancements.service';
import { UpdateForkTagsDto } from './dto/fork-enhancements.dto';

@Controller('fork-enhancements')
@UseGuards(JwtAuthGuard)
export class ForkEnhancementsController {
  constructor(
    private readonly forkEnhancementsService: ForkEnhancementsService,
  ) {}

  // ==================== FORK LINEAGE ====================

  @Get('recipes/:recipeId/lineage')
  getForkLineage(@Param('recipeId') recipeId: string) {
    return this.forkEnhancementsService.getForkLineage(recipeId);
  }

  @Get('recipes/:recipeId/genealogy-tree')
  getGenealogyTree(
    @Param('recipeId') recipeId: string,
    @Query('maxDepth') maxDepth?: string,
  ) {
    return this.forkEnhancementsService.getGenealogyTree(
      recipeId,
      maxDepth ? parseInt(maxDepth, 10) : undefined,
    );
  }

  @Get('recipes/:recipeId/inspired-recipes')
  getInspiredRecipes(
    @Param('recipeId') recipeId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.forkEnhancementsService.getInspiredRecipes(
      recipeId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  @Get('trending')
  getTrendingForks(@Query('limit') limit?: string) {
    return this.forkEnhancementsService.getTrendingForks(
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  // ==================== FORK TAGS ====================

  @Get('tags/options')
  getForkTagOptions() {
    return this.forkEnhancementsService.getForkTagOptions();
  }

  @Put('recipes/:recipeId/tags')
  updateForkTags(
    @Param('recipeId') recipeId: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateForkTagsDto,
  ) {
    return this.forkEnhancementsService.updateForkTags(
      recipeId,
      req.user.id,
      dto.tags,
    );
  }

  // ==================== FORK VOTING ====================

  @Post('recipes/:recipeId/vote')
  voteFork(
    @Param('recipeId') recipeId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.forkEnhancementsService.voteFork(recipeId, req.user.id);
  }

  @Delete('recipes/:recipeId/vote')
  unvoteFork(
    @Param('recipeId') recipeId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.forkEnhancementsService.unvoteFork(recipeId, req.user.id);
  }

  @Get('recipes/:recipeId/vote-stats')
  getForkVoteStats(
    @Param('recipeId') recipeId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.forkEnhancementsService.getForkVoteStats(recipeId, req.user.id);
  }

  // ==================== SMART FORK SUGGESTIONS ====================

  @Get('recipes/:recipeId/smart-suggestions')
  getSmartForkSuggestions(
    @Param('recipeId') recipeId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.forkEnhancementsService.getSmartForkSuggestions(
      recipeId,
      req.user.id,
    );
  }

  // ==================== FORK CHANGELOG ====================

  @Get('recipes/:forkId/changelog')
  async getForkChangelog(@Param('forkId') forkId: string) {
    // First get the parent recipe ID
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const fork = await prisma.recipe.findUnique({
      where: { id: forkId },
      select: { parentRecipeId: true },
    });
    await prisma.$disconnect();

    if (!fork?.parentRecipeId) {
      return { error: 'Not a forked recipe' };
    }

    return this.forkEnhancementsService.generateForkChangelog(
      forkId,
      fork.parentRecipeId,
    );
  }

  // ==================== FORK GALLERY ====================

  @Get('recipes/:recipeId/gallery')
  getForkGallery(
    @Param('recipeId') recipeId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.forkEnhancementsService.getForkGallery(recipeId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
    });
  }

  // ==================== FORK ANALYTICS ====================

  @Get('analytics')
  getForkAnalytics(@Request() req: { user: { id: string } }) {
    return this.forkEnhancementsService.getForkAnalytics(req.user.id);
  }

  // ==================== FORK COMPARISON MATRIX ====================

  @Get('recipes/:recipeId/comparison-matrix')
  getForkComparisonMatrix(@Param('recipeId') recipeId: string) {
    return this.forkEnhancementsService.getForkComparisonMatrix(recipeId);
  }

  // ==================== COOK TRIALS + VALIDATION BADGES ====================

  @Get('recipes/:recipeId/validation-stats')
  getForkValidationStats(@Param('recipeId') recipeId: string) {
    return this.forkEnhancementsService.getForkValidationStats(recipeId);
  }

  @Get('recipes/:recipeId/top-validated-forks')
  getTopValidatedForks(
    @Param('recipeId') recipeId: string,
    @Query('limit') limit?: string,
  ) {
    return this.forkEnhancementsService.getTopValidatedForks(
      recipeId,
      limit ? parseInt(limit, 10) : 5,
    );
  }

  // ==================== AUTO-FORK TEMPLATES ====================

  @Get('auto-fork/templates')
  getAutoForkTemplates() {
    return this.forkEnhancementsService.getAutoForkTemplates();
  }

  @Get('auto-fork/templates/by-category')
  getAutoForkTemplatesByCategory() {
    return this.forkEnhancementsService.getAutoForkTemplatesByCategory();
  }

  @Get('recipes/:recipeId/auto-fork/preview/:templateId')
  previewAutoFork(
    @Param('recipeId') recipeId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.forkEnhancementsService.previewAutoFork(recipeId, templateId);
  }

  @Post('recipes/:recipeId/auto-fork/:templateId')
  applyAutoFork(
    @Param('recipeId') recipeId: string,
    @Param('templateId') templateId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.forkEnhancementsService.applyAutoFork(
      recipeId,
      templateId,
      req.user.id,
    );
  }

  // ==================== FORK OUTCOME PREDICTION ====================

  @Get('recipes/:recipeId/outcome-prediction')
  getForkOutcomePrediction(@Param('recipeId') recipeId: string) {
    return this.forkEnhancementsService.getForkOutcomePrediction(recipeId);
  }
}
