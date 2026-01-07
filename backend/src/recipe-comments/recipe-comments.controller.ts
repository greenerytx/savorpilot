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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RecipeCommentsService } from './recipe-comments.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
  CommentListResponseDto,
} from './dto/recipe-comment.dto';

@ApiTags('Recipe Comments')
@Controller('recipes/:recipeId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecipeCommentsController {
  constructor(private readonly commentsService: RecipeCommentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get comments for a recipe' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 50)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of comments',
    type: CommentListResponseDto,
  })
  async getComments(
    @Param('recipeId') recipeId: string,
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<CommentListResponseDto> {
    return this.commentsService.getComments(
      recipeId,
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Add a comment to a recipe' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID' })
  @ApiResponse({
    status: 201,
    description: 'Comment created',
    type: CommentResponseDto,
  })
  async createComment(
    @Param('recipeId') recipeId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ): Promise<CommentResponseDto> {
    return this.commentsService.createComment(recipeId, userId, dto);
  }

  @Put(':commentId')
  @ApiOperation({ summary: 'Edit a comment' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({
    status: 200,
    description: 'Comment updated',
    type: CommentResponseDto,
  })
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ): Promise<CommentResponseDto> {
    return this.commentsService.updateComment(commentId, userId, dto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 204, description: 'Comment deleted' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.commentsService.deleteComment(commentId, userId);
  }

  @Post(':commentId/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a comment' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 204, description: 'Comment liked' })
  async likeComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.commentsService.likeComment(commentId, userId);
  }

  @Delete(':commentId/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a comment' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 204, description: 'Comment unliked' })
  async unlikeComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.commentsService.unlikeComment(commentId, userId);
  }

  @Get(':commentId/replies')
  @ApiOperation({ summary: 'Get replies to a comment' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of replies',
    type: CommentListResponseDto,
  })
  async getReplies(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<CommentListResponseDto> {
    return this.commentsService.getReplies(
      commentId,
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
