import {
  Controller,
  Get,
  Post,
  Delete,
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
import { SocialService } from './social.service';
import {
  UserProfileResponseDto,
  FollowResponseDto,
  FollowListResponseDto,
  FollowSuggestionDto,
} from './dto/social.dto';

@ApiTags('Social')
@Controller('social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ============================================
  // FOLLOW/UNFOLLOW
  // ============================================

  @Post('follow/:userId')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'userId', description: 'User ID to follow' })
  @ApiResponse({
    status: 201,
    description: 'Successfully followed user',
    type: FollowResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot follow yourself or already following' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async followUser(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<FollowResponseDto> {
    return this.socialService.followUser(currentUserId, targetUserId);
  }

  @Delete('follow/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'userId', description: 'User ID to unfollow' })
  @ApiResponse({ status: 204, description: 'Successfully unfollowed user' })
  @ApiResponse({ status: 404, description: 'Not following this user' })
  async unfollowUser(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<void> {
    return this.socialService.unfollowUser(currentUserId, targetUserId);
  }

  // ============================================
  // FOLLOWERS/FOLLOWING LISTS
  // ============================================

  @Get('followers')
  @ApiOperation({ summary: 'Get my followers' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 50)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of followers',
    type: FollowListResponseDto,
  })
  async getMyFollowers(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<FollowListResponseDto> {
    return this.socialService.getFollowers(
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('following')
  @ApiOperation({ summary: 'Get who I follow' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 50)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of users I follow',
    type: FollowListResponseDto,
  })
  async getMyFollowing(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<FollowListResponseDto> {
    return this.socialService.getFollowing(
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  // ============================================
  // USER PROFILES
  // ============================================

  @Get('users/:userId/profile')
  @ApiOperation({ summary: 'Get a user\'s public profile' })
  @ApiParam({ name: 'userId', description: 'User ID to view' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<UserProfileResponseDto> {
    return this.socialService.getUserProfile(targetUserId, currentUserId);
  }

  @Get('users/:userId/followers')
  @ApiOperation({ summary: 'Get a user\'s followers' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of followers',
    type: FollowListResponseDto,
  })
  async getUserFollowers(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<FollowListResponseDto> {
    // For now, we return the target user's followers
    // This could be enhanced to respect privacy settings
    return this.socialService.getFollowers(
      targetUserId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('users/:userId/following')
  @ApiOperation({ summary: 'Get who a user follows' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of users they follow',
    type: FollowListResponseDto,
  })
  async getUserFollowing(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<FollowListResponseDto> {
    return this.socialService.getFollowing(
      targetUserId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  // ============================================
  // SUGGESTIONS
  // ============================================

  @Get('suggestions')
  @ApiOperation({ summary: 'Get follow suggestions' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of suggestions (default 10)' })
  @ApiResponse({
    status: 200,
    description: 'List of suggested users to follow',
    type: [FollowSuggestionDto],
  })
  async getFollowSuggestions(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ): Promise<FollowSuggestionDto[]> {
    return this.socialService.getFollowSuggestions(
      userId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  // ============================================
  // CHECK STATUS
  // ============================================

  @Get('is-following/:userId')
  @ApiOperation({ summary: 'Check if following a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID to check' })
  @ApiResponse({
    status: 200,
    description: 'Follow status',
  })
  async isFollowing(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.socialService.isFollowing(currentUserId, targetUserId);
    return { isFollowing };
  }
}
