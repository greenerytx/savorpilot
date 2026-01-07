import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

// ==================== REQUEST DTOs ====================

export class CreateCommentDto {
  @ApiProperty({ example: 'This recipe is amazing! I added extra garlic.' })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment content' })
  @IsString()
  @MaxLength(2000)
  content: string;
}

// ==================== RESPONSE DTOs ====================

export class CommentAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  recipeId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isEdited: boolean;

  @ApiProperty({ type: CommentAuthorDto })
  author: CommentAuthorDto;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  isLikedByMe: boolean;

  @ApiProperty()
  replyCount: number;

  @ApiPropertyOptional({ type: [CommentResponseDto] })
  replies?: CommentResponseDto[];
}

export class CommentListResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  data: CommentResponseDto[];

  @ApiProperty()
  total: number;
}
