import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CollectionDto {
  @IsString()
  id: string;

  @IsString()
  name: string;
}

export class SyncInstagramDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  csrfToken: string;

  @IsOptional()
  @IsString()
  dsUserId?: string;

  @IsOptional()
  @IsString()
  igWwwClaim?: string;

  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionDto)
  collections?: CollectionDto[];
}

export class SyncResponseDto {
  success: boolean;
  totalFetched: number;
  newPosts: number;
  skippedPosts: number;
  message?: string;
}

export class ReloadImageDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  csrfToken: string;

  @IsOptional()
  @IsString()
  dsUserId?: string;

  @IsOptional()
  @IsString()
  igWwwClaim?: string;
}

export class BulkReloadImagesDto extends ReloadImageDto {
  @IsArray()
  @IsString({ each: true })
  postIds: string[];
}
