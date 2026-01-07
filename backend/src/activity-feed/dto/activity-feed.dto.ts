import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType, TargetType } from '@prisma/client';

// ==================== REQUEST DTOs ====================

export class MarkActivityReadDto {
  @ApiProperty({ description: 'Array of activity item IDs to mark as read' })
  itemIds: string[];
}

// ==================== RESPONSE DTOs ====================

export class ActivityActorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

export class ActivityTargetDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: TargetType;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  imageUrl?: string;
}

export class ActivityFeedItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ActivityType })
  activityType: ActivityType;

  @ApiProperty({ enum: TargetType })
  targetType: TargetType;

  @ApiProperty()
  targetId: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty({ type: ActivityActorDto })
  actor: ActivityActorDto;

  @ApiPropertyOptional({ type: ActivityTargetDto })
  target?: ActivityTargetDto;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}

export class ActivityFeedResponseDto {
  @ApiProperty({ type: [ActivityFeedItemDto] })
  data: ActivityFeedItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  unreadCount: number;
}
