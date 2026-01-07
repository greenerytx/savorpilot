import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SocialPostType, RecipeVisibility } from '@prisma/client';

// Create Social Post DTO
export class CreateSocialPostDto {
  @ApiProperty({
    description: 'Type of the social post',
    enum: SocialPostType,
    example: 'GENERAL',
  })
  @IsEnum(SocialPostType)
  postType: SocialPostType;

  @ApiProperty({
    description: 'Content/text of the post',
    example: 'Just made the most amazing pasta dish!',
  })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    description: 'URL of the attached image',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Optional linked recipe ID',
    example: 'uuid-of-recipe',
  })
  @IsOptional()
  @IsUUID()
  recipeId?: string;

  @ApiPropertyOptional({
    description: 'Visibility of the post',
    enum: RecipeVisibility,
    example: 'PUBLIC',
    default: 'PUBLIC',
  })
  @IsOptional()
  @IsEnum(RecipeVisibility)
  visibility?: RecipeVisibility;
}

// Update Social Post DTO
export class UpdateSocialPostDto extends PartialType(CreateSocialPostDto) {}

// Create Comment DTO
export class CreateSocialPostCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'This looks amazing!',
  })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

// Feed Query DTO
export class SocialFeedQueryDto {
  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Cursor for pagination (post ID)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Filter by post type',
    enum: SocialPostType,
  })
  @IsOptional()
  @IsEnum(SocialPostType)
  postType?: SocialPostType;
}

// User Posts Query DTO
export class UserPostsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

// Author Response
export class AuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

// Recipe Preview in Post
export class PostRecipePreviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  imageUrl?: string;
}

// Social Post Response DTO
export class SocialPostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: SocialPostType })
  postType: SocialPostType;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ type: PostRecipePreviewDto })
  recipe?: PostRecipePreviewDto;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  commentCount: number;

  @ApiProperty()
  isLikedByMe: boolean;

  @ApiProperty({ enum: RecipeVisibility })
  visibility: RecipeVisibility;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// Comment Response DTO
export class SocialPostCommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  isLikedByMe: boolean;

  @ApiProperty()
  replyCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: [SocialPostCommentResponseDto] })
  replies?: SocialPostCommentResponseDto[];
}

// Paginated Feed Response
export class PaginatedFeedDto {
  @ApiProperty({ type: [SocialPostResponseDto] })
  data: SocialPostResponseDto[];

  @ApiPropertyOptional()
  nextCursor?: string;

  @ApiProperty()
  hasMore: boolean;
}

// Paginated Posts Response (offset-based)
export class PaginatedPostsDto {
  @ApiProperty({ type: [SocialPostResponseDto] })
  data: SocialPostResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasMore: boolean;
}

// Paginated Comments Response
export class PaginatedCommentsDto {
  @ApiProperty({ type: [SocialPostCommentResponseDto] })
  data: SocialPostCommentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  hasMore: boolean;
}
