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
import { CookingPostsService } from './cooking-posts.service';
import {
  CreateCookingPostDto,
  UpdateCookingPostDto,
  CookingPostResponseDto,
  CookingPostListResponseDto,
} from './dto/cooking-post.dto';

@ApiTags('Cooking Posts')
@Controller('cooking-posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CookingPostsController {
  constructor(private readonly cookingPostsService: CookingPostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cooking post ("I made this!")' })
  @ApiResponse({
    status: 201,
    description: 'Post created',
    type: CookingPostResponseDto,
  })
  async createPost(
    @Body() dto: CreateCookingPostDto,
    @CurrentUser('id') userId: string,
  ): Promise<CookingPostResponseDto> {
    return this.cookingPostsService.createPost(userId, dto);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get personalized feed of cooking posts' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 20)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({
    status: 200,
    description: 'Feed of cooking posts',
    type: CookingPostListResponseDto,
  })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<CookingPostListResponseDto> {
    return this.cookingPostsService.getFeed(
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get cooking posts by a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of user\'s cooking posts',
    type: CookingPostListResponseDto,
  })
  async getUserPosts(
    @Param('userId') userId: string,
    @CurrentUser('id') currentUserId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<CookingPostListResponseDto> {
    return this.cookingPostsService.getUserPosts(
      userId,
      currentUserId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('recipe/:recipeId')
  @ApiOperation({ summary: 'Get cooking posts for a specific recipe' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of cooking posts for the recipe',
    type: CookingPostListResponseDto,
  })
  async getRecipePosts(
    @Param('recipeId') recipeId: string,
    @CurrentUser('id') currentUserId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<CookingPostListResponseDto> {
    return this.cookingPostsService.getRecipePosts(
      recipeId,
      currentUserId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single cooking post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Cooking post details',
    type: CookingPostResponseDto,
  })
  async getPost(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ): Promise<CookingPostResponseDto> {
    return this.cookingPostsService.getPost(postId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a cooking post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post updated',
    type: CookingPostResponseDto,
  })
  async updatePost(
    @Param('id') postId: string,
    @Body() dto: UpdateCookingPostDto,
    @CurrentUser('id') userId: string,
  ): Promise<CookingPostResponseDto> {
    return this.cookingPostsService.updatePost(postId, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a cooking post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post deleted' })
  async deletePost(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.cookingPostsService.deletePost(postId, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a cooking post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post liked' })
  async likePost(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.cookingPostsService.likePost(postId, userId);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a cooking post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post unliked' })
  async unlikePost(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.cookingPostsService.unlikePost(postId, userId);
  }
}
