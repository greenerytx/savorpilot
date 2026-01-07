import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RecipeReactionsService } from './recipe-reactions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ReactionType } from '@prisma/client';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipeReactionsController {
  constructor(private readonly reactionsService: RecipeReactionsService) {}

  /**
   * Add a reaction to a recipe
   * POST /recipes/:recipeId/reactions/:type
   */
  @Post(':recipeId/reactions/:type')
  async addReaction(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
    @Param('type') type: ReactionType,
    @CurrentUser() user: { id: string },
  ) {
    return this.reactionsService.addReaction(recipeId, user.id, type);
  }

  /**
   * Remove a reaction from a recipe
   * DELETE /recipes/:recipeId/reactions/:type
   */
  @Delete(':recipeId/reactions/:type')
  async removeReaction(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
    @Param('type') type: ReactionType,
    @CurrentUser() user: { id: string },
  ) {
    await this.reactionsService.removeReaction(recipeId, user.id, type);
    return { success: true };
  }

  /**
   * Get reaction stats for a recipe
   * GET /recipes/:recipeId/reactions
   * Works with or without authentication
   */
  @Get(':recipeId/reactions')
  @UseGuards(OptionalJwtAuthGuard)
  async getReactionStats(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.reactionsService.getReactionStats(recipeId, user?.id);
  }

  /**
   * Get users who reacted to a recipe
   * GET /recipes/:recipeId/reactions/users
   */
  @Get(':recipeId/reactions/users')
  @UseGuards(OptionalJwtAuthGuard)
  async getReactionUsers(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
    @Query('type') type?: ReactionType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reactionsService.getReactionUsers(
      recipeId,
      type,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }

  /**
   * Get batch reaction stats for multiple recipes
   * POST /recipes/reactions/batch
   */
  @Post('reactions/batch')
  @UseGuards(OptionalJwtAuthGuard)
  async getBatchReactionStats(
    @Body() body: { recipeIds: string[] },
    @CurrentUser() user?: { id: string },
  ) {
    const statsMap = await this.reactionsService.getBatchReactionStats(
      body.recipeIds,
      user?.id,
    );
    return Object.fromEntries(statsMap);
  }
}
