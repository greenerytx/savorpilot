import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== USER PROFILE DTOs ====================

export class UserProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  followerCount: number;

  @ApiProperty()
  followingCount: number;

  @ApiProperty()
  recipeCount: number;

  @ApiProperty()
  isFollowing: boolean;

  @ApiProperty()
  isFollowedBy: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  isFollowing: boolean;
}

// ==================== FOLLOW DTOs ====================

export class FollowResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  followerId: string;

  @ApiProperty()
  followeeId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: UserSummaryDto })
  follower?: UserSummaryDto;

  @ApiPropertyOptional({ type: UserSummaryDto })
  followee?: UserSummaryDto;
}

export class FollowListResponseDto {
  @ApiProperty({ type: [UserSummaryDto] })
  data: UserSummaryDto[];

  @ApiProperty()
  total: number;
}

// ==================== FOLLOW SUGGESTION DTOs ====================

export class FollowSuggestionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  recipeCount: number;

  @ApiProperty()
  isFollowing: boolean;

  @ApiPropertyOptional()
  mutualFollowerCount?: number;

  @ApiPropertyOptional()
  reason?: string;
}

export class FollowSuggestionsResponseDto {
  @ApiProperty({ type: [FollowSuggestionDto] })
  suggestions: FollowSuggestionDto[];
}
