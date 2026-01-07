import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  IsInt,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecipeVisibility } from '@prisma/client';

// Create Group DTO
export class CreateGroupDto {
  @ApiProperty({ example: 'Italian Favorites' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'My favorite Italian recipes for weeknight dinners' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// Update Group DTO
export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @ApiPropertyOptional({
    description: 'Visibility of the collection',
    enum: RecipeVisibility,
    example: 'PRIVATE',
  })
  @IsOptional()
  @IsEnum(RecipeVisibility)
  visibility?: RecipeVisibility;
}

// Add recipes to group
export class AddRecipesToGroupDto {
  @ApiProperty({ example: ['uuid-1', 'uuid-2'], type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  recipeIds: string[];
}

// Remove recipes from group
export class RemoveRecipesFromGroupDto {
  @ApiProperty({ example: ['uuid-1', 'uuid-2'], type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  recipeIds: string[];
}

// Reorder recipes in group
export class ReorderRecipesDto {
  @ApiProperty({
    example: [
      { recipeId: 'uuid-1', sortOrder: 1 },
      { recipeId: 'uuid-2', sortOrder: 2 },
    ],
  })
  @IsArray()
  recipes: { recipeId: string; sortOrder: number }[];
}

// Group Query DTO
export class GroupQueryDto {
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
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'italian' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true, description: 'Include recipe count' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeRecipeCount?: boolean = true;
}

// Group Response DTO
export class GroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  coverImage?: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty({ enum: RecipeVisibility })
  visibility: RecipeVisibility;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  recipeCount?: number;

  @ApiPropertyOptional({ description: 'Preview of first few recipes' })
  recipePreview?: {
    id: string;
    title: string;
    imageUrl?: string;
  }[];
}

// Group with recipes response
export class GroupDetailResponseDto extends GroupResponseDto {
  @ApiProperty()
  recipes: {
    id: string;
    title: string;
    imageUrl?: string;
    category?: string;
    cuisine?: string;
    totalTimeMinutes?: number;
    sortOrder?: number;
  }[];
}

// Paginated Groups Response
export class PaginatedGroupsDto {
  @ApiProperty({ type: [GroupResponseDto] })
  data: GroupResponseDto[];

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
