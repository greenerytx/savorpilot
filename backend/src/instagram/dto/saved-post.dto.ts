import { IsEnum, IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { SavedPostStatus } from '@prisma/client';

export type SortField = 'fetchedAt' | 'savedAt' | 'postedAt' | 'ownerUsername' | 'likeCount' | 'commentCount';
export type SortOrder = 'asc' | 'desc';

export class GetSavedPostsQueryDto {
  @IsOptional()
  @IsEnum(SavedPostStatus)
  status?: SavedPostStatus;

  @IsOptional()
  @IsString()
  ownerUsername?: string;

  @IsOptional()
  @IsString()
  collectionName?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['fetchedAt', 'savedAt', 'postedAt', 'ownerUsername', 'likeCount', 'commentCount'])
  sortBy?: SortField = 'fetchedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: SortOrder = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class SavedPostResponseDto {
  id: string;
  instagramPostId: string;
  shortcode: string;
  caption: string | null;
  captionTranslated: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  ownerUsername: string;
  ownerFullName: string | null;
  ownerId: string;
  postedAt: Date | null;
  isVideo: boolean;
  likeCount: number | null;
  commentCount: number | null;
  collectionId: string | null;
  collectionName: string | null;
  status: SavedPostStatus;
  importedRecipeId: string | null;
  detectedLanguage: string | null;
  fetchedAt: Date;
  importedAt: Date | null;
}

export class SavedPostsListResponseDto {
  posts: SavedPostResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GetFiltersQueryDto {
  @IsOptional()
  @IsEnum(SavedPostStatus)
  status?: SavedPostStatus;
}

export class FiltersResponseDto {
  usernames: { username: string; count: number }[];
  collections: { name: string; count: number }[];
  statusCounts: { status: SavedPostStatus; count: number }[];
}

export class DismissPostsDto {
  @IsString({ each: true })
  postIds: string[];
}

export class ParsedPostDto {
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  difficulty?: string;
  category?: string;
  cuisine?: string;
  tags?: string[];
  components: {
    name: string;
    ingredients: {
      quantity?: number;
      unit?: string;
      name: string;
      notes?: string;
      optional?: boolean;
    }[];
    steps: {
      order: number;
      instruction: string;
      duration?: number;
      tips?: string;
    }[];
  }[];
  confidence: number;
  detectedLanguage?: string;
  needsTranslation?: boolean;
  hasSteps: boolean;
}
