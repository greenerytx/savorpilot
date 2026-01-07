import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { NotificationType } from '@prisma/client';

export { NotificationType };

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  data?: Record<string, any>;

  @ApiProperty()
  isRead: boolean;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class MarkReadDto {
  @ApiPropertyOptional({ description: 'Specific notification IDs to mark as read' })
  @IsOptional()
  notificationIds?: string[];

  @ApiPropertyOptional({ description: 'Mark all notifications as read' })
  @IsOptional()
  @IsBoolean()
  all?: boolean;
}

export class NotificationCountDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  unread: number;
}

export class CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}
