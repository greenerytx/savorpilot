import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { PostVisibility } from '@prisma/client';

// ==================== REQUEST DTOs ====================

export class CreateCookingPostDto {
  @ApiProperty({ description: 'Recipe ID that was cooked' })
  @IsUUID()
  recipeId: string;

  @ApiPropertyOptional({ description: 'URL to the photo of the cooked dish' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Caption for the post' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;

  @ApiPropertyOptional({ description: 'Rating 1-5', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Visibility of the post',
    enum: PostVisibility,
    default: PostVisibility.FOLLOWERS,
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}

export class UpdateCookingPostDto {
  @ApiPropertyOptional({ description: 'Caption for the post' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;

  @ApiPropertyOptional({ description: 'Rating 1-5', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Visibility of the post',
    enum: PostVisibility,
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}

// ==================== RESPONSE DTOs ====================

export class PostAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

export class PostRecipeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  imageUrl?: string;
}

export class CookingPostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  recipeId: string;

  @ApiPropertyOptional()
  photoUrl?: string;

  @ApiPropertyOptional()
  caption?: string;

  @ApiPropertyOptional()
  rating?: number;

  @ApiProperty({ enum: PostVisibility })
  visibility: PostVisibility;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  isLikedByMe: boolean;

  @ApiProperty({ type: PostAuthorDto })
  author: PostAuthorDto;

  @ApiProperty({ type: PostRecipeDto })
  recipe: PostRecipeDto;
}

export class CookingPostListResponseDto {
  @ApiProperty({ type: [CookingPostResponseDto] })
  data: CookingPostResponseDto[];

  @ApiProperty()
  total: number;
}
