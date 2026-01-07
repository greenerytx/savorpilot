import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import {
  NotificationResponseDto,
  NotificationCountDto,
  MarkReadDto,
} from './dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
    type: [NotificationResponseDto],
  })
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getNotifications(
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
      unreadOnly === 'true',
    );
  }

  @Get('count')
  @ApiOperation({ summary: 'Get notification count' })
  @ApiResponse({
    status: 200,
    description: 'Notification count',
    type: NotificationCountDto,
  })
  async getNotificationCount(
    @CurrentUser('id') userId: string,
  ): Promise<NotificationCountDto> {
    return this.notificationsService.getNotificationCount(userId);
  }

  @Post('mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read',
  })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Body() dto: MarkReadDto,
  ): Promise<{ updated: number }> {
    return this.notificationsService.markAsRead(
      userId,
      dto.notificationIds,
      dto.all,
    );
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  async markSingleAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markSingleAsRead(notificationId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  async deleteNotification(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.notificationsService.deleteNotification(notificationId, userId);
  }

  @Delete('read/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all read notifications' })
  @ApiResponse({
    status: 200,
    description: 'Read notifications deleted',
  })
  async deleteAllRead(
    @CurrentUser('id') userId: string,
  ): Promise<{ deleted: number }> {
    return this.notificationsService.deleteAllRead(userId);
  }
}
