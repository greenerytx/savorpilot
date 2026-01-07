import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  MaxLength,
  IsUUID,
  IsObject,
} from 'class-validator';

// ==================== CIRCLE DTOs ====================

export class CreateDinnerCircleDto {
  @ApiProperty({ example: 'Family Dinners' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Our weekly family meal planning' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '👨‍👩‍👧‍👦' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  emoji?: string;
}

export class UpdateDinnerCircleDto extends PartialType(CreateDinnerCircleDto) {}

export class DinnerCircleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  emoji?: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => [MemberResponseDto] })
  members?: MemberResponseDto[];
}

// ==================== MEMBER DTOs ====================

export class CreateMemberDto {
  @ApiProperty({ example: 'Sarah' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID if this is a registered user',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'True if this is a virtual member (no account)',
  })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional({ example: '👧' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  avatarEmoji?: string;

  @ApiPropertyOptional({ example: 'admin', enum: ['owner', 'admin', 'member'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 'Prefers mild flavors' })
  @IsOptional()
  @IsString()
  dietaryNotes?: string;

  @ApiPropertyOptional({ example: ['vegetarian', 'gluten-free'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];

  @ApiPropertyOptional({ example: ['nuts', 'shellfish'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @ApiPropertyOptional({
    example: { saltPreference: 0.3, heatPreference: 0.2 },
    description: 'Flavor preferences override',
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, number>;
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) {}

export class MemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  circleId: string;

  @ApiPropertyOptional()
  userId?: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isVirtual: boolean;

  @ApiProperty()
  role: string;

  @ApiPropertyOptional()
  avatarEmoji?: string;

  @ApiPropertyOptional()
  dietaryNotes?: string;

  @ApiProperty({ type: [String] })
  restrictions: string[];

  @ApiProperty({ type: [String] })
  allergens: string[];

  @ApiPropertyOptional()
  preferences?: Record<string, number>;

  @ApiProperty()
  createdAt: Date;
}

// Common restrictions and allergens for UI
export const COMMON_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'gluten-free',
  'dairy-free',
  'keto',
  'paleo',
  'low-carb',
  'low-sodium',
  'halal',
  'kosher',
] as const;

export const COMMON_ALLERGENS = [
  'nuts',
  'peanuts',
  'tree-nuts',
  'dairy',
  'eggs',
  'shellfish',
  'fish',
  'soy',
  'wheat',
  'sesame',
] as const;

export const MEMBER_EMOJIS = [
  '👨', '👩', '👧', '👦', '👶',
  '🧑', '👴', '👵', '🧔', '👱',
  '🐶', '🐱', '🐰', '🐻', '🦊',
] as const;
