import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FlavorDnaService } from './flavor-dna.service';
import { TrackInteractionDto } from './dto/interaction.dto';
import {
  CreateCookingReviewDto,
  UpdateCookingReviewDto,
} from './dto/cooking-review.dto';
import { CreateSeasoningFeedbackDto } from './dto/seasoning-feedback.dto';

@Controller('flavor-dna')
@UseGuards(JwtAuthGuard)
export class FlavorDnaController {
  constructor(private readonly flavorDnaService: FlavorDnaService) {}

  // ==================== INTERACTIONS ====================

  @Post('interactions')
  async trackInteraction(
    @Request() req: { user: { id: string } },
    @Body() dto: TrackInteractionDto,
  ) {
    return this.flavorDnaService.trackInteraction(req.user.id, dto);
  }

  @Get('interactions/recent')
  async getRecentInteractions(
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: string,
  ) {
    return this.flavorDnaService.getUserRecentInteractions(
      req.user.id,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('interactions/recipe/:recipeId/stats')
  async getRecipeInteractionStats(@Param('recipeId') recipeId: string) {
    return this.flavorDnaService.getRecipeInteractionStats(recipeId);
  }

  // ==================== COOKING REVIEWS ====================

  @Post('reviews')
  async createReview(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateCookingReviewDto,
  ) {
    return this.flavorDnaService.createCookingReview(req.user.id, dto);
  }

  @Put('reviews/:reviewId')
  async updateReview(
    @Request() req: { user: { id: string } },
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateCookingReviewDto,
  ) {
    return this.flavorDnaService.updateCookingReview(
      reviewId,
      req.user.id,
      dto,
    );
  }

  @Get('reviews/recipe/:recipeId')
  async getUserReviewForRecipe(
    @Request() req: { user: { id: string } },
    @Param('recipeId') recipeId: string,
  ) {
    return this.flavorDnaService.getUserReviewForRecipe(
      req.user.id,
      recipeId,
    );
  }

  @Get('reviews/recipe/:recipeId/stats')
  async getRecipeReviewStats(@Param('recipeId') recipeId: string) {
    return this.flavorDnaService.getRecipeReviewStats(recipeId);
  }

  // ==================== SEASONING FEEDBACK (SALT SENSE) ====================

  @Post('seasoning')
  async recordSeasoningFeedback(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateSeasoningFeedbackDto,
  ) {
    return this.flavorDnaService.recordSeasoningFeedback(req.user.id, dto);
  }

  @Get('seasoning/preferences')
  async getSeasoningPreferences(@Request() req: { user: { id: string } }) {
    return this.flavorDnaService.getUserSeasoningPreferences(req.user.id);
  }

  // ==================== FLAVOR PROFILE ====================

  @Get('profile')
  async getFlavorProfile(@Request() req: { user: { id: string } }) {
    return this.flavorDnaService.getFlavorProfile(req.user.id);
  }

  @Get('profile/summary')
  async getFlavorProfileSummary(@Request() req: { user: { id: string } }) {
    return this.flavorDnaService.getFlavorProfileSummary(req.user.id);
  }

  // ==================== RECOMMENDATIONS ====================

  @Get('recommendations')
  async getRecommendedRecipes(
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: string,
  ) {
    return this.flavorDnaService.getRecommendedRecipes(
      req.user.id,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  // ==================== RECIPE MATCH SCORE ====================

  @Get('recipes/:recipeId/match-score')
  async getRecipeMatchScore(
    @Request() req: { user: { id: string } },
    @Param('recipeId') recipeId: string,
  ) {
    return this.flavorDnaService.getRecipeMatchScore(req.user.id, recipeId);
  }

  // ==================== TASTE TWIN MATCHING ====================

  @Get('taste-twins')
  async findTasteTwins(
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: string,
  ) {
    return this.flavorDnaService.findTasteTwins(
      req.user.id,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('compatibility/:targetUserId')
  async getTasteCompatibility(
    @Request() req: { user: { id: string } },
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.flavorDnaService.getTasteCompatibility(
      req.user.id,
      targetUserId,
    );
  }

  @Get('recommendations/users')
  async getSuggestedUsers(
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: string,
  ) {
    return this.flavorDnaService.getSuggestedUsers(
      req.user.id,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
