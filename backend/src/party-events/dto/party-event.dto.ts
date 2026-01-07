import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { EventStatus } from '@prisma/client';

// ==================== EVENT DTOs ====================

export class CreatePartyEventDto {
  @ApiProperty({ example: 'Friendsgiving 2026' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Annual gathering with friends to celebrate' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '🦃' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  emoji?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @ApiProperty({ example: '2026-11-28T18:00:00Z' })
  @IsDateString()
  eventDate: string;

  @ApiPropertyOptional({ example: '2026-11-28T23:00:00Z' })
  @IsOptional()
  @IsDateString()
  eventEndDate?: string;

  @ApiPropertyOptional({ example: "John's house, 123 Main St" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Link event to a Dinner Circle for auto-importing members' })
  @IsOptional()
  @IsString()
  circleId?: string;

  @ApiPropertyOptional({ example: true, description: 'Auto-import members from the linked circle' })
  @IsOptional()
  @IsBoolean()
  importCircleMembers?: boolean;
}

export class UpdatePartyEventDto extends PartialType(CreatePartyEventDto) {
  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class CircleSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  emoji?: string;

  @ApiProperty()
  memberCount: number;
}

export class PartyEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  emoji?: string;

  @ApiPropertyOptional()
  coverImage?: string;

  @ApiProperty()
  eventDate: Date;

  @ApiPropertyOptional()
  eventEndDate?: Date;

  @ApiPropertyOptional()
  location?: string;

  @ApiProperty()
  inviteCode: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty()
  ownerId: string;

  @ApiPropertyOptional()
  circleId?: string;

  @ApiPropertyOptional({ type: CircleSummaryDto })
  circle?: CircleSummaryDto;

  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  recipeCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PartyEventDetailResponseDto extends PartyEventResponseDto {
  @ApiPropertyOptional({ type: () => [PartyEventMemberResponseDto] })
  members?: PartyEventMemberResponseDto[];

  @ApiPropertyOptional({ type: () => [PartyEventRecipeResponseDto] })
  recipes?: PartyEventRecipeResponseDto[];

  @ApiPropertyOptional({ type: () => [PartyEventAssignmentResponseDto] })
  assignments?: PartyEventAssignmentResponseDto[];
}

// ==================== MEMBER DTOs ====================

import { EventMemberRole, RsvpStatus } from '@prisma/client';

export class InviteMemberDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'User ID for existing app users' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'Sarah', description: 'Name for virtual guests (required if no userId)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'sarah@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '👩' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  avatarEmoji?: string;

  @ApiPropertyOptional({ enum: EventMemberRole, default: EventMemberRole.GUEST })
  @IsOptional()
  @IsEnum(EventMemberRole)
  role?: EventMemberRole;

  @ApiPropertyOptional({ example: 'No nuts please' })
  @IsOptional()
  @IsString()
  dietaryNotes?: string;
}

export class UpdateEventMemberDto {
  @ApiPropertyOptional({ example: 'Sarah M.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: EventMemberRole })
  @IsOptional()
  @IsEnum(EventMemberRole)
  role?: EventMemberRole;

  @ApiPropertyOptional({ example: '👩' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  avatarEmoji?: string;

  @ApiPropertyOptional({ example: 'No nuts please' })
  @IsOptional()
  @IsString()
  dietaryNotes?: string;
}

export class RsvpDto {
  @ApiProperty({ enum: RsvpStatus })
  @IsEnum(RsvpStatus)
  status: RsvpStatus;

  @ApiPropertyOptional({ example: "Can't wait! I'll bring dessert" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class PartyEventMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiPropertyOptional()
  userId?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  isVirtual: boolean;

  @ApiProperty({ enum: EventMemberRole })
  role: EventMemberRole;

  @ApiProperty({ enum: RsvpStatus })
  rsvpStatus: RsvpStatus;

  @ApiPropertyOptional()
  rsvpNote?: string;

  @ApiPropertyOptional()
  avatarEmoji?: string;

  @ApiPropertyOptional()
  dietaryNotes?: string;

  @ApiProperty({ type: [String] })
  restrictions: string[];

  @ApiProperty({ type: [String] })
  allergens: string[];

  @ApiProperty()
  invitedAt: Date;

  @ApiPropertyOptional()
  respondedAt?: Date;
}

// ==================== RECIPE DTOs ====================

export class PinRecipeDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  recipeId: string;

  @ApiPropertyOptional({ example: 'Main Course' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  servings?: number;

  @ApiPropertyOptional({ example: 'Grandma\'s secret recipe' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdatePinnedRecipeDto {
  @ApiPropertyOptional({ example: 'Appetizer' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  servings?: number;

  @ApiPropertyOptional({ example: 'Made it spicier this year' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class PartyEventRecipeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  recipeId: string;

  @ApiProperty()
  addedById: string;

  @ApiPropertyOptional()
  claimedById?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  servings: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  addedAt: Date;

  @ApiPropertyOptional()
  claimedAt?: Date;

  @ApiPropertyOptional()
  claimedBy?: PartyEventMemberResponseDto;

  @ApiPropertyOptional()
  recipe?: {
    id: string;
    title: string;
    imageUrl?: string;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    servings: number;
  };
}

// ==================== ASSIGNMENT DTOs ====================

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Bring wine' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: '2 bottles of red, 1 white' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ example: '2026-11-28T16:00:00Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class PartyEventAssignmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  assignedToId?: string;

  @ApiProperty()
  isCompleted: boolean;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  assignedTo?: PartyEventMemberResponseDto;
}

// ==================== CONSTANTS ====================

export const EVENT_EMOJIS = [
  '🦃', '🎃', '🎄', '🎊', '🎉',
  '🍗', '🥘', '🍖', '🌮', '🍕',
  '🎂', '🎈', '🏠', '🌴', '⛺',
  '🔥', '🌙', '☀️', '🌸', '🍂',
] as const;

export const EVENT_CATEGORIES = [
  'Appetizer',
  'Main Course',
  'Side Dish',
  'Dessert',
  'Beverage',
  'Bread',
  'Salad',
  'Soup',
  'Other',
] as const;
