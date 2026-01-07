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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SocialPostsService } from './social-posts.service';
import {
  CreateSocialPostDto,
  UpdateSocialPostDto,
  CreateSocialPostCommentDto,
  SocialFeedQueryDto,
  UserPostsQueryDto,
  SocialPostResponseDto,
  SocialPostCommentResponseDto,
  PaginatedFeedDto,
  PaginatedPostsDto,
  PaginatedCommentsDto,
} from './dto/social-post.dto';

@ApiTags('Social Posts')
@Controller('social-posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialPostsController {
  constructor(private readonly socialPostsService: SocialPostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new social post' })
  @ApiResponse({ status: 201, type: SocialPostResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSocialPostDto,
  ): Promise<SocialPostResponseDto> {
    return this.socialPostsService.create(userId, dto);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get social feed (posts from followed users + own)' })
  @ApiResponse({ status: 200, type: PaginatedFeedDto })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query() query: SocialFeedQueryDto,
  ): Promise<PaginatedFeedDto> {
    return this.socialPostsService.getFeed(userId, query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get posts by a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, type: PaginatedPostsDto })
  async getUserPosts(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') targetUserId: string,
    @Query() query: UserPostsQueryDto,
  ): Promise<PaginatedPostsDto> {
    return this.socialPostsService.getUserPosts(currentUserId, targetUserId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, type: SocialPostResponseDto })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
  ): Promise<SocialPostResponseDto> {
    return this.socialPostsService.findOne(userId, postId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, type: SocialPostResponseDto })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
    @Body() dto: UpdateSocialPostDto,
  ): Promise<SocialPostResponseDto> {
    return this.socialPostsService.update(userId, postId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 204 })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
  ): Promise<void> {
    return this.socialPostsService.remove(userId, postId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 204 })
  async likePost(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
  ): Promise<void> {
    return this.socialPostsService.likePost(userId, postId);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 204 })
  async unlikePost(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
  ): Promise<void> {
    return this.socialPostsService.unlikePost(userId, postId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, type: PaginatedCommentsDto })
  async getComments(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedCommentsDto> {
    return this.socialPostsService.getComments(userId, postId, page, limit);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 201, type: SocialPostCommentResponseDto })
  async addComment(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
    @Body() dto: CreateSocialPostCommentDto,
  ): Promise<SocialPostCommentResponseDto> {
    return this.socialPostsService.addComment(userId, postId, dto);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 204 })
  async deleteComment(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    return this.socialPostsService.deleteComment(userId, postId, commentId);
  }
}
