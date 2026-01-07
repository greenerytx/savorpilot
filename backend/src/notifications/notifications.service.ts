import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationResponseDto,
  NotificationCountDto,
  CreateNotificationDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(
    userId: string,
    limit = 20,
    offset = 0,
    unreadOnly = false,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return notifications.map((n) => this.mapToResponse(n));
  }

  async getNotificationCount(userId: string): Promise<NotificationCountDto> {
    const [total, unread] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { total, unread };
  }

  async markAsRead(
    userId: string,
    notificationIds?: string[],
    all?: boolean,
  ): Promise<{ updated: number }> {
    const now = new Date();

    if (all) {
      const result = await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: now },
      });
      return { updated: result.count };
    }

    if (notificationIds && notificationIds.length > 0) {
      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
          isRead: false,
        },
        data: { isRead: true, readAt: now },
      });
      return { updated: result.count };
    }

    return { updated: 0 };
  }

  async markSingleAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return this.mapToResponse(updated);
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async deleteAllRead(userId: string): Promise<{ deleted: number }> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    return { deleted: result.count };
  }

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data || undefined,
      },
    });

    this.logger.log(
      `Notification created for user ${dto.userId}: ${dto.type}`,
    );

    return this.mapToResponse(notification);
  }

  async createRecipeSharedNotification(
    recipientUserId: string,
    senderName: string,
    recipeName: string,
    recipeId: string,
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId: recipientUserId,
      type: NotificationType.RECIPE_SHARED,
      title: 'Recipe Shared',
      message: `${senderName} shared "${recipeName}" with you`,
      data: { recipeId, senderName },
    });
  }

  async createGroupSharedNotification(
    recipientUserId: string,
    senderName: string,
    groupName: string,
    groupId: string,
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId: recipientUserId,
      type: NotificationType.GROUP_SHARED,
      title: 'Collection Shared',
      message: `${senderName} shared "${groupName}" collection with you`,
      data: { groupId, senderName },
    });
  }

  async createImportCompleteNotification(
    userId: string,
    successCount: number,
    totalCount: number,
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId,
      type: NotificationType.IMPORT_COMPLETE,
      title: 'Import Complete',
      message: `Successfully imported ${successCount} of ${totalCount} recipes`,
      data: { successCount, totalCount },
    });
  }

  private mapToResponse(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      data: notification.data as Record<string, any> | undefined,
      isRead: notification.isRead,
      readAt: notification.readAt || undefined,
      createdAt: notification.createdAt,
    };
  }
}
