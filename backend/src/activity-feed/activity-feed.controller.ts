import {
  Controller,
  Get,
  Post,
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
import { ActivityFeedService } from './activity-feed.service';
import {
  ActivityFeedResponseDto,
  MarkActivityReadDto,
} from './dto/activity-feed.dto';

@ApiTags('Activity Feed')
@Controller('activity-feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivityFeedController {
  constructor(private readonly activityFeedService: ActivityFeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get personalized activity feed' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 20)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({
    status: 200,
    description: 'Activity feed',
    type: ActivityFeedResponseDto,
  })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<ActivityFeedResponseDto> {
    return this.activityFeedService.getFeed(
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get public activity of a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({
    status: 200,
    description: 'User activity',
    type: ActivityFeedResponseDto,
  })
  async getUserActivity(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') viewerId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<ActivityFeedResponseDto> {
    return this.activityFeedService.getUserActivity(
      targetUserId,
      viewerId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post('mark-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark activity items as read' })
  @ApiResponse({ status: 204, description: 'Items marked as read' })
  async markAsRead(
    @Body() dto: MarkActivityReadDto,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.activityFeedService.markAsRead(userId, dto.itemIds);
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all activity items as read' })
  @ApiResponse({ status: 204, description: 'All items marked as read' })
  async markAllAsRead(@CurrentUser('id') userId: string): Promise<void> {
    return this.activityFeedService.markAllAsRead(userId);
  }
}
